"use client";

import { useState, useEffect } from "react";
import { SimpleInvoice } from "@/types/quickbooks";
import { toSimpleInvoice } from "@/lib/invoice-transformers";

export function useInvoiceManagement() {
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SimpleInvoice | null>(
    null,
  );
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvoiceSelection, setPendingInvoiceSelection] = useState<
    string | null
  >(null);

  // Effect to handle pending invoice selection after invoices are updated
  useEffect(() => {
    if (pendingInvoiceSelection && invoices.length > 0) {
      const invoiceToSelect = invoices.find(
        (inv) => inv.id === pendingInvoiceSelection,
      );
      if (invoiceToSelect) {
        setSelectedInvoice(invoiceToSelect);
        setPendingInvoiceSelection(null);
      }
    }
  }, [invoices, pendingInvoiceSelection]);

  const handleInvoiceSelect = (invoice: SimpleInvoice) => {
    setSelectedInvoice(invoice);
  };

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    setError(null);
    try {
      const response = await fetch("/api/quickbooks/invoices");
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }
      const data: SimpleInvoice[] = await response.json();
      setInvoices(data);
      setSelectedInvoice(data[0] || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleToolInvocationResult = (toolInvocation: any) => {
    if (
      toolInvocation.toolName === "fetchAllInvoices" &&
      "result" in toolInvocation
    ) {
      const result = toolInvocation.result as any;

      if (result.success && result.invoices) {
        setInvoices(result.invoices);
        setSelectedInvoice(result.invoices[0] || null);
      }
      setIsLoadingInvoices(false);
    }

    if (
      toolInvocation.toolName === "fetchOverdueInvoices" &&
      "result" in toolInvocation
    ) {
      const result = toolInvocation.result as any;

      if (result.success && result.invoices) {
        setInvoices(result.invoices);
        setSelectedInvoice(result.invoices[0] || null);
      }
      setIsLoadingInvoices(false);
    }

    if (
      toolInvocation.toolName === "getInvoice" &&
      "result" in toolInvocation
    ) {
      const result = toolInvocation.result as any;

      if (result.success && result.invoice) {
        const simplifiedInvoice = toSimpleInvoice(result.invoice);
        const existingInvoice = invoices.find(
          (inv) => inv.id === simplifiedInvoice.id,
        );

        if (existingInvoice) {
          setSelectedInvoice(existingInvoice);
        } else {
          setInvoices((prev) => [...prev, simplifiedInvoice]);
          setPendingInvoiceSelection(simplifiedInvoice.id);
        }
      }
    }

    if (
      toolInvocation.toolName === "createInvoice" &&
      "result" in toolInvocation
    ) {
      const result = toolInvocation.result as any;

      if (result.success && result.invoice) {
        const simplifiedInvoice = toSimpleInvoice(result.invoice);
        setInvoices((prev) => [simplifiedInvoice, ...prev]);
        setSelectedInvoice(simplifiedInvoice);
      }
    }

    if (
      toolInvocation.toolName === "updateInvoice" &&
      "result" in toolInvocation
    ) {
      const result = toolInvocation.result as any;

      if (result.success && result.invoice) {
        const updatedSimplifiedInvoice = toSimpleInvoice(result.invoice);

        setInvoices((prev) =>
          prev.map((invoice) =>
            invoice.id === updatedSimplifiedInvoice.id
              ? updatedSimplifiedInvoice
              : invoice,
          ),
        );

        if (selectedInvoice?.id === updatedSimplifiedInvoice.id) {
          setSelectedInvoice(updatedSimplifiedInvoice);
        }
      }
    }

    if (
      toolInvocation.toolName === "deleteInvoice" &&
      "result" in toolInvocation
    ) {
      const result = toolInvocation.result as any;

      if (result.success && result.deletedInvoiceId) {
        setInvoices((prev) => {
          const updatedInvoices = prev.filter(
            (invoice) => invoice.id !== result.deletedInvoiceId,
          );

          if (selectedInvoice?.id === result.deletedInvoiceId) {
            setSelectedInvoice(
              updatedInvoices.length > 0 ? updatedInvoices[0] : null,
            );
          }

          return updatedInvoices;
        });
      }
    }

    if (
      toolInvocation.toolName === "downloadInvoicePdf" &&
      "result" in toolInvocation
    ) {
      const result = toolInvocation.result as any;

      if (result.success && result.downloadUrl) {
        const link = document.createElement("a");
        link.href = result.downloadUrl;
        link.download = `invoice-${result.invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const startFetchingInvoices = () => {
    setIsLoadingInvoices(true);
    setError(null);
  };

  return {
    invoices,
    selectedInvoice,
    isLoadingInvoices,
    error,
    handleInvoiceSelect,
    fetchInvoices,
    handleToolInvocationResult,
    startFetchingInvoices,
  };
}
