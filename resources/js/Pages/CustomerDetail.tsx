import { useState } from "react";
import { Link, router, useForm } from "@inertiajs/react";
import { ChevronLeft, Edit2, ShoppingCart, DollarSign, Star, Check, ShoppingBag, FileText } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import type { Customer } from "@/types";

export default function CustomerDetail({ customer: c }: { customer: Customer }) {
  const [editModal, setEditModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [loyaltyModal, setLoyaltyModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const credit = Number(c.credit_balance);
  const payments = c.credit_payments ?? [];
  const prescriptions = c.prescriptions ?? [];

  const editForm = useForm({
    name: c.name,
    phone: c.phone ?? "",
    email: c.email ?? "",
    city: c.city ?? "",
    address: c.address ?? "",
  });

  const payForm = useForm({
    amount: "",
    method: "Cash",
    notes: "",
  });

  const loyaltyForm = useForm({
    points: "",
    type: "Add",
  });

  const submitEdit = () => {
    editForm.put(`/customers/${c.id}`, {
      preserveScroll: true,
      onSuccess: () => { setEditModal(false); setToast({ msg: "Customer updated successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const submitPayment = () => {
    payForm.post(`/customers/${c.id}/payments`, {
      preserveScroll: true,
      onSuccess: () => { setPayModal(false); payForm.reset(); setToast({ msg: "Payment recorded successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const submitLoyalty = () => {
    loyaltyForm.post(`/customers/${c.id}/loyalty`, {
      preserveScroll: true,
      onSuccess: () => { setLoyaltyModal(false); loyaltyForm.reset(); setToast({ msg: "Loyalty points updated successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/customers" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{c.name}</h1>
          <div className="ml-auto flex gap-2">
            <Btn variant="outline" size="sm" onClick={() => setEditModal(true)}><Edit2 size={13} />Edit</Btn>
            <Link href="/pos">
              <Btn variant="primary" size="sm"><ShoppingCart size={13} />New Sale</Btn>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold">{c.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="text-base font-semibold text-foreground">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.email ?? "—"} · {c.phone ?? "—"}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["City", c.city ?? "—"], ["Address", c.address ?? "—"]].map(([l, v]) => (
                <div key={l}><span className="text-xs text-muted-foreground block">{l}</span><span className="font-medium text-foreground">{v}</span></div>
              ))}
            </div>
          </Card>
          <div className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-0.5">
                <div className="text-xs text-muted-foreground">Loyalty Points</div>
                <button onClick={() => setLoyaltyModal(true)} className="text-xs text-primary hover:underline">Adjust</button>
              </div>
              <div className="text-2xl font-mono font-bold text-amber-600 flex items-center gap-1"><Star size={18} className="fill-amber-500 text-amber-500" />{c.loyalty_points}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-0.5">Credit Balance</div>
              <div className={`text-2xl font-mono font-bold ${credit > 0 ? "text-red-600" : "text-emerald-600"}`}>₹{credit.toLocaleString()}</div>
              <Btn variant="primary" size="sm" className="w-full justify-center mt-3" onClick={() => setPayModal(true)} disabled={credit <= 0}><DollarSign size={13} />Record Payment</Btn>
            </Card>
          </div>
        </div>

        <Card className="mb-4">
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Purchase History</div>
          <EmptyState icon={<ShoppingBag size={40} />} title="No purchases yet" description="Sales made by this customer will appear here." />
        </Card>

        <Card className="mb-4">
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Prescriptions</div>
          {prescriptions.length === 0 ? (
            <EmptyState icon={<FileText size={40} />} title="No prescriptions yet" description="Prescriptions uploaded for this customer will appear here." />
          ) : (
            <table className="w-full">
              <TableHeader cols={["RX ID", "Doctor", "Date", "Medicines", "Status"]} />
              <tbody>
                {prescriptions.map(rx => (
                  <tr key={rx.id} onClick={() => router.visit(`/prescriptions/${rx.id}`)} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-2.5 text-xs font-mono text-primary">{rx.rx_number}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{rx.doctor_name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{rx.prescribed_date}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{rx.items_count ?? 0} items</td>
                    <td className="px-4 py-2.5"><Badge status={rx.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Credit Payment History</div>
          {payments.length === 0 ? (
            <EmptyState icon={<DollarSign size={40} />} title="No payments recorded" description="Credit payments recorded for this customer will appear here." />
          ) : (
            <table className="w-full">
              <TableHeader cols={["Date", "Amount", "Method", "Recorded By", "Notes"]} />
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{p.created_at}</td>
                    <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.method}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.user?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Customer">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Customer Name<span className="text-red-500 ml-0.5">*</span></label>
              <input value={editForm.data.name} onChange={e => editForm.setData("name", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {editForm.errors.name && <p className="text-xs text-red-500 mt-1">{editForm.errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Phone</label>
                <input value={editForm.data.phone} onChange={e => editForm.setData("phone", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {editForm.errors.phone && <p className="text-xs text-red-500 mt-1">{editForm.errors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Email</label>
                <input type="email" value={editForm.data.email} onChange={e => editForm.setData("email", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {editForm.errors.email && <p className="text-xs text-red-500 mt-1">{editForm.errors.email}</p>}
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-foreground block mb-1.5">City</label>
                <input value={editForm.data.city} onChange={e => editForm.setData("city", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Address</label>
              <textarea rows={2} value={editForm.data.address} onChange={e => editForm.setData("address", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setEditModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={editForm.processing} onClick={submitEdit}><Check size={13} />Save Changes</Btn>
            </div>
          </div>
        </Modal>

        <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment">
          <div className="p-5 space-y-4">
            <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
              Outstanding balance: <span className="font-mono font-semibold text-foreground">₹{credit.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Amount (₹)<span className="text-red-500 ml-0.5">*</span></label>
                <input type="number" value={payForm.data.amount} onChange={e => payForm.setData("amount", e.target.value)} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {payForm.errors.amount && <p className="text-xs text-red-500 mt-1">{payForm.errors.amount}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Method</label>
                <select value={payForm.data.method} onChange={e => payForm.setData("method", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  <option>Cash</option><option>Card</option><option>Bank Transfer</option><option>Cheque</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Notes</label>
              <textarea rows={2} value={payForm.data.notes} onChange={e => payForm.setData("notes", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setPayModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={payForm.processing} onClick={submitPayment}><Check size={13} />Save Payment</Btn>
            </div>
          </div>
        </Modal>

        <Modal open={loyaltyModal} onClose={() => setLoyaltyModal(false)} title="Adjust Loyalty Points">
          <div className="p-5 space-y-4">
            <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
              Current balance: <span className="font-mono font-semibold text-foreground">{c.loyalty_points} pts</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Points<span className="text-red-500 ml-0.5">*</span></label>
                <input type="number" value={loyaltyForm.data.points} onChange={e => loyaltyForm.setData("points", e.target.value)} placeholder="0" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
                {loyaltyForm.errors.points && <p className="text-xs text-red-500 mt-1">{loyaltyForm.errors.points}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Type</label>
                <select value={loyaltyForm.data.type} onChange={e => loyaltyForm.setData("type", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                  <option value="Add">Add</option>
                  <option value="Redeem">Redeem</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setLoyaltyModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={loyaltyForm.processing} onClick={submitLoyalty}><Check size={13} />Save</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
