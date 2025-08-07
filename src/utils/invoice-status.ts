import { CheckCircle, Clock, AlertTriangle, FileText } from "lucide-react"
import type { SimpleInvoice } from "@/types/quickbooks"

export type InvoiceStatus = SimpleInvoice["status"]

export interface StatusConfig {
  bgColor: string
  textColor: string
  iconColor: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

export const getStatusConfig = (status: InvoiceStatus): StatusConfig => {
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