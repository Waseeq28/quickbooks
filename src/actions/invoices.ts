import { getQuickBooksServiceForTeam } from '@/lib/quickbooks/service'
import { toSimpleInvoice, toSimpleInvoices } from '@/lib/quickbooks/invoices'
import { findOrCreateCustomerByDisplayName } from '@/actions/customers'
import { buildItemResolver } from '@/actions/items'
import { z } from 'zod'

export async function listTeamInvoices(teamId: string) {
  const qbService = await getQuickBooksServiceForTeam(teamId)
  const raw = await qbService.listInvoices()
  return toSimpleInvoices(raw)
}

type CreateItem = {
  description: string
  productName?: string
  productDescription?: string
  quantity: number
  rate: number
}

export const CreateInvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  productName: z.string().optional(),
  productDescription: z.string().optional(),
  quantity: z.number().int().positive(),
  rate: z.number().nonnegative(),
})

export const CreateInvoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(CreateInvoiceItemSchema).min(1, 'At least one item is required'),
})

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>

export async function createTeamInvoice(teamId: string, input: CreateInvoiceInput) {
  const qbService = await getQuickBooksServiceForTeam(teamId)
  const { customerName, issueDate, dueDate, items } = input

  const { id: customerId } = await findOrCreateCustomerByDisplayName(qbService, customerName)
  const resolveOrCreateItemRef = buildItemResolver(qbService)

  const Line = await Promise.all(items.map(async (item) => {
    const itemRef = await resolveOrCreateItemRef(item.productName)
    return {
      Amount: (item.quantity ?? 1) * (item.rate ?? 0),
      DetailType: 'SalesItemLineDetail',
      Description: item.description || item.productDescription || item.productName || 'Item',
      SalesItemLineDetail: {
        Qty: item.quantity ?? 1,
        UnitPrice: item.rate ?? 0,
        ...(itemRef ? { ItemRef: itemRef } : {}),
      },
    }
  }))

  const payload: any = {
    CustomerRef: { value: customerId, name: customerName },
    Line,
    ...(issueDate ? { TxnDate: issueDate } : {}),
    ...(dueDate ? { DueDate: dueDate } : {}),
  }

  const created = await qbService.createInvoice(payload)
  return toSimpleInvoice(created)
}


