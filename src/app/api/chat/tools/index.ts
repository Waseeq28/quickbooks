// Invoice read tools
export { 
  fetchAllInvoices, 
  fetchOverdueInvoices, 
  getInvoice 
} from "./invoice-read";

// Invoice CUD tools (Create, Update, Delete)
export { 
  createInvoice, 
  updateInvoice, 
  deleteInvoice 
} from "./invoice-cud";

// Invoice PDF tools
export { 
  sendInvoicePdf, 
  downloadInvoicePdf 
} from "./invoice-pdf";

// Customer tools
export { 
  getCustomers 
} from "./customer";

// Import all tools to create consolidated registry
import { 
  fetchAllInvoices, 
  fetchOverdueInvoices, 
  getInvoice 
} from "./invoice-read";
import { 
  createInvoice, 
  updateInvoice, 
  deleteInvoice 
} from "./invoice-cud";
import { 
  sendInvoicePdf, 
  downloadInvoicePdf 
} from "./invoice-pdf";
import { 
  getCustomers 
} from "./customer";

// Consolidated tool registry for easy import
export const invoiceTools = {
  // Read operations
  fetchAllInvoices,
  fetchOverdueInvoices,
  getInvoice,
  
  // Customers
  getCustomers,
  
  // CUD operations (Create, Update, Delete)
  createInvoice,
  updateInvoice,
  deleteInvoice,
  
  // PDF operations
  sendInvoicePdf,
  downloadInvoicePdf,
};
