import { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
import {
  ArrowUpDown, Plus, Package, AlertTriangle, AlertCircle, Clock, Filter, Download, Check,
  Undo2, ArrowRightLeft, ClipboardCheck,
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
import { useCurrency } from "@/lib/settings";
import type { Medicine, StockMovement, Paginated } from "@/types";

interface Props {
  medicines: Medicine[];
  ledger: Paginated<StockMovement>;
  stats: { total_skus: number; low_stock: number; out_of_stock: number; expiring_soon: number };
  filters: { search?: string; ledger_type?: string };
}

type View = "stock" | "ledger" | "adjustment" | "expired" | "damaged" | "returned" | "transfer" | "audit";

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
  const { fmt } = useCurrency();
  const [view, setView] = useState<View>("stock");
  const [adjustModal, setAdjustModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [auditModal, setAuditModal] = useState(false);
  const [search, setSearch] = useState(filters.search ?? "");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const tabs: { id: View; label: string }[] = [
    { id: "stock", label: "Current Stock" },
    { id: "ledger", label: "Stock Ledger" },
    { id: "adjustment", label: "Adjustments" },
    { id: "damaged", label: "Damaged" },
    { id: "expired", label: "Expired" },
    { id: "returned", label: "Returned" },
    { id: "transfer", label: "Transfers" },
    { id: "audit", label: "Inventory Audit" },
  ];

  const adjustForm = useForm({
    medicine_id: "",
    adjustment_type: "Add Stock",
    quantity: "",
    reason: "",
  });

  const returnForm = useForm({
    medicine_id: "",
    direction: "Customer Return",
    quantity: "",
    reason: "",
  });

  const transferForm = useForm({
    medicine_id: "",
    from_location: "",
    to_location: "",
    quantity: "",
    reason: "",
  });

  const auditForm = useForm({
    medicine_id: "",
    counted_quantity: "",
    reason: "",
  });

  const selectedAuditMedicine = medicines.find(m => String(m.id) === auditForm.data.medicine_id);
  const auditVariance = selectedAuditMedicine && auditForm.data.counted_quantity !== ""
    ? Number(auditForm.data.counted_quantity) - selectedAuditMedicine.stock
    : null;

  const submitAdjustment = () => {
    adjustForm.post("/inventory/adjustments", {
      preserveScroll: true,
      onSuccess: () => { setAdjustModal(false); adjustForm.reset(); setToast({ msg: "Stock adjustment saved successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const submitReturn = () => {
    returnForm.post("/inventory/returns", {
      preserveScroll: true,
      onSuccess: () => { setReturnModal(false); returnForm.reset(); setToast({ msg: "Stock return recorded successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const submitTransfer = () => {
    transferForm.post("/inventory/transfers", {
      preserveScroll: true,
      onSuccess: () => { setTransferModal(false); transferForm.reset(); setToast({ msg: "Stock transfer recorded successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const submitAudit = () => {
    auditForm.post("/inventory/audits", {
      preserveScroll: true,
      onSuccess: () => { setAuditModal(false); auditForm.reset(); setToast({ msg: "Inventory audit applied successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const ledgerTypeForTab: Partial<Record<View, string>> = {
    ledger: "All",
    adjustment: "Adjustment",
    damaged: "Damaged",
    expired: "Expired",
    returned: "Returned",
    transfer: "Transfer",
  };

  const goToTab = (type: View) => {
    setView(type);
    const ledgerType = ledgerTypeForTab[type];
    if (ledgerType) {
      router.get("/inventory", { ledger_type: ledgerType }, { preserveState: true, preserveScroll: true, only: ["ledger", "filters"] });
    }
  };

  const applySearch = (v: string) => {
    setSearch(v);
    router.get("/inventory", { search: v }, { preserveState: true, preserveScroll: true, only: ["medicines", "filters"] });
  };

  return (
    <AppLayout>
      <div className="p-5">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <PageHeader
          title="Inventory Management"
          subtitle="Track stock levels, movements, and adjustments"
          actions={
            <>
              <Btn variant="outline" size="sm" onClick={() => setReturnModal(true)}><Undo2 size={13} />Return Stock</Btn>
              <Btn variant="outline" size="sm" onClick={() => setTransferModal(true)}><ArrowRightLeft size={13} />Transfer</Btn>
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

        <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => goToTab(t.id)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${view === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
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
                      <td className="px-4 py-2.5 text-xs font-mono font-medium text-foreground">{fmt(value, 0)}</td>
                      <td className="px-4 py-2.5"><Badge status={m.status} /></td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => { adjustForm.setData("medicine_id", String(m.id)); setAdjustModal(true); }} className="text-xs text-primary hover:underline">Adjust</button>
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
            {ledger.data.length === 0 ? (
              <EmptyState icon={<ArrowUpDown size={40} />} title="No adjustments yet" description="Create your first stock adjustment." action={<Btn variant="primary" size="sm" onClick={() => setAdjustModal(true)}><Plus size={13} />New Adjustment</Btn>} />
            ) : (
              <table className="w-full">
                <TableHeader cols={["Date", "Medicine", "Qty In", "Qty Out", "Balance", "Reference", "Reason"]} />
                <tbody>
                  {ledger.data.map(row => (
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

        {view === "returned" && (
          <Card>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">Returned Stock</div>
              <Btn variant="primary" size="sm" onClick={() => setReturnModal(true)}><Plus size={13} />New Return</Btn>
            </div>
            {ledger.data.length === 0 ? (
              <EmptyState icon={<Undo2 size={40} />} title="No returns recorded" description="Customer returns and supplier returns will appear here." action={<Btn variant="primary" size="sm" onClick={() => setReturnModal(true)}><Plus size={13} />New Return</Btn>} />
            ) : (
              <table className="w-full">
                <TableHeader cols={["Date", "Medicine", "Qty In", "Qty Out", "Balance", "Reference", "Reason"]} />
                <tbody>
                  {ledger.data.map(row => (
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

        {view === "transfer" && (
          <Card>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">Stock Transfers</div>
              <Btn variant="primary" size="sm" onClick={() => setTransferModal(true)}><Plus size={13} />New Transfer</Btn>
            </div>
            {ledger.data.length === 0 ? (
              <EmptyState icon={<ArrowRightLeft size={40} />} title="No transfers recorded" description="Stock moved between shelves, counters, or branches will appear here." action={<Btn variant="primary" size="sm" onClick={() => setTransferModal(true)}><Plus size={13} />New Transfer</Btn>} />
            ) : (
              <table className="w-full">
                <TableHeader cols={["Date", "Medicine", "From", "To", "Reference", "Reason"]} />
                <tbody>
                  {ledger.data.map(row => (
                    <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{row.created_at.slice(0, 10)}</td>
                      <td className="px-4 py-2.5 text-sm text-foreground">{row.medicine.brand_name} {row.medicine.strength}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{row.from_location ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-foreground">{row.to_location ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-primary">{row.reference ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {view === "audit" && (
          <Card>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">Inventory Audit</div>
              <Btn variant="primary" size="sm" onClick={() => setAuditModal(true)}><ClipboardCheck size={13} />New Count</Btn>
            </div>
            <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border">
              Count actual stock on the shelf and compare it to the system quantity. Any variance is applied as a stock adjustment automatically.
            </div>
            <table className="w-full">
              <TableHeader cols={["Medicine", "SKU", "System Stock", "Reorder", "Status", ""]} />
              <tbody>
                {medicines.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon={<ClipboardCheck size={40} />} title="No medicines to audit" description="Add medicines to your catalogue first." /></td></tr>
                ) : medicines.map(m => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-medium text-foreground">{m.name}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{m.sku}</td>
                    <td className="px-4 py-2.5 text-sm font-mono font-semibold text-foreground">{m.stock}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{m.reorder_level}</td>
                    <td className="px-4 py-2.5"><Badge status={m.status} /></td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => { auditForm.setData("medicine_id", String(m.id)); auditForm.setData("counted_quantity", String(m.stock)); setAuditModal(true); }} className="text-xs text-primary hover:underline">Count</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Adjust Stock Modal */}
        <Modal open={adjustModal} onClose={() => setAdjustModal(false)} title="Stock Adjustment" width="max-w-xl">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Medicine</label>
              <select value={adjustForm.data.medicine_id} onChange={e => adjustForm.setData("medicine_id", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                <option value="">Select medicine</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
              </select>
              {adjustForm.errors.medicine_id && <p className="text-xs text-red-500 mt-1">{adjustForm.errors.medicine_id}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Adjustment Type</label>
                <select value={adjustForm.data.adjustment_type} onChange={e => adjustForm.setData("adjustment_type", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  <option>Add Stock</option><option>Remove Stock</option><option>Damage Write-off</option><option>Expired Write-off</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Quantity</label>
                <input type="number" placeholder="0" value={adjustForm.data.quantity} onChange={e => adjustForm.setData("quantity", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {adjustForm.errors.quantity && <p className="text-xs text-red-500 mt-1">{adjustForm.errors.quantity}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Reason</label>
              <textarea rows={2} placeholder="Describe reason for adjustment…" value={adjustForm.data.reason} onChange={e => adjustForm.setData("reason", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setAdjustModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={adjustForm.processing} onClick={submitAdjustment}><Check size={13} />Save Adjustment</Btn>
            </div>
          </div>
        </Modal>

        {/* Return Stock Modal */}
        <Modal open={returnModal} onClose={() => setReturnModal(false)} title="Stock Return" width="max-w-xl">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Medicine</label>
              <select value={returnForm.data.medicine_id} onChange={e => returnForm.setData("medicine_id", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                <option value="">Select medicine</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
              </select>
              {returnForm.errors.medicine_id && <p className="text-xs text-red-500 mt-1">{returnForm.errors.medicine_id}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Direction</label>
                <select value={returnForm.data.direction} onChange={e => returnForm.setData("direction", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  <option>Customer Return</option><option>Return to Supplier</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">{returnForm.data.direction === "Customer Return" ? "Adds stock back in" : "Removes stock, sent back to supplier"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Quantity</label>
                <input type="number" placeholder="0" value={returnForm.data.quantity} onChange={e => returnForm.setData("quantity", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {returnForm.errors.quantity && <p className="text-xs text-red-500 mt-1">{returnForm.errors.quantity}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Reason</label>
              <textarea rows={2} placeholder="e.g. Wrong item sold, damaged in transit…" value={returnForm.data.reason} onChange={e => returnForm.setData("reason", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setReturnModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={returnForm.processing} onClick={submitReturn}><Check size={13} />Save Return</Btn>
            </div>
          </div>
        </Modal>

        {/* Transfer Stock Modal */}
        <Modal open={transferModal} onClose={() => setTransferModal(false)} title="Stock Transfer" width="max-w-xl">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Medicine</label>
              <select value={transferForm.data.medicine_id} onChange={e => transferForm.setData("medicine_id", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                <option value="">Select medicine</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
              </select>
              {transferForm.errors.medicine_id && <p className="text-xs text-red-500 mt-1">{transferForm.errors.medicine_id}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">From Location</label>
                <input placeholder="e.g. Shelf A3" value={transferForm.data.from_location} onChange={e => transferForm.setData("from_location", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {transferForm.errors.from_location && <p className="text-xs text-red-500 mt-1">{transferForm.errors.from_location}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">To Location</label>
                <input placeholder="e.g. Counter 1" value={transferForm.data.to_location} onChange={e => transferForm.setData("to_location", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {transferForm.errors.to_location && <p className="text-xs text-red-500 mt-1">{transferForm.errors.to_location}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Quantity</label>
              <input type="number" placeholder="0" value={transferForm.data.quantity} onChange={e => transferForm.setData("quantity", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {transferForm.errors.quantity && <p className="text-xs text-red-500 mt-1">{transferForm.errors.quantity}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Reason</label>
              <textarea rows={2} placeholder="Optional notes…" value={transferForm.data.reason} onChange={e => transferForm.setData("reason", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setTransferModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={transferForm.processing} onClick={submitTransfer}><Check size={13} />Save Transfer</Btn>
            </div>
          </div>
        </Modal>

        {/* Inventory Audit Modal */}
        <Modal open={auditModal} onClose={() => setAuditModal(false)} title="Inventory Audit" width="max-w-xl">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Medicine</label>
              <select value={auditForm.data.medicine_id} onChange={e => auditForm.setData("medicine_id", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                <option value="">Select medicine</option>
                {medicines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
              </select>
              {auditForm.errors.medicine_id && <p className="text-xs text-red-500 mt-1">{auditForm.errors.medicine_id}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">System Stock</label>
                <div className="px-3 py-2 text-sm border border-border rounded-md bg-muted/50 font-mono text-muted-foreground">{selectedAuditMedicine ? selectedAuditMedicine.stock : "—"}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Counted Quantity</label>
                <input type="number" placeholder="0" value={auditForm.data.counted_quantity} onChange={e => auditForm.setData("counted_quantity", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {auditForm.errors.counted_quantity && <p className="text-xs text-red-500 mt-1">{auditForm.errors.counted_quantity}</p>}
              </div>
            </div>
            {auditVariance !== null && auditVariance !== 0 && (
              <div className={`p-3 rounded-md text-xs font-medium ${auditVariance > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                Variance: {auditVariance > 0 ? `+${auditVariance}` : auditVariance} — stock will be {auditVariance > 0 ? "increased" : "decreased"} to match the count.
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Notes</label>
              <textarea rows={2} placeholder="Optional notes about this count…" value={auditForm.data.reason} onChange={e => auditForm.setData("reason", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setAuditModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={auditForm.processing} onClick={submitAudit}><Check size={13} />Apply Count</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
