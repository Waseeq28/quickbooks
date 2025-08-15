"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Receipt, Plus } from "lucide-react";
import { SimpleInvoice } from "@/types/quickbooks";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { InvoiceDetails } from "@/components/invoices/InvoiceDetails";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { useState } from "react";
import { PermissionGate } from "@/components/providers/AuthzProvider";
import { EditInvoiceDialog } from "@/components/invoices/EditInvoiceDialog";
import { useEffect } from "react";

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
  const [editOpen, setEditOpen] = useState(false);

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

  // Listen for edit open requests dispatched from children using effect
  useEffect(() => {
    const handler = () => setEditOpen(true);
    window.addEventListener("openEditInvoiceDialog", handler as any);
    return () =>
      window.removeEventListener("openEditInvoiceDialog", handler as any);
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-background overflow-hidden relative">
      {/* Header */}
      <div className="relative px-3 py-2 glass-effect border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-primary to-purple-500">
              <Receipt className="h-3 w-3 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Invoices</h2>
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
                className={`h-4 w-4 text-primary group-hover:text-primary/80 transition-colors ${
                  isLoading ? "animate-spin" : "group-hover:rotate-180"
                } duration-300`}
              />
              <span className="text-foreground group-hover:text-primary transition-colors">
                {isLoading ? "Loading..." : "Refresh"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area (with loading overlay) */}
      <div className="relative flex flex-1 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <LoadingSpinner message="Loading Invoices" size="md" />
          </div>
        )}
        {invoices.length === 0 ? (
          // Centrally aligned empty state for no invoices
          <div className="flex-1">
            <EmptyState
              title="No Invoices Found"
              description="Fetch your invoices"
              icon={Receipt}
              size="lg"
            />
          </div>
        ) : (
          <>
            <InvoiceList
              invoices={invoices}
              selectedInvoice={selectedInvoice}
              onInvoiceSelect={onInvoiceSelect}
              isLoading={false}
              error={error}
            />

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {selectedInvoice ? (
                  <InvoiceDetails
                    invoice={selectedInvoice}
                    onDownloadPdf={handleDownloadPdf}
                  />
                ) : (
                  <EmptyState
                    title="No Invoice Selected"
                    description="Select an invoice to view details"
                  />
                )}
              </ScrollArea>
            </div>
          </>
        )}
      </div>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        onInvoiceCreated={async () => {
          await onFetchInvoices();
        }}
      />

      {/* Edit Invoice Dialog */}
      <EditInvoiceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        invoice={selectedInvoice}
        onSaved={onFetchInvoices}
      />
    </div>
  );
}
