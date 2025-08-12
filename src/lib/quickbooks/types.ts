export interface QbCustomer {
  Id: string
  DisplayName: string
  PrimaryEmailAddr?: { Address?: string }
}

export interface QbInvoiceLineItem {
  Amount: number
  DetailType: 'SalesItemLineDetail'
  SalesItemLineDetail: {
    ItemRef: { value: string }
    Qty?: number
    UnitPrice?: number
  }
  Description?: string
}

export interface QbInvoice {
  Id?: string
  SyncToken?: string
  CustomerRef: { value: string }
  Line: QbInvoiceLineItem[]
  BillEmail?: { Address: string }
  TxnDate?: string
  DueDate?: string
  PrivateNote?: string
  TotalAmt?: number
}


