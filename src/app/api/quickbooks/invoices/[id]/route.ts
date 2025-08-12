import { NextRequest, NextResponse } from 'next/server'
import { getQuickBooksService } from '@/lib/quickbooks/service'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const qbService = await getQuickBooksService()
    const docNumber = params.id

    // Find invoice by DocNumber to obtain QuickBooks Id and SyncToken
    const invoices = await qbService.listInvoices()
    const target = invoices.find((inv: any) => String(inv.DocNumber) === String(docNumber))
    if (!target) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    const quickbooksId = String(target.Id)
    const syncToken = String(target.SyncToken)

    await qbService.deleteInvoice(quickbooksId, syncToken)

    return NextResponse.json({ success: true, deletedInvoiceId: docNumber })
  } catch (error: any) {
    console.error('Failed to delete invoice:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete invoice in QuickBooks',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}


