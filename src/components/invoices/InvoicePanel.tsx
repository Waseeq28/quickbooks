"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Receipt, Plus } from "lucide-react";
import { SimpleInvoice } from "@/types/quickbooks";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceDetails } from "@/components/invoices/InvoiceDetails";
import { EmptyState } from "@/components/shared/EmptyState";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { useState } from "react";
import { PermissionGate } from "@/components/providers/AuthzProvider";

interface InvoicePanelProps {
  invoices: SimpleInvoice[];
  selectedInvoice: SimpleInvoice | null;
  onInvoiceSelect: (invoice: SimpleInvoice) => void;
  isLoading: boolean;
  onFetchInvoices: () => Promise<void>;
  error: string | null;
}

export function InvoicePanel({
  invoices,
  selectedInvoice,
  onInvoiceSelect,
  isLoading,
  onFetchInvoices,
  error,
}: InvoicePanelProps) {
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/quickbooks/invoices/${invoiceId}/pdf`);

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-background overflow-hidden">
      {/* Header */}
      <div className="relative px-4 py-3 glass-effect border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Invoices</h2>
              <p className="text-xs text-muted-foreground font-medium">
                Track and manage billing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PermissionGate action={"invoice:create"}>
              <Button
                onClick={() => setCreateInvoiceOpen(true)}
                size="sm"
                variant="outline"
                className="flex-1 gap-2 font-medium bg-card/50 hover:bg-card border-border/50 hover:border-primary/50 shadow-md hover:shadow-lg transition-all duration-200 group"
              >
                <Plus className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors" />
                <span className="text-foreground group-hover:text-primary transition-colors">
                  Create
                </span>
              </Button>
            </PermissionGate>
            <Button
              onClick={onFetchInvoices}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="flex-1 gap-2 font-medium bg-card/50 hover:bg-card border-border/50 hover:border-primary/50 shadow-md hover:shadow-lg transition-all duration-200 group"
            >
              <RefreshCw
                className={`h-4 w-4 text-primary group-hover:text-primary/80 transition-colors ${isLoading ? "animate-spin" : "group-hover:rotate-180"} duration-300`}
              />
              <span className="text-foreground group-hover:text-primary transition-colors">
                {isLoading ? "Loading..." : "Refresh"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <InvoiceList
          invoices={invoices}
          selectedInvoice={selectedInvoice}
          onInvoiceSelect={onInvoiceSelect}
          isLoading={isLoading}
          error={error}
        />

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {!isLoading && selectedInvoice ? (
              <InvoiceDetails
                invoice={selectedInvoice}
                onDownloadPdf={handleDownloadPdf}
              />
            ) : !isLoading ? (
              <EmptyState
                title="No Invoice Selected"
                description={
                  invoices.length > 0
                    ? "Select an invoice to view details"
                    : "Click refresh to load invoices"
                }
              />
            ) : null}
          </ScrollArea>
        </div>
      </div>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        onInvoiceCreated={async () => {
          await onFetchInvoices();
        }}
      />
    </div>
  );
}
