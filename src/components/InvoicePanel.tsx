"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search, DollarSign, Calendar, User, FileText, Mail, Download, RefreshCw, AlertTriangle, Check, Hash, Receipt, CheckCircle, Clock } from "lucide-react"
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
  const [emailToSend, setEmailToSend] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [sendEmailError, setSendEmailError] = useState<string | null>(null)
  const [sendEmailSuccess, setSendEmailSuccess] = useState<string | null>(null)

  const getStatusConfig = (status: SimpleInvoice["status"]) => {
    switch (status) {
      case "paid":
        return {
          bgColor: "bg-green-900/30",
          textColor: "text-green-300",
          iconColor: "text-green-400",
          icon: CheckCircle,
          label: "Paid"
        }
      case "pending":
        return {
          bgColor: "bg-purple-900/30",
          textColor: "text-purple-300",
          iconColor: "text-purple-400",
          icon: Clock,
          label: "Pending"
        }
      case "overdue":
        return {
          bgColor: "bg-red-900/30",
          textColor: "text-red-300",
          iconColor: "text-red-400",
          icon: AlertTriangle,
          label: "Overdue"
        }
      default:
        return {
          bgColor: "bg-muted/30",
          textColor: "text-muted-foreground",
          iconColor: "text-muted-foreground",
          icon: FileText,
          label: "Unknown"
        }
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
    <div className="flex flex-col flex-1 bg-background overflow-hidden">
      {/* Header */}
      <div className="relative px-4 py-3 glass-effect border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Invoices
              </h2>
              <p className="text-xs text-muted-foreground font-medium">Track and manage billing</p>
            </div>
          </div>
          <Button 
            onClick={onFetchInvoices} 
            disabled={isLoading} 
            size="sm" 
            variant="outline" 
            className="gap-2 font-medium bg-card/50 hover:bg-card border-border/50 hover:border-primary/50 shadow-md hover:shadow-lg transition-all duration-200 group"
          >
            <RefreshCw className={`h-4 w-4 text-primary group-hover:text-primary/80 transition-colors ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'} duration-300`} />
            <span className="text-foreground group-hover:text-primary transition-colors">{isLoading ? 'Loading...' : 'Fetch'}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Invoice List Sidebar */}
        <div className="w-72 border-r border-border/50 flex flex-col overflow-hidden bg-surface/30">
          <ScrollArea className="flex-1 h-0">
            <div className="p-2.5 space-y-1.5">
              {error && (
                <div className="p-2.5 text-sm text-red-300 bg-red-900/30 border border-red-800/50 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {!isLoading && !error && invoices.length === 0 && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/20 mb-3">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-muted-foreground text-sm">No Invoices Found</h3>
                  <p className="text-xs text-muted-foreground/70 mt-1 max-w-[180px] mx-auto">
                    Click refresh to fetch invoices
                  </p>
                </div>
              )}
              {invoices.map((invoice) => {
                const statusConfig = getStatusConfig(invoice.status)
                return (
                  <Card
                    key={invoice.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg border border-border/30 ${
                      selectedInvoice?.id === invoice.id 
                        ? "ring-2 ring-primary/50 shadow-lg bg-primary/10" 
                        : "hover:bg-card/50 bg-card/30"
                    }`}
                    onClick={() => handleInvoiceSelection(invoice)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold text-sm text-foreground">{invoice.id}</span>
                        </div>
                        <span 
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor} border border-white/10`}
                        >
                          <statusConfig.icon className={`h-3 w-3 ${statusConfig.iconColor}`} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1 truncate">
                        {invoice.customerName}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-bold text-primary">
                          ${invoice.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.dueDate}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Invoice Details */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
           {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Loading invoices...</span>
                </div>
              </div>
           )}
           {!isLoading && selectedInvoice ? (
            <div className="p-3">
              <Card className="border border-border/50 shadow-xl bg-gradient-to-br from-card via-surface/30 to-card/50 relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2.5">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg shadow-md bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-xl font-bold text-foreground">
                          Invoice {selectedInvoice.id}
                        </span>
                        <p className="text-sm text-muted-foreground font-normal mt-0.5">
                          Created {selectedInvoice.issueDate}
                        </p>
                      </div>
                    </CardTitle>
                    {(() => {
                      const statusConfig = getStatusConfig(selectedInvoice.status)
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold shadow-md ${statusConfig.bgColor} ${statusConfig.textColor} border border-white/10`}
                        >
                          <statusConfig.icon className={`h-4 w-4 ${statusConfig.iconColor}`} />
                          {statusConfig.label.toUpperCase()}
                        </span>
                      )
                    })()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 pt-1.5">
                  {/* Customer Info & Dates */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                      <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-medium mb-1">
                        <User className="h-3.5 w-3.5" />
                        <span>Customer</span>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{selectedInvoice.customerName}</p>
                    </div>
                    <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                      <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-medium mb-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Total Amount</span>
                      </div>
                      <p className="font-semibold text-sm text-primary">
                        ${selectedInvoice.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                      <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-medium mb-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Issue Date</span>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{selectedInvoice.issueDate}</p>
                    </div>
                    <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                      <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-medium mb-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Due Date</span>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{selectedInvoice.dueDate}</p>
                    </div>
                  </div>

                  <Separator className="bg-border/30" />

                  {/* Invoice Items */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-primary" />
                      Line Items
                    </h3>
                    <div className="space-y-1.5">
                      {selectedInvoice.items.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-border/30 hover:bg-muted/40 transition-all"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.quantity} × ${item.rate.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-bold text-base text-primary">
                            ${item.amount.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2.5 space-y-2.5 border-t border-border/30">
                    <div className="flex items-end gap-2">
                      <div className="flex-grow">
                        <label htmlFor="emailForInvoice" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                          Email Invoice
                        </label>
                        <Input
                          id="emailForInvoice"
                          type="email"
                          placeholder="Enter recipient email"
                          value={emailToSend}
                          onChange={(e) => setEmailToSend(e.target.value)}
                          disabled={isSendingEmail}
                          className="mt-1 bg-input border-border/50 focus:border-primary/50 text-sm h-9"
                        />
                      </div>
                      
                      <Button
                        onClick={() => handleSendEmail(selectedInvoice.id)}
                        disabled={isSendingEmail || !emailToSend || !!sendEmailSuccess}
                        className="gap-1.5 min-w-[90px] h-9"
                        variant={sendEmailSuccess ? "secondary" : "default"}
                        size="sm"
                      >
                        {isSendingEmail ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : sendEmailSuccess ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Mail className="h-3.5 w-3.5" />
                        )}
                        <span className="text-sm">
                          {isSendingEmail
                            ? 'Sending'
                            : sendEmailSuccess
                            ? 'Sent!'
                            : 'Send'}
                        </span>
                      </Button>

                      <Button 
                        onClick={() => handleDownloadPdf(selectedInvoice.id)}
                        variant="outline"
                        className="gap-1.5 h-9"
                        size="sm"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="text-sm">PDF</span>
                      </Button>
                    </div>
                    <div className="h-4">
                      {sendEmailError && (
                        <p className="text-xs text-red-400 flex items-center gap-1 pl-1">
                          <AlertTriangle className="h-3 w-3" />
                          {sendEmailError}
                        </p>
                      )}
                      {sendEmailSuccess && (
                        <p className="text-xs text-green-400 flex items-center gap-1 pl-1">
                          <Check className="h-3 w-3" />
                          {sendEmailSuccess}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
           ) : null}
           {!isLoading && !selectedInvoice && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 mb-3">
                  <FileText className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="text-lg font-bold text-muted-foreground">No Invoice Selected</h3>
                <p className="text-sm text-muted-foreground/70 mt-1.5 max-w-xs mx-auto">
                  {invoices.length > 0 ? 'Select an invoice to view details' : 'Click refresh to load invoices'}
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