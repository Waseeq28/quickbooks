import { getQuickBooksServiceForTeam } from "@/services/quickbooks";
import { requirePermission } from "@/utils/authz-server";
import { toSimpleInvoices } from "@/lib/invoice-transformers";
import { BaseToolResponse } from "../schemas/response-types";

// Permission types that map to our invoice operations
export type InvoicePermission = 
  | "invoice:read" 
  | "invoice:create" 
  | "invoice:update" 
  | "invoice:delete" 
  | "invoice:send" 
  | "invoice:download";

// Common error response helper
export function createErrorResponse(
  error: string, 
  message: string
): BaseToolResponse {
  return {
    success: false,
    error,
    message,
  };
}

// Common success response helper
export function createSuccessResponse(
  message: string, 
  additionalData: Record<string, any> = {}
): BaseToolResponse {
  return {
    success: true,
    message,
    ...additionalData,
  };
}

// Initialize service with permission check
export async function initializeServiceWithPermission(permission: InvoicePermission) {
  try {
    const { teamId } = await requirePermission(permission);
    const service = await getQuickBooksServiceForTeam(teamId);
    return { service, teamId };
  } catch (error: any) {
    throw new Error(`Permission denied or service initialization failed: ${error.message}`);
  }
}

// Find invoice by DocNumber helper
export async function findInvoiceByDocNumber(service: any, docNumber: string) {
  const invoices = await service.listInvoices();
  const target: any = (invoices as any[]).find(
    (inv: any) => String(inv.DocNumber) === String(docNumber),
  );
  
  if (!target) {
    return null;
  }
  
  return {
    invoice: target,
    quickbooksId: target?.Id ? String(target.Id) : String(target.DocNumber),
    syncToken: String(target.SyncToken),
  };
}

// Fetch and simplify invoices helper
export async function fetchSimplifiedInvoices(service: any) {
  const rawInvoices = await service.listInvoices();
  return toSimpleInvoices(rawInvoices);
}

// Handle common tool execution pattern
export async function executeToolSafely<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | BaseToolResponse> {
  try {
    return await operation();
  } catch (error: any) {
    return createErrorResponse(
      errorMessage,
      `${errorMessage}. Error: ${error.message}`
    );
  }
}
