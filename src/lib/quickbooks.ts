import QuickBooks from 'node-quickbooks'
import { DatabaseService } from './database'

// QuickBooks client configuration
export class QuickBooksService {
  private qbo: any
  
  constructor(accessToken: string, refreshToken: string, realmId: string) {
    this.qbo = new QuickBooks(
      process.env.QB_CLIENT_ID!,
      process.env.QB_CLIENT_SECRET!,
      accessToken,
      false, // no token secret needed for OAuth 2.0
      realmId,
      process.env.QB_ENVIRONMENT === 'sandbox', // true for sandbox
      false, // debug logging disabled
      null, // minor version (use default)
      '2.0', // oauth version
      refreshToken
    )
  }

  // Static method to create service instance from database
  static async fromDatabase(): Promise<QuickBooksService> {
    const connection = await DatabaseService.getQuickBooksConnection()
    if (!connection) {
      throw new Error('No QuickBooks connection found. Please connect your QuickBooks account first.')
    }
    
    return new QuickBooksService(
      connection.access_token,
      connection.refresh_token,
      connection.realm_id
    )
  }

  // Refresh the OAuth 2.0 access token
  private async refreshToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.qbo.refreshAccessToken(async (err: any, authResponse: any) => {
        if (err) {
          return reject(new Error(err.Fault?.Error?.[0]?.Detail || JSON.stringify(err)))
        }
        
        try {
          // The node-quickbooks library automatically updates the qbo instance with new tokens
          // We can get the updated tokens from the qbo instance itself
          const accessToken = this.qbo.token
          const refreshToken = this.qbo.refreshToken
          
          // Update tokens in database
          await DatabaseService.updateQuickBooksTokens(
            accessToken,
            refreshToken,
            undefined // We don't have expires_in from the refresh response
          )
          
          resolve()
        } catch (dbError) {
          reject(new Error(`Failed to update tokens in database: ${dbError}`))
        }
      })
    })
  }

  // Get all invoices
  async getInvoices(): Promise<any[]> {
    try {
      await this.refreshToken()
      return new Promise((resolve, reject) => {
        this.qbo.findInvoices((err: any, data: any) => {
          if (err) {
            reject(new Error(err.Fault?.Error?.[0]?.Detail || JSON.stringify(err)))
          } else {
            const invoices = data?.QueryResponse?.Invoice || []
            resolve(invoices)
          }
        })
      })
    } catch (error) {
      throw error
    }
  }

  // Get specific invoice by ID
  async getInvoice(invoiceId: string): Promise<any> {
    try {
      await this.refreshToken()
      return new Promise((resolve, reject) => {
        this.qbo.getInvoice(invoiceId, (err: any, data: any) => {
          if (err) {
            reject(new Error(err.Fault?.Error?.[0]?.Detail || JSON.stringify(err)))
          } else {
            resolve(data)
          }
        })
      })
    } catch (error) {
      throw error
    }
  }

  // Update invoice
  async updateInvoice(invoice: any): Promise<any> {
    try {
      await this.refreshToken()
      return new Promise((resolve, reject) => {
        this.qbo.updateInvoice(invoice, (err: any, data: any) => {
          if (err) {
            reject(new Error(err.Fault?.Error?.[0]?.Detail || JSON.stringify(err)))
          } else {
            resolve(data)
          }
        })
      })
    } catch (error) {
      throw error
    }
  }

  // Delete invoice
  async deleteInvoice(invoiceId: string, syncToken: string): Promise<any> {
    try {
      await this.refreshToken()
      return new Promise((resolve, reject) => {
        // For QuickBooks, we need to pass the invoice object with Id and SyncToken
        const invoiceToDelete = {
          Id: invoiceId,
          SyncToken: syncToken
        }
        this.qbo.deleteInvoice(invoiceToDelete, (err: any, data: any) => {
          if (err) {
            reject(new Error(err.Fault?.Error?.[0]?.Detail || JSON.stringify(err)))
          } else {
            resolve(data)
          }
        })
      })
    } catch (error) {
      throw error
    }
  }

  // Send invoice email
  async sendInvoiceEmail(invoiceId: string, emailAddress: string): Promise<any> {
    try {
      await this.refreshToken()
      return new Promise((resolve, reject) => {
        this.qbo.sendInvoicePdf(invoiceId, emailAddress, (err: any, data: any) => {
          if (err) {
            reject(new Error(err.Fault?.Error?.[0]?.Detail || JSON.stringify(err)))
          } else {
            resolve(data)
          }
        })
      })
    } catch (error) {
      throw error
    }
  }

  // Get invoice PDF
  async getInvoicePdf(invoiceId: string): Promise<Buffer> {
    try {
      await this.refreshToken()
      return new Promise((resolve, reject) => {
        this.qbo.getInvoicePdf(invoiceId, (err: any, data: any) => {
          if (err) {
            reject(new Error(err.Fault?.Error?.[0]?.Detail || JSON.stringify(err)))
          } else {
            resolve(data)
          }
        })
      })
    } catch (error) {
      throw error
    }
  }

  // Get all customers
  async getCustomers(): Promise<any[]> {
    try {
      await this.refreshToken()
      return new Promise((resolve, reject) => {
        this.qbo.findCustomers((err: any, data: any) => {
          if (err) {
            reject(new Error(err.Fault?.Error?.[0]?.Detail || JSON.stringify(err)))
          } else {
            const customers = data?.QueryResponse?.Customer || []
            resolve(customers)
          }
        })
      })
    } catch (error) {
      throw error
    }
  }

  // Create a new invoice
  async createInvoice(invoiceData: any): Promise<any> {
    try {
      await this.refreshToken()
      return new Promise((resolve, reject) => {
        this.qbo.createInvoice(invoiceData, (err: any, data: any) => {
          if (err) {
            reject(new Error(err.Fault?.Error?.[0]?.Detail || JSON.stringify(err)))
          } else {
            resolve(data)
          }
        })
      })
    } catch (error) {
      throw error
    }
  }
}

// Helper function to get service instance
export const getQuickBooksService = async (): Promise<QuickBooksService> => {
  return await QuickBooksService.fromDatabase()
} 