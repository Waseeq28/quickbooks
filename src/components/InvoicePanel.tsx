"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search, DollarSign, Calendar, User, FileText, Mail, Download, RefreshCw, AlertTriangle, Check } from "lucide-react"
import { SimpleInvoice } from "@/types/quickbooks"

interface InvoicePanelProps {
  invoices: SimpleInvoice[]
  selectedInvoice: SimpleInvoice | null
  onInvoiceSelect: (invoice: SimpleInvoice) => void
  isLoading: boolean
  onFetchInvoices: () => Promise<void>
  error: string | null
}

export function InvoicePanel({ 
  invoices, 
  selectedInvoice, 
  onInvoiceSelect, 
  isLoading, 
  onFetchInvoices,
  error 
}: InvoicePanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [emailToSend, setEmailToSend] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [sendEmailError, setSendEmailError] = useState<string | null>(null)
  const [sendEmailSuccess, setSendEmailSuccess] = useState<string | null>(null)

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: SimpleInvoice["status"]) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
      case "overdue":
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
    }
  }

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/quickbooks/invoices/${invoiceId}/pdf`)
      
      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      
      // Trigger download
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      // You could add a toast notification here
    }
  }

  const handleInvoiceSelection = (invoice: SimpleInvoice) => {
    onInvoiceSelect(invoice)
    // Reset state when a new invoice is selected
    setEmailToSend("")
    setSendEmailError(null)
    setSendEmailSuccess(null)
  }

  const handleSendEmail = async (invoiceId: string) => {
    if (!emailToSend) {
      setSendEmailError("Please enter a recipient's email address.")
      return
    }

    setIsSendingEmail(true)
    setSendEmailError(null)
    setSendEmailSuccess(null)

    try {
      const response = await fetch(`/api/quickbooks/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }
      
      setSendEmailSuccess(result.message || "Email sent successfully!")
      setEmailToSend("")
    } catch (error: any) {
      setSendEmailError(error.message)
    } finally {
      setIsSendingEmail(false)
      // Clear messages after a few seconds
      setTimeout(() => {
        setSendEmailError(null)
        setSendEmailSuccess(null)
      }, 5000)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Invoices</h2>
            <p className="text-sm text-muted-foreground">Manage your invoice collection</p>
          </div>
          <Button onClick={onFetchInvoices} disabled={isLoading} size="sm" variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Fetching...' : 'Fetch Invoices'}</span>
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-border/50 focus:bg-background"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Invoice List Sidebar */}
        <div className="w-80 border-r border-border/40 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 h-0">
            <div className="p-4 space-y-3">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {!isLoading && !error && invoices.length === 0 && (
                <div className="text-center p-6">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <h3 className="font-semibold text-muted-foreground">No Invoices Found</h3>
                  <p className="text-sm text-muted-foreground/80 mt-1">
                    Try fetching again or create an invoice in QuickBooks.
                  </p>
                </div>
              )}
              {filteredInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md border-border/50 ${
                    selectedInvoice?.id === invoice.id 
                      ? "ring-2 ring-primary shadow-md bg-accent/30" 
                      : "hover:bg-accent/20"
                  }`}
                  onClick={() => handleInvoiceSelection(invoice)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm text-foreground">{invoice.id}</span>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(invoice.status)} border font-medium`}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 truncate">{invoice.customerName}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-foreground">${invoice.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Due {invoice.dueDate}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Invoice Details */}
        <div className="flex-1 bg-background/50 overflow-hidden">
          <ScrollArea className="h-full">
           {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center space-x-3 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading invoices...</span>
                </div>
              </div>
           )}
           {!isLoading && selectedInvoice ? (
            <div className="p-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xl font-semibold">Invoice {selectedInvoice.id}</span>
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          Created on {selectedInvoice.issueDate}
                        </p>
                      </div>
                    </CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(selectedInvoice.status)} border font-medium text-sm px-3 py-1`}
                    >
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-muted">
                          <User className="h-3 w-3" />
                        </div>
                        <span>Customer</span>
                      </div>
                      <p className="font-semibold text-lg text-foreground">{selectedInvoice.customerName}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-muted">
                          <DollarSign className="h-3 w-3" />
                        </div>
                        <span>Total Amount</span>
                      </div>
                      <span className="font-semibold text-foreground">${selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator className="bg-border/40" />

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-muted">
                          <Calendar className="h-3 w-3" />
                        </div>
                        <span>Issue Date</span>
                      </div>
                      <p className="font-semibold text-foreground">{selectedInvoice.issueDate}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center justify-center w-6 h-6 rounded bg-muted">
                          <Calendar className="h-3 w-3" />
                        </div>
                        <span>Due Date</span>
                      </div>
                      <p className="font-semibold text-foreground">{selectedInvoice.dueDate}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Invoice Items */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">Invoice Items</h3>
                    <div className="space-y-3">
                      {selectedInvoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-accent/30 border border-border/30 rounded-lg transition-colors hover:bg-accent/40">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{item.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Qty: {item.quantity} × ${item.rate.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-bold text-lg text-foreground">${item.amount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 space-y-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-grow">
                        <label htmlFor="emailForInvoice" className="text-xs font-medium text-muted-foreground pl-1">
                          Send invoice to email
                        </label>
                        <Input
                          id="emailForInvoice"
                          type="email"
                          placeholder="recipient@example.com"
                          value={emailToSend}
                          onChange={(e) => setEmailToSend(e.target.value)}
                          disabled={isSendingEmail}
                          className="bg-background/50 border-border/50 focus:bg-background mt-1"
                        />
                      </div>
                      
                      <Button
                        onClick={() => handleSendEmail(selectedInvoice.id)}
                        disabled={isSendingEmail || !emailToSend || !!sendEmailSuccess}
                        className="gap-2 w-32"
                      >
                        {isSendingEmail ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : sendEmailSuccess ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        <span>
                          {isSendingEmail
                            ? 'Sending...'
                            : sendEmailSuccess
                            ? 'Sent!'
                            : 'Send'}
                        </span>
                      </Button>

                      <Button 
                        onClick={() => handleDownloadPdf(selectedInvoice.id)}
                        variant="outline"
                        className="gap-2 w-32"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </Button>
                    </div>
                    <div className="h-4">
                      {sendEmailError && <p className="text-sm text-red-600 pl-1">{sendEmailError}</p>}
                      {sendEmailSuccess && <p className="text-sm text-emerald-600 pl-1">{sendEmailSuccess}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
           ) : null}
           {!isLoading && !selectedInvoice && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No Invoice Selected</h3>
                <p className="text-sm text-muted-foreground/80 mt-1">
                  {invoices.length > 0 ? 'Select an invoice from the list to view its details.' : 'Fetch invoices to get started.'}
                </p>
              </div>
            </div>
           )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
} 