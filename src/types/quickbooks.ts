export interface QBInvoice {
  Id: string
  SyncToken: string
  CustomerRef: {
    value: string
    name?: string
  }
  Line: Array<{
    Id?: string
    LineNum?: number
    Amount: number
    DetailType: string
    SalesItemLineDetail?: {
      ItemRef: {
        value: string
        name?: string
      }
      UnitPrice?: number
      Qty?: number
    }
    Description?: string
  }>
  TxnDate: string
  DueDate?: string
  Balance: number
  TotalAmt: number
  EmailStatus?: string
  BillEmail?: {
    Address: string
  }
  PrintStatus?: string
  CustomField?: Array<{
    DefinitionId: string
    Name: string
    Type: string
    StringValue?: string
  }>
}

export interface QBCustomer {
  Id: string
  Name: string
  CompanyName?: string
  PrimaryEmailAddr?: {
    Address: string
  }
}

export interface InvoiceListResponse {
  QueryResponse: {
    Invoice: QBInvoice[]
    startPosition: number
    maxResults: number
  }
}

export interface InvoiceResponse {
  QueryResponse: {
    Invoice: [QBInvoice]
  }
}

// Simplified invoice format for our UI
export interface SimpleInvoice {
  id: string
  customerName: string
  amount: number
  balance: number
  status: "paid" | "pending" | "overdue"
  dueDate: string
  issueDate: string
  items: Array<{
    description: string
    productName?: string
    productDescription?: string
    quantity: number
    rate: number
    amount: number
  }>
} 