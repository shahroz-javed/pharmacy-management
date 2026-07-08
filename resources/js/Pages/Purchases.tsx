import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Download, Plus, Truck, Clock, Building2, Eye, Printer } from "lucide-react";
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
import type { PurchaseOrder, Supplier } from "@/types";

interface Props {
  orders: PurchaseOrder[];
  suppliers: Pick<Supplier, "id" | "name">[];
  stats: { month_total: number; month_count: number; pending_orders: number; supplier_count: number };
  filters: { search?: string; supplier_id?: string; status?: string };
}

export default function Purchases({ orders, suppliers, stats, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [supplierId, setSupplierId] = useState(filters.supplier_id ?? "");
  const [status, setStatus] = useState(filters.status ?? "All");

  const applyFilters = (next: Partial<{ search: string; supplier_id: string; status: string }>) => {
    router.get("/purchases", {
      search: next.search ?? search,
      supplier_id: next.supplier_id ?? supplierId,
      status: next.status ?? status,
    }, { preserveState: true, preserveScroll: true });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Purchase Management"
          subtitle="Manage purchase orders and supplier invoices"
          actions={
            <>
              <Btn variant="outline" size="sm"><Download size={13} />Export</Btn>
              <Link href="/purchases/add">
                <Btn variant="primary" size="sm"><Plus size={13} />New Purchase Order</Btn>
              </Link>
            </>
          }
        />
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard label="This Month" value={`₹${Number(stats.month_total).toLocaleString()}`} sub={`${stats.month_count} purchase orders`} icon={<Truck size={16} className="text-blue-600" />} color="bg-blue-50 dark:bg-blue-950/20" />
          <StatCard label="Pending Orders" value={String(stats.pending_orders)} icon={<Clock size={16} className="text-amber-600" />} color="bg-amber-50 dark:bg-amber-950/20" />
          <StatCard label="Suppliers" value={String(stats.supplier_count)} icon={<Building2 size={16} className="text-violet-600" />} color="bg-violet-50 dark:bg-violet-950/20" />
        </div>
        <Toolbar>
          <SearchInput placeholder="Search purchase orders…" value={search} onChange={v => { setSearch(v); applyFilters({ search: v }); }} />
          <select value={supplierId} onChange={e => { setSupplierId(e.target.value); applyFilters({ supplier_id: e.target.value }); }} className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none">
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }} className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none">
            <option>All</option><option>Ordered</option><option>Partial</option><option>Received</option>
          </select>
        </Toolbar>
        <Card>
          {orders.length === 0 ? (
            <EmptyState icon={<Truck size={40} />} title="No purchase orders found" description="Try adjusting your filters or create a new purchase order." />
          ) : (
            <table className="w-full">
              <TableHeader cols={["PO Number", "Supplier", "Date", "Items", "Amount", "Status", ""]} />
              <tbody>
                {orders.map(po => (
                  <tr key={po.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">{po.po_number}</td>
                    <td className="px-4 py-2.5 text-sm text-foreground">{po.supplier.name}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{po.order_date}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{po.items_count ?? 0} items</td>
                    <td className="px-4 py-2.5 text-sm font-mono font-semibold text-foreground">₹{Number(po.total).toLocaleString()}</td>
                    <td className="px-4 py-2.5"><Badge status={po.status} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        <Link href={`/purchases/${po.id}`} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye size={13} /></Link>
                        <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Printer size={13} /></button>
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
