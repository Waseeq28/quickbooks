"use client";

import { useChat } from "@ai-sdk/react";
import { InvoicePanel } from "@/components/invoices";
import { ChatPanel } from "@/components/chat";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useInvoiceManagement } from "@/hooks/useInvoiceManagement";

export default function InvoiceManagement() {
  const {
    invoices,
    selectedInvoice,
    isLoadingInvoices,
    error,
    handleInvoiceSelect,
    fetchInvoices,
    handleToolInvocationResult,
    startFetchingInvoices,
  } = useInvoiceManagement();

  // AI SDK useChat hook with tool result handling
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      onToolCall: ({ toolCall }) => {
        if (toolCall.toolName === "fetchAllInvoices") {
          startFetchingInvoices();
        }
      },
      onFinish: (message) => {
        for (const toolInvocation of message.toolInvocations || []) {
          handleToolInvocationResult(toolInvocation);
        }
      },
    });

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Invoice Panel */}
        <div className="flex-1 flex flex-col bg-background">
          <Dashboard invoices={invoices} />
          <InvoicePanel
            invoices={invoices}
            selectedInvoice={selectedInvoice}
            onInvoiceSelect={handleInvoiceSelect}
            isLoading={isLoadingInvoices}
            onFetchInvoices={fetchInvoices}
            error={error}
          />
        </div>
        {/* Chat Panel */}
        <div className="w-[450px] border-l border-border bg-card shadow-2xl">
          <ChatPanel
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
