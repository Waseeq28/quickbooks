import type { QuickBooksService } from '@/lib/quickbooks/service'

function normalizeName(name?: string): string {
  return (name || '').trim().toLowerCase()
}

export function buildItemResolver(qbService: QuickBooksService | any) {
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

    cachedItems!.push(createdItem)
    return { value: String(createdItem.Id), name: createdItem.Name }
  }
}


