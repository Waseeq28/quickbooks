"use client"

import { SimpleInvoice } from "@/types/quickbooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, CheckCircle, AlertTriangle, Clock } from "lucide-react"

interface DashboardProps {
  invoices: SimpleInvoice[]
}

export function Dashboard({ invoices }: DashboardProps) {
  const totalInvoices = invoices.length
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const totalDue = invoices.reduce((sum, inv) => sum + inv.balance, 0)
  
  const paidCount = invoices.filter(inv => inv.status === 'paid').length
  const pendingCount = invoices.filter(inv => inv.status === 'pending').length
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalAmount),
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100/50",
    },
    {
      title: "Total Outstanding",
      value: formatCurrency(totalDue),
      icon: AlertTriangle,
      color: "text-amber-500",
      bgColor: "bg-amber-100/50",
    },
    {
      title: "Total Invoices",
      value: totalInvoices,
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-100/50",
    },
    {
      title: "Paid",
      value: paidCount,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-100/50",
    },
    {
      title: "Pending",
      value: pendingCount,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-100/50",
    },
    {
      title: "Overdue",
      value: overdueCount,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-100/50",
    },
  ]

  return (
    <div className="p-6 border-b border-border/40">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium whitespace-nowrap">{stat.title}</CardTitle>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 