import { tool } from "ai";
import { 
  sendInvoicePdfParamsSchema, 
  downloadInvoicePdfParamsSchema 
} from "../schemas/invoice-schemas";
import { 
  InvoiceSendResponse, 
  InvoiceDownloadResponse 
} from "../schemas/response-types";
import {
  initializeServiceWithPermission,
  findInvoiceByDocNumber,
  executeToolSafely,
  createErrorResponse,
  createSuccessResponse,
} from "../utils/tool-helpers";

export const sendInvoicePdf = tool({
  description:
    "Send the PDF of a specific invoice to a recipient via email by DocNumber.",
  parameters: sendInvoicePdfParamsSchema,
  execute: async ({ docNumber, email }): Promise<InvoiceSendResponse> => {
    return executeToolSafely(async () => {
      const { service } = await initializeServiceWithPermission("invoice:send");
      
      const result = await findInvoiceByDocNumber(service, docNumber);
      if (!result) {
        return createErrorResponse(
          "Invoice not found",
          `Invoice "${docNumber}" not found.`
        );
      }

      await service.sendInvoicePdf(result.quickbooksId, email);
      
      return createSuccessResponse(
        `Invoice ${docNumber} has been sent to ${email}.`,
        {
          invoiceId: docNumber,
          email: email,
        }
      );
    }, "Failed to send invoice PDF");
  },
});

export const downloadInvoicePdf = tool({
  description:
    "Download PDF version of an invoice. Provide the DocNumber; the UI will handle the download from the generated link.",
  parameters: downloadInvoicePdfParamsSchema,
  execute: async ({ docNumber }): Promise<InvoiceDownloadResponse> => {
    return executeToolSafely(async () => {
      const { service } = await initializeServiceWithPermission("invoice:download");
      
      // Verify the invoice exists by DocNumber
      const result = await findInvoiceByDocNumber(service, docNumber);
      if (!result) {
        return createErrorResponse(
          "Invoice not found",
          `Invoice "${docNumber}" not found.`
        );
      }

      return createSuccessResponse(
        `The PDF download has been initiated for invoice ${docNumber}.`,
        {
          downloadUrl: `/api/quickbooks/invoices/${docNumber}/pdf`,
          invoiceId: docNumber,
          action: "download_pdf",
        }
      );
    }, "Failed to initiate PDF download");
  },
});
