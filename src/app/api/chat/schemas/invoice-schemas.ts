import { z } from "zod";

// Invoice item schema for creating invoices
export const invoiceItemSchema = z.object({
  description: z.string().describe("Item description"),
  productName: z.string().optional().describe("Product/Service name to map to an Item (will be created if missing)"),
  productDescription: z.string().optional().describe("Alternate/long description"),
  quantity: z.number().describe("Quantity of the item"),
  rate: z.number().describe("Price per unit"),
});

// Invoice item schema for updating invoices (all fields optional)
export const updateInvoiceItemSchema = z.object({
  description: z.string().optional(),
  productName: z.string().optional(),
  productDescription: z.string().optional(),
  quantity: z.number().optional(),
  rate: z.number().optional(),
});

// Date schema for invoice dates
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe("Date in YYYY-MM-DD format");

// Common parameter schemas
export const docNumberSchema = z
  .string()
  .describe("The invoice DocNumber as shown in the UI (human-readable number)");

export const emailSchema = z.string().email().describe("Email address");

// Tool parameter schemas
export const getInvoiceParamsSchema = z.object({
  docNumber: docNumberSchema,
});

export const createInvoiceParamsSchema = z.object({
  customerName: z.string().describe("Customer display name for the invoice"),
  items: z
    .array(invoiceItemSchema)
    .min(1)
    .describe("Array of invoice items"),
  issueDate: dateSchema.optional().describe("Transaction date in YYYY-MM-DD format"),
  dueDate: dateSchema.optional().describe("Due date in YYYY-MM-DD format"),
});

export const updateInvoiceParamsSchema = z.object({
  docNumber: docNumberSchema,
  updates: z
    .object({
      issueDate: dateSchema.optional().describe("New transaction date in YYYY-MM-DD format"),
      dueDate: dateSchema.optional().describe("New due date in YYYY-MM-DD format"),
      customerName: z
        .string()
        .optional()
        .describe("New customer name (will be created if not found)"),
      items: z
        .array(updateInvoiceItemSchema)
        .optional()
        .describe("New set of invoice items"),
    })
    .describe("Fields to update"),
});

export const deleteInvoiceParamsSchema = z.object({
  docNumber: docNumberSchema,
});

export const sendInvoicePdfParamsSchema = z.object({
  docNumber: docNumberSchema,
  email: emailSchema,
});

export const downloadInvoicePdfParamsSchema = z.object({
  docNumber: docNumberSchema,
});

// Empty schema for tools that don't need parameters
export const emptyParamsSchema = z.object({});
