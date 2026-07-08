import { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { ChevronLeft, FileText, Check, X, ShoppingCart, ExternalLink } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Toast } from "@/Components/ui/Toast";
import type { Medicine, Prescription } from "@/types";

interface Props {
  prescription: Prescription;
  medicines: Pick<Medicine, "id" | "generic_name" | "brand_name" | "strength" | "sku">[];
}

type DraftItem = { medicine_id: string; quantity: string; dosage_instructions: string };

export default function PrescriptionDetail({ prescription: rx, medicines }: Props) {
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const items = rx.items ?? [];
  const isImage = rx.file_path ? /\.(png|jpe?g|gif|webp)$/i.test(rx.file_path) : false;

  const { data, setData, post, processing, errors } = useForm({
    items: (items.length > 0
      ? items.map(i => ({ medicine_id: String(i.medicine_id), quantity: String(i.quantity), dosage_instructions: i.dosage_instructions ?? "" }))
      : [{ medicine_id: "", quantity: "1", dosage_instructions: "" }]) as DraftItem[],
  });

  const addItem = () => setData("items", [...data.items, { medicine_id: "", quantity: "1", dosage_instructions: "" }]);
  const updateItem = (idx: number, field: keyof DraftItem, value: string) => {
    setData("items", data.items.map((row, ix) => ix === idx ? { ...row, [field]: value } : row));
  };
  const removeItem = (idx: number) => setData("items", data.items.filter((_, ix) => ix !== idx));

  const submit = () => {
    post(`/prescriptions/${rx.id}/items`, {
      preserveScroll: true,
      onSuccess: () => setToast({ msg: "Medicines attached successfully", type: "success" }),
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/prescriptions" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{rx.rx_number}</h1>
          <Badge status={rx.status} />
          {rx.status === "Pending" && (
            <Link href="/pos" className="ml-auto">
              <Btn variant="primary" size="sm"><ShoppingCart size={13} />Dispense via POS</Btn>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-4 col-span-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Patient", rx.patient_name],
                ["Phone", rx.patient_phone ?? "—"],
                ["Linked Customer", rx.customer?.name ?? "Walk-in"],
                ["Doctor", rx.doctor_name ?? "—"],
                ["Prescribed Date", rx.prescribed_date],
                ["Notes", rx.notes ?? "—"],
              ].map(([l, v]) => (
                <div key={l}><span className="text-xs text-muted-foreground block mb-0.5">{l}</span><span className="font-medium text-foreground">{v}</span></div>
              ))}
            </div>
            {rx.sale && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block mb-0.5">Dispensed via Sale</span>
                  <span className="font-mono text-sm text-foreground">{rx.sale.invoice_number} · ₹{Number(rx.sale.total).toLocaleString()}</span>
                </div>
                <Link href={`/sales/${rx.sale.id}`} className="text-primary hover:underline text-xs flex items-center gap-1">
                  View Sale <ExternalLink size={11} />
                </Link>
              </div>
            )}
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Prescription File</div>
            {rx.file_path ? (
              isImage ? (
                <a href={`/storage/${rx.file_path}`} target="_blank" rel="noopener noreferrer">
                  <img src={`/storage/${rx.file_path}`} alt="Prescription" className="w-full rounded-md border border-border object-cover" />
                </a>
              ) : (
                <a href={`/storage/${rx.file_path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <FileText size={16} />View PDF
                </a>
              )
            ) : (
              <div className="text-xs text-muted-foreground">No file uploaded</div>
            )}
          </Card>
        </div>

        <Card>
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Attached Medicines</div>
          <div className="p-4 space-y-2">
            {data.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <select value={item.medicine_id} onChange={e => updateItem(idx, "medicine_id", e.target.value)} className="flex-1 text-sm border border-border rounded-md px-2.5 py-1.5 bg-input-background focus:outline-none">
                  <option value="">Select medicine…</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.brand_name} {m.strength}</option>)}
                </select>
                <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} className="w-20 text-center text-sm font-mono border border-border rounded-md px-2.5 py-1.5 bg-input-background focus:outline-none" />
                <input placeholder="Dosage instructions" value={item.dosage_instructions} onChange={e => updateItem(idx, "dosage_instructions", e.target.value)} className="w-40 text-sm border border-border rounded-md px-2.5 py-1.5 bg-input-background focus:outline-none" />
                <button onClick={() => removeItem(idx)} className="p-1.5 text-muted-foreground hover:text-red-600"><X size={14} /></button>
              </div>
            ))}
            {data.items.length === 0 && (
              <EmptyState icon={<FileText size={40} />} title="No medicines attached" description="Attach the medicines prescribed for this patient." />
            )}
            <div className="flex items-center justify-between pt-1">
              <button onClick={addItem} className="text-xs text-primary hover:underline">+ Add medicine</button>
              <Btn variant="primary" size="sm" disabled={processing} onClick={submit}><Check size={13} />Save Medicines</Btn>
            </div>
            {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
