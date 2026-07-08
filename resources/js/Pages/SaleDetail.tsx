import { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { ChevronLeft, Printer, RefreshCw, Check, ShoppingCart } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import type { Sale } from "@/types";

export default function SaleDetail({ sale: s }: { sale: Sale }) {
  const [returnModal, setReturnModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const items = s.items ?? [];
  const payments = s.payments ?? [];
  const returns = s.returns ?? [];
  const returnableItems = items.filter(i => i.quantity_returned < i.quantity);

  const { data, setData, post, processing, errors, reset } = useForm({
    refund_method: "Original Payment Method",
    reason: "",
    items: [] as { item_id: number; quantity: number }[],
  });

  const toggleItem = (itemId: number, maxQty: number, checked: boolean) => {
    setData("items", checked
      ? [...data.items, { item_id: itemId, quantity: maxQty }]
      : data.items.filter(i => i.item_id !== itemId));
  };

  const setReturnQty = (itemId: number, qty: number) => {
    setData("items", data.items.map(i => i.item_id === itemId ? { ...i, quantity: qty } : i));
  };

  const submitReturn = () => {
    post(`/sales/${s.id}/returns`, {
      preserveScroll: true,
      onSuccess: () => { setReturnModal(false); reset(); setToast({ msg: "Return processed successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl print:hidden">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/sales" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{s.invoice_number}</h1>
          <Badge status={s.status} />
          <div className="ml-auto flex gap-2">
            {returnableItems.length > 0 && (
              <Btn variant="outline" size="sm" onClick={() => setReturnModal(true)}><RefreshCw size={13} />Return / Refund</Btn>
            )}
            <Btn variant="outline" size="sm" onClick={() => window.print()}><Printer size={13} />Print Receipt</Btn>
            <Link href="/pos">
              <Btn variant="primary" size="sm"><ShoppingCart size={13} />New Sale</Btn>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            ["Customer", s.customer?.name ?? "Walk-in"],
            ["Date & Time", s.sold_at ? new Date(s.sold_at).toLocaleString() : "—"],
            ["Payment Method", s.payment_method],
            ["Amount Paid", `₹${Number(s.amount_paid).toLocaleString()}`],
            ["Loyalty Points Earned", String(s.loyalty_points_earned)],
            ["Total", `₹${Number(s.total).toLocaleString()}`],
          ].map(([l, v]) => (
            <div key={l} className="bg-card border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-0.5">{l}</div>
              <div className="text-sm font-medium text-foreground font-mono">{v}</div>
            </div>
          ))}
        </div>

        <Card className="mb-4">
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Sale Items</div>
          <table className="w-full">
            <TableHeader cols={["Medicine", "Qty", "Returned", "Unit Price", "Disc %", "Tax %", "Total"]} />
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-sm text-foreground">{item.medicine.brand_name} {item.medicine.strength}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{item.quantity_returned}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">₹{Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{item.discount}%</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{item.tax}%</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border flex justify-end">
            <div className="w-56 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">₹{Number(s.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between text-amber-600"><span>Discount</span><span className="font-mono">−₹{Number(s.discount_total).toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="font-mono">+₹{Number(s.tax_total).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1"><span>Total</span><span className="font-mono">₹{Number(s.total).toFixed(2)}</span></div>
            </div>
          </div>
        </Card>

        {payments.length > 1 && (
          <Card className="mb-4">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Payment Breakdown</div>
            <table className="w-full">
              <TableHeader cols={["Method", "Amount"]} />
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 text-sm text-foreground">{p.method}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-foreground">₹{Number(p.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card>
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Return / Refund History</div>
          {returns.length === 0 ? (
            <EmptyState icon={<RefreshCw size={40} />} title="No returns" description="Returns and refunds for this sale will appear here." />
          ) : (
            <table className="w-full">
              <TableHeader cols={["Date", "Items", "Refund Amount", "Method", "Reason"]} />
              <tbody>
                {returns.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.items.map(ri => `${ri.sale_item.medicine.brand_name} ×${ri.quantity}`).join(", ")}</td>
                    <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{Number(r.refund_amount).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.refund_method}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Modal open={returnModal} onClose={() => setReturnModal(false)} title="Process Return / Refund" width="max-w-xl">
          <div className="p-5 space-y-4">
            <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
              Invoice: <span className="font-mono font-medium text-foreground">{s.invoice_number}</span> · ₹{Number(s.total).toFixed(2)} · {s.customer?.name ?? "Walk-in"}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Select Items to Return</label>
              {returnableItems.map(item => {
                const remaining = item.quantity - item.quantity_returned;
                const selected = data.items.find(i => i.item_id === item.id);
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <input
                      type="checkbox"
                      checked={!!selected}
                      onChange={e => toggleItem(item.id, remaining, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-foreground flex-1">{item.medicine.brand_name} {item.medicine.strength}</span>
                    <span className="text-xs font-mono text-muted-foreground">Max: {remaining}</span>
                    <input
                      type="number"
                      min={1}
                      max={remaining}
                      disabled={!selected}
                      value={selected?.quantity ?? remaining}
                      onChange={e => setReturnQty(item.id, Math.max(1, Math.min(remaining, parseInt(e.target.value) || 1)))}
                      className="w-16 text-center text-xs font-mono border border-border rounded py-1 bg-input-background focus:outline-none disabled:opacity-50"
                    />
                  </div>
                );
              })}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Refund Method</label>
              <select value={data.refund_method} onChange={e => setData("refund_method", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                <option>Original Payment Method</option>
                <option>Cash</option>
                <option>Store Credit</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Reason</label>
              <textarea rows={2} value={data.reason} onChange={e => setData("reason", e.target.value)} placeholder="Return reason…" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setReturnModal(false)}>Cancel</Btn>
              <Btn variant="danger" disabled={processing || data.items.length === 0} onClick={submitReturn}><Check size={13} />Process Return</Btn>
            </div>
          </div>
        </Modal>
      </div>

      {/* Printable receipt — only rendered visually when printing */}
      <div className="hidden print:block p-6">
        <div className="flex justify-between mb-6">
          <div>
            <div className="text-lg font-semibold text-black">PharmaPro Medical Store</div>
            <div className="text-xs text-gray-600">123, MG Road, Mumbai</div>
            <div className="text-xs text-gray-600">GST: 27AABCU9603R1ZX</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-black">SALE RECEIPT</div>
            <div className="text-xs text-gray-600">Invoice No. {s.invoice_number}</div>
            <div className="text-xs text-gray-600">Date: {s.sold_at ? new Date(s.sold_at).toLocaleString() : "—"}</div>
          </div>
        </div>

        <div className="flex justify-between mb-6 p-3 bg-gray-100 rounded-md text-sm">
          <div>
            <div className="text-xs text-gray-600 mb-0.5">Billed To</div>
            <div className="font-medium text-black">{s.customer?.name ?? "Walk-in Customer"}</div>
            {s.customer?.phone && <div className="text-xs text-gray-600">{s.customer.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600 mb-0.5">Payment Method</div>
            <div className="font-medium text-black">{s.payment_method}</div>
          </div>
        </div>

        <table className="w-full mb-4 text-sm">
          <thead>
            <tr className="border-b-2 border-black text-left">
              <th className="py-2 font-semibold text-black">Medicine</th>
              <th className="py-2 font-semibold text-black text-right">Qty</th>
              <th className="py-2 font-semibold text-black text-right">Unit Price</th>
              <th className="py-2 font-semibold text-black text-right">Tax</th>
              <th className="py-2 font-semibold text-black text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="py-2 text-black">{item.medicine.brand_name} {item.medicine.strength}</td>
                <td className="py-2 font-mono text-black text-right">{item.quantity}</td>
                <td className="py-2 font-mono text-black text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                <td className="py-2 font-mono text-gray-700 text-right">{item.tax}%</td>
                <td className="py-2 font-mono font-semibold text-black text-right">₹{Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-1.5 text-sm border-t-2 border-black pt-2">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-mono text-black">₹{Number(s.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Discount</span><span className="font-mono text-black">−₹{Number(s.discount_total).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Tax</span><span className="font-mono text-black">₹{Number(s.tax_total).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base border-t border-black pt-2 mt-2">
              <span>Total</span><span className="font-mono">₹{Number(s.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-gray-500">Thank you for your purchase. This is a system-generated receipt.</div>
      </div>
    </AppLayout>
  );
}
