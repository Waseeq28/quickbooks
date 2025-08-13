import QuickBooks from 'node-quickbooks'
import { DatabaseService } from '@/lib/database'
import { normalizeQbError } from './errors'
import type { QBInvoice } from '@/types/quickbooks'

export class QuickBooksService {
  private qbo: any

  private constructor(accessToken: string, refreshToken: string, realmId: string, isSandbox: boolean) {
    this.qbo = new QuickBooks(
      process.env.QB_CLIENT_ID!,
      process.env.QB_CLIENT_SECRET!,
      accessToken,
      false,
      realmId,
      isSandbox,
      false,
      null,
      '2.0',
      refreshToken
    )
  }

  static async fromTeam(teamId: string): Promise<QuickBooksService> {
    const connection = await DatabaseService.getQuickBooksConnectionForTeam(teamId)
    if (!connection) throw new Error('No QuickBooks connection found for team')
    const isSandbox = process.env.QB_ENVIRONMENT === 'sandbox'
    return new QuickBooksService(connection.access_token, connection.refresh_token, connection.realm_id, isSandbox)
  }

  private refreshAccessToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.qbo.refreshAccessToken(async (err: any) => {
        if (err) return reject(normalizeQbError(err))
        try {
          const accessToken = this.qbo.token
          const refreshToken = this.qbo.refreshToken
          // We need a teamId to persist refreshed tokens; node-quickbooks does not expose it here.
          // In practice, callers should use fromTeam() and update tokens via that path.
          // For now, skip persistence here; requests will still use fresh tokens in-memory.
          resolve()
        } catch (e: any) {
          reject(new Error(`Failed to persist refreshed tokens: ${e?.message || e}`))
        }
      })
    })
  }

  private async request<T>(opName: string, fn: (qbo: any) => Promise<T>): Promise<T> {
    try {
      await this.refreshAccessToken()
      return await fn(this.qbo)
    } catch (err: any) {
      throw normalizeQbError(err)
    }
  }

  // Invoices
  listInvoices(): Promise<QBInvoice[]> {
    return this.request<QBInvoice[]>('findInvoices', () => new Promise((resolve, reject) => {
      this.qbo.findInvoices((err: any, data: any) => err ? reject(err) : resolve((data?.QueryResponse?.Invoice ?? []) as QBInvoice[]))
    }))
  }

  getInvoice(id: string): Promise<QBInvoice> {
    return this.request<QBInvoice>('getInvoice', () => new Promise((resolve, reject) => {
      this.qbo.getInvoice(id, (err: any, data: any) => err ? reject(err) : resolve(data as QBInvoice))
    }))
  }

  createInvoice(invoice: any): Promise<QBInvoice> {
    return this.request<QBInvoice>('createInvoice', () => new Promise((resolve, reject) => {
      this.qbo.createInvoice(invoice, (err: any, data: any) => err ? reject(err) : resolve(data as QBInvoice))
    }))
  }

  updateInvoice(invoice: any): Promise<QBInvoice> {
    return this.request<QBInvoice>('updateInvoice', () => new Promise((resolve, reject) => {
      this.qbo.updateInvoice(invoice, (err: any, data: any) => err ? reject(err) : resolve(data as QBInvoice))
    }))
  }

  deleteInvoice(id: string, syncToken: string): Promise<any> {
    return this.request<any>('deleteInvoice', () => new Promise((resolve, reject) => {
      this.qbo.deleteInvoice({ Id: id, SyncToken: syncToken }, (err: any, data: any) => err ? reject(err) : resolve(data))
    }))
  }

  sendInvoicePdf(id: string, email: string): Promise<any> {
    return this.request<any>('sendInvoicePdf', () => new Promise((resolve, reject) => {
      this.qbo.sendInvoicePdf(id, email, (err: any, data: any) => err ? reject(err) : resolve(data))
    }))
  }

  getInvoicePdf(id: string): Promise<Buffer> {
    return this.request<Buffer>('getInvoicePdf', () => new Promise((resolve, reject) => {
      this.qbo.getInvoicePdf(id, (err: any, data: any) => err ? reject(err) : resolve(data))
    }))
  }

  // Customers
  listCustomers(): Promise<any[]> {
    return this.request<any[]>('findCustomers', () => new Promise((resolve, reject) => {
      this.qbo.findCustomers((err: any, data: any) => err ? reject(err) : resolve((data?.QueryResponse?.Customer ?? []) as any[]))
    }))
  }

  createCustomer(customer: any): Promise<any> {
    return this.request<any>('createCustomer', () => new Promise((resolve, reject) => {
      this.qbo.createCustomer(customer, (err: any, data: any) => err ? reject(err) : resolve(data))
    }))
  }

  /**
   * Find a single customer by exact DisplayName using QBO query API.
   * Returns the first match or null.
   */
  findCustomerByDisplayName(displayName: string): Promise<any | null> {
    // Escape single quotes for QBO SQL-like syntax by doubling them
    const escaped = displayName.replace(/'/g, "''")
    const query = `select Id, DisplayName from Customer where DisplayName = '${escaped}' maxresults 1`
    return this.request<any | null>('queryCustomerByName', () => new Promise((resolve, reject) => {
      this.qbo.query(query, (err: any, data: any) => {
        if (err) return reject(err)
        const customer = data?.QueryResponse?.Customer?.[0] ?? null
        resolve(customer)
      })
    }))
  }

  // Items (Products/Services)
  listItems(): Promise<any[]> {
    return this.request<any[]>('findItems', () => new Promise((resolve, reject) => {
      this.qbo.findItems((err: any, data: any) => err ? reject(err) : resolve((data?.QueryResponse?.Item ?? []) as any[]))
    }))
  }

  createItem(item: any): Promise<any> {
    return this.request<any>('createItem', () => new Promise((resolve, reject) => {
      this.qbo.createItem(item, (err: any, data: any) => err ? reject(err) : resolve(data))
    }))
  }

  // Accounts
  listAccounts(): Promise<any[]> {
    return this.request<any[]>('findAccounts', () => new Promise((resolve, reject) => {
      this.qbo.findAccounts((err: any, data: any) => err ? reject(err) : resolve((data?.QueryResponse?.Account ?? []) as any[]))
    }))
  }
}

export const getQuickBooksServiceForTeam = async (teamId: string) => QuickBooksService.fromTeam(teamId)


