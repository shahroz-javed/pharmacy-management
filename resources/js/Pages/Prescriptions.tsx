import { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
import { Plus, Eye, FileText, Check, X, UploadCloud } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { Toolbar } from "@/Components/ui/Toolbar";
import { SearchInput } from "@/Components/ui/SearchInput";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import type { Customer, Medicine, Prescription } from "@/types";

interface Props {
  prescriptions: Prescription[];
  customers: Pick<Customer, "id" | "name" | "phone">[];
  medicines: Pick<Medicine, "id" | "generic_name" | "brand_name" | "strength" | "sku">[];
  filters: { search?: string; status?: string };
}

type DraftItem = { medicine_id: string; quantity: string; dosage_instructions: string };

export default function Prescriptions({ prescriptions, customers, medicines, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [status, setStatus] = useState(filters.status ?? "All");
  const [uploadModal, setUploadModal] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    customer_id: "",
    patient_name: "",
    patient_phone: "",
    doctor_name: "",
    prescribed_date: new Date().toISOString().slice(0, 10),
    file: null as File | null,
    notes: "",
    items: [] as DraftItem[],
  });

  const applyFilters = (next: Partial<{ search: string; status: string }>) => {
    const merged = { search, status, ...next };
    router.get("/prescriptions", merged, { preserveState: true, preserveScroll: true, only: ["prescriptions", "filters"] });
  };

  const selectCustomer = (id: string) => {
    setData("customer_id", id);
    const c = customers.find(c => String(c.id) === id);
    if (c) {
      setData("patient_name", c.name);
      setData("patient_phone", c.phone ?? "");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setData("file", file);
    if (file) setFilePreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : file.name);
  };

  const addItem = () => setData("items", [...data.items, { medicine_id: "", quantity: "1", dosage_instructions: "" }]);
  const updateItem = (idx: number, field: keyof DraftItem, value: string) => {
    setData("items", data.items.map((row, ix) => ix === idx ? { ...row, [field]: value } : row));
  };
  const removeItem = (idx: number) => setData("items", data.items.filter((_, ix) => ix !== idx));

  const closeModal = () => {
    setUploadModal(false);
    reset();
    setFilePreview(null);
  };

  const submit = () => {
    post("/prescriptions", {
      forceFormData: true,
      onSuccess: () => { closeModal(); setToast({ msg: "Prescription uploaded successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <PageHeader
          title="Prescriptions"
          subtitle="Manage and track all prescriptions"
          actions={<Btn variant="primary" size="sm" onClick={() => setUploadModal(true)}><Plus size={13} />Upload Prescription</Btn>}
        />
        <Toolbar>
          <SearchInput placeholder="Search by patient, doctor, RX ID…" value={search} onChange={v => { setSearch(v); applyFilters({ search: v }); }} />
          <select value={status} onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }} className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Dispensed">Dispensed</option>
          </select>
        </Toolbar>
        <Card>
          {prescriptions.length === 0 ? (
            <EmptyState
              icon={<FileText size={40} />}
              title={search || status !== "All" ? "No prescriptions found" : "No prescriptions yet"}
              description={search || status !== "All" ? "Try adjusting your search or filters." : "Upload a prescription to get started."}
            />
          ) : (
            <table className="w-full">
              <TableHeader cols={["RX ID", "Patient", "Doctor", "Date", "Medicines", "Status", ""]} />
              <tbody>
                {prescriptions.map(rx => (
                  <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">
                      <Link href={`/prescriptions/${rx.id}`} className="hover:underline">{rx.rx_number}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-foreground">{rx.patient_name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{rx.doctor_name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{rx.prescribed_date}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{rx.items_count ?? 0} items</td>
                    <td className="px-4 py-2.5"><Badge status={rx.status} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/prescriptions/${rx.id}`} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye size={13} /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Modal open={uploadModal} onClose={closeModal} title="Upload Prescription" width="max-w-xl">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Existing Customer (optional)</label>
              <select value={data.customer_id} onChange={e => selectCustomer(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                <option value="">Walk-in / not a registered customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Patient Name<span className="text-red-500 ml-0.5">*</span></label>
                <input value={data.patient_name} onChange={e => setData("patient_name", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {errors.patient_name && <p className="text-xs text-red-500 mt-1">{errors.patient_name}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Patient Phone</label>
                <input value={data.patient_phone} onChange={e => setData("patient_phone", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Doctor Name</label>
                <input value={data.doctor_name} onChange={e => setData("doctor_name", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Prescribed Date<span className="text-red-500 ml-0.5">*</span></label>
                <input type="date" value={data.prescribed_date} onChange={e => setData("prescribed_date", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {errors.prescribed_date && <p className="text-xs text-red-500 mt-1">{errors.prescribed_date}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Prescription File (image or PDF)</label>
              <label className="flex items-center gap-3 px-3 py-3 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
                <UploadCloud size={18} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{filePreview ? (data.file?.name ?? filePreview) : "Click to upload or drag & drop"}</span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
              </label>
              {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-foreground">Attach Medicines (optional)</label>
                <button onClick={addItem} className="text-xs text-primary hover:underline">+ Add medicine</button>
              </div>
              {data.items.length > 0 && (
                <div className="space-y-2">
                  {data.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <select value={item.medicine_id} onChange={e => updateItem(idx, "medicine_id", e.target.value)} className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-input-background focus:outline-none">
                        <option value="">Select medicine…</option>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.brand_name} {m.strength}</option>)}
                      </select>
                      <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} className="w-16 text-center text-xs font-mono border border-border rounded-md px-2 py-1.5 bg-input-background focus:outline-none" />
                      <input placeholder="Dosage" value={item.dosage_instructions} onChange={e => updateItem(idx, "dosage_instructions", e.target.value)} className="w-28 text-xs border border-border rounded-md px-2 py-1.5 bg-input-background focus:outline-none" />
                      <button onClick={() => removeItem(idx)} className="p-1 text-muted-foreground hover:text-red-600"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Notes</label>
              <textarea rows={2} value={data.notes} onChange={e => setData("notes", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={closeModal}>Cancel</Btn>
              <Btn variant="primary" disabled={processing} onClick={submit}><Check size={13} />Upload Prescription</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
