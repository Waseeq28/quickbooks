import type { SimpleInvoice } from '@/types/quickbooks'

export interface CreateInvoiceItemPayload {
  description: string
  productName?: string
  productDescription?: string
  quantity: number
  rate: number
}

export interface CreateInvoicePayload {
  customerName: string
  issueDate?: string
  dueDate?: string
  items: CreateInvoiceItemPayload[]
}

export interface CreateInvoiceResponse {
  success: boolean
  invoice?: SimpleInvoice
  raw?: any
  error?: string
  details?: string
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<CreateInvoiceResponse> {
  const response = await fetch('/api/quickbooks/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return {
      success: false,
      error: data?.error || 'Failed to create invoice',
      details: data?.details,
    }
  }

  return data as CreateInvoiceResponse
}

export interface DeleteInvoiceResponse {
  success: boolean
  deletedInvoiceId?: string
  error?: string
  details?: string
}

export async function deleteInvoice(docNumber: string): Promise<DeleteInvoiceResponse> {
  const response = await fetch(`/api/quickbooks/invoices/${docNumber}`, { method: 'DELETE' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return {
      success: false,
      error: data?.error || 'Failed to delete invoice',
      details: data?.details,
    }
  }
  return data as DeleteInvoiceResponse
}


