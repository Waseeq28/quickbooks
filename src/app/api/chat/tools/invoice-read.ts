import { tool } from "ai";
import { 
  emptyParamsSchema, 
  getInvoiceParamsSchema 
} from "../schemas/invoice-schemas";
import { 
  InvoiceListResponse, 
  InvoiceDetailResponse 
} from "../schemas/response-types";
import {
  initializeServiceWithPermission,
  findInvoiceByDocNumber,
  fetchSimplifiedInvoices,
  executeToolSafely,
  createErrorResponse,
  createSuccessResponse,
} from "../utils/tool-helpers";

export const fetchAllInvoices = tool({
  description:
    "Fetch all invoices from QuickBooks Online. Use this when the user asks to retrieve, get, fetch, or see all invoices.",
  parameters: emptyParamsSchema,
  execute: async (): Promise<InvoiceListResponse> => {
    return executeToolSafely(async () => {
      const { service } = await initializeServiceWithPermission("invoice:read");
      const simplifiedInvoices = await fetchSimplifiedInvoices(service);

      return createSuccessResponse(
        `Retrieved ${simplifiedInvoices.length} invoices.`,
        {
          invoices: simplifiedInvoices,
          count: simplifiedInvoices.length,
        }
      );
    }, "Failed to fetch invoices from QuickBooks");
  },
});

export const fetchOverdueInvoices = tool({
  description:
    "Fetch only overdue invoices from QuickBooks Online. Use this when the user asks to see overdue/past-due invoices.",
  parameters: emptyParamsSchema,
  execute: async (): Promise<InvoiceListResponse> => {
    return executeToolSafely(async () => {
      const { service } = await initializeServiceWithPermission("invoice:read");
      const simplifiedInvoices = await fetchSimplifiedInvoices(service);
      const overdue = simplifiedInvoices.filter((inv: any) => inv.status === "overdue");
      
      return createSuccessResponse(
        `Retrieved ${overdue.length} overdue invoices.`,
        {
          invoices: overdue,
          count: overdue.length,
        }
      );
    }, "Failed to fetch overdue invoices from QuickBooks");
  },
});

export const getInvoice = tool({
  description:
    "Get details of a specific invoice by DocNumber (the number shown in the UI). Use when the user asks for a specific invoice.",
  parameters: getInvoiceParamsSchema,
  execute: async ({ docNumber }): Promise<InvoiceDetailResponse> => {
    return executeToolSafely(async () => {
      const { service } = await initializeServiceWithPermission("invoice:read");
      
      // Use our helper to find invoice by DocNumber
      const result = await findInvoiceByDocNumber(service, docNumber);
      if (!result) {
        return createErrorResponse(
          "Invoice not found",
          `Invoice "${docNumber}" not found.`
        );
      }

      const rawInvoice = await service.getInvoice(result.quickbooksId);
      if (!rawInvoice) {
        return createErrorResponse(
          "Invoice not found",
          `Invoice "${docNumber}" not found.`
        );
      }

      return createSuccessResponse(
        `Invoice ${docNumber} retrieved.`,
        { invoice: rawInvoice }
      );
    }, "Failed to fetch invoice from QuickBooks");
  },
});
