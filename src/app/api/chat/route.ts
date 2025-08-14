import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { getQuickBooksServiceForTeam } from "@/services/quickbooks";
import { requirePermission } from "@/utils/authz-server";
import { toSimpleInvoices, toSimpleInvoice } from "@/lib/invoice-transformers";
import { findOrCreateCustomerByDisplayName } from "@/actions/customers";
import { buildItemResolver } from "@/actions/items";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define invoice tools using the AI SDK tool helper
const invoiceTools = {
  fetchAllInvoices: tool({
    description:
      "Fetch all invoices from QuickBooks Online. Use this when the user asks to retrieve, get, fetch, or see all invoices.",
    parameters: z.object({}), // No parameters needed for fetching all invoices
    execute: async () => {
      try {
        const { teamId } = await requirePermission("invoice:read");
        const service = await getQuickBooksServiceForTeam(teamId);
        const rawInvoices = await service.listInvoices();
        const simplifiedInvoices = toSimpleInvoices(rawInvoices);

        return {
          success: true,
          message: `Retrieved ${simplifiedInvoices.length} invoices.`,
          invoices: simplifiedInvoices,
          count: simplifiedInvoices.length,
        };
      } catch (error: any) {
        return {
          success: false,
          error: "Failed to fetch invoices from QuickBooks",
          message: "Unable to retrieve invoices. Please try again.",
        };
      }
    },
  }),

  fetchOverdueInvoices: tool({
    description:
      "Fetch only overdue invoices from QuickBooks Online. Use this when the user asks to see overdue/past-due invoices.",
    parameters: z.object({}),
    execute: async () => {
      try {
        const { teamId } = await requirePermission("invoice:read");
        const service = await getQuickBooksServiceForTeam(teamId);
        const rawInvoices = await service.listInvoices();
        const simplifiedInvoices = toSimpleInvoices(rawInvoices);
        const overdue = simplifiedInvoices.filter((inv: any) => inv.status === "overdue");
        return {
          success: true,
          message: `Retrieved ${overdue.length} overdue invoices.`,
          invoices: overdue,
          count: overdue.length,
        };
      } catch (error: any) {
        return {
          success: false,
          error: "Failed to fetch overdue invoices from QuickBooks",
          message: "Unable to retrieve overdue invoices. Please try again.",
        };
      }
    },
  }),

  getInvoice: tool({
    description:
      "Get details of a specific invoice by DocNumber (the number shown in the UI). Use when the user asks for a specific invoice.",
    parameters: z.object({
      docNumber: z
        .string()
        .describe("The invoice DocNumber as shown in the UI (human-readable number)"),
    }),
    execute: async ({ docNumber }) => {
      try {
        const { teamId } = await requirePermission("invoice:read");
        const service = await getQuickBooksServiceForTeam(teamId);
        // Resolve DocNumber -> internal Id
        const invoices = await service.listInvoices();
        const target = (invoices as any[]).find(
          (inv: any) => String(inv.DocNumber) === String(docNumber),
        );

        if (!target) {
          return {
            success: false,
            error: "Invoice not found",
            message: `Invoice "${docNumber}" not found.`,
          };
        }

        const quickbooksId = (target as any).Id
          ? String((target as any).Id)
          : String(target.DocNumber);
        const rawInvoice = await service.getInvoice(quickbooksId);

        if (!rawInvoice) {
          return {
            success: false,
            error: "Invoice not found",
            message: `Invoice "${docNumber}" not found.`,
          };
        }

        return {
          success: true,
          message: `Invoice ${docNumber} retrieved.`,
          invoice: rawInvoice,
        };
      } catch (error: any) {
        return {
          success: false,
          error: "Failed to fetch invoice from QuickBooks",
          message: `Could not retrieve invoice "${docNumber}".`,
        };
      }
    },
  }),

  getCustomers: tool({
    description:
      "Get all customers from QuickBooks Online. Use this when the user wants to create an invoice and needs to see available customers.",
    parameters: z.object({}),
    execute: async () => {
      try {
        const { teamId } = await requirePermission("invoice:read");
        const service = await getQuickBooksServiceForTeam(teamId);
        const customers = await service.listCustomers();

        return {
          success: true,
          message: `Retrieved ${customers.length} customers.`,
          customers: (customers as any[]).map((customer: any) => ({
            id: customer.Id,
            name: customer.Name,
            companyName: customer.CompanyName,
            email: customer.PrimaryEmailAddr?.Address,
          })),
          count: customers.length,
        };
      } catch (error: any) {
        return {
          success: false,
          error: "Failed to fetch customers from QuickBooks",
          message: "Unable to retrieve customers. Please try again.",
        };
      }
    },
  }),

  createInvoice: tool({
    description:
      "Create a new invoice in QuickBooks Online. Use this when the user wants to create a new invoice with a customer name and line item details. Accepts optional issue date and due date.",
    parameters: z.object({
      customerName: z.string().describe("Customer display name for the invoice"),
      items: z
        .array(
          z.object({
            description: z.string().describe("Item description"),
            productName: z.string().optional().describe("Product/Service name to map to an Item (will be created if missing)"),
            productDescription: z.string().optional().describe("Alternate/long description"),
            quantity: z.number().describe("Quantity of the item"),
            rate: z.number().describe("Price per unit"),
          }),
        )
        .min(1)
        .describe("Array of invoice items"),
      issueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("Transaction date in YYYY-MM-DD format"),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("Due date in YYYY-MM-DD format"),
    }),
    execute: async ({ customerName, items, issueDate, dueDate }) => {
      try {
        const { teamId } = await requirePermission("invoice:create");
        const service = await getQuickBooksServiceForTeam(teamId);

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

        return {
          success: true,
          message: `Invoice created successfully for ${customerName}.` +
            (typeof totalAmount === "number" ? ` Total amount: $${Number(totalAmount).toFixed(2)}.` : ""),
          invoice: createdInvoice,
          invoiceId: (createdInvoice as any)?.Id || (createdInvoice as any)?.DocNumber,
        };
      } catch (error: any) {
        return {
          success: false,
          error: "Failed to create invoice in QuickBooks",
          message: `Could not create invoice for ${customerName}. Error: ${error.message}`,
        };
      }
    },
  }),

  updateInvoice: tool({
    description:
      "Update an existing invoice by DocNumber in QuickBooks Online. Use for changing dates, items, or customer name. The tool will handle SyncToken resolution.",
    parameters: z.object({
      docNumber: z.string().describe("The invoice DocNumber shown in the UI"),
      updates: z
        .object({
          issueDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("New transaction date in YYYY-MM-DD format"),
          dueDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("New due date in YYYY-MM-DD format"),
          customerName: z
            .string()
            .optional()
            .describe("New customer name (will be created if not found)"),
          items: z
            .array(
              z.object({
                description: z.string().optional(),
                productName: z.string().optional(),
                productDescription: z.string().optional(),
                quantity: z.number().optional(),
                rate: z.number().optional(),
              }),
            )
            .optional()
            .describe("New set of invoice items"),
        })
        .describe("Fields to update"),
    }),
    execute: async ({ docNumber, updates }) => {
      try {
        const { teamId } = await requirePermission("invoice:update");
        const service = await getQuickBooksServiceForTeam(teamId);

        // Resolve DocNumber -> Id + SyncToken
        const invoices = await service.listInvoices();
        const target: any = (invoices as any[]).find(
          (inv: any) => String(inv.DocNumber) === String(docNumber),
        );
        if (!target) {
          return {
            success: false,
            error: "Invoice not found",
            message: `Invoice "${docNumber}" not found.`,
          };
        }
        const quickbooksId = target?.Id ? String(target.Id) : String(target.DocNumber);
        const syncToken = String(target.SyncToken);

        // Fetch current invoice
        const currentInvoice: any = await service.getInvoice(quickbooksId);
        const updatedInvoice: any = {
          ...currentInvoice,
          Id: quickbooksId,
          SyncToken: syncToken,
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

        const result = await service.updateInvoice(updatedInvoice);
        return {
          success: true,
          message: `Invoice ${docNumber} updated successfully.`,
          invoice: result,
          invoiceId: docNumber,
        };
      } catch (error: any) {
        return {
          success: false,
          error: "Failed to update invoice in QuickBooks",
          message: `Could not update invoice "${docNumber}". Error: ${error.message}`,
        };
      }
    },
  }),

  deleteInvoice: tool({
    description:
      "Delete (void) an invoice in QuickBooks Online by DocNumber. The tool will resolve the internal Id and SyncToken.",
    parameters: z.object({
      docNumber: z.string().describe("The invoice DocNumber to delete"),
    }),
    execute: async ({ docNumber }) => {
      try {
        const { teamId } = await requirePermission("invoice:delete");
        const service = await getQuickBooksServiceForTeam(teamId);
        const invoices = await service.listInvoices();
        const target: any = (invoices as any[]).find(
          (inv: any) => String(inv.DocNumber) === String(docNumber),
        );
        if (!target) {
          return {
            success: false,
            error: "Invoice not found",
            message: `Invoice "${docNumber}" not found.`,
          };
        }
        const quickbooksId = target?.Id ? String(target.Id) : String(target.DocNumber);
        const syncToken = String(target.SyncToken);

        await service.deleteInvoice(quickbooksId, syncToken);

        return {
          success: true,
          message: `Invoice ${docNumber} has been deleted successfully.`,
          deletedInvoiceId: docNumber,
        };
      } catch (error: any) {
        return {
          success: false,
          error: "Failed to delete invoice in QuickBooks",
          message: `Could not delete invoice "${docNumber}". Error: ${error.message}`,
        };
      }
    },
  }),

  sendInvoicePdf: tool({
    description:
      "Send the PDF of a specific invoice to a recipient via email by DocNumber.",
    parameters: z.object({
      docNumber: z
        .string()
        .describe("The invoice DocNumber to email"),
      email: z.string().email().describe("Recipient email"),
    }),
    execute: async ({ docNumber, email }) => {
      try {
        const { teamId } = await requirePermission("invoice:send");
        const service = await getQuickBooksServiceForTeam(teamId);
        const invoices = await service.listInvoices();
        const target: any = (invoices as any[]).find(
          (inv: any) => String(inv.DocNumber) === String(docNumber),
        );
        if (!target) {
          return {
            success: false,
            error: "Invoice not found",
            message: `Invoice "${docNumber}" not found.`,
          };
        }
        const quickbooksId = target?.Id ? String(target.Id) : String(target.DocNumber);
        await service.sendInvoicePdf(quickbooksId, email);
        return {
          success: true,
          message: `Invoice ${docNumber} has been sent to ${email}.`,
          invoiceId: docNumber,
          email: email,
        };
      } catch (error: any) {
        return {
          success: false,
          error: "Failed to send invoice PDF",
          message: `Could not send invoice ${docNumber} to ${email}. Error: ${error.message}`,
        };
      }
    },
  }),

  downloadInvoicePdf: tool({
    description:
      "Download PDF version of an invoice. Provide the DocNumber; the UI will handle the download from the generated link.",
    parameters: z.object({
      docNumber: z
        .string()
        .describe("The invoice DocNumber to download as PDF"),
    }),
    execute: async ({ docNumber }) => {
      try {
        const { teamId } = await requirePermission("invoice:download");
        const service = await getQuickBooksServiceForTeam(teamId);
        // Verify the invoice exists by DocNumber
        const invoices = await service.listInvoices();
        const target = (invoices as any[]).find(
          (inv: any) => String(inv.DocNumber) === String(docNumber),
        );
        if (!target) {
          return {
            success: false,
            error: "Invoice not found",
            message: `Invoice "${docNumber}" not found.`,
          };
        }

        return {
          success: true,
          message: `The PDF download has been initiated for invoice ${docNumber}.`,
          downloadUrl: `/api/quickbooks/invoices/${docNumber}/pdf`,
          invoiceId: docNumber,
          action: "download_pdf",
        };
      } catch (error: any) {
        return {
          success: false,
          error: "Failed to initiate PDF download",
          message: `Could not download PDF for invoice "${docNumber}". Error: ${error.message}`,
        };
      }
    },
  }),
};

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    tools: invoiceTools,
    maxSteps: 3, // Reduced from 5 for development
    maxTokens: 150, // Limit tokens for development to save credits
    system: `You are a helpful AI assistant for invoice management with QuickBooks Online integration. 

You can help users with their QuickBooks invoices by:
- Fetching all invoices from QuickBooks Online
- Fetching only overdue invoices
- Getting details of specific invoices by ID and selecting them in the interface
- Retrieving customer information from QuickBooks
 - Creating new invoices with customer name and line item details (optionally issue date and due date)
- Updating existing invoices (due dates, line items, customer changes)
- Deleting (voiding) invoices from QuickBooks
- Downloading PDF versions of invoices
- Answering questions about invoice data when specifically asked

When a user asks to see, fetch, get, or retrieve invoices, use the fetchAllInvoices tool and only provide a brief confirmation. The UI will display the invoices.
When a user asks specifically for overdue/past-due invoices, use the fetchOverdueInvoices tool.
When a user asks about a specific invoice by ID, use the getInvoice tool with the exact invoice ID. Only provide a brief confirmation. The UI will show the invoice details.
 When a user wants to create a new invoice, first get the customers list using getCustomers tool if needed, then use the createInvoice tool with ONLY the parameters the user explicitly provided (customerName, items with description/productName/quantity/rate; optional issueDate and dueDate).
When a user wants to update or delete an invoice, reference it by DocNumber (the number shown in the UI). The tools will resolve the internal Id and SyncToken as needed.
When a user wants to download a PDF of an invoice, provide the DocNumber. The tool returns a downloadUrl that the UI will use; keep chat responses brief.

IMPORTANT: Only use information the user explicitly provides. Do not assume or add:
- Transaction dates (let QuickBooks set defaults)
- Due dates (unless user specifies)
- Item descriptions beyond the item name  
- Payment terms or other business logic

For invoice operations, extract only what the user states:
- Customer name/reference
- Item name, quantity, unit price
- Due date (only if explicitly mentioned)
- Specific fields to update (for updates)

CRITICAL for updates/deletes: Always get the current invoice first to obtain the required sync token. QuickBooks requires the sync token for all update and delete operations to prevent conflicts.

Do not describe invoice details in chat - the interface displays all invoice information.
If an invoice is not found, simply state that it was not found.
Only provide insights, summaries, or analysis when specifically asked by the user.
Keep all responses brief and to the point.`,
  });

  return result.toDataStreamResponse();
}
