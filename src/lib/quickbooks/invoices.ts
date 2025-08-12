import type { QBInvoice, SimpleInvoice } from '@/types/quickbooks'

export function toSimpleInvoice(qbInvoice: QBInvoice): SimpleInvoice {
  const status: SimpleInvoice['status'] = (() => {
    if (qbInvoice.Balance === 0) return 'paid'
    if (qbInvoice.DueDate) {
      const due = new Date(qbInvoice.DueDate)
      if (!isNaN(due.getTime()) && due < new Date()) return 'overdue'
    }
    return 'pending'
  })()

  const items = qbInvoice.Line
    .filter(line => line.DetailType === 'SalesItemLineDetail')
    .map(line => ({
      description: line.Description || line.SalesItemLineDetail?.ItemRef?.name || 'Item',
      productName: line.SalesItemLineDetail?.ItemRef?.name || 'Item',
      productDescription: line.Description || '',
      quantity: line.SalesItemLineDetail?.Qty ?? 1,
      rate: line.SalesItemLineDetail?.UnitPrice ?? line.Amount,
      amount: line.Amount,
    })) as any

  return {
    id: qbInvoice.DocNumber,
    customerName: qbInvoice.CustomerRef.name || `Customer ${qbInvoice.CustomerRef.value}`,
    amount: qbInvoice.TotalAmt,
    balance: qbInvoice.Balance,
    status,
    dueDate: qbInvoice.DueDate ? formatDate(qbInvoice.DueDate) : 'No due date',
    issueDate: formatDate(qbInvoice.TxnDate),
    items,
  } as any
}

export function toSimpleInvoices(qbInvoices: QBInvoice[]): SimpleInvoice[] {
  return qbInvoices.map(toSimpleInvoice)
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'No due date'
  const d = new Date(dateString)
  return isNaN(d.getTime()) ? dateString : d.toISOString().split('T')[0]
}


