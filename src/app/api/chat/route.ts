import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { qbService } from '@/lib/quickbooks';
import { transformQBInvoicesToSimple } from '@/lib/quickbooks-transform';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Define invoice tools using the AI SDK tool helper
const invoiceTools = {
  fetchAllInvoices: tool({
    description: 'Fetch all invoices from QuickBooks Online. Use this when the user asks to retrieve, get, fetch, or see all invoices.',
    parameters: z.object({}), // No parameters needed for fetching all invoices
    execute: async () => {
      try {
        const rawInvoices = await qbService.getInvoices();
        const simplifiedInvoices = transformQBInvoicesToSimple(rawInvoices);
        
        return {
          success: true,
          message: `Retrieved ${simplifiedInvoices.length} invoices.`,
          invoices: simplifiedInvoices,
          count: simplifiedInvoices.length
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to fetch invoices from QuickBooks',
          message: 'Unable to retrieve invoices. Please try again.'
        };
      }
    },
  }),

  getInvoice: tool({
    description: 'Get details of a specific invoice by ID from QuickBooks Online. Use this when the user asks for details about a specific invoice.',
    parameters: z.object({
      invoiceId: z.string().describe('The exact ID of the invoice to retrieve'),
    }),
    execute: async ({ invoiceId }) => {
      try {
        const rawInvoice = await qbService.getInvoice(invoiceId);
        
        if (!rawInvoice) {
          return {
            success: false,
            error: 'Invoice not found',
            message: `Invoice "${invoiceId}" not found.`
          };
        }

        return {
          success: true,
          message: `Invoice ${invoiceId} retrieved.`,
          invoice: rawInvoice
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to fetch invoice from QuickBooks',
          message: `Could not retrieve invoice "${invoiceId}".`
        };
      }
    },
  }),

  getCustomers: tool({
    description: 'Get all customers from QuickBooks Online. Use this when the user wants to create an invoice and needs to see available customers.',
    parameters: z.object({}),
    execute: async () => {
      try {
        const customers = await qbService.getCustomers();
        
        return {
          success: true,
          message: `Retrieved ${customers.length} customers.`,
          customers: customers.map(customer => ({
            id: customer.Id,
            name: customer.Name,
            companyName: customer.CompanyName,
            email: customer.PrimaryEmailAddr?.Address
          })),
          count: customers.length
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to fetch customers from QuickBooks',
          message: 'Unable to retrieve customers. Please try again.'
        };
      }
    },
  }),

  createInvoice: tool({
    description: 'Create a new invoice in QuickBooks Online. Use this when the user wants to create a new invoice with specific customer and line item details.',
    parameters: z.object({
      customerId: z.string().describe('The ID of the customer for this invoice'),
      customerName: z.string().describe('The name of the customer for reference'),
      lineItems: z.array(z.object({
        itemName: z.string().describe('Name of the item or service being sold'),
        quantity: z.number().describe('Quantity of the item'),
        unitPrice: z.number().describe('Price per unit'),
        amount: z.number().describe('Total amount for this line item (quantity * unitPrice)')
      })).describe('Array of line items for the invoice'),
      dueDate: z.string().optional().describe('Due date for the invoice in YYYY-MM-DD format')
    }),
    execute: async ({ customerId, customerName, lineItems, dueDate }) => {
      try {
        // Calculate total amount
        const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
        
        // Format current date
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Build QuickBooks invoice object - only include what user specified
        const invoiceData = {
          CustomerRef: {
            value: customerId
          },
          // Only set DueDate if explicitly provided by user
          ...(dueDate && { DueDate: dueDate }),
          Line: lineItems.map((item, index) => ({
            Amount: item.amount,
            DetailType: "SalesItemLineDetail",
            Description: item.itemName, // Only field user specified for the item
            SalesItemLineDetail: {
              Qty: item.quantity,
              UnitPrice: item.unitPrice
              // Removed hardcoded ItemRef - let QuickBooks handle defaults
            }
          }))
        };

        const createdInvoice = await qbService.createInvoice(invoiceData);
        
        // Add a flag to track if we explicitly set due date
        if (createdInvoice) {
          createdInvoice._customCreationFlags = {
            explicitDueDate: !!dueDate
          };
        }
        
        return {
          success: true,
          message: `Invoice created successfully for ${customerName}. Total amount: $${totalAmount.toFixed(2)}${dueDate ? `, due ${dueDate}` : ', no due date set'}.`,
          invoice: createdInvoice,
          invoiceId: createdInvoice?.Id,
          totalAmount: totalAmount
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to create invoice in QuickBooks',
          message: `Could not create invoice for ${customerName}. Error: ${error.message}`
        };
      }
    },
  }),

  updateInvoice: tool({
    description: 'Update an existing invoice in QuickBooks Online. Use this when the user wants to modify an existing invoice. Requires the invoice ID and sync token from the current invoice data.',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice to update'),
      syncToken: z.string().describe('The current sync token of the invoice (required for QuickBooks versioning)'),
      updates: z.object({
        dueDate: z.string().optional().describe('New due date for the invoice in YYYY-MM-DD format'),
        lineItems: z.array(z.object({
          itemName: z.string().describe('Name of the item or service being sold'),
          quantity: z.number().describe('Quantity of the item'),
          unitPrice: z.number().describe('Price per unit'),
          amount: z.number().describe('Total amount for this line item (quantity * unitPrice)')
        })).optional().describe('Updated array of line items for the invoice'),
        customerId: z.string().optional().describe('New customer ID if changing the customer')
      }).describe('Object containing the fields to update')
    }),
    execute: async ({ invoiceId, syncToken, updates }) => {
      try {
        // First get the current invoice to preserve existing data
        const currentInvoice = await qbService.getInvoice(invoiceId);
        
        if (!currentInvoice) {
          return {
            success: false,
            error: 'Invoice not found',
            message: `Invoice "${invoiceId}" not found.`
          };
        }

        // Build the updated invoice object
        const updatedInvoice = {
          ...currentInvoice,
          Id: invoiceId,
          SyncToken: syncToken
        };

        // Apply updates
        if (updates.dueDate) {
          updatedInvoice.DueDate = updates.dueDate;
        }

        if (updates.customerId) {
          updatedInvoice.CustomerRef = {
            value: updates.customerId
          };
        }

        if (updates.lineItems) {
          updatedInvoice.Line = updates.lineItems.map((item, index) => ({
            Amount: item.amount,
            DetailType: "SalesItemLineDetail",
            Description: item.itemName,
            SalesItemLineDetail: {
              Qty: item.quantity,
              UnitPrice: item.unitPrice
            }
          }));
        }

        const result = await qbService.updateInvoice(updatedInvoice);
        
        return {
          success: true,
          message: `Invoice ${invoiceId} updated successfully.`,
          invoice: result,
          invoiceId: result?.Id
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to update invoice in QuickBooks',
          message: `Could not update invoice "${invoiceId}". Error: ${error.message}`
        };
      }
    },
  }),

  deleteInvoice: tool({
    description: 'Delete (void) an invoice in QuickBooks Online. Use this when the user wants to permanently remove or void an invoice. Requires the invoice ID and sync token.',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice to delete'),
      syncToken: z.string().describe('The current sync token of the invoice (required for QuickBooks versioning)'),
      invoiceReference: z.string().optional().describe('Invoice reference or number for confirmation')
    }),
    execute: async ({ invoiceId, syncToken, invoiceReference }) => {
      try {
        const result = await qbService.deleteInvoice(invoiceId, syncToken);
        
        return {
          success: true,
          message: `Invoice ${invoiceReference || invoiceId} has been deleted successfully.`,
          deletedInvoiceId: invoiceId
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to delete invoice in QuickBooks',
          message: `Could not delete invoice "${invoiceReference || invoiceId}". Error: ${error.message}`
        };
      }
    },
  }),

  sendInvoicePdf: tool({
    description: 'Send the PDF of a specific invoice to a recipient via email. Use this when the user wants to email an invoice.',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice to send'),
      email: z.string().email().describe('The email address of the recipient'),
    }),
    execute: async ({ invoiceId, email }) => {
      try {
        await qbService.sendInvoiceEmail(invoiceId, email);
        return {
          success: true,
          message: `Invoice ${invoiceId} has been sent to ${email}.`,
          invoiceId: invoiceId,
          email: email
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to send invoice PDF',
          message: `Could not send invoice ${invoiceId} to ${email}. Error: ${error.message}`
        };
      }
    },
  }),

  downloadInvoicePdf: tool({
    description: 'Download PDF version of an invoice from QuickBooks Online. Use this when the user wants to download or get a PDF copy of a specific invoice.',
    parameters: z.object({
      invoiceId: z.string().describe('The ID of the invoice to download as PDF'),
      invoiceReference: z.string().optional().describe('Invoice reference or number for user confirmation')
    }),
    execute: async ({ invoiceId, invoiceReference }) => {
      try {
        // Verify the invoice exists first
        const invoice = await qbService.getInvoice(invoiceId);
        
        if (!invoice) {
          return {
            success: false,
            error: 'Invoice not found',
            message: `Invoice "${invoiceReference || invoiceId}" not found.`
          };
        }

        return {
          success: true,
          message: `The PDF download has been initiated for invoice ${invoiceReference || invoiceId}.`,
          downloadUrl: `/api/quickbooks/invoices/${invoiceId}/pdf`,
          invoiceId: invoiceId,
          action: 'download_pdf'
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to initiate PDF download',
          message: `Could not download PDF for invoice "${invoiceReference || invoiceId}". Error: ${error.message}`
        };
      }
    },
  }),
};

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    tools: invoiceTools,
    maxSteps: 3, // Reduced from 5 for development
    maxTokens: 150, // Limit tokens for development to save credits
    system: `You are a helpful AI assistant for invoice management with QuickBooks Online integration. 

You can help users with their QuickBooks invoices by:
- Fetching all invoices from QuickBooks Online
- Getting details of specific invoices by ID and selecting them in the interface
- Retrieving customer information from QuickBooks
- Creating new invoices with customer and line item details
- Updating existing invoices (due dates, line items, customer changes)
- Deleting (voiding) invoices from QuickBooks
- Downloading PDF versions of invoices
- Answering questions about invoice data when specifically asked

When a user asks to see, fetch, get, or retrieve invoices, use the fetchAllInvoices tool and only provide a brief confirmation. The UI will display the invoices.
When a user asks about a specific invoice by ID, use the getInvoice tool with the exact invoice ID. Only provide a brief confirmation. The UI will show the invoice details.
When a user wants to create a new invoice, first get the customers list using getCustomers tool if needed, then use the createInvoice tool with ONLY the parameters the user explicitly provided.
When a user wants to update an invoice, first get the specific invoice using getInvoice to obtain the current sync token, then use updateInvoice with the invoice ID, sync token, and requested changes.
When a user wants to delete an invoice, first get the specific invoice using getInvoice to obtain the sync token, then use deleteInvoice with the invoice ID and sync token.
When a user wants to download a PDF of an invoice, use downloadInvoicePdf with the invoice ID. The tool will verify the invoice exists and automatically trigger the download. Only respond with the success message, do not include URLs or technical details.

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