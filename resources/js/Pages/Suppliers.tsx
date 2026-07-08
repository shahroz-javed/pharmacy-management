import { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
import { Plus, Building2, Phone, Mail, MapPin, Check } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { Toolbar } from "@/Components/ui/Toolbar";
import { SearchInput } from "@/Components/ui/SearchInput";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import type { Supplier } from "@/types";

interface Props {
  suppliers: Supplier[];
  filters: { search?: string };
}

export default function Suppliers({ suppliers, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [addModal, setAddModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    city: "",
    address: "",
  });

  const applySearch = (v: string) => {
    setSearch(v);
    router.get("/suppliers", { search: v }, { preserveState: true, preserveScroll: true, only: ["suppliers", "filters"] });
  };

  const submit = () => {
    post("/suppliers", {
      preserveScroll: true,
      onSuccess: () => { setAddModal(false); reset(); setToast({ msg: "Supplier added successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <PageHeader
          title="Suppliers"
          subtitle={`${suppliers.length} suppliers`}
          actions={<Btn variant="primary" size="sm" onClick={() => setAddModal(true)}><Plus size={13} />Add Supplier</Btn>}
        />
        <Toolbar>
          <SearchInput placeholder="Search suppliers…" value={search} onChange={applySearch} />
          <div className="ml-auto text-xs text-muted-foreground">{suppliers.length} suppliers</div>
        </Toolbar>

        {suppliers.length === 0 ? (
          <Card><EmptyState icon={<Building2 size={40} />} title="No suppliers found" description="Try adjusting your search or add a new supplier." /></Card>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {suppliers.map(s => {
              const balance = Number(s.outstanding_balance);
              return (
                <Link key={s.id} href={`/suppliers/${s.id}`} className="block">
                  <Card className="p-4 cursor-pointer hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                        <Building2 size={18} className="text-violet-600" />
                      </div>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${balance > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                        {balance > 0 ? `Due: ₹${balance.toLocaleString()}` : "Paid Up"}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.contact_person ?? "—"}</div>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={11} />{s.phone ?? "—"}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={11} />{s.email ?? "—"}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={11} />{s.city ?? "—"}</div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs">
                      <span className="text-muted-foreground">Orders: <span className="font-mono font-medium text-foreground">{s.orders ?? 0}</span></span>
                      <span className="text-muted-foreground">Last: <span className="font-mono text-foreground">{s.last_order ?? "—"}</span></span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Supplier">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Supplier Name<span className="text-red-500 ml-0.5">*</span></label>
              <input value={data.name} onChange={e => setData("name", e.target.value)} placeholder="e.g. MediCorp Pharma" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Contact Person</label>
                <input value={data.contact_person} onChange={e => setData("contact_person", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Phone</label>
                <input value={data.phone} onChange={e => setData("phone", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Email</label>
                <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">City</label>
                <input value={data.city} onChange={e => setData("city", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Address</label>
              <textarea rows={2} value={data.address} onChange={e => setData("address", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setAddModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={processing} onClick={submit}><Check size={13} />Save Supplier</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
