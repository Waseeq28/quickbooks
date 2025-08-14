import { NextRequest, NextResponse } from "next/server";
import { getQuickBooksServiceForTeam } from "@/services/quickbooks";
import { requirePermission } from "@/utils/authz-server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id: invoiceId } = params;
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Email address is required" },
      { status: 400 },
    );
  }

  try {
    const { teamId } = await requirePermission("invoice:send");
    const service = await getQuickBooksServiceForTeam(teamId);

    // UI passes DocNumber; QuickBooks email API expects internal Id
    const invoices = await service.listInvoices();
    const target = invoices.find(
      (inv: any) => String(inv.DocNumber) === String(invoiceId),
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

    await service.sendInvoicePdf(quickbooksId, email);
    return NextResponse.json({
      success: true,
      message: `Invoice ${invoiceId} sent to ${email}`,
    });
  } catch (error: any) {
    console.error(`Failed to send invoice ${invoiceId}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send invoice email",
      },
      { status: 500 },
    );
  }
}
