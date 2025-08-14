import { NextRequest, NextResponse } from "next/server";
import { getQuickBooksServiceForTeam } from "@/services/quickbooks";
import { requirePermission } from "@/utils/authz-server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { teamId } = await requirePermission("invoice:delete");
    const qbService = await getQuickBooksServiceForTeam(teamId);
    const docNumber = params.id;

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
