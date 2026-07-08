import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Download, Plus, Activity, TrendingUp, RefreshCw, DollarSign, Eye } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { StatCard } from "@/Components/ui/StatCard";
import { SearchInput } from "@/Components/ui/SearchInput";
import { Toolbar } from "@/Components/ui/Toolbar";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { EmptyState } from "@/Components/ui/EmptyState";
import type { Sale } from "@/types";

interface Props {
  sales: Sale[];
  stats: {
    today_total: number; today_count: number;
    week_total: number; week_count: number;
    returns_total: number; returns_count: number;
  };
  filters: { search?: string; status?: string; payment_method?: string; date?: string };
}

export default function Sales({ sales, stats, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [status, setStatus] = useState(filters.status ?? "All");
  const [paymentMethod, setPaymentMethod] = useState(filters.payment_method ?? "All");
  const [date, setDate] = useState(filters.date ?? "");

  const applyFilters = (next: Partial<{ search: string; status: string; payment_method: string; date: string }>) => {
    const merged = { search, status, payment_method: paymentMethod, date, ...next };
    router.get("/sales", merged, { preserveState: true, preserveScroll: true, only: ["sales", "filters"] });
  };

  const netSales = stats.week_total - stats.returns_total;

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Sales History"
          subtitle="View all transactions and returns"
          actions={
            <>
              <Btn variant="outline" size="sm"><Download size={13} />Export</Btn>
              <Link href="/pos">
                <Btn variant="primary" size="sm"><Plus size={13} />New Sale</Btn>
              </Link>
            </>
          }
        />
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard label="Today" value={`₹${stats.today_total.toLocaleString()}`} sub={`${stats.today_count} sales`} icon={<Activity size={16} className="text-blue-600" />} color="bg-blue-50 dark:bg-blue-950/20" />
          <StatCard label="This Week" value={`₹${stats.week_total.toLocaleString()}`} sub={`${stats.week_count} sales`} icon={<TrendingUp size={16} className="text-emerald-600" />} color="bg-emerald-50 dark:bg-emerald-950/20" />
          <StatCard label="Returns" value={`₹${stats.returns_total.toLocaleString()}`} sub={`${stats.returns_count} returns`} icon={<RefreshCw size={16} className="text-amber-600" />} color="bg-amber-50 dark:bg-amber-950/20" />
          <StatCard label="Net Sales" value={`₹${netSales.toLocaleString()}`} icon={<DollarSign size={16} className="text-violet-600" />} color="bg-violet-50 dark:bg-violet-950/20" />
        </div>
        <Toolbar>
          <SearchInput placeholder="Search invoice, customer…" value={search} onChange={v => { setSearch(v); applyFilters({ search: v }); }} />
          <input type="date" value={date} onChange={e => { setDate(e.target.value); applyFilters({ date: e.target.value }); }} className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none" />
          <select value={status} onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }} className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none">
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Returned">Returned</option>
            <option value="Partially Returned">Partially Returned</option>
          </select>
          <select value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value); applyFilters({ payment_method: e.target.value }); }} className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none">
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Credit">Credit</option>
            <option value="Split">Split</option>
          </select>
        </Toolbar>
        <Card>
          {sales.length === 0 ? (
            <EmptyState
              icon={<Activity size={40} />}
              title={search || status !== "All" || paymentMethod !== "All" || date ? "No sales found" : "No sales yet"}
              description={search || status !== "All" || paymentMethod !== "All" || date ? "Try adjusting your filters." : "Sales made through POS will appear here."}
            />
          ) : (
            <table className="w-full">
              <TableHeader cols={["Invoice", "Customer", "Date & Time", "Items", "Subtotal", "Tax", "Total", "Payment", "Status", ""]} />
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">
                      <Link href={`/sales/${s.id}`} className="hover:underline">{s.invoice_number}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-foreground">{s.customer?.name ?? "Walk-in"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{s.sold_at ? new Date(s.sold_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.items_count ?? 0}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-foreground">₹{Number(s.subtotal).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">₹{Number(s.tax_total).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-sm font-mono font-semibold text-foreground">₹{Number(s.total).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.payment_method}</td>
                    <td className="px-4 py-2.5"><Badge status={s.status} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/sales/${s.id}`} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye size={13} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
