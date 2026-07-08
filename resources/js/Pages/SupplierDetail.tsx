import { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
import { ChevronLeft, Truck, DollarSign, Check } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import type { Supplier } from "@/types";

export default function SupplierDetail({ supplier: s }: { supplier: Supplier }) {
  const [payModal, setPayModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const balance = Number(s.outstanding_balance);
  const orders = s.purchase_orders ?? [];

  const { data, setData, post, processing, errors, reset } = useForm({
    amount: "",
    method: "Cash",
    purchase_order_id: "",
    notes: "",
  });

  const submitPayment = () => {
    post(`/suppliers/${s.id}/payments`, {
      preserveScroll: true,
      onSuccess: () => { setPayModal(false); reset(); setToast({ msg: "Payment recorded successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/suppliers" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{s.name}</h1>
          <div className="ml-auto">
            <Link href="/purchases/add">
              <Btn variant="primary" size="sm"><Truck size={13} />New Purchase Order</Btn>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-4 col-span-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Contact Person", s.contact_person ?? "—"], ["Phone", s.phone ?? "—"], ["Email", s.email ?? "—"],
                ["City", s.city ?? "—"], ["Total Orders", String(orders.length)], ["Outstanding Balance", `₹${balance.toLocaleString()}`],
              ].map(([l, v]) => (
                <div key={l}><span className="text-xs text-muted-foreground block mb-0.5">{l}</span><span className="font-medium text-foreground">{v}</span></div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Balance</div>
            <div className="text-3xl font-mono font-bold text-foreground">₹{balance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mb-4">outstanding</div>
            <Btn variant="primary" size="sm" className="w-full justify-center" onClick={() => setPayModal(true)} disabled={balance <= 0}><DollarSign size={13} />Record Payment</Btn>
          </Card>
        </div>
        <Card>
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Purchase History</div>
          {orders.length === 0 ? (
            <EmptyState icon={<Truck size={40} />} title="No purchase orders yet" description="Purchase orders placed with this supplier will appear here." />
          ) : (
            <table className="w-full">
              <TableHeader cols={["PO Number", "Date", "Items", "Amount", "Status"]} />
              <tbody>
                {orders.map(po => (
                  <tr key={po.id} onClick={() => router.visit(`/purchases/${po.id}`)} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">{po.po_number}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{po.order_date}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{po.items_count ?? 0} items</td>
                    <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{Number(po.total).toLocaleString()}</td>
                    <td className="px-4 py-2.5"><Badge status={po.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment">
          <div className="p-5 space-y-4">
            <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
              Outstanding balance: <span className="font-mono font-semibold text-foreground">₹{balance.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Amount (₹)<span className="text-red-500 ml-0.5">*</span></label>
                <input type="number" value={data.amount} onChange={e => setData("amount", e.target.value)} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Method</label>
                <select value={data.method} onChange={e => setData("method", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  <option>Cash</option><option>Card</option><option>Bank Transfer</option><option>Cheque</option>
                </select>
              </div>
            </div>
            {orders.length > 0 && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Against Purchase Order</label>
                <select value={data.purchase_order_id} onChange={e => setData("purchase_order_id", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  <option value="">General payment (not tied to a PO)</option>
                  {orders.map(po => <option key={po.id} value={po.id}>{po.po_number} — ₹{Number(po.total).toLocaleString()}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Notes</label>
              <textarea rows={2} value={data.notes} onChange={e => setData("notes", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setPayModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={processing} onClick={submitPayment}><Check size={13} />Save Payment</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
