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
  
  // AI SDK useChat hook with tool result handling
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    onToolCall: ({ toolCall }) => {
      // Show loading state when AI tools are being executed
      if (toolCall.toolName === 'fetchAllInvoices') {
        setIsLoadingInvoices(true)
        setError(null)
      }
    },
    onFinish: (message) => {
      // Handle tool results and update invoice panel
      if (message.toolInvocations) {
        for (const toolInvocation of message.toolInvocations) {
          if (toolInvocation.toolName === 'fetchAllInvoices' && 'result' in toolInvocation) {
            const result = toolInvocation.result as any
            
            if (result.success && result.invoices) {
              // Update invoices from AI tool result
              setInvoices(result.invoices)
              setSelectedInvoice(result.invoices[0] || null)
              setError(null)
              console.log('AI Tool Result: Updated invoice panel with', result.invoices.length, 'invoices')
            } else if (!result.success) {
              // Handle AI tool errors
              setError(result.message || 'Failed to fetch invoices via AI')
              console.error('AI Tool Error:', result)
            }
            
            setIsLoadingInvoices(false)
          }
          
          if (toolInvocation.toolName === 'getInvoice' && 'result' in toolInvocation) {
            const result = toolInvocation.result as any
            
            if (result.success && result.invoice) {
              // If a specific invoice was fetched, you could highlight it or show details
              console.log('AI Tool Result: Retrieved specific invoice', result.invoice)
            }
          }
        }
      }
    }
  })

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
    <div className="h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Invoice Panel */}
        <div className="flex-1">
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
        <div className="w-[700px] border-l border-border/40">
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
  )
}
