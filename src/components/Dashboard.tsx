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

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalAmount),
      icon: TrendingUp,
      gradient: "gradient-success",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Outstanding",
      value: formatCurrency(totalDue),
      icon: DollarSign,
      gradient: "gradient-warning",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Invoices",
      value: totalInvoices,
      icon: FileText,
      gradient: "gradient-primary",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Paid",
      value: paidCount,
      icon: CheckCircle,
      gradient: "gradient-success",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Pending",
      value: pendingCount,
      icon: Clock,
      gradient: "gradient-accent",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Overdue",
      value: overdueCount,
      icon: AlertTriangle,
      gradient: "gradient-danger",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  ]

  return (
    <div className="p-4 lg:p-6 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, index) => (
          <Card 
            key={stat.title} 
            className="group hover:scale-[1.02] cursor-pointer relative overflow-hidden border-0 shadow-md"
            style={{
              animationDelay: `${index * 50}ms`,
              animation: 'fadeInUp 0.5s ease-out'
            }}
          >
            <div className={`absolute inset-0 ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
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