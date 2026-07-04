import { useState } from "react";
import {
  Download, Receipt, Truck, Boxes, TrendingUp, Percent, Clock, Star,
  DollarSign, Activity, RefreshCw, BarChart2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { StatCard } from "@/Components/ui/StatCard";
import { TableHeader } from "@/Components/ui/TableHeader";
import { EmptyState } from "@/Components/ui/EmptyState";
import { salesData, medicines } from "@/mockData";

const reportTypes = [
  { id: "sales", label: "Sales Report", icon: <Receipt size={14} /> },
  { id: "purchase", label: "Purchase Report", icon: <Truck size={14} /> },
  { id: "inventory", label: "Inventory Report", icon: <Boxes size={14} /> },
  { id: "profit", label: "Profit & Loss", icon: <TrendingUp size={14} /> },
  { id: "tax", label: "Tax Report", icon: <Percent size={14} /> },
  { id: "expiry", label: "Expiry Report", icon: <Clock size={14} /> },
  { id: "topselling", label: "Top Selling", icon: <Star size={14} /> },
];

export default function Reports() {
  const [period, setPeriod] = useState("monthly");
  const [reportType, setReportType] = useState("sales");

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Reports"
          subtitle="Analytics and business intelligence"
          actions={
            <div className="flex items-center gap-2">
              <Btn variant="outline" size="sm"><Download size={13} />PDF</Btn>
              <Btn variant="outline" size="sm"><Download size={13} />Excel</Btn>
              <Btn variant="outline" size="sm"><Download size={13} />CSV</Btn>
            </div>
          }
        />

        <div className="flex gap-4">
          {/* Report selector */}
          <div className="w-52 shrink-0 space-y-1">
            {reportTypes.map(r => (
              <button key={r.id} onClick={() => setReportType(r.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${reportType === r.id ? "bg-primary/5 text-primary font-medium border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <span className={reportType === r.id ? "text-primary" : "text-muted-foreground"}>{r.icon}</span>
                {r.label}
              </button>
            ))}
          </div>

          {/* Report content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              {["daily", "weekly", "monthly", "yearly", "custom"].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${period === p ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                  {p}
                </button>
              ))}
              {period === "custom" && (
                <div className="flex items-center gap-2">
                  <input type="date" className="px-3 py-1.5 text-xs border border-border rounded-md bg-card focus:outline-none" />
                  <span className="text-muted-foreground text-xs">to</span>
                  <input type="date" className="px-3 py-1.5 text-xs border border-border rounded-md bg-card focus:outline-none" />
                </div>
              )}
            </div>

            {reportType === "sales" && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <StatCard label="Total Sales" value="₹4,82,600" icon={<DollarSign size={16} className="text-blue-600" />} color="bg-blue-50 dark:bg-blue-950/20" />
                  <StatCard label="Transactions" value="2,847" icon={<Receipt size={16} className="text-emerald-600" />} color="bg-emerald-50 dark:bg-emerald-950/20" />
                  <StatCard label="Avg. Sale" value="₹169.50" icon={<Activity size={16} className="text-violet-600" />} color="bg-violet-50 dark:bg-violet-950/20" />
                  <StatCard label="Returns" value="₹8,400" icon={<RefreshCw size={16} className="text-amber-600" />} color="bg-amber-50 dark:bg-amber-950/20" />
                </div>
                <Card className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Sales Trend — July 2025</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
                      <Bar dataKey="sales" fill="#1a56db" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card>
                  <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Daily Sales Breakdown</div>
                  <table className="w-full">
                    <TableHeader cols={["Date", "Transactions", "Gross Sales", "Returns", "Net Sales", "Tax", "Profit"]} />
                    <tbody>
                      {salesData.map(d => (
                        <tr key={d.date} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2.5 text-xs font-mono text-foreground">{d.date}</td>
                          <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{Math.floor(d.sales / 130)}</td>
                          <td className="px-4 py-2.5 text-xs font-mono font-medium text-foreground">₹{d.sales.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-xs font-mono text-red-600">−₹{Math.floor(d.sales * 0.02).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{Math.floor(d.sales * 0.98).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">₹{Math.floor(d.sales * 0.1).toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-xs font-mono text-emerald-600">₹{d.profit.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}

            {reportType === "topselling" && (
              <Card>
                <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Top Selling Medicines — July 2025</div>
                <table className="w-full">
                  <TableHeader cols={["#", "Medicine", "Category", "Units Sold", "Revenue", "Profit", "% Share"]} />
                  <tbody>
                    {medicines.map((m, i) => (
                      <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">#{i + 1}</td>
                        <td className="px-4 py-2.5 text-sm text-foreground">{m.name}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.category}</td>
                        <td className="px-4 py-2.5 text-xs font-mono font-medium text-foreground">{Math.floor(Math.random() * 300 + 50)}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-foreground">₹{Math.floor(m.selling * (Math.random() * 200 + 50)).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-emerald-600">₹{Math.floor((m.selling - m.purchase) * (Math.random() * 100 + 30)).toLocaleString()}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.floor(Math.random() * 60 + 10)}%` }} />
                            </div>
                            <span className="text-xs font-mono text-muted-foreground w-8">{Math.floor(Math.random() * 15 + 2)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {!["sales", "topselling"].includes(reportType) && (
              <EmptyState icon={<BarChart2 size={40} />} title={`${reportTypes.find(r => r.id === reportType)?.label} — Coming Soon`} description="Select date range and generate this report." action={<Btn variant="primary" size="sm"><Download size={13} />Generate Report</Btn>} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
