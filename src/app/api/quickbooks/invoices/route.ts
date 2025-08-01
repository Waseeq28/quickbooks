import { NextResponse } from 'next/server'
import { getQuickBooksService } from '@/lib/quickbooks'
import { transformQBInvoicesToSimple } from '@/lib/quickbooks-transform'

export async function GET() {
  try {
    const qbService = await getQuickBooksService()
    const rawInvoices = await qbService.getInvoices()
    const simplifiedInvoices = transformQBInvoicesToSimple(rawInvoices)

    return NextResponse.json(simplifiedInvoices)
  } catch (error: any) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoices from QuickBooks',
        details: error.message 
      }, 
      { status: 500 }
    )
  }
} 