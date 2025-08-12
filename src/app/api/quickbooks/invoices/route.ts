import { NextRequest, NextResponse } from 'next/server'
import { getQuickBooksService } from '@/lib/quickbooks/service'
import { toSimpleInvoice, toSimpleInvoices } from '@/lib/quickbooks/invoices'

type CreateInvoiceItem = {
  description: string
  productName?: string
  productDescription?: string
  quantity: number
  rate: number
  amount?: number
}

type CreateInvoiceRequest = {
  customerName: string
  issueDate?: string
  dueDate?: string
  items: CreateInvoiceItem[]
}

function normalizeName(name?: string): string {
  return (name || '').trim().toLowerCase()
}

async function findOrCreateCustomer(qbService: any, customerName: string): Promise<{ id: string; name: string }> {
  const customers = await qbService.listCustomers()
  const target = normalizeName(customerName)

  const existing = customers.find((c: any) => (
    normalizeName(c.DisplayName) === target ||
    normalizeName(c.FullyQualifiedName) === target ||
    normalizeName(c.Name) === target
  ))

  if (existing) {
    return { id: String(existing.Id), name: existing.DisplayName || existing.Name || customerName }
  }

  const created = await qbService.createCustomer({ DisplayName: customerName })
  return { id: String(created?.Id), name: created?.DisplayName || customerName }
}

function buildItemResolver(qbService: any) {
  let cachedItems: any[] | null = null
  let cachedAccounts: any[] | null = null

  const ensureItems = async (): Promise<any[]> => {
    if (!cachedItems) cachedItems = await qbService.listItems().catch(() => [])
    return cachedItems || []
  }

  const ensureIncomeAccount = async (): Promise<any | undefined> => {
    if (!cachedAccounts) cachedAccounts = await qbService.listAccounts().catch(() => [])
    const accounts = cachedAccounts || []
    return (
      accounts.find((a: any) => a?.AccountType === 'Income') ||
      accounts.find((a: any) => a?.Classification === 'Revenue') ||
      accounts.find((a: any) => /sales/i.test(a?.Name || ''))
    )
  }

  return async function resolveOrCreateItemRef(productName?: string): Promise<{ value: string; name?: string } | undefined> {
    if (!productName) return undefined
    const items = await ensureItems()
    const target = normalizeName(productName)

    const found = items.find((it: any) => (
      normalizeName(it?.Name) === target ||
      normalizeName(it?.FullyQualifiedName) === target
    ))
    if (found) return { value: String(found.Id), name: found.Name }

    const incomeAccount = await ensureIncomeAccount()
    if (!incomeAccount) return undefined

    const createdItem = await qbService.createItem({
      Name: productName,
      Type: 'Service',
      IncomeAccountRef: { value: String(incomeAccount.Id), name: incomeAccount.Name },
    })

    // cache for subsequent lookups
    cachedItems!.push(createdItem)
    return { value: String(createdItem.Id), name: createdItem.Name }
  }
}

export async function GET() {
  try {
    const qbService = await getQuickBooksService()
    const rawInvoices = await qbService.listInvoices()
    const simplifiedInvoices = toSimpleInvoices(rawInvoices)

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

export async function POST(req: NextRequest) {
  try {
    const qbService = await getQuickBooksService()

    const body = (await req.json()) as CreateInvoiceRequest
    const { customerName, issueDate, dueDate, items } = body

    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find or create customer by name
    const { id: customerId } = await findOrCreateCustomer(qbService, customerName)

    // Resolve items (products/services) and auto-create if missing
    const resolveOrCreateItemRef = buildItemResolver(qbService)

    // Build invoice payload with ItemRef where possible
    const line = await Promise.all(items.map(async (item) => {
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

    const invoicePayload: any = {
      CustomerRef: { value: customerId, name: customerName },
      Line: line,
      ...(issueDate ? { TxnDate: issueDate } : {}),
      ...(dueDate ? { DueDate: dueDate } : {}),
    }

    const created = await qbService.createInvoice(invoicePayload)
    const simple = toSimpleInvoice(created)

    return NextResponse.json({ success: true, invoice: simple, raw: created })
  } catch (error: any) {
    console.error('Failed to create invoice:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create invoice in QuickBooks',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}