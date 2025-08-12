import { NextResponse } from 'next/server'
import { getQuickBooksService } from '@/lib/quickbooks/service'

export async function GET() {
  try {
    // A successful call to getInvoices serves as a connection test.
    const service = await getQuickBooksService()
    const invoices = await service.listInvoices()
    
    return NextResponse.json({
      success: true,
      message: 'QuickBooks connection successful',
      data: {
        invoiceCount: invoices.length,
        // Return a sample of invoices for verification
        invoices: invoices.slice(0, 3) 
      }
    })

  } catch (error: any) {
    // If getInvoices fails, the connection is considered failed.
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to QuickBooks',
        message: 'Check your credentials in .env.local and that your refresh token is valid.',
        details: error.message
      },
      { status: 500 }
    )
  }
} 