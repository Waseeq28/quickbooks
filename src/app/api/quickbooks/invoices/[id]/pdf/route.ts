import { NextRequest, NextResponse } from 'next/server'
import { getQuickBooksService } from '@/lib/quickbooks/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Get the PDF from QuickBooks
    const service = await getQuickBooksService()
    const pdfBuffer = await service.getInvoicePdf(invoiceId)

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    console.error('Error downloading invoice PDF:', error)
    return NextResponse.json(
      { error: 'Failed to download invoice PDF' },
      { status: 500 }
    )
  }
} 