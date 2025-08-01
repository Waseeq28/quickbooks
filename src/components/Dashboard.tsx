"use client"

import { SimpleInvoice } from "@/types/quickbooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, CheckCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react"

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

  const revenueStats = [
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

  const invoiceStatusData = [
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

  return (
    <div className="p-3 lg:p-4 bg-surface/30">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Stats */}
        {revenueStats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className={`group hover:scale-[1.02] cursor-pointer border border-border/30 shadow-lg ${stat.cardBg} transition-all duration-300 animate-slide-up`}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform shadow-md`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className={`text-xl font-bold tracking-tight ${stat.accentColor || 'text-foreground'}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Combined Invoice Card */}
        <Card 
          className="group hover:scale-[1.02] cursor-pointer border border-border/30 shadow-lg bg-gradient-to-br from-blue-900/20 to-indigo-900/30 transition-all duration-300 animate-slide-up"
          style={{
            animationDelay: '200ms'
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Invoices
            </CardTitle>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:scale-110 transition-transform shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pb-3">
            <div className="text-xl font-bold tracking-tight text-blue-400">
              {totalInvoices}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {invoiceStatusData.map((status) => (
                <span 
                  key={status.label}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${status.bgColor} ${status.textColor} border border-white/10`}
                >
                  <status.icon className={`h-3 w-3 ${status.iconColor}`} />
                  {status.label}: {status.count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 