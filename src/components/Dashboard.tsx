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
      cardBg: "bg-gradient-to-br from-green-50 to-emerald-100",
      iconBg: "bg-green-500",
      iconColor: "text-white",
    },
    {
      title: "Outstanding",
      value: formatCurrency(totalDue),
      icon: DollarSign,
      cardBg: "bg-gradient-to-br from-amber-50 to-orange-100",
      iconBg: "bg-amber-500",
      iconColor: "text-white",
    },
  ]

  const invoiceStatusData = [
    {
      label: "Paid",
      count: paidCount,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      iconColor: "text-green-600",
    },
    {
      label: "Pending",
      count: pendingCount,
      icon: Clock,
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      iconColor: "text-purple-600",
    },
    {
      label: "Overdue",
      count: overdueCount,
      icon: AlertTriangle,
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      iconColor: "text-red-600",
    },
  ]

  return (
    <div className="p-4 lg:p-6 bg-gray-50">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Stats */}
        {revenueStats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className={`group hover:scale-[1.02] cursor-pointer border-0 shadow-lg ${stat.cardBg} transition-all duration-300`}
            style={{
              animationDelay: `${index * 50}ms`,
              animation: 'fadeInUp 0.5s ease-out'
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform shadow-md`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Combined Invoice Card */}
        <Card 
          className="group hover:scale-[1.02] cursor-pointer border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 transition-all duration-300"
          style={{
            animationDelay: '100ms',
            animation: 'fadeInUp 0.5s ease-out'
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Invoices
            </CardTitle>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500 group-hover:scale-110 transition-transform shadow-md">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold tracking-tight">
              {totalInvoices}
            </div>
            <div className="flex flex-wrap gap-2">
              {invoiceStatusData.map((status) => (
                <span 
                  key={status.label}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bgColor} ${status.textColor}`}
                >
                  <status.icon className={`h-3 w-3 ${status.iconColor}`} />
                  {status.label}: {status.count}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
} 