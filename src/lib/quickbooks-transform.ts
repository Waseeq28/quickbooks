import type { QBInvoice, SimpleInvoice } from '@/types/quickbooks'

// Transform QuickBooks invoice to our UI format
export function transformQBInvoiceToSimple(qbInvoice: QBInvoice): SimpleInvoice {
  // Determine status based on balance and due date
  const getStatus = (invoice: QBInvoice): "paid" | "pending" | "overdue" => {
    if (invoice.Balance === 0) return "paid"
    
    if (invoice.DueDate) {
      const dueDate = new Date(invoice.DueDate)
      const today = new Date()
      if (dueDate < today) return "overdue"
    }
    
    return "pending"
  }

  // Transform line items - prioritize Description field over ItemRef.name
  const items = qbInvoice.Line
    .filter(line => line.DetailType === 'SalesItemLineDetail')
    .map(line => ({
      description: line.Description || line.SalesItemLineDetail?.ItemRef?.name || 'Unknown Item',
      quantity: line.SalesItemLineDetail?.Qty || 1,
      rate: line.SalesItemLineDetail?.UnitPrice || line.Amount,
      amount: line.Amount
    }))

  return {
    id: qbInvoice.Id,
    customerName: qbInvoice.CustomerRef.name || `Customer ${qbInvoice.CustomerRef.value}`,
    amount: qbInvoice.TotalAmt,
    balance: qbInvoice.Balance,
    status: getStatus(qbInvoice),
    dueDate: (qbInvoice as any)._customCreationFlags?.explicitDueDate === false ? 'No due date' : 
             (qbInvoice.DueDate ? formatDate(qbInvoice.DueDate) : 'No due date'),
    issueDate: formatDate(qbInvoice.TxnDate),
    items
  }
}

// Transform multiple invoices
export function transformQBInvoicesToSimple(qbInvoices: QBInvoice[]): SimpleInvoice[] {
  return qbInvoices.map(transformQBInvoiceToSimple)
}

// Format date from QB format to our UI format
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  } catch {
    return dateString
  }
}

// Helper to find invoice by ID
export function findInvoiceById(invoices: SimpleInvoice[], id: string): SimpleInvoice | undefined {
  return invoices.find(invoice => invoice.id === id)
} 