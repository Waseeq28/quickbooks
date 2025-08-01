"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash, AlertTriangle, FileText } from "lucide-react"
import { SimpleInvoice } from "@/types/quickbooks"
import { getStatusConfig } from "@/utils/invoice-status"

interface InvoiceListProps {
  invoices: SimpleInvoice[]
  selectedInvoice: SimpleInvoice | null
  onInvoiceSelect: (invoice: SimpleInvoice) => void
  isLoading: boolean
  error: string | null
}

export function InvoiceList({ 
  invoices, 
  selectedInvoice, 
  onInvoiceSelect, 
  isLoading, 
  error 
}: InvoiceListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-72 border-r border-border/50 flex flex-col overflow-hidden bg-surface/30">
      <ScrollArea className="flex-1 h-0">
        <div className="p-2.5 space-y-1.5">
          {error && (
            <div className="p-2.5 text-sm text-red-300 bg-red-900/30 border border-red-800/50 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          {!error && invoices.length === 0 && (
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
            const isSelected = selectedInvoice?.id === invoice.id

            return (
              <Card
                key={invoice.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border border-border/30 ${
                  isSelected 
                    ? "ring-2 ring-primary/50 shadow-lg bg-primary/10" 
                    : "hover:bg-card/50 bg-card/30"
                }`}
                onClick={() => onInvoiceSelect(invoice)}
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
  )
}