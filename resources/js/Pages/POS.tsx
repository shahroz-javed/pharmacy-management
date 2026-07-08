import { useMemo, useRef, useState } from "react";
import { Link, router } from "@inertiajs/react";
import { Scan, ShoppingCart, Clock, BookOpen, Trash2, X, ArrowLeft, CheckCircle2, PlayCircle, FileText } from "lucide-react";
import { Btn } from "@/Components/ui/Btn";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import type { CartLine, Customer, Medicine, Prescription, Sale } from "@/types";

type PayMethod = "Cash" | "Card" | "UPI" | "Credit";

interface Props {
  medicines: Medicine[];
  customers: Pick<Customer, "id" | "name" | "phone" | "credit_balance">[];
  heldSales: Sale[];
  pendingPrescriptions: Prescription[];
}

export default function POS({ medicines, customers, heldSales, pendingPrescriptions }: Props) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [splitPayments, setSplitPayments] = useState<{ method: PayMethod; amount: string }[]>([{ method: "Cash", amount: "" }]);
  const [holdModal, setHoldModal] = useState(false);
  const [holdReference, setHoldReference] = useState("");
  const [resumeModal, setResumeModal] = useState(false);
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const discountAmt = cart.reduce((s, i) => s + (i.qty * i.price * i.discount / 100), 0);
  const taxAmt = cart.reduce((s, i) => s + ((i.qty * i.price - i.qty * i.price * i.discount / 100) * i.tax / 100), 0);
  const total = subtotal - discountAmt + taxAmt;
  const amountEntered = splitPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const hasCreditPayment = splitPayments.some(p => p.method === "Credit" && parseFloat(p.amount) > 0);

  const filteredMedicines = useMemo(
    () => medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase()) || (m.barcode ?? "").includes(search)),
    [medicines, search]
  );

  const addToCart = (m: Medicine) => {
    setCart(c => {
      const exists = c.find(i => i.medicine_id === m.id);
      if (exists) {
        if (exists.qty >= m.stock) {
          setToast({ msg: `Only ${m.stock} in stock`, type: "error" });
          return c;
        }
        return c.map(i => i.medicine_id === m.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...c, { medicine_id: m.id, name: m.name, sku: m.sku, qty: 1, price: Number(m.selling_price), discount: Number(m.discount) || 0, tax: Number(m.tax) || 0, stock: m.stock }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(c => c.map(item => {
      if (item.medicine_id !== id) return item;
      const nextQty = Math.max(1, item.qty + delta);
      if (nextQty > item.stock) {
        setToast({ msg: `Only ${item.stock} in stock`, type: "error" });
        return item;
      }
      return { ...item, qty: nextQty };
    }));
  };
  const removeItem = (id: number) => setCart(c => c.filter(i => i.medicine_id !== id));
  const clearCart = () => { setCart([]); setCustomerId(""); setSplitPayments([{ method: "Cash", amount: "" }]); setPrescriptionId(null); };

  const buildItemsPayload = () => cart.map(i => ({ medicine_id: i.medicine_id, quantity: i.qty, unit_price: i.price, discount: i.discount, tax: i.tax }));

  const charge = () => {
    if (hasCreditPayment && !customerId) {
      setToast({ msg: "Select a customer for credit payment", type: "error" });
      return;
    }
    if (amountEntered + 0.01 < total) {
      setToast({ msg: "Amount entered is less than the total", type: "error" });
      return;
    }
    setProcessing(true);
    router.post("/sales", {
      customer_id: customerId || null,
      status: "Paid",
      prescription_id: prescriptionId,
      items: buildItemsPayload(),
      payments: splitPayments.filter(p => parseFloat(p.amount) > 0).map(p => ({ method: p.method, amount: parseFloat(p.amount) })),
    }, {
      // Charging navigates to the new sale's receipt (SaleDetail) on success,
      // so there is no local success state to set here.
      onError: (errors) => setToast({ msg: errors.items ?? "Please fix the errors and try again", type: "error" }),
      onFinish: () => setProcessing(false),
    });
  };

  const holdSale = () => {
    setProcessing(true);
    router.post("/sales", {
      customer_id: customerId || null,
      status: "Held",
      hold_reference: holdReference || null,
      items: buildItemsPayload(),
    }, {
      preserveState: true,
      onSuccess: () => { setHoldModal(false); setHoldReference(""); clearCart(); setToast({ msg: "Sale held successfully", type: "success" }); },
      onError: () => setToast({ msg: "Could not hold sale", type: "error" }),
      onFinish: () => setProcessing(false),
    });
  };

  const resumeSale = (sale: Sale) => {
    setCart((sale.items ?? []).map(i => ({
      medicine_id: i.medicine_id,
      name: i.medicine.brand_name + (i.medicine.strength ? ` ${i.medicine.strength}` : ""),
      sku: i.medicine.sku,
      qty: i.quantity,
      price: Number(i.unit_price),
      discount: Number(i.discount),
      tax: Number(i.tax),
      stock: medicines.find(m => m.id === i.medicine_id)?.stock ?? i.quantity,
    })));
    setCustomerId(sale.customer_id ? String(sale.customer_id) : "");
    setResumeModal(false);
    setToast({ msg: "Held sale resumed", type: "success" });
  };

  const attachPrescription = (rx: Prescription) => {
    setPrescriptionId(rx.id);
    if (rx.customer_id) setCustomerId(String(rx.customer_id));
    setCart(c => {
      let next = c;
      for (const item of rx.items ?? []) {
        const medicine = medicines.find(m => m.id === item.medicine_id);
        if (!medicine) continue;
        const exists = next.find(i => i.medicine_id === medicine.id);
        const qty = Math.min(item.quantity, medicine.stock);
        next = exists
          ? next.map(i => i.medicine_id === medicine.id ? { ...i, qty: Math.min(i.qty + item.quantity, medicine.stock) } : i)
          : [...next, { medicine_id: medicine.id, name: medicine.name, sku: medicine.sku, qty, price: Number(medicine.selling_price), discount: Number(medicine.discount) || 0, tax: Number(medicine.tax) || 0, stock: medicine.stock }];
      }
      return next;
    });
    setPrescriptionModal(false);
    setToast({ msg: `Attached ${rx.rx_number}`, type: "success" });
  };

  const updateSplitPayment = (idx: number, field: "method" | "amount", value: string) => {
    setSplitPayments(p => p.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };
  const addSplitRow = () => setSplitPayments(p => [...p, { method: "Card", amount: "" }]);
  const removeSplitRow = (idx: number) => setSplitPayments(p => p.length > 1 ? p.filter((_, i) => i !== idx) : p);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Left — Search */}
      <div className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="relative flex-1">
            <Scan size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              placeholder="Scan or search medicine…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              autoFocus
            />
          </div>
        </div>
        <div className="px-3 pt-2 pb-1">
          <button onClick={() => setResumeModal(true)} className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs border border-border rounded-md hover:bg-muted text-muted-foreground">
            <PlayCircle size={12} />Resume Held ({heldSales.length})
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredMedicines.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">No medicines found</div>
          ) : filteredMedicines.map(m => (
            <button
              key={m.id}
              onClick={() => addToCart(m)}
              className="w-full text-left px-2.5 py-2 rounded-md hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
            >
              <div className="text-xs font-medium text-foreground leading-tight">{m.name}</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">{m.sku}</span>
                <span className="text-xs font-mono font-semibold text-foreground">₹{Number(m.selling_price).toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground">Stock: {m.stock}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Center — Cart */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="text-sm border border-border rounded-md px-3 py-1.5 bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option value="">Walk-in</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Link href="/customers" className="text-xs text-primary hover:underline">+ New Customer</Link>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHoldModal(true)} disabled={cart.length === 0} className="px-2.5 py-1.5 text-xs border border-border rounded-md hover:bg-muted text-muted-foreground flex items-center gap-1.5 disabled:opacity-50">
              <Clock size={12} />Hold Sale
            </button>
            <button onClick={() => setPrescriptionModal(true)} className={`px-2.5 py-1.5 text-xs border rounded-md flex items-center gap-1.5 ${prescriptionId ? "border-primary/40 bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}>
              <BookOpen size={12} />{prescriptionId ? "Prescription Linked" : "Prescription"}
            </button>
            <button onClick={clearCart} disabled={cart.length === 0} className="px-2.5 py-1.5 text-xs border border-red-200 rounded-md hover:bg-red-50 text-red-600 flex items-center gap-1.5 disabled:opacity-50">
              <Trash2 size={12} />Clear
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <ShoppingCart size={40} className="opacity-20" />
              <div className="text-sm font-medium">Cart is empty</div>
              <div className="text-xs">Scan a barcode or search for a medicine to begin</div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-border bg-muted/40 sticky top-0">
                <tr>
                  {["Medicine", "Qty", "Unit Price", "Disc %", "Tax %", "Total", ""].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cart.map(item => {
                  const lineTotal = item.qty * item.price * (1 - item.discount / 100) * (1 + item.tax / 100);
                  return (
                    <tr key={item.medicine_id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="text-sm font-medium text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.medicine_id, -1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground text-sm">−</button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={e => setCart(c => c.map(i => i.medicine_id === item.medicine_id ? { ...i, qty: Math.max(1, Math.min(item.stock, parseInt(e.target.value) || 1)) } : i))}
                            className="w-12 text-center text-sm font-mono border border-border rounded py-1 bg-input-background focus:outline-none focus:ring-1 focus:ring-ring/30"
                          />
                          <button onClick={() => updateQty(item.medicine_id, 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground text-sm">+</button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-sm text-foreground">₹{item.price.toFixed(2)}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={e => setCart(c => c.map(i => i.medicine_id === item.medicine_id ? { ...i, discount: parseFloat(e.target.value) || 0 } : i))}
                          className="w-14 text-center text-sm font-mono border border-border rounded py-1 bg-input-background focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-sm font-mono text-muted-foreground">{item.tax}%</td>
                      <td className="px-3 py-2.5 font-mono text-sm font-semibold text-foreground">₹{lineTotal.toFixed(2)}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeItem(item.medicine_id)} className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600 transition-colors"><X size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right — Bill Summary */}
      <div className="w-80 bg-card border-l border-border flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold text-foreground">Bill Summary</div>
          <div className="text-xs text-muted-foreground font-mono">New Sale · {new Date().toLocaleDateString()}</div>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-amber-600"><span>Discount</span><span className="font-mono">−₹{discountAmt.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax (GST)</span><span className="font-mono">+₹{taxAmt.toFixed(2)}</span></div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="font-mono text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-2.5 bg-muted/40 rounded-md text-xs text-muted-foreground flex justify-between">
            <span>{cart.length} items · {cart.reduce((s, i) => s + i.qty, 0)} units</span>
            <span className="font-mono">{customerId ? customers.find(c => String(c.id) === customerId)?.name : "Walk-in"}</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-foreground">Payment</div>
              {splitPayments.length > 1 && <span className="text-xs text-primary">Split Payment</span>}
            </div>
            <div className="space-y-2">
              {splitPayments.map((p, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <select
                    value={p.method}
                    onChange={e => updateSplitPayment(idx, "method", e.target.value)}
                    className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-input-background text-foreground focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI / QR</option>
                    <option value="Credit">Credit</option>
                  </select>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={p.amount}
                    onChange={e => updateSplitPayment(idx, "amount", e.target.value)}
                    className="w-24 text-xs font-mono border border-border rounded-md px-2 py-1.5 bg-input-background focus:outline-none"
                  />
                  {splitPayments.length > 1 && (
                    <button onClick={() => removeSplitRow(idx)} className="p-1 text-muted-foreground hover:text-red-600"><X size={12} /></button>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between">
                <button onClick={addSplitRow} className="text-xs text-primary hover:underline">+ Add split payment</button>
                <button onClick={() => setSplitPayments(p => [{ ...p[0], amount: total.toFixed(2) }])} className="text-xs text-muted-foreground hover:underline">Fill exact</button>
              </div>
            </div>
            <div className="flex justify-between text-xs mt-2 pt-2 border-t border-border">
              <span className="text-muted-foreground">Entered</span>
              <span className={`font-mono ${amountEntered + 0.01 < total ? "text-red-600" : "text-emerald-600"}`}>₹{amountEntered.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <Btn variant="primary" className="w-full justify-center" disabled={cart.length === 0 || processing} onClick={charge}>
            <CheckCircle2 size={15} />Charge ₹{total.toFixed(2)}
          </Btn>
        </div>
      </div>

      <Modal open={holdModal} onClose={() => setHoldModal(false)} title="Hold Current Sale">
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">This sale will be held and you can resume it later. Give it a reference name.</p>
          <input
            value={holdReference}
            onChange={e => setHoldReference(e.target.value)}
            placeholder="e.g. Customer: Suresh Nair"
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setHoldModal(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={processing} onClick={holdSale}>Hold Sale</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={resumeModal} onClose={() => setResumeModal(false)} title="Resume Held Sale">
        <div className="p-2">
          {heldSales.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No held sales</div>
          ) : (
            <div className="divide-y divide-border">
              {heldSales.map(sale => (
                <button key={sale.id} onClick={() => resumeSale(sale)} className="w-full text-left px-3 py-3 hover:bg-muted/40 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{sale.hold_reference || sale.invoice_number}</div>
                    <div className="text-xs text-muted-foreground">{sale.items?.length ?? 0} items · ₹{Number(sale.total).toFixed(2)}</div>
                  </div>
                  <PlayCircle size={16} className="text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={prescriptionModal} onClose={() => setPrescriptionModal(false)} title="Link Prescription">
        <div className="p-2">
          {pendingPrescriptions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No pending prescriptions</div>
          ) : (
            <div className="divide-y divide-border">
              {pendingPrescriptions.map(rx => (
                <button key={rx.id} onClick={() => attachPrescription(rx)} className="w-full text-left px-3 py-3 hover:bg-muted/40 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{rx.rx_number} · {rx.patient_name}</div>
                    <div className="text-xs text-muted-foreground">{rx.items?.length ?? 0} medicines · {rx.prescribed_date}</div>
                  </div>
                  <FileText size={16} className="text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
