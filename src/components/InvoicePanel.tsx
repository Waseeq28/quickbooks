"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search, DollarSign, Calendar, User, FileText, Mail, Download } from "lucide-react"

export interface Invoice {
  id: string
  customerName: string
  amount: number
  status: "paid" | "pending" | "overdue"
  dueDate: string
  issueDate: string
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
}

interface InvoicePanelProps {
  invoices: Invoice[]
  selectedInvoice?: Invoice
  onInvoiceSelect: (invoice: Invoice) => void
  isLoading: boolean
}

export function InvoicePanel({ invoices, selectedInvoice, onInvoiceSelect, isLoading }: InvoicePanelProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: Invoice["status"]) => {
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

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Invoices</h2>
            <p className="text-sm text-muted-foreground">Manage your invoice collection</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {filteredInvoices.length} total
          </Badge>
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

      <div className="flex-1 flex">
        {/* Invoice List Sidebar */}
        <div className="w-80 border-r border-border/40">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {filteredInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md border-border/50 ${
                    selectedInvoice?.id === invoice.id 
                      ? "ring-2 ring-primary shadow-md bg-accent/30" 
                      : "hover:bg-accent/20"
                  }`}
                  onClick={() => onInvoiceSelect(invoice)}
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
        <div className="flex-1 bg-background/50">
          <ScrollArea className="h-full">
           {selectedInvoice && (
            <div className="p-6">
              {isLoading && (
                <div className="mb-6 p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="text-sm text-blue-800 font-medium">Processing invoice operation...</span>
                  </div>
                </div>
              )}

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
                      <p className="font-bold text-2xl text-foreground">${selectedInvoice.amount.toFixed(2)}</p>
                    </div>
                  </div>

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

                  <Separator />

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button variant="default" size="sm" className="shadow-sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    <Button variant="outline" size="sm" className="border-border/50">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
           )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
} 