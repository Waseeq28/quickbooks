"use client"

import { useState } from "react"
import { useChat } from '@ai-sdk/react'
import { InvoicePanel } from "@/components/InvoicePanel"
import { ChatPanel } from "@/components/ChatPanel"
import { Header } from "@/components/Header"
import { SimpleInvoice } from "@/types/quickbooks"

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<SimpleInvoice | null>(null)
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Real AI SDK useChat hook
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

  const handleInvoiceSelect = (invoice: SimpleInvoice) => {
    setSelectedInvoice(invoice)
  }

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true)
    setError(null)
    try {
      const response = await fetch('/api/quickbooks/invoices')
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      const data: SimpleInvoice[] = await response.json()
      setInvoices(data)
      setSelectedInvoice(data[0] || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoadingInvoices(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 divide-x divide-border">
          {/* Invoice Panel */}
          <div className="flex-1 min-w-0">
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
          <div className="flex-1 min-w-0">
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
    </div>
  )
}
