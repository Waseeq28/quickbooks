import { NextRequest, NextResponse } from "next/server";
import { getQuickBooksServiceForTeam } from "@/services/quickbooks";
import { requirePermission } from "@/utils/authz-server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: invoiceId } = await context.params;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    // Team-scoped service with RBAC
    const { teamId } = await requirePermission("invoice:download");
    const service = await getQuickBooksServiceForTeam(teamId);

    // The UI passes DocNumber; QuickBooks APIs require the internal Id for PDF.
    // Resolve DocNumber -> Id from the current invoice list.
    const invoices = await service.listInvoices();
    const target = invoices.find(
      (inv: any) => String(inv.DocNumber) === String(invoiceId),
    );
    if (!target) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 },
      );
    }
    const quickbooksId = (target as any).Id
      ? String((target as any).Id)
      : String(target.DocNumber);

    const pdfBuffer = await service.getInvoicePdf(quickbooksId);

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoiceId}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error downloading invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to download invoice PDF" },
      { status: 500 },
    );
  }
}
