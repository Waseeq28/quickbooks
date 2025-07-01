"use client"

import { useState } from "react"
import type { FormEvent, ChangeEvent } from "react"
import { InvoicePanel } from "@/components/InvoicePanel"
import { ChatPanel, Message } from "@/components/ChatPanel"
import { Header } from "@/components/Header"

// Mock invoice data for UI demonstration
const mockInvoices = [
  {
    id: "INV-001",
    customerName: "Acme Corporation",
    amount: 2500.0,
    status: "paid" as const,
    dueDate: "2024-01-15",
    issueDate: "2023-12-15",
    items: [
      { description: "Web Development Services", quantity: 1, rate: 2000.0, amount: 2000.0 },
      { description: "Domain Setup", quantity: 1, rate: 500.0, amount: 500.0 },
    ],
  },
  {
    id: "INV-002",
    customerName: "Tech Solutions Inc",
    amount: 1800.0,
    status: "pending" as const,
    dueDate: "2024-01-30",
    issueDate: "2024-01-01",
    items: [
      { description: "Consulting Services", quantity: 8, rate: 150.0, amount: 1200.0 },
      { description: "Software License", quantity: 1, rate: 600.0, amount: 600.0 },
    ],
  },
  {
    id: "INV-003",
    customerName: "StartupXYZ",
    amount: 3200.0,
    status: "overdue" as const,
    dueDate: "2023-12-20",
    issueDate: "2023-11-20",
    items: [{ description: "Mobile App Development", quantity: 1, rate: 3200.0, amount: 3200.0 }],
  },
]

export default function InvoiceManagement() {
  const [selectedInvoice, setSelectedInvoice] = useState(mockInvoices[0])
  const [appIsLoading, setAppIsLoading] = useState(false)
  
  // Mocking the useChat hook
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [chatIsLoading, setChatIsLoading] = useState(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages(prev => [...prev, newMessage]);
    
    const currentInput = input;
    setInput("");
    setChatIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `This is a mock response to: "${currentInput}"`,
      };
      setMessages(prev => [...prev, aiResponse]);
      setChatIsLoading(false);
    }, 1500);
  }
  // End of useChat mock

  const handleInvoiceSelect = (invoice: (typeof mockInvoices)[0]) => {
    setSelectedInvoice(invoice)
  }

  const handleToolExecution = (toolName: string, args: any) => {
    setAppIsLoading(true)
    // UI feedback for tool execution
    setTimeout(() => setAppIsLoading(false), 2000)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 divide-x divide-border">
          {/* Invoice Panel */}
          <div className="flex-1 min-w-0">
            <InvoicePanel
              invoices={mockInvoices}
              selectedInvoice={selectedInvoice}
              onInvoiceSelect={handleInvoiceSelect}
              isLoading={appIsLoading}
            />
          </div>

          {/* Chat Panel */}
          <div className="flex-1 min-w-0">
            <ChatPanel
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={chatIsLoading || appIsLoading}
              onToolExecution={handleToolExecution}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
