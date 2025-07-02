import QuickBooks from 'node-quickbooks'

// QuickBooks client configuration
export class QuickBooksService {
  private qbo: any
  
  constructor() {
    this.qbo = new QuickBooks(
      process.env.QB_CLIENT_ID!,
      process.env.QB_CLIENT_SECRET!,
      process.env.QB_ACCESS_TOKEN!,
      false, // no token secret needed for OAuth 2.0
      process.env.QB_REALM_ID!,
      process.env.QB_ENVIRONMENT === 'sandbox', // true for sandbox
      process.env.QB_DEBUG === 'true', // enable debug logging
      null, // minor version (use default)
      '2.0', // oauth version
      process.env.QB_REFRESH_TOKEN!
    )
  }

  // Refresh the OAuth 2.0 access token
  private async refreshToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.qbo.refreshAccessToken((err: any, authResponse: any) => {
        if (err) {
          return reject(err)
        }
        
        // The library automatically updates the qbo instance with the new token
        // but you could manually update them if needed from authResponse.getJson()
        
        resolve()
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
            reject(err)
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
            reject(err)
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
            reject(err)
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
            reject(err)
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

// Singleton instance
export const qbService = new QuickBooksService() 