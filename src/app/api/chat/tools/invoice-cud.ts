import { tool } from "ai";
import { findOrCreateCustomerByDisplayName } from "@/actions/customers";
import { buildItemResolver } from "@/actions/items";
import { 
  createInvoiceParamsSchema, 
  updateInvoiceParamsSchema, 
  deleteInvoiceParamsSchema 
} from "../schemas/invoice-schemas";
import { 
  InvoiceCreateResponse, 
  InvoiceUpdateResponse, 
  InvoiceDeleteResponse 
} from "../schemas/response-types";
import {
  initializeServiceWithPermission,
  findInvoiceByDocNumber,
  executeToolSafely,
  createErrorResponse,
  createSuccessResponse,
} from "../utils/tool-helpers";

export const createInvoice = tool({
  description:
    "Create a new invoice in QuickBooks Online. Use this when the user wants to create a new invoice with a customer name and line item details. Accepts optional issue date and due date.",
  parameters: createInvoiceParamsSchema,
  execute: async ({ customerName, items, issueDate, dueDate }): Promise<InvoiceCreateResponse> => {
    return executeToolSafely(async () => {
      const { service } = await initializeServiceWithPermission("invoice:create");

      // Find or create customer by display name (manual flow parity)
      const { id: customerId } = await findOrCreateCustomerByDisplayName(
        service as any,
        customerName,
      );

      // Resolve ItemRef for products (manual flow parity)
      const resolveOrCreateItemRef = buildItemResolver(service as any);
      const Line = await Promise.all(
        items.map(async (item: any) => {
          const itemRef = await resolveOrCreateItemRef(item.productName);
          const amount = (item.quantity ?? 1) * (item.rate ?? 0);
          return {
            Amount: amount,
            DetailType: "SalesItemLineDetail",
            Description:
              item.description || item.productDescription || item.productName || "Item",
            SalesItemLineDetail: {
              Qty: item.quantity ?? 1,
              UnitPrice: item.rate ?? 0,
              ...(itemRef ? { ItemRef: itemRef } : {}),
            },
          };
        }),
      );

      const payload: any = {
        CustomerRef: { value: customerId, name: customerName },
        Line,
        ...(issueDate ? { TxnDate: issueDate } : {}),
        ...(dueDate ? { DueDate: dueDate } : {}),
      };

      const createdInvoice = await service.createInvoice(payload);
      const totalAmount = (createdInvoice as any)?.TotalAmt;

      return createSuccessResponse(
        `Invoice created successfully for ${customerName}.` +
          (typeof totalAmount === "number" ? ` Total amount: $${Number(totalAmount).toFixed(2)}.` : ""),
        {
          invoice: createdInvoice,
          invoiceId: (createdInvoice as any)?.Id || (createdInvoice as any)?.DocNumber,
        }
      );
    }, "Failed to create invoice in QuickBooks");
  },
});

export const updateInvoice = tool({
  description:
    "Update an existing invoice by DocNumber in QuickBooks Online. Use for changing dates, items, or customer name. The tool will handle SyncToken resolution.",
  parameters: updateInvoiceParamsSchema,
  execute: async ({ docNumber, updates }): Promise<InvoiceUpdateResponse> => {
    return executeToolSafely(async () => {
      const { service } = await initializeServiceWithPermission("invoice:update");

      // Resolve DocNumber -> Id + SyncToken
      const result = await findInvoiceByDocNumber(service, docNumber);
      if (!result) {
        return createErrorResponse(
          "Invoice not found",
          `Invoice "${docNumber}" not found.`
        );
      }

      // Fetch current invoice
      const currentInvoice: any = await service.getInvoice(result.quickbooksId);
      const updatedInvoice: any = {
        ...currentInvoice,
        Id: result.quickbooksId,
        SyncToken: result.syncToken,
      };

      if (updates.issueDate) updatedInvoice.TxnDate = updates.issueDate;
      if (updates.dueDate) updatedInvoice.DueDate = updates.dueDate;

      if (updates.customerName) {
        const { id: customerId, name } = await findOrCreateCustomerByDisplayName(
          service as any,
          updates.customerName,
        );
        updatedInvoice.CustomerRef = { value: customerId, name };
      }

      if (updates.items) {
        const resolveOrCreateItemRef = buildItemResolver(service as any);
        const Line = await Promise.all(
          updates.items.map(async (item: any) => {
            const itemRef = await resolveOrCreateItemRef(item.productName);
            const qty = item.quantity ?? 1;
            const rate = item.rate ?? 0;
            return {
              Amount: qty * rate,
              DetailType: "SalesItemLineDetail",
              Description:
                item.description || item.productDescription || item.productName,
              SalesItemLineDetail: {
                Qty: qty,
                UnitPrice: rate,
                ...(itemRef ? { ItemRef: itemRef } : {}),
              },
            };
          }),
        );
        updatedInvoice.Line = Line;
      }

      const updateResult = await service.updateInvoice(updatedInvoice);
      return createSuccessResponse(
        `Invoice ${docNumber} updated successfully.`,
        {
          invoice: updateResult,
          invoiceId: docNumber,
        }
      );
    }, "Failed to update invoice in QuickBooks");
  },
});

export const deleteInvoice = tool({
  description:
    "Delete (void) an invoice in QuickBooks Online by DocNumber. The tool will resolve the internal Id and SyncToken.",
  parameters: deleteInvoiceParamsSchema,
  execute: async ({ docNumber }): Promise<InvoiceDeleteResponse> => {
    return executeToolSafely(async () => {
      const { service } = await initializeServiceWithPermission("invoice:delete");
      
      const result = await findInvoiceByDocNumber(service, docNumber);
      if (!result) {
        return createErrorResponse(
          "Invoice not found",
          `Invoice "${docNumber}" not found.`
        );
      }

      await service.deleteInvoice(result.quickbooksId, result.syncToken);

      return createSuccessResponse(
        `Invoice ${docNumber} has been deleted successfully.`,
        { deletedInvoiceId: docNumber }
      );
    }, "Failed to delete invoice in QuickBooks");
  },
});
