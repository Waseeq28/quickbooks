import { NextRequest, NextResponse } from "next/server";
import { toSimpleInvoices } from "@/lib/invoice-transformers";
import { requirePermission } from "@/utils/authz-server";
import {
  listTeamInvoices,
  createTeamInvoice,
  CreateInvoiceSchema,
} from "@/actions/invoices";

type CreateInvoiceItem = {
  description: string;
  productName?: string;
  productDescription?: string;
  quantity: number;
  rate: number;
  amount?: number;
};

type CreateInvoiceRequest = {
  customerName: string;
  issueDate?: string;
  dueDate?: string;
  items: CreateInvoiceItem[];
};

function normalizeName(name?: string): string {
  return (name || "").trim().toLowerCase();
}

async function findOrCreateCustomer(
  qbService: any,
  customerName: string,
): Promise<{ id: string; name: string }> {
  // Use a direct QBO query to fetch at most one exact DisplayName match
  const existing = await qbService.findCustomerByDisplayName(customerName);
  if (existing) {
    return {
      id: String(existing.Id),
      name: existing.DisplayName || customerName,
    };
  }
  const created = await qbService.createCustomer({ DisplayName: customerName });
  return {
    id: String(created?.Id),
    name: created?.DisplayName || customerName,
  };
}

function buildItemResolver(qbService: any) {
  let cachedItems: any[] | null = null;
  let cachedAccounts: any[] | null = null;

  const ensureItems = async (): Promise<any[]> => {
    if (!cachedItems) cachedItems = await qbService.listItems().catch(() => []);
    return cachedItems || [];
  };

  const ensureIncomeAccount = async (): Promise<any | undefined> => {
    if (!cachedAccounts)
      cachedAccounts = await qbService.listAccounts().catch(() => []);
    const accounts = cachedAccounts || [];
    return (
      accounts.find((a: any) => a?.AccountType === "Income") ||
      accounts.find((a: any) => a?.Classification === "Revenue") ||
      accounts.find((a: any) => /sales/i.test(a?.Name || ""))
    );
  };

  return async function resolveOrCreateItemRef(
    productName?: string,
  ): Promise<{ value: string; name?: string } | undefined> {
    if (!productName) return undefined;
    const items = await ensureItems();
    const target = normalizeName(productName);

    const found = items.find(
      (it: any) =>
        normalizeName(it?.Name) === target ||
        normalizeName(it?.FullyQualifiedName) === target,
    );
    if (found) return { value: String(found.Id), name: found.Name };

    const incomeAccount = await ensureIncomeAccount();
    if (!incomeAccount) return undefined;

    const createdItem = await qbService.createItem({
      Name: productName,
      Type: "Service",
      IncomeAccountRef: {
        value: String(incomeAccount.Id),
        name: incomeAccount.Name,
      },
    });

    // cache for subsequent lookups
    cachedItems!.push(createdItem);
    return { value: String(createdItem.Id), name: createdItem.Name };
  };
}

export async function GET() {
  try {
    const { teamId } = await requirePermission("invoice:read");
    const simplifiedInvoices = await listTeamInvoices(teamId);
    return NextResponse.json(simplifiedInvoices);
  } catch (error: any) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch invoices from QuickBooks",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { teamId } = await requirePermission("invoice:create");

    const body = await req.json();
    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { customerName, issueDate, dueDate, items } = parsed.data;

    const simple = await createTeamInvoice(teamId, {
      customerName,
      issueDate,
      dueDate,
      items,
    });
    return NextResponse.json({ success: true, invoice: simple });
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create invoice in QuickBooks",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
