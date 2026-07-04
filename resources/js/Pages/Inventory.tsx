import { useState } from "react";
import { Link } from "@inertiajs/react";
import {
  ArrowUpDown, Plus, Package, AlertTriangle, AlertCircle, Clock, Filter, Download, Check,
} from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { StatCard } from "@/Components/ui/StatCard";
import { SearchInput } from "@/Components/ui/SearchInput";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { medicines } from "@/mockData";

const ledgerRows = [
  { date: "2025-07-02", med: "Paracetamol 650mg", type: "Sale", in: 0, out: 4, bal: 12, ref: "INV-2407-088", user: "Admin" },
  { date: "2025-07-01", med: "Amoxicillin 500mg", type: "Purchase", in: 100, out: 0, bal: 240, ref: "PO-2407-021", user: "Admin" },
  { date: "2025-07-01", med: "Vitamin D3 1000IU", type: "Sale", in: 0, out: 2, bal: 95, ref: "INV-2407-082", user: "Cashier" },
  { date: "2025-06-30", med: "Metformin 500mg", type: "Adjustment", in: 5, out: 0, bal: 180, ref: "ADJ-062", user: "Admin" },
];

export default function Inventory() {
  const [view, setView] = useState<"stock" | "ledger" | "adjustment" | "expired" | "damaged">("stock");
  const [adjustModal, setAdjustModal] = useState(false);

  const tabs = [
    { id: "stock", label: "Current Stock" },
    { id: "ledger", label: "Stock Ledger" },
    { id: "adjustment", label: "Adjustments" },
    { id: "expired", label: "Expired" },
    { id: "damaged", label: "Damaged" },
  ] as const;

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Inventory Management"
          subtitle="Track stock levels, movements, and adjustments"
          actions={
            <>
              <Btn variant="outline" size="sm" onClick={() => setAdjustModal(true)}><ArrowUpDown size={13} />Adjust Stock</Btn>
              <Link href="/purchases/add">
                <Btn variant="primary" size="sm"><Plus size={13} />New Purchase</Btn>
              </Link>
            </>
          }
        />

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard label="Total SKUs" value="847" icon={<Package size={16} className="text-blue-600" />} color="bg-blue-50 dark:bg-blue-950/20" />
          <StatCard label="Low Stock Items" value="14" icon={<AlertTriangle size={16} className="text-amber-600" />} color="bg-amber-50 dark:bg-amber-950/20" />
          <StatCard label="Out of Stock" value="6" icon={<AlertCircle size={16} className="text-red-600" />} color="bg-red-50 dark:bg-red-950/20" />
          <StatCard label="Expiring (6mo)" value="9" icon={<Clock size={16} className="text-orange-600" />} color="bg-orange-50 dark:bg-orange-950/20" />
        </div>

        <div className="flex gap-1 border-b border-border mb-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${view === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {view === "stock" && (
          <Card>
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <SearchInput placeholder="Search medicines…" value="" onChange={() => {}} />
              <Btn variant="outline" size="sm"><Filter size={13} />Filter</Btn>
              <Btn variant="outline" size="sm"><Download size={13} />Export</Btn>
            </div>
            <table className="w-full">
              <TableHeader cols={["Medicine", "Category", "Batch", "Expiry", "Stock", "Reorder", "Value", "Status", ""]} />
              <tbody>
                {medicines.map(m => {
                  const value = m.stock * m.purchase;
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="text-sm font-medium text-foreground">{m.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{m.sku}</div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.category}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{m.batch}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{m.expiry}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-foreground">{m.stock}</span>
                          {m.stock <= m.reorder && m.stock > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          {m.stock === 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{m.reorder}</td>
                      <td className="px-4 py-2.5 text-xs font-mono font-medium text-foreground">₹{value.toFixed(0)}</td>
                      <td className="px-4 py-2.5"><Badge status={m.status} /></td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => setAdjustModal(true)} className="opacity-0 group-hover:opacity-100 text-xs text-primary hover:underline transition-opacity">Adjust</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        {view === "ledger" && (
          <Card>
            <table className="w-full">
              <TableHeader cols={["Date", "Medicine", "Type", "Qty In", "Qty Out", "Balance", "Reference", "User"]} />
              <tbody>
                {ledgerRows.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{row.date}</td>
                    <td className="px-4 py-2.5 text-sm text-foreground">{row.med}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${row.type === "Sale" ? "bg-blue-50 text-blue-700" : row.type === "Purchase" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{row.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-emerald-600">{row.in > 0 ? `+${row.in}` : "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-red-600">{row.out > 0 ? `−${row.out}` : "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">{row.bal}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">{row.ref}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {(view === "expired" || view === "damaged") && (
          <Card>
            <EmptyState
              icon={view === "expired" ? <Clock size={40} /> : <AlertTriangle size={40} />}
              title={view === "expired" ? "No expired medicines" : "No damaged stock recorded"}
              description={view === "expired" ? "All your medicines are within their expiry dates." : "No damaged stock has been reported."}
            />
          </Card>
        )}

        {view === "adjustment" && (
          <Card>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">Recent Adjustments</div>
              <Btn variant="primary" size="sm" onClick={() => setAdjustModal(true)}><Plus size={13} />New Adjustment</Btn>
            </div>
            <EmptyState icon={<ArrowUpDown size={40} />} title="No adjustments yet" description="Create your first stock adjustment." action={<Btn variant="primary" size="sm" onClick={() => setAdjustModal(true)}><Plus size={13} />New Adjustment</Btn>} />
          </Card>
        )}

        {/* Adjust Stock Modal */}
        <Modal open={adjustModal} onClose={() => setAdjustModal(false)} title="Stock Adjustment" width="max-w-xl">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Medicine</label>
              <select className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                {medicines.map(m => <option key={m.id}>{m.name} ({m.sku})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Adjustment Type</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  <option>Add Stock</option><option>Remove Stock</option><option>Damage Write-off</option><option>Expired Write-off</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Quantity</label>
                <input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Reason</label>
              <textarea rows={2} placeholder="Describe reason for adjustment…" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setAdjustModal(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={() => setAdjustModal(false)}><Check size={13} />Save Adjustment</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
