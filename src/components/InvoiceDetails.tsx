"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileText, User, DollarSign, Calendar, Receipt } from "lucide-react"
import { SimpleInvoice } from "@/types/quickbooks"
import { InvoiceActions } from "./InvoiceActions"
import { getStatusConfig } from "@/utils/invoice-status"

interface InvoiceDetailsProps {
  invoice: SimpleInvoice
  onDownloadPdf: (invoiceId: string) => Promise<void>
}

export function InvoiceDetails({ invoice, onDownloadPdf }: InvoiceDetailsProps) {
  const statusConfig = getStatusConfig(invoice.status)

  return (
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
                  Invoice {invoice.id}
                </span>
                <p className="text-sm text-muted-foreground font-normal mt-0.5">
                  Created {invoice.issueDate}
                </p>
              </div>
            </CardTitle>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold shadow-md ${statusConfig.bgColor} ${statusConfig.textColor} border border-white/10`}
            >
              <statusConfig.icon className={`h-4 w-4 ${statusConfig.iconColor}`} />
              {statusConfig.label.toUpperCase()}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5 pt-1.5">
          {/* Customer Info & Dates */}
          <div className="grid grid-cols-2 gap-2.5">
            <InfoCard 
              icon={User} 
              label="Customer" 
              value={invoice.customerName} 
            />
            <InfoCard 
              icon={DollarSign} 
              label="Total Amount" 
              value={`$${invoice.amount.toFixed(2)}`}
              valueColor="text-primary"
            />
            <InfoCard 
              icon={Calendar} 
              label="Issue Date" 
              value={invoice.issueDate} 
            />
            <InfoCard 
              icon={Calendar} 
              label="Due Date" 
              value={invoice.dueDate} 
            />
          </div>

          <Separator className="bg-border/30" />

          {/* Invoice Items */}
          <div className="space-y-2">
            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-primary" />
              Line Items
            </h3>
            <div className="space-y-1.5">
              {invoice.items.map((item, index) => (
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

          <InvoiceActions 
            invoiceId={invoice.id} 
            onDownloadPdf={onDownloadPdf} 
          />
        </CardContent>
      </Card>
    </div>
  )
}

interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  valueColor?: string
}

function InfoCard({ icon: Icon, label, value, valueColor = "text-foreground" }: InfoCardProps) {
  return (
    <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
      <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-medium mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className={`font-semibold text-sm ${valueColor}`}>
        {value}
      </p>
    </div>
  )
}