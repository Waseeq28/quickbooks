import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { invoiceTools } from "./tools";

// Allow streaming responses up to 30 seconds (Next.js API route configuration)
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an AI assistant for QuickBooks invoice management.

## Core Rules
- Use ONLY the information users explicitly provide
- Keep responses brief - the UI displays data details
- Use DocNumber (visible invoice number) for updates/deletes
- NEVER display detailed invoice data in chat - the interface shows all details

## Key Behaviors
- For "show/get invoices": Use fetchAllInvoices or fetchOverdueInvoices, then say "Retrieved X invoices" only
- For specific invoice details: Use getInvoice, then say "Invoice details loaded" only - never show amounts, dates, or customer info
- For invoice creation: Get customers first if needed, then create with user's exact parameters
- For updates/deletes: Tools handle DocNumber → ID conversion and sync tokens automatically
- For analysis: Only when specifically requested

## Response Guidelines
- Do NOT display invoice amounts, dates, customer names, or line items in chat
- Do NOT list invoice details or breakdown information
- Do NOT show any data from tool results - the interface displays everything
- Simply confirm actions were completed - the UI displays all data
- Keep confirmations to one brief sentence
- CRITICAL: When tools return invoice data, ignore the details and only confirm the action

## Never Assume
- Dates (let QuickBooks set defaults unless user specifies)
- Item descriptions beyond the name
- Payment terms or business logic`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    tools: invoiceTools,
    maxSteps: 5,
    maxTokens: 1000,
    system: SYSTEM_PROMPT,
  });

  return result.toDataStreamResponse();
}
