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
          message: `Successfully fetched ${simplifiedInvoices.length} invoices from QuickBooks`,
          invoices: simplifiedInvoices,
          count: simplifiedInvoices.length
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to fetch invoices from QuickBooks',
          message: error.message || 'Unknown error occurred while fetching invoices'
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
            message: `Invoice with ID "${invoiceId}" was not found in QuickBooks.`
          };
        }

        return {
          success: true,
          message: `Found and selected invoice ${invoiceId}.`,
          invoice: rawInvoice
        };
      } catch (error: any) {
        return {
          success: false,
          error: 'Failed to fetch invoice from QuickBooks',
          message: `Could not retrieve invoice "${invoiceId}". ${error.message || 'Please check the invoice ID and try again.'}`
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
- Answering questions about invoice data when specifically asked

When a user asks to see, fetch, get, or retrieve invoices, use the fetchAllInvoices tool and only mention the total number of invoices fetched.
When a user asks about a specific invoice by ID, use the getInvoice tool with the exact invoice ID. This will select the invoice in the interface if found.

If an invoice is not found, simply state that it was not found - do not try to find alternative invoices.
Only provide insights, summaries, or analysis when specifically asked by the user.
Keep responses brief and to the point.`,
  });

  return result.toDataStreamResponse();
} 