import { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
import { Plus, Users, Phone, Mail, MapPin, Check, Star } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { Toolbar } from "@/Components/ui/Toolbar";
import { SearchInput } from "@/Components/ui/SearchInput";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import type { Customer } from "@/types";

interface Props {
  customers: Customer[];
  filters: { search?: string };
}

export default function Customers({ customers, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [addModal, setAddModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
  });

  const applySearch = (v: string) => {
    setSearch(v);
    router.get("/customers", { search: v }, { preserveState: true, preserveScroll: true, only: ["customers", "filters"] });
  };

  const submit = () => {
    post("/customers", {
      preserveScroll: true,
      onSuccess: () => { setAddModal(false); reset(); setToast({ msg: "Customer added successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <PageHeader
          title="Customers"
          subtitle={`${customers.length} registered customers`}
          actions={<Btn variant="primary" size="sm" onClick={() => setAddModal(true)}><Plus size={13} />Add Customer</Btn>}
        />
        <Toolbar>
          <SearchInput placeholder="Search customers…" value={search} onChange={applySearch} />
          <div className="ml-auto text-xs text-muted-foreground">{customers.length} customers</div>
        </Toolbar>

        {customers.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Users size={40} />}
              title={search ? "No customers found" : "No customers yet"}
              description={search ? "Try adjusting your search." : "Add your first customer to start tracking loyalty and credit."}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {customers.map(c => {
              const credit = Number(c.credit_balance);
              return (
                <Link key={c.id} href={`/customers/${c.id}`} className="block">
                  <Card className="p-4 cursor-pointer hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 text-sm font-semibold">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${credit > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                        {credit > 0 ? `Due: ₹${credit.toLocaleString()}` : "No Credit"}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Star size={11} className="text-amber-500" />{c.loyalty_points} pts</div>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={11} />{c.phone ?? "—"}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={11} />{c.email ?? "—"}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={11} />{c.city ?? "—"}</div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Customer">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Customer Name<span className="text-red-500 ml-0.5">*</span></label>
              <input value={data.name} onChange={e => setData("name", e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Phone</label>
                <input value={data.phone} onChange={e => setData("phone", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Email</label>
                <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div className="col-span-2">
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
              <Btn variant="primary" disabled={processing} onClick={submit}><Check size={13} />Save Customer</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
