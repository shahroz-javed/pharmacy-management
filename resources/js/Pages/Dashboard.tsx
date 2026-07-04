import { Link } from "@inertiajs/react";
import {
  Calendar, ShoppingCart, TrendingUp, DollarSign, PieChart, Truck,
  AlertTriangle, AlertCircle, Clock, ChevronRight, Plus, ArrowUpDown, BarChart2,
} from "lucide-react";
import {
  AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { StatCard } from "@/Components/ui/StatCard";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { salesData } from "@/mockData";

const categoryData = [
  { name: "Antibiotics", value: 32 },
  { name: "Analgesics", value: 24 },
  { name: "Vitamins", value: 18 },
  { name: "Antacids", value: 14 },
  { name: "Others", value: 12 },
];

const CHART_COLORS = ["#1a56db", "#059669", "#d97706", "#7c3aed", "#dc2626"];

const recentSales = [
  { id: "INV-2407-089", customer: "Walk-in", items: 3, total: 284.50, payment: "Cash", time: "14:32", status: "Paid" },
  { id: "INV-2407-088", customer: "Meena Joshi", items: 5, total: 628.00, payment: "Card", time: "13:58", status: "Paid" },
  { id: "INV-2407-087", customer: "Walk-in", items: 2, total: 96.00, payment: "UPI", time: "13:21", status: "Paid" },
  { id: "INV-2407-086", customer: "Suresh Nair", items: 8, total: 1240.00, payment: "Credit", time: "12:44", status: "Pending" },
  { id: "INV-2407-085", customer: "Walk-in", items: 1, total: 45.00, payment: "Cash", time: "12:09", status: "Paid" },
];

export default function Dashboard() {
  return (
    <AppLayout notifCount={3}>
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Wednesday, 2 July 2025 — Good morning, Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="outline" size="sm"><Calendar size={13} />Jul 2025</Btn>
            <Link href="/pos">
              <Btn variant="primary" size="sm"><ShoppingCart size={13} />New Sale</Btn>
            </Link>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Today's Sales" value="₹18,240" sub="124 transactions" icon={<TrendingUp size={16} className="text-blue-600" />} trend="+12.4%" color="bg-blue-50 dark:bg-blue-950/20" />
          <StatCard label="Monthly Revenue" value="₹4,82,600" sub="2,847 transactions" icon={<DollarSign size={16} className="text-emerald-600" />} trend="+8.2%" color="bg-emerald-50 dark:bg-emerald-950/20" />
          <StatCard label="Gross Profit" value="₹1,68,340" sub="34.9% margin" icon={<PieChart size={16} className="text-violet-600" />} trend="+5.1%" color="bg-violet-50 dark:bg-violet-950/20" />
          <StatCard label="Purchases" value="₹3,14,260" sub="This month" icon={<Truck size={16} className="text-amber-600" />} trend="-2.3%" color="bg-amber-50 dark:bg-amber-950/20" />
        </div>

        {/* Alerts Row */}
        <div className="grid grid-cols-3 gap-3">
          <Link href="/inventory" className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3.5 cursor-pointer hover:border-amber-400 transition-colors block">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">Low Stock</span>
            </div>
            <div className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-300">14</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">medicines below reorder level</div>
          </Link>
          <Link href="/inventory" className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3.5 cursor-pointer hover:border-red-400 transition-colors block">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-red-600" />
              <span className="text-xs font-semibold text-red-800 dark:text-red-400">Out of Stock</span>
            </div>
            <div className="text-2xl font-mono font-bold text-red-700 dark:text-red-300">6</div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">medicines unavailable</div>
          </Link>
          <Link href="/inventory" className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3.5 cursor-pointer hover:border-orange-400 transition-colors block">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-orange-600" />
              <span className="text-xs font-semibold text-orange-800 dark:text-orange-400">Expiring Soon</span>
            </div>
            <div className="text-2xl font-mono font-bold text-orange-700 dark:text-orange-300">9</div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">medicines expire within 6 months</div>
          </Link>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Sales & Profit — Last 7 Days</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Sales</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Profit</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a56db" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, ""]} />
                <Area type="monotone" dataKey="sales" stroke="#1a56db" strokeWidth={2} fill="url(#sales)" />
                <Area type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2} fill="url(#profit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Sales by Category</h3>
            <ResponsiveContainer width="100%" height={160}>
              <RechartsPieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {categoryData.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: CHART_COLORS[i] }}></span>
                    <span className="text-muted-foreground">{c.name}</span>
                  </div>
                  <span className="font-mono font-medium text-foreground">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sales + Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Recent Sales</h3>
              <Link href="/sales">
                <Btn variant="ghost" size="sm">View all <ChevronRight size={13} /></Btn>
              </Link>
            </div>
            <table className="w-full">
              <TableHeader cols={["Invoice", "Customer", "Items", "Total", "Payment", "Time", "Status"]} />
              <tbody>
                {recentSales.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">{s.id}</td>
                    <td className="px-4 py-2.5 text-xs text-foreground">{s.customer}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.items}</td>
                    <td className="px-4 py-2.5 text-xs font-mono font-medium text-foreground">₹{s.total.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.payment}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{s.time}</td>
                    <td className="px-4 py-2.5"><Badge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "New Sale", icon: <ShoppingCart size={14} />, href: "/pos", color: "text-blue-600" },
                { label: "Add Medicine", icon: <Plus size={14} />, href: "/medicines/add", color: "text-emerald-600" },
                { label: "New Purchase", icon: <Truck size={14} />, href: "/purchases/add", color: "text-violet-600" },
                { label: "Stock Adjustment", icon: <ArrowUpDown size={14} />, href: "/inventory", color: "text-amber-600" },
                { label: "View Reports", icon: <BarChart2 size={14} />, href: "/reports", color: "text-indigo-600" },
              ].map(a => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-border hover:bg-muted/50 transition-colors text-sm text-foreground"
                >
                  <span className={a.color}>{a.icon}</span>
                  {a.label}
                  <ChevronRight size={12} className="ml-auto text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
