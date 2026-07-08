import { useState } from "react";
import { router } from "@inertiajs/react";
import {
  Download, Receipt, Truck, Boxes, TrendingUp, Percent, Clock, Star, Archive, CalendarDays, CalendarRange,
  DollarSign, Activity, RefreshCw, Package, AlertTriangle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { StatCard } from "@/Components/ui/StatCard";
import { TableHeader } from "@/Components/ui/TableHeader";
import { EmptyState } from "@/Components/ui/EmptyState";
import type { ReportData, ReportType } from "@/types";

interface Props {
  reportType: ReportType;
  period: string;
  from: string;
  to: string;
  data: ReportData;
}

const reportTypes: { id: ReportType; label: string; icon: React.ReactNode }[] = [
  { id: "sales", label: "Sales Report", icon: <Receipt size={14} /> },
  { id: "purchase", label: "Purchase Report", icon: <Truck size={14} /> },
  { id: "inventory", label: "Inventory Report", icon: <Boxes size={14} /> },
  { id: "profit", label: "Profit & Loss", icon: <TrendingUp size={14} /> },
  { id: "tax", label: "Tax Report", icon: <Percent size={14} /> },
  { id: "expiry", label: "Expiry Report", icon: <Clock size={14} /> },
  { id: "topselling", label: "Top Selling", icon: <Star size={14} /> },
  { id: "deadstock", label: "Dead Stock", icon: <Archive size={14} /> },
  { id: "daily", label: "Daily Sales", icon: <CalendarDays size={14} /> },
  { id: "monthly", label: "Monthly Sales", icon: <CalendarRange size={14} /> },
];

const statConfig: Record<ReportType, { key: string; label: string; icon: React.ReactNode; color: string; format?: "money" | "number" | "percent" }[]> = {
  sales: [
    { key: "total_sales", label: "Total Sales", icon: <DollarSign size={16} className="text-blue-600" />, color: "bg-blue-50 dark:bg-blue-950/20", format: "money" },
    { key: "transactions", label: "Transactions", icon: <Receipt size={16} className="text-emerald-600" />, color: "bg-emerald-50 dark:bg-emerald-950/20" },
    { key: "avg_sale", label: "Avg. Sale", icon: <Activity size={16} className="text-violet-600" />, color: "bg-violet-50 dark:bg-violet-950/20", format: "money" },
    { key: "returns_total", label: "Returns", icon: <RefreshCw size={16} className="text-amber-600" />, color: "bg-amber-50 dark:bg-amber-950/20", format: "money" },
  ],
  purchase: [
    { key: "total_purchases", label: "Total Purchases", icon: <DollarSign size={16} className="text-blue-600" />, color: "bg-blue-50 dark:bg-blue-950/20", format: "money" },
    { key: "order_count", label: "Orders", icon: <Truck size={16} className="text-emerald-600" />, color: "bg-emerald-50 dark:bg-emerald-950/20" },
    { key: "received_count", label: "Received", icon: <Package size={16} className="text-violet-600" />, color: "bg-violet-50 dark:bg-violet-950/20" },
    { key: "pending_count", label: "Pending", icon: <Clock size={16} className="text-amber-600" />, color: "bg-amber-50 dark:bg-amber-950/20" },
  ],
  inventory: [
    { key: "total_medicines", label: "Total Medicines", icon: <Boxes size={16} className="text-blue-600" />, color: "bg-blue-50 dark:bg-blue-950/20" },
    { key: "in_stock", label: "In Stock", icon: <Package size={16} className="text-emerald-600" />, color: "bg-emerald-50 dark:bg-emerald-950/20" },
    { key: "low_stock", label: "Low Stock", icon: <AlertTriangle size={16} className="text-amber-600" />, color: "bg-amber-50 dark:bg-amber-950/20" },
    { key: "stock_value", label: "Stock Value", icon: <DollarSign size={16} className="text-violet-600" />, color: "bg-violet-50 dark:bg-violet-950/20", format: "money" },
  ],
  profit: [
    { key: "revenue", label: "Revenue", icon: <DollarSign size={16} className="text-blue-600" />, color: "bg-blue-50 dark:bg-blue-950/20", format: "money" },
    { key: "cost_of_goods", label: "Cost of Goods", icon: <Package size={16} className="text-amber-600" />, color: "bg-amber-50 dark:bg-amber-950/20", format: "money" },
    { key: "gross_profit", label: "Gross Profit", icon: <TrendingUp size={16} className="text-emerald-600" />, color: "bg-emerald-50 dark:bg-emerald-950/20", format: "money" },
    { key: "purchase_cost", label: "Purchase Cost", icon: <Truck size={16} className="text-violet-600" />, color: "bg-violet-50 dark:bg-violet-950/20", format: "money" },
  ],
  tax: [
    { key: "tax_collected", label: "Tax Collected", icon: <Percent size={16} className="text-blue-600" />, color: "bg-blue-50 dark:bg-blue-950/20", format: "money" },
    { key: "tax_paid_on_purchases", label: "Tax Paid (Purchases)", icon: <Truck size={16} className="text-amber-600" />, color: "bg-amber-50 dark:bg-amber-950/20", format: "money" },
    { key: "net_tax_liability", label: "Net Tax Liability", icon: <DollarSign size={16} className="text-emerald-600" />, color: "bg-emerald-50 dark:bg-emerald-950/20", format: "money" },
    { key: "taxable_sales", label: "Taxable Sales", icon: <Receipt size={16} className="text-violet-600" />, color: "bg-violet-50 dark:bg-violet-950/20", format: "money" },
  ],
  expiry: [
    { key: "expired_count", label: "Expired", icon: <AlertTriangle size={16} className="text-red-600" />, color: "bg-red-50 dark:bg-red-950/20" },
    { key: "expiring_soon_count", label: "Expiring Soon (90d)", icon: <Clock size={16} className="text-amber-600" />, color: "bg-amber-50 dark:bg-amber-950/20" },
    { key: "expired_stock_value", label: "Expired Stock Value", icon: <DollarSign size={16} className="text-red-600" />, color: "bg-red-50 dark:bg-red-950/20", format: "money" },
    { key: "at_risk_stock_value", label: "At-Risk Stock Value", icon: <DollarSign size={16} className="text-amber-600" />, color: "bg-amber-50 dark:bg-amber-950/20", format: "money" },
  ],
  topselling: [
    { key: "total_revenue", label: "Total Revenue", icon: <DollarSign size={16} className="text-blue-600" />, color: "bg-blue-50 dark:bg-blue-950/20", format: "money" },
    { key: "medicines_sold", label: "Medicines Sold", icon: <Boxes size={16} className="text-emerald-600" />, color: "bg-emerald-50 dark:bg-emerald-950/20" },
    { key: "total_units", label: "Total Units", icon: <Package size={16} className="text-violet-600" />, color: "bg-violet-50 dark:bg-violet-950/20" },
  ],
  deadstock: [
    { key: "dead_stock_count", label: "Dead Stock Items", icon: <Archive size={16} className="text-amber-600" />, color: "bg-amber-50 dark:bg-amber-950/20" },
    { key: "dead_stock_value", label: "Dead Stock Value", icon: <DollarSign size={16} className="text-red-600" />, color: "bg-red-50 dark:bg-red-950/20", format: "money" },
  ],
  daily: [
    { key: "total_sales", label: "Total Sales", icon: <DollarSign size={16} className="text-blue-600" />, color: "bg-blue-50 dark:bg-blue-950/20", format: "money" },
    { key: "transactions", label: "Transactions", icon: <Receipt size={16} className="text-emerald-600" />, color: "bg-emerald-50 dark:bg-emerald-950/20" },
    { key: "avg_sale", label: "Avg. Sale", icon: <Activity size={16} className="text-violet-600" />, color: "bg-violet-50 dark:bg-violet-950/20", format: "money" },
    { key: "returns_total", label: "Returns", icon: <RefreshCw size={16} className="text-amber-600" />, color: "bg-amber-50 dark:bg-amber-950/20", format: "money" },
  ],
  monthly: [
    { key: "total_sales", label: "Total Sales", icon: <DollarSign size={16} className="text-blue-600" />, color: "bg-blue-50 dark:bg-blue-950/20", format: "money" },
    { key: "transactions", label: "Transactions", icon: <Receipt size={16} className="text-emerald-600" />, color: "bg-emerald-50 dark:bg-emerald-950/20" },
    { key: "months_covered", label: "Months Covered", icon: <CalendarRange size={16} className="text-violet-600" />, color: "bg-violet-50 dark:bg-violet-950/20" },
  ],
};

const chartTitles: Partial<Record<ReportType, string>> = {
  sales: "Sales Trend",
  purchase: "Purchases by Supplier",
  profit: "Profit Trend",
  monthly: "Monthly Sales Trend",
};

function formatValue(value: number, format?: "money" | "number" | "percent"): string {
  if (format === "money") return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (format === "percent") return `${value}%`;
  return value.toLocaleString();
}

function titleCase(key: string): string {
  return key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatCell(key: string, value: string | number): string {
  if (typeof value === "number") {
    if (/(total|revenue|profit|cost|value|sales|tax|amount)/i.test(key) && !/count|units|transactions|orders|days/i.test(key)) {
      return `₹${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }
    return value.toLocaleString();
  }
  return value;
}

export default function Reports({ reportType, period, from, to, data }: Props) {
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  const navigate = (params: Partial<{ type: ReportType; period: string; from: string; to: string }>) => {
    router.get("/reports", { type: reportType, period, from, to, ...params }, { preserveState: true, preserveScroll: true });
  };

  const stats = statConfig[reportType] ?? [];
  const rowKeys = data.rows.length > 0 ? Object.keys(data.rows[0]) : [];
  const chartTitle = chartTitles[reportType];

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Reports"
          subtitle="Analytics and business intelligence"
          actions={
            <div className="flex items-center gap-2">
              <Btn variant="outline" size="sm" onClick={() => window.print()}><Download size={13} />PDF</Btn>
              <a href={`/reports/${reportType}/export?period=${period}&from=${from}&to=${to}`}>
                <Btn variant="outline" size="sm"><Download size={13} />CSV</Btn>
              </a>
            </div>
          }
        />

        <div className="flex gap-4 print:hidden">
          <div className="w-52 shrink-0 space-y-1">
            {reportTypes.map(r => (
              <button key={r.id} onClick={() => navigate({ type: r.id })}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${reportType === r.id ? "bg-primary/5 text-primary font-medium border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <span className={reportType === r.id ? "text-primary" : "text-muted-foreground"}>{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              {["daily", "weekly", "monthly", "yearly", "custom"].map(p => (
                <button key={p} onClick={() => navigate({ period: p })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${period === p ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                  {p}
                </button>
              ))}
              {period === "custom" && (
                <div className="flex items-center gap-2">
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-3 py-1.5 text-xs border border-border rounded-md bg-card focus:outline-none" />
                  <span className="text-muted-foreground text-xs">to</span>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-3 py-1.5 text-xs border border-border rounded-md bg-card focus:outline-none" />
                  <Btn variant="outline" size="sm" onClick={() => navigate({ period: "custom", from: customFrom, to: customTo })}>Apply</Btn>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {stats.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {stats.map(s => (
                    <StatCard key={s.key} label={s.label} value={formatValue(data.stats[s.key] ?? 0, s.format)} icon={s.icon} color={s.color} />
                  ))}
                </div>
              )}

              {chartTitle && data.chart && data.chart.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">{chartTitle} — {from} to {to}</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
                      <Bar dataKey="sales" fill="#1a56db" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              <Card>
                <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">
                  {reportTypes.find(r => r.id === reportType)?.label} Detail
                </div>
                {data.rows.length === 0 ? (
                  <EmptyState icon={<Boxes size={40} />} title="No data" description="No records found for the selected period." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <TableHeader cols={rowKeys.map(titleCase)} />
                      <tbody>
                        {data.rows.map((row, i) => (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                            {rowKeys.map(key => (
                              <td key={key} className="px-4 py-2.5 text-xs font-mono text-foreground whitespace-nowrap">{formatCell(key, row[key])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
