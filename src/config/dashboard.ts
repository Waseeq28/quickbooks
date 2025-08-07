import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText 
} from "lucide-react"
import type { SimpleInvoice } from "@/types/quickbooks"

export interface StatConfig {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  cardBg: string
  iconBg: string
  iconColor: string
  accentColor?: string
}

export interface StatusConfig {
  label: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  textColor: string
  iconColor: string
}

export const getRevenueStats = (totalAmount: number, totalDue: number): StatConfig[] => [
  {
    title: "Total Revenue",
    value: formatCurrency(totalAmount),
    icon: TrendingUp,
    cardBg: "bg-gradient-to-br from-green-900/20 to-emerald-900/30",
    iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
    iconColor: "text-white",
    accentColor: "text-green-400",
  },
  {
    title: "Outstanding",
    value: formatCurrency(totalDue),
    icon: DollarSign,
    cardBg: "bg-gradient-to-br from-amber-900/20 to-orange-900/30",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    iconColor: "text-white",
    accentColor: "text-amber-400",
  },
]

export const getInvoiceStatusData = (
  paidCount: number, 
  pendingCount: number, 
  overdueCount: number
): StatusConfig[] => [
  {
    label: "Paid",
    count: paidCount,
    icon: CheckCircle,
    bgColor: "bg-green-900/30",
    textColor: "text-green-300",
    iconColor: "text-green-400",
  },
  {
    label: "Pending",
    count: pendingCount,
    icon: Clock,
    bgColor: "bg-purple-900/30",
    textColor: "text-purple-300",
    iconColor: "text-purple-400",
  },
  {
    label: "Overdue",
    count: overdueCount,
    icon: AlertTriangle,
    bgColor: "bg-red-900/30",
    textColor: "text-red-300",
    iconColor: "text-red-400",
  },
]

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export const calculateDashboardStats = (invoices: SimpleInvoice[]) => {
  return {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    totalDue: invoices.reduce((sum, inv) => sum + inv.balance, 0),
    paidCount: invoices.filter(inv => inv.status === 'paid').length,
    pendingCount: invoices.filter(inv => inv.status === 'pending').length,
    overdueCount: invoices.filter(inv => inv.status === 'overdue').length,
  }
}