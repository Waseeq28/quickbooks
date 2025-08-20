// Common response structure for all tools
export interface BaseToolResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Invoice-specific response types
export interface InvoiceListResponse extends BaseToolResponse {
  invoices?: any[];
  count?: number;
}

export interface InvoiceDetailResponse extends BaseToolResponse {
  invoice?: any;
  invoiceId?: string;
}

export interface CustomerListResponse extends BaseToolResponse {
  customers?: Array<{
    id: string;
    name: string;
    companyName?: string;
    email?: string;
  }>;
  count?: number;
}

export interface InvoiceCreateResponse extends BaseToolResponse {
  invoice?: any;
  invoiceId?: string;
}

export interface InvoiceUpdateResponse extends BaseToolResponse {
  invoice?: any;
  invoiceId?: string;
}

export interface InvoiceDeleteResponse extends BaseToolResponse {
  deletedInvoiceId?: string;
}

export interface InvoiceSendResponse extends BaseToolResponse {
  invoiceId?: string;
  email?: string;
}

export interface InvoiceDownloadResponse extends BaseToolResponse {
  downloadUrl?: string;
  invoiceId?: string;
  action?: string;
}
