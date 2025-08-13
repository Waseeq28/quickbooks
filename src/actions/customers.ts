import type { QuickBooksService } from '@/lib/quickbooks/service'

export async function findOrCreateCustomerByDisplayName(
  qbService: QuickBooksService | any,
  customerName: string
): Promise<{ id: string; name: string }> {
  const existing = await qbService.findCustomerByDisplayName(customerName)
  if (existing) {
    return { id: String(existing.Id), name: existing.DisplayName || customerName }
  }
  const created = await qbService.createCustomer({ DisplayName: customerName })
  return { id: String(created?.Id), name: created?.DisplayName || customerName }
}


