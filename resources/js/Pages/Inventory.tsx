import { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
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
import { Toast } from "@/Components/ui/Toast";
import type { Medicine, StockMovement, Paginated } from "@/types";

interface Props {
  medicines: Medicine[];
  ledger: Paginated<StockMovement>;
  stats: { total_skus: number; low_stock: number; out_of_stock: number; expiring_soon: number };
  filters: { search?: string; ledger_type?: string };
}

type View = "stock" | "ledger" | "adjustment" | "expired" | "damaged";

const typeStyles: Record<string, string> = {
  Sale: "bg-blue-50 text-blue-700",
  Purchase: "bg-emerald-50 text-emerald-700",
  Adjustment: "bg-amber-50 text-amber-700",
  Damaged: "bg-red-50 text-red-700",
  Expired: "bg-gray-100 text-gray-600",
  Returned: "bg-violet-50 text-violet-700",
  Transfer: "bg-cyan-50 text-cyan-700",
};

export default function Inventory({ medicines, ledger, stats, filters }: Props) {
  const [view, setView] = useState<View>("stock");
  const [adjustModal, setAdjustModal] = useState(false);
  const [search, setSearch] = useState(filters.search ?? "");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const tabs: { id: View; label: string }[] = [
    { id: "stock", label: "Current Stock" },
    { id: "ledger", label: "Stock Ledger" },
    { id: "adjustment", label: "Adjustments" },
    { id: "expired", label: "Expired" },
    { id: "damaged", label: "Damaged" },
  ];

  const { data, setData, post, processing, errors, reset } = useForm({
    medicine_id: "",
    adjustment_type: "Add Stock",
    quantity: "",
    reason: "",
  });

  const submitAdjustment = () => {
    post("/inventory/adjustments", {
      preserveScroll: true,
      onSuccess: () => {
        setAdjustModal(false);
        reset();
        setToast({ msg: "Stock adjustment saved successfully", type: "success" });
      },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const goToTab = (type: View) => {
    setView(type);
    if (type === "ledger") router.get("/inventory", { ledger_type: "All" }, { preserveState: true, preserveScroll: true, only: ["ledger", "filters"] });
    if (type === "expired") router.get("/inventory", { ledger_type: "Expired" }, { preserveState: true, preserveScroll: true, only: ["ledger", "filters"] });
    if (type === "damaged") router.get("/inventory", { ledger_type: "Damaged" }, { preserveState: true, preserveScroll: true, only: ["ledger", "filters"] });
  };

  const applySearch = (v: string) => {
    setSearch(v);
    router.get("/inventory", { search: v }, { preserveState: true, preserveScroll: true, only: ["medicines", "filters"] });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
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
          <StatCard label="Total SKUs" value={String(stats.total_skus)} icon={<Package size={16} className="text-blue-600" />} color="bg-blue-50 dark:bg-blue-950/20" />
          <StatCard label="Low Stock Items" value={String(stats.low_stock)} icon={<AlertTriangle size={16} className="text-amber-600" />} color="bg-amber-50 dark:bg-amber-950/20" />
          <StatCard label="Out of Stock" value={String(stats.out_of_stock)} icon={<AlertCircle size={16} className="text-red-600" />} color="bg-red-50 dark:bg-red-950/20" />
          <StatCard label="Expiring (6mo)" value={String(stats.expiring_soon)} icon={<Clock size={16} className="text-orange-600" />} color="bg-orange-50 dark:bg-orange-950/20" />
        </div>

        <div className="flex gap-1 border-b border-border mb-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => goToTab(t.id)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${view === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {view === "stock" && (
          <Card>
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <SearchInput placeholder="Search medicines…" value={search} onChange={applySearch} />
              <Btn variant="outline" size="sm"><Filter size={13} />Filter</Btn>
              <Btn variant="outline" size="sm"><Download size={13} />Export</Btn>
            </div>
            <table className="w-full">
              <TableHeader cols={["Medicine", "Category", "Batch", "Expiry", "Stock", "Reorder", "Value", "Status", ""]} />
              <tbody>
                {medicines.length === 0 ? (
                  <tr><td colSpan={9}><EmptyState icon={<Package size={40} />} title="No medicines found" description="Try adjusting your search" /></td></tr>
                ) : medicines.map(m => {
                  const value = m.stock * Number(m.purchase_price);
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="text-sm font-medium text-foreground">{m.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">{m.sku}</div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.category}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{m.batch_number}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{m.expiry_date}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-foreground">{m.stock}</span>
                          {m.stock <= m.reorder_level && m.stock > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          {m.stock === 0 && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{m.reorder_level}</td>
                      <td className="px-4 py-2.5 text-xs font-mono font-medium text-foreground">₹{value.toFixed(0)}</td>
                      <td className="px-4 py-2.5"><Badge status={m.status} /></td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => { setData("medicine_id", String(m.id)); setAdjustModal(true); }} className="opacity-0 group-hover:opacity-100 text-xs text-primary hover:underline transition-opacity">Adjust</button>
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
                {ledger.data.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState icon={<ArrowUpDown size={40} />} title="No stock movements yet" description="Movements from purchases, sales, and adjustments will appear here." /></td></tr>
                ) : ledger.data.map(row => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{row.created_at.slice(0, 10)}</td>
                    <td className="px-4 py-2.5 text-sm text-foreground">{row.medicine.brand_name} {row.medicine.strength}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeStyles[row.type] ?? "bg-gray-100 text-gray-600"}`}>{row.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-emerald-600">{row.quantity_in > 0 ? `+${row.quantity_in}` : "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-red-600">{row.quantity_out > 0 ? `−${row.quantity_out}` : "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">{row.balance_after}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">{row.reference ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.user?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {(view === "expired" || view === "damaged") && (
          <Card>
            {ledger.data.length === 0 ? (
              <EmptyState
                icon={view === "expired" ? <Clock size={40} /> : <AlertTriangle size={40} />}
                title={view === "expired" ? "No expired medicines" : "No damaged stock recorded"}
                description={view === "expired" ? "All your medicines are within their expiry dates." : "No damaged stock has been reported."}
              />
            ) : (
              <table className="w-full">
                <TableHeader cols={["Date", "Medicine", "Qty", "Balance After", "Reference", "User"]} />
                <tbody>
                  {ledger.data.map(row => (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{row.created_at.slice(0, 10)}</td>
                      <td className="px-4 py-2.5 text-sm text-foreground">{row.medicine.brand_name} {row.medicine.strength}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-red-600">−{row.quantity_out}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{row.balance_after}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-primary">{row.reference ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.user?.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {view === "adjustment" && (
          <Card>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">Recent Adjustments</div>
              <Btn variant="primary" size="sm" onClick={() => setAdjustModal(true)}><Plus size={13} />New Adjustment</Btn>
            </div>
            {ledger.data.filter(r => r.type === "Adjustment").length === 0 ? (
              <EmptyState icon={<ArrowUpDown size={40} />} title="No adjustments yet" description="Create your first stock adjustment." action={<Btn variant="primary" size="sm" onClick={() => setAdjustModal(true)}><Plus size={13} />New Adjustment</Btn>} />
            ) : (
              <table className="w-full">
                <TableHeader cols={["Date", "Medicine", "Qty In", "Qty Out", "Balance", "Reference", "Reason"]} />
                <tbody>
                  {ledger.data.filter(r => r.type === "Adjustment").map(row => (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{row.created_at.slice(0, 10)}</td>
                      <td className="px-4 py-2.5 text-sm text-foreground">{row.medicine.brand_name} {row.medicine.strength}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-emerald-600">{row.quantity_in > 0 ? `+${row.quantity_in}` : "—"}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-red-600">{row.quantity_out > 0 ? `−${row.quantity_out}` : "—"}</td>
                      <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">{row.balance_after}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-primary">{row.reference ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {/* Adjust Stock Modal */}
        <Modal open={adjustModal} onClose={() => setAdjustModal(false)} title="Stock Adjustment" width="max-w-xl">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Medicine</label>
              <select value={data.medicine_id} onChange={e => setData("medicine_id", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                <option value="">Select medicine</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
              </select>
              {errors.medicine_id && <p className="text-xs text-red-500 mt-1">{errors.medicine_id}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Adjustment Type</label>
                <select value={data.adjustment_type} onChange={e => setData("adjustment_type", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  <option>Add Stock</option><option>Remove Stock</option><option>Damage Write-off</option><option>Expired Write-off</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Quantity</label>
                <input type="number" placeholder="0" value={data.quantity} onChange={e => setData("quantity", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Reason</label>
              <textarea rows={2} placeholder="Describe reason for adjustment…" value={data.reason} onChange={e => setData("reason", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setAdjustModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={processing} onClick={submitAdjustment}><Check size={13} />Save Adjustment</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
