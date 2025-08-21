import { tool } from "ai";
import { emptyParamsSchema } from "../schemas/invoice-schemas";
import { CustomerListResponse } from "../schemas/response-types";
import {
  initializeServiceWithPermission,
  executeToolSafely,
  createSuccessResponse,
} from "../utils/tool-helpers";

export const getCustomers = tool({
  description:
    "Get all customers from QuickBooks Online. Use this when the user wants to create an invoice and needs to see available customers.",
  parameters: emptyParamsSchema,
  execute: async (): Promise<CustomerListResponse> => {
    return executeToolSafely(async () => {
      const { service } = await initializeServiceWithPermission("invoice:read");
      const customers = await service.listCustomers();

      const formattedCustomers = (customers as any[]).map((customer: any) => ({
        id: customer.Id,
        name: customer.Name,
        companyName: customer.CompanyName,
        email: customer.PrimaryEmailAddr?.Address,
      }));

      return createSuccessResponse(
        `Retrieved ${customers.length} customers.`,
        {
          customers: formattedCustomers,
          count: customers.length,
        }
      );
    }, "Failed to fetch customers from QuickBooks");
  },
});
