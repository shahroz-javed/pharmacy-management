import { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { ChevronLeft, Printer, RefreshCw, Check, ShoppingCart, ArrowLeftRight, X, ExternalLink } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { EmptyState } from "@/Components/ui/EmptyState";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import type { Medicine, Sale } from "@/types";

type Mode = "return" | "exchange";
type ReplacementLine = { medicine_id: string; quantity: string; unit_price: string; discount: string; tax: string };

interface Props {
  sale: Sale;
  medicines: Pick<Medicine, "id" | "generic_name" | "brand_name" | "strength" | "sku" | "selling_price" | "discount" | "tax" | "stock">[];
}

export default function SaleDetail({ sale: s, medicines }: Props) {
  const [modalMode, setModalMode] = useState<Mode | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const items = s.items ?? [];
  const payments = s.payments ?? [];
  const returns = s.returns ?? [];
  const returnableItems = items.filter(i => i.quantity_returned < i.quantity);

  const { data, setData, post, processing, errors, reset } = useForm({
    refund_method: "Original Payment Method",
    reason: "",
    return_items: [] as { item_id: number; quantity: number }[],
    replacement_items: [] as ReplacementLine[],
  });

  const toggleItem = (itemId: number, maxQty: number, checked: boolean) => {
    setData("return_items", checked
      ? [...data.return_items, { item_id: itemId, quantity: maxQty }]
      : data.return_items.filter(i => i.item_id !== itemId));
  };

  const setReturnQty = (itemId: number, qty: number) => {
    setData("return_items", data.return_items.map(i => i.item_id === itemId ? { ...i, quantity: qty } : i));
  };

  const returnedValue = data.return_items.reduce((sum, ri) => {
    const item = items.find(i => i.id === ri.item_id);
    if (!item) return sum;
    const unit = item.quantity > 0 ? Number(item.total) / item.quantity : 0;
    return sum + unit * ri.quantity;
  }, 0);

  const addReplacement = () => setData("replacement_items", [...data.replacement_items, { medicine_id: "", quantity: "1", unit_price: "", discount: "0", tax: "0" }]);
  const updateReplacement = (idx: number, field: keyof ReplacementLine, value: string) => {
    setData("replacement_items", data.replacement_items.map((row, ix) => {
      if (ix !== idx) return row;
      if (field === "medicine_id") {
        const m = medicines.find(med => String(med.id) === value);
        return { ...row, medicine_id: value, unit_price: m ? m.selling_price : row.unit_price, discount: m ? m.discount : row.discount, tax: m ? m.tax : row.tax };
      }
      return { ...row, [field]: value };
    }));
  };
  const removeReplacement = (idx: number) => setData("replacement_items", data.replacement_items.filter((_, ix) => ix !== idx));

  const replacementValue = data.replacement_items.reduce((sum, r) => {
    const qty = parseFloat(r.quantity) || 0;
    const price = parseFloat(r.unit_price) || 0;
    const disc = parseFloat(r.discount) || 0;
    const tax = parseFloat(r.tax) || 0;
    const gross = qty * price;
    const afterDiscount = gross - gross * (disc / 100);
    return sum + afterDiscount + afterDiscount * (tax / 100);
  }, 0);

  const priceDifference = replacementValue - returnedValue;

  const closeModal = () => { setModalMode(null); reset(); };

  const submit = () => {
    if (modalMode === "return") {
      post(`/sales/${s.id}/returns`, {
        preserveScroll: true,
        onSuccess: () => { closeModal(); setToast({ msg: "Return processed successfully", type: "success" }); },
        onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
      });
    } else {
      post(`/sales/${s.id}/exchanges`, {
        preserveScroll: true,
        onSuccess: () => { closeModal(); setToast({ msg: "Exchange processed successfully", type: "success" }); },
        onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
      });
    }
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
              <>
                <Btn variant="outline" size="sm" onClick={() => setModalMode("return")}><RefreshCw size={13} />Return / Refund</Btn>
                <Btn variant="outline" size="sm" onClick={() => setModalMode("exchange")}><ArrowLeftRight size={13} />Exchange</Btn>
              </>
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
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Return / Exchange History</div>
          {returns.length === 0 ? (
            <EmptyState icon={<RefreshCw size={40} />} title="No returns or exchanges" description="Returns, refunds, and exchanges for this sale will appear here." />
          ) : (
            <table className="w-full">
              <TableHeader cols={["Date", "Items Returned", "Refund Amount", "Method", "Exchanged For", "Reason"]} />
              <tbody>
                {returns.map(r => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.items.map(ri => `${ri.sale_item.medicine.brand_name} ×${ri.quantity}`).join(", ")}</td>
                    <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{Number(r.refund_amount).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.refund_method}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {r.exchange_sale ? (
                        <Link href={`/sales/${r.exchange_sale.id}`} className="text-primary hover:underline flex items-center gap-1">
                          {r.exchange_sale.invoice_number} <ExternalLink size={10} />
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Modal open={modalMode !== null} onClose={closeModal} title={modalMode === "exchange" ? "Process Exchange" : "Process Return / Refund"} width="max-w-2xl">
          <div className="p-5 space-y-4">
            <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
              Invoice: <span className="font-mono font-medium text-foreground">{s.invoice_number}</span> · ₹{Number(s.total).toFixed(2)} · {s.customer?.name ?? "Walk-in"}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-2">Select Items to Return</label>
              {returnableItems.map(item => {
                const remaining = item.quantity - item.quantity_returned;
                const selected = data.return_items.find(i => i.item_id === item.id);
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

            {modalMode === "exchange" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-foreground">Replacement Items</label>
                  <button onClick={addReplacement} className="text-xs text-primary hover:underline">+ Add medicine</button>
                </div>
                {data.replacement_items.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2">No replacement items added — this will behave as a plain return.</div>
                ) : (
                  <div className="space-y-2">
                    {data.replacement_items.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <select value={row.medicine_id} onChange={e => updateReplacement(idx, "medicine_id", e.target.value)} className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-input-background focus:outline-none">
                          <option value="">Select medicine…</option>
                          {medicines.map(m => <option key={m.id} value={m.id}>{m.brand_name} {m.strength} · ₹{Number(m.selling_price).toFixed(2)}</option>)}
                        </select>
                        <input type="number" min={1} value={row.quantity} onChange={e => updateReplacement(idx, "quantity", e.target.value)} className="w-14 text-center text-xs font-mono border border-border rounded-md px-2 py-1.5 bg-input-background focus:outline-none" />
                        <input type="number" step="0.01" value={row.unit_price} onChange={e => updateReplacement(idx, "unit_price", e.target.value)} className="w-20 text-center text-xs font-mono border border-border rounded-md px-2 py-1.5 bg-input-background focus:outline-none" />
                        <button onClick={() => removeReplacement(idx)} className="p-1 text-muted-foreground hover:text-red-600"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
                {data.replacement_items.length > 0 && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-md text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Returned value</span><span className="font-mono">₹{returnedValue.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Replacement value</span><span className="font-mono">₹{replacementValue.toFixed(2)}</span></div>
                    <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                      <span>{priceDifference > 0 ? "Customer pays" : priceDifference < 0 ? "Refund to customer" : "Even exchange"}</span>
                      <span className="font-mono">₹{Math.abs(priceDifference).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">{modalMode === "exchange" ? "Settlement Method" : "Refund Method"}</label>
              <select value={data.refund_method} onChange={e => setData("refund_method", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                <option>Original Payment Method</option>
                <option>Cash</option>
                <option>Store Credit</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Reason</label>
              <textarea rows={2} value={data.reason} onChange={e => setData("reason", e.target.value)} placeholder={modalMode === "exchange" ? "Exchange reason…" : "Return reason…"} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            {errors.return_items && <p className="text-xs text-red-500">{errors.return_items}</p>}
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={closeModal}>Cancel</Btn>
              <Btn variant={modalMode === "exchange" ? "primary" : "danger"} disabled={processing || data.return_items.length === 0} onClick={submit}>
                <Check size={13} />{modalMode === "exchange" ? "Process Exchange" : "Process Return"}
              </Btn>
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
