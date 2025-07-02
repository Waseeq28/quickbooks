import { NextResponse } from 'next/server'
import { qbService } from '@/lib/quickbooks'

export async function GET() {
  try {
    console.log('Testing QuickBooks connection...')
    
    // A successful call to getInvoices serves as a connection test.
    const invoices = await qbService.getInvoices()
    
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
    console.error('QuickBooks test error:', error)
    
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