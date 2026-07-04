import { useState } from "react";
import { Link } from "@inertiajs/react";
import {
  Upload, Download, Plus, Filter, Pill, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { Toolbar } from "@/Components/ui/Toolbar";
import { PageHeader } from "@/Components/ui/PageHeader";
import { SearchInput } from "@/Components/ui/SearchInput";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import { medicines } from "@/mockData";

export default function Medicines() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const filtered = medicines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || m.category === category;
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const cats = ["All", ...Array.from(new Set(medicines.map(m => m.category)))];

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <PageHeader
          title="Medicines"
          subtitle={`${medicines.length} medicines in catalogue`}
          actions={
            <>
              <Btn variant="outline" size="sm"><Upload size={13} />Import</Btn>
              <Btn variant="outline" size="sm"><Download size={13} />Export</Btn>
              <Link href="/medicines/add">
                <Btn variant="primary" size="sm"><Plus size={13} />Add Medicine</Btn>
              </Link>
            </>
          }
        />
        <Toolbar>
          <SearchInput placeholder="Search by name, SKU, batch…" value={search} onChange={setSearch} />
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20">
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20">
            {["All", "In Stock", "Low Stock", "Out of Stock"].map(s => <option key={s}>{s}</option>)}
          </select>
          <Btn variant="outline" size="sm"><Filter size={13} />More Filters</Btn>
          <div className="ml-auto text-xs text-muted-foreground">{filtered.length} results</div>
        </Toolbar>

        <Card>
          <table className="w-full">
            <TableHeader cols={["", "Medicine", "Category", "Batch / Expiry", "Stock", "Reorder", "Purchase", "Selling", "Status", ""]} />
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10}><EmptyState icon={<Pill size={40} />} title="No medicines found" description="Try adjusting your search or filters" /></td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2.5"><input type="checkbox" className="rounded border-border" /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                        <Pill size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{m.sku} · {m.form}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><span className="text-xs text-muted-foreground">{m.category}</span></td>
                  <td className="px-4 py-2.5">
                    <div className="text-xs font-mono text-foreground">{m.batch}</div>
                    <div className="text-xs text-muted-foreground">{m.expiry}</div>
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono font-medium text-foreground">{m.stock}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{m.reorder}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">₹{m.purchase.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-medium text-foreground">₹{m.selling.toFixed(2)}</td>
                  <td className="px-4 py-2.5"><Badge status={m.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/medicines/${m.id}`} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye size={13} /></Link>
                      <Link href={`/medicines/${m.id}/edit`} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Edit2 size={13} /></Link>
                      <button onClick={() => { setSelectedId(m.id); setDeleteModal(true); }} className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Showing 1–{filtered.length} of {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button className="px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted disabled:opacity-40"><ChevronLeft size={12} /></button>
                <button className="px-2.5 py-1.5 text-xs border border-border rounded bg-primary text-primary-foreground">1</button>
                <button className="px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted"><ChevronRight size={12} /></button>
              </div>
            </div>
          )}
        </Card>

        <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Medicine">
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-800 dark:text-red-400">This action cannot be undone</div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">This medicine and all associated stock records will be permanently deleted.</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Btn>
              <Btn variant="danger" onClick={() => { setDeleteModal(false); setToast({ msg: "Medicine deleted successfully", type: "success" }); }}>Delete Medicine</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
