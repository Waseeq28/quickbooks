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
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          iconColor: "text-green-600",
          icon: CheckCircle,
          label: "Paid"
        }
      case "pending":
        return {
          bgColor: "bg-purple-100",
          textColor: "text-purple-700",
          iconColor: "text-purple-600",
          icon: Clock,
          label: "Pending"
        }
      case "overdue":
        return {
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          iconColor: "text-red-600",
          icon: AlertTriangle,
          label: "Overdue"
        }
      default:
        return {
          bgColor: "bg-gray-100",
          textColor: "text-gray-700",
          iconColor: "text-gray-600",
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
    <div className="flex flex-col flex-1 bg-transparent overflow-hidden">
      {/* Header */}
      <div className="relative px-6 py-4 bg-gradient-to-r from-purple-50/80 via-white/80 to-violet-50/80 backdrop-blur-sm border-b border-primary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Invoices
              </h2>
              <p className="text-xs text-muted-foreground font-medium">Track and manage your billing</p>
            </div>
          </div>
          <Button 
            onClick={onFetchInvoices} 
            disabled={isLoading} 
            size="sm" 
            variant="outline" 
            className="gap-2 font-medium bg-gradient-to-r from-white to-purple-50/50 hover:from-purple-50 hover:to-purple-100/80 border-purple-200/60 hover:border-purple-300/80 shadow-md hover:shadow-lg transition-all duration-200 group"
          >
            <RefreshCw className={`h-4 w-4 text-purple-600 group-hover:text-purple-700 transition-colors ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'} duration-300`} />
            <span className="text-purple-700 group-hover:text-purple-800 transition-colors">{isLoading ? 'Loading...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Invoice List Sidebar */}
        <div className="w-80 border-r border-primary/10 flex flex-col overflow-hidden bg-white/30">
          <ScrollArea className="flex-1 h-0">
            <div className="p-3 space-y-2">
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {!isLoading && !error && invoices.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <FileText className="h-8 w-8 text-primary/60" />
                  </div>
                  <h3 className="font-semibold text-muted-foreground">No Invoices Found</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1 max-w-[200px] mx-auto">
                    Click refresh to fetch your invoices from QuickBooks
                  </p>
                </div>
              )}
              {invoices.map((invoice) => {
                const statusConfig = getStatusConfig(invoice.status)
                return (
                  <Card
                    key={invoice.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-0 ${
                      selectedInvoice?.id === invoice.id 
                        ? "ring-2 ring-primary shadow-lg bg-primary/5" 
                        : "hover:bg-white/60 bg-white/40"
                    }`}
                    onClick={() => handleInvoiceSelection(invoice)}
                  >
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold text-sm">{invoice.id}</span>
                        </div>
                        <span 
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                        >
                          <statusConfig.icon className={`h-3 w-3 ${statusConfig.iconColor}`} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1 truncate">
                        {invoice.customerName}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-blue-600">
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
            <div>
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/30 to-gray-100/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Cg fill=%22%23f8fafc%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M0 0h20v20H0z%22/%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl shadow-md bg-white/80">
                        <FileText className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-primary">
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
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md ${statusConfig.bgColor} ${statusConfig.textColor}`}
                        >
                          <statusConfig.icon className={`h-4 w-4 ${statusConfig.iconColor}`} />
                          {statusConfig.label.toUpperCase()}
                        </span>
                      )
                    })()}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-2 relative">
                  {/* Customer Info & Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium mb-1.5">
                        <User className="h-4 w-4 text-slate-700" />
                        <span>Customer</span>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{selectedInvoice.customerName}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium mb-1.5">
                        <DollarSign className="h-4 w-4 text-slate-700" />
                        <span>Total Amount</span>
                      </div>
                      <p className="font-semibold text-sm text-blue-600">
                        ${selectedInvoice.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium mb-1.5">
                        <Calendar className="h-4 w-4 text-slate-700" />
                        <span>Issue Date</span>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{selectedInvoice.issueDate}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium mb-1.5">
                        <Calendar className="h-4 w-4 text-slate-700" />
                        <span>Due Date</span>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{selectedInvoice.dueDate}</p>
                    </div>
                  </div>

                  <Separator className="bg-border/30" />

                  {/* Invoice Items */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-primary" />
                      Line Items
                    </h3>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{item.description}</p>
                            <p className="text-sm text-slate-600 mt-0.5">
                              {item.quantity} × ${item.rate.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-bold text-lg text-blue-600">
                            ${item.amount.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 space-y-3 border-t border-border/30">
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
                          className="mt-1 bg-white/50 border-primary/20 focus:border-primary/40 focus:bg-white"
                        />
                      </div>
                      
                      <Button
                        onClick={() => handleSendEmail(selectedInvoice.id)}
                        disabled={isSendingEmail || !emailToSend || !!sendEmailSuccess}
                        className="gap-2 min-w-[100px]"
                        variant={sendEmailSuccess ? "secondary" : "default"}
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
                            ? 'Sending'
                            : sendEmailSuccess
                            ? 'Sent!'
                            : 'Send'}
                        </span>
                      </Button>

                      <Button 
                        onClick={() => handleDownloadPdf(selectedInvoice.id)}
                        variant="outline"
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>PDF</span>
                      </Button>
                    </div>
                    <div className="h-4">
                      {sendEmailError && (
                        <p className="text-sm text-red-600 flex items-center gap-1 pl-1">
                          <AlertTriangle className="h-3 w-3" />
                          {sendEmailError}
                        </p>
                      )}
                      {sendEmailSuccess && (
                        <p className="text-sm text-emerald-600 flex items-center gap-1 pl-1">
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
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                  <FileText className="h-10 w-10 text-primary/50" />
                </div>
                <h3 className="text-xl font-bold text-muted-foreground">No Invoice Selected</h3>
                <p className="text-sm text-muted-foreground/70 mt-2 max-w-xs mx-auto">
                  {invoices.length > 0 ? 'Select an invoice from the sidebar to view details' : 'Click refresh to load your invoices'}
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