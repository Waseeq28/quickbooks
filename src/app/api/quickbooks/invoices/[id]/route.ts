import { NextRequest, NextResponse } from "next/server";
import { getQuickBooksServiceForTeam } from "@/services/quickbooks";
import { requirePermission } from "@/utils/authz-server";
import { z } from "zod";
import { findOrCreateCustomerByDisplayName } from "@/actions/customers";
import { buildItemResolver } from "@/actions/items";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { teamId } = await requirePermission("invoice:delete");
    const qbService = await getQuickBooksServiceForTeam(teamId);
    const { id } = await context.params;
    const docNumber = id;

    // Find invoice by DocNumber to obtain QuickBooks Id and SyncToken
    const invoices = await qbService.listInvoices();
    const target = invoices.find(
      (inv: any) => String(inv.DocNumber) === String(docNumber),
    );
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    // QuickBooks SDK returns both DocNumber (human friendly) and internal Id.
    // Our QBInvoice type omits Id, so we fallback to DocNumber if Id is not typed.
    const quickbooksId = (target as any).Id
      ? String((target as any).Id)
      : String(target.DocNumber);
    const syncToken = String(target.SyncToken);

    await qbService.deleteInvoice(quickbooksId, syncToken);

    return NextResponse.json({ success: true, deletedInvoiceId: docNumber });
  } catch (error: any) {
    console.error("Failed to delete invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete invoice in QuickBooks",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

const UpdateInvoiceItemSchema = z.object({
  description: z.string().optional(),
  productName: z.string().optional(),
  productDescription: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  rate: z.number().nonnegative().optional(),
});

const UpdateInvoiceSchema = z.object({
  customerName: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(UpdateInvoiceItemSchema).optional(),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { teamId } = await requirePermission("invoice:update");
    const qbService = await getQuickBooksServiceForTeam(teamId);
    const { id } = await context.params;
    const docNumber = id;

    const body = await req.json().catch(() => ({}));
    const parsed = UpdateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const updates = parsed.data;

    // Find invoice by DocNumber to obtain QuickBooks Id and SyncToken
    const invoices = await qbService.listInvoices();
    const target = invoices.find(
      (inv: any) => String(inv.DocNumber) === String(docNumber),
    );
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    const quickbooksId = (target as any).Id
      ? String((target as any).Id)
      : String(target.DocNumber);
    const syncToken = String(target.SyncToken);

    // Get full current invoice to preserve other fields
    const currentInvoice: any = await qbService.getInvoice(quickbooksId);

    const updatedInvoice: any = {
      ...currentInvoice,
      Id: quickbooksId,
      SyncToken: syncToken,
    };

    if (updates.issueDate) updatedInvoice.TxnDate = updates.issueDate;
    if (updates.dueDate) updatedInvoice.DueDate = updates.dueDate;

    if (updates.customerName) {
      const { id: customerId, name } = await findOrCreateCustomerByDisplayName(
        qbService as any,
        updates.customerName,
      );
      updatedInvoice.CustomerRef = { value: customerId, name };
    }

    if (updates.items) {
      const resolveOrCreateItemRef = buildItemResolver(qbService as any);
      const Line = await Promise.all(
        updates.items.map(async (item: any) => {
          const itemRef = await resolveOrCreateItemRef(item.productName);
          return {
            Amount: (item.quantity ?? 1) * (item.rate ?? 0),
            DetailType: "SalesItemLineDetail",
            Description:
              item.description || item.productDescription || item.productName,
            SalesItemLineDetail: {
              Qty: item.quantity ?? 1,
              UnitPrice: item.rate ?? 0,
              ...(itemRef ? { ItemRef: itemRef } : {}),
            },
          };
        }),
      );
      updatedInvoice.Line = Line;
    }

    const updated = await qbService.updateInvoice(updatedInvoice);

    // Reuse transformer to shape client response
    const { toSimpleInvoice } = await import("@/lib/invoice-transformers");
    const simple = toSimpleInvoice(updated as any);
    return NextResponse.json({ success: true, invoice: simple });
  } catch (error: any) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update invoice in QuickBooks",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
