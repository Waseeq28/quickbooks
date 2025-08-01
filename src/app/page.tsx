"use client"

import { useState, useEffect } from "react"
import { useChat } from '@ai-sdk/react'
import { InvoicePanel } from "@/components/InvoicePanel"
import { ChatPanel } from "@/components/ChatPanel"
import { Header } from "@/components/Header"
import { Dashboard } from "@/components/Dashboard"
import { SimpleInvoice } from "@/types/quickbooks"
import { transformQBInvoiceToSimple } from "@/lib/quickbooks-transform"

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<SimpleInvoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<SimpleInvoice | null>(null)
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingInvoiceSelection, setPendingInvoiceSelection] = useState<string | null>(null)
  
  // Effect to handle pending invoice selection after invoices are updated
  useEffect(() => {
    if (pendingInvoiceSelection && invoices.length > 0) {
      const invoiceToSelect = invoices.find(inv => inv.id === pendingInvoiceSelection)
      if (invoiceToSelect) {
        setSelectedInvoice(invoiceToSelect)
        setPendingInvoiceSelection(null)
      }
    }
  }, [invoices, pendingInvoiceSelection])
  
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
      for (const toolInvocation of message.toolInvocations || []) {
        if (toolInvocation.toolName === 'fetchAllInvoices' && 'result' in toolInvocation) {
          const result = toolInvocation.result as any
          
          if (result.success && result.invoices) {
            setInvoices(result.invoices)
            setSelectedInvoice(result.invoices[0] || null)
          }
          // Clear loading state when fetchAllInvoices completes
          setIsLoadingInvoices(false)
        }
        
        if (toolInvocation.toolName === 'getInvoice' && 'result' in toolInvocation) {
          const result = toolInvocation.result as any
          
          if (result.success && result.invoice) {
            // Transform the raw QB invoice to simplified format
            const simplifiedInvoice = transformQBInvoiceToSimple(result.invoice)
            
            // Check if this invoice is already in our list
            const existingInvoice = invoices.find(inv => inv.id === simplifiedInvoice.id)
            
            if (existingInvoice) {
              // Select the existing invoice immediately
              setSelectedInvoice(existingInvoice)
            } else {
              // Add the new invoice to the list and mark for pending selection
              setInvoices(prev => [...prev, simplifiedInvoice])
              setPendingInvoiceSelection(simplifiedInvoice.id)
            }
          }
        }

        if (toolInvocation.toolName === 'createInvoice' && 'result' in toolInvocation) {
          const result = toolInvocation.result as any
          
          if (result.success && result.invoice) {
            // Transform the newly created invoice and add it to the list
            const simplifiedInvoice = transformQBInvoiceToSimple(result.invoice)
            setInvoices(prev => [simplifiedInvoice, ...prev]) // Add to beginning of list
            setSelectedInvoice(simplifiedInvoice) // Select the newly created invoice
          }
        }

        if (toolInvocation.toolName === 'updateInvoice' && 'result' in toolInvocation) {
          const result = toolInvocation.result as any
          
          if (result.success && result.invoice) {
            // Transform the updated invoice
            const updatedSimplifiedInvoice = transformQBInvoiceToSimple(result.invoice)
            
            // Update the invoice in the list
            setInvoices(prev => prev.map(invoice => 
              invoice.id === updatedSimplifiedInvoice.id ? updatedSimplifiedInvoice : invoice
            ))
            
            // Update selected invoice if it's the one that was updated
            if (selectedInvoice?.id === updatedSimplifiedInvoice.id) {
              setSelectedInvoice(updatedSimplifiedInvoice)
            }
          }
        }

        if (toolInvocation.toolName === 'deleteInvoice' && 'result' in toolInvocation) {
          const result = toolInvocation.result as any
          
          if (result.success && result.deletedInvoiceId) {
            // Remove the deleted invoice from the list
            setInvoices(prev => {
              const updatedInvoices = prev.filter(invoice => invoice.id !== result.deletedInvoiceId)
              
              // If the deleted invoice was selected, select another one or clear selection
              if (selectedInvoice?.id === result.deletedInvoiceId) {
                setSelectedInvoice(updatedInvoices.length > 0 ? updatedInvoices[0] : null)
              }
              
              return updatedInvoices
            })
          }
        }

        if (toolInvocation.toolName === 'downloadInvoicePdf' && 'result' in toolInvocation) {
          const result = toolInvocation.result as any
          
          if (result.success && result.downloadUrl) {
            // Automatically trigger the PDF download
            const link = document.createElement('a')
            link.href = result.downloadUrl
            link.download = `invoice-${result.invoiceId}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
          }
        }

        if (toolInvocation.toolName === 'sendInvoicePdf' && 'result' in toolInvocation) {
          // The result of this tool is primarily for user feedback in the chat,
          // which is automatically handled by the AI SDK.
          // No specific client-side action is needed here, but you could add
          // a notification if desired. For example:
          // console.log('Invoice email sent:', toolInvocation.result);
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
  )
}
