export class QuickBooksApiError extends Error {
  code?: string
  detail?: string
  constructor(message: string, code?: string, detail?: string) {
    super(message)
    this.name = 'QuickBooksApiError'
    this.code = code
    this.detail = detail
  }
}

// Extract a readable message from node-quickbooks error payloads
export function normalizeQbError(err: any): QuickBooksApiError {
  const fault = err?.Fault?.Error?.[0]
  const message = fault?.Message || fault?.Detail || err?.message || 'QuickBooks API error'
  const code = fault?.code || fault?.Code
  const detail = fault?.Detail
  return new QuickBooksApiError(message, code, detail)
}


