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

        console.log('Creating invoice with data:', JSON.stringify(invoiceData, null, 2));
        const createdInvoice = await qbService.createInvoice(invoiceData);
        console.log('Created invoice result:', JSON.stringify(createdInvoice, null, 2));
        
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
- Answering questions about invoice data when specifically asked

When a user asks to see, fetch, get, or retrieve invoices, use the fetchAllInvoices tool and only provide a brief confirmation. The UI will display the invoices.
When a user asks about a specific invoice by ID, use the getInvoice tool with the exact invoice ID. Only provide a brief confirmation. The UI will show the invoice details.
When a user wants to create a new invoice, first get the customers list using getCustomers tool if needed, then use the createInvoice tool with ONLY the parameters the user explicitly provided.

IMPORTANT: Only use information the user explicitly provides. Do not assume or add:
- Transaction dates (let QuickBooks set defaults)
- Due dates (unless user specifies)
- Item descriptions beyond the item name
- Payment terms or other business logic

For invoice creation, extract only what the user states:
- Customer name/reference
- Item name, quantity, unit price
- Due date (only if explicitly mentioned)

Do not describe invoice details in chat - the interface displays all invoice information.
If an invoice is not found, simply state that it was not found.
Only provide insights, summaries, or analysis when specifically asked by the user.
Keep all responses brief and to the point.`,
  });

  return result.toDataStreamResponse();
} 