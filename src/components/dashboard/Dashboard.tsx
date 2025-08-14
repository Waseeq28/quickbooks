"use client";

import { SimpleInvoice } from "@/types/quickbooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import {
  getRevenueStats,
  getInvoiceStatusData,
  calculateDashboardStats,
  type StatConfig,
  type StatusConfig,
} from "@/components/dashboard/config";

interface DashboardProps {
  invoices: SimpleInvoice[];
}

export function Dashboard({ invoices }: DashboardProps) {
  const stats = calculateDashboardStats(invoices);
  const revenueStats = getRevenueStats(stats.totalAmount, stats.totalDue);
  const invoiceStatusData = getInvoiceStatusData(
    stats.paidCount,
    stats.pendingCount,
    stats.overdueCount,
  );

  return (
    <div className="p-3 lg:p-4 bg-surface/30">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Stats */}
        {revenueStats.map((stat, index) => (
          <StatCard key={stat.title} stat={stat} index={index} />
        ))}

        {/* Combined Invoice Card */}
        <InvoiceSummaryCard
          totalInvoices={stats.totalInvoices}
          statusData={invoiceStatusData}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  stat: StatConfig;
  index: number;
}

function StatCard({ stat, index }: StatCardProps) {
  return (
    <Card
      className={`group hover:scale-[1.02] cursor-pointer border border-border/30 shadow-lg ${stat.cardBg} transition-all duration-300 animate-slide-up`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {stat.title}
        </CardTitle>
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform shadow-md`}
        >
          <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div
          className={`text-xl font-bold tracking-tight ${stat.accentColor || "text-foreground"}`}
        >
          {stat.value}
        </div>
      </CardContent>
    </Card>
  );
}

interface InvoiceSummaryCardProps {
  totalInvoices: number;
  statusData: StatusConfig[];
}

function InvoiceSummaryCard({
  totalInvoices,
  statusData,
}: InvoiceSummaryCardProps) {
  return (
    <Card
      className="group hover:scale-[1.02] cursor-pointer border border-border/30 shadow-lg bg-gradient-to-br from-blue-900/20 to-indigo-900/30 transition-all duration-300 animate-slide-up"
      style={{
        animationDelay: "200ms",
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
          {statusData.map((status) => (
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
  );
}
