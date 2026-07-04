import { useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import {
  Scan, ShoppingCart, Clock, BookOpen, Trash2, X, ArrowLeft,
  Banknote, CreditCard, Smartphone, Star, CheckCircle2, Printer, Mail,
} from "lucide-react";
import { Btn } from "@/Components/ui/Btn";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import { medicines, customers, posCartSeed } from "@/mockData";

export default function POS() {
  const [cart, setCart] = useState(posCartSeed);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("Walk-in");
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "upi" | "credit">("cash");
  const [payModal, setPayModal] = useState(false);
  const [holdModal, setHoldModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const discountAmt = cart.reduce((s, i) => s + (i.qty * i.price * i.discount / 100), 0);
  const taxAmt = cart.reduce((s, i) => s + ((i.qty * i.price - i.qty * i.price * i.discount / 100) * i.tax / 100), 0);
  const total = subtotal - discountAmt + taxAmt;

  const updateQty = (id: number, delta: number) => {
    setCart(c => c.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };
  const removeItem = (id: number) => setCart(c => c.filter(i => i.id !== id));

  const categories = ["All", "Antibiotics", "Analgesics", "Vitamins", "Antacids", "Antidiabetic"];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Left — Search + Categories */}
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
        <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1">
          {categories.map(c => (
            <button key={c} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">{c}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) && m.stock > 0).map(m => (
            <button
              key={m.id}
              onClick={() => {
                const exists = cart.find(c => c.id === m.id);
                if (exists) {
                  setCart(c => c.map(i => i.id === m.id ? { ...i, qty: i.qty + 1 } : i));
                } else {
                  setCart(c => [...c, { id: m.id, name: m.name, sku: m.sku, qty: 1, price: m.selling, discount: 0, tax: m.tax }]);
                }
              }}
              className="w-full text-left px-2.5 py-2 rounded-md hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
            >
              <div className="text-xs font-medium text-foreground leading-tight">{m.name}</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">{m.sku}</span>
                <span className="text-xs font-mono font-semibold text-foreground">₹{m.selling}</span>
              </div>
              <div className="text-xs text-muted-foreground">Stock: {m.stock}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Center — Cart */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Cart header */}
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <select
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              className="text-sm border border-border rounded-md px-3 py-1.5 bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option>Walk-in</option>
              {customers.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
            <button className="text-xs text-primary hover:underline">+ New Customer</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHoldModal(true)} className="px-2.5 py-1.5 text-xs border border-border rounded-md hover:bg-muted text-muted-foreground flex items-center gap-1.5">
              <Clock size={12} />Hold Sale
            </button>
            <button className="px-2.5 py-1.5 text-xs border border-border rounded-md hover:bg-muted text-muted-foreground flex items-center gap-1.5">
              <BookOpen size={12} />Prescription
            </button>
            <button onClick={() => setCart([])} className="px-2.5 py-1.5 text-xs border border-red-200 rounded-md hover:bg-red-50 text-red-600 flex items-center gap-1.5">
              <Trash2 size={12} />Clear
            </button>
          </div>
        </div>

        {/* Cart items */}
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
                    <tr key={item.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="text-sm font-medium text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{item.sku}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground text-sm">−</button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={e => setCart(c => c.map(i => i.id === item.id ? { ...i, qty: Math.max(1, parseInt(e.target.value) || 1) } : i))}
                            className="w-12 text-center text-sm font-mono border border-border rounded py-1 bg-input-background focus:outline-none focus:ring-1 focus:ring-ring/30"
                          />
                          <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted text-foreground text-sm">+</button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-sm text-foreground">₹{item.price.toFixed(2)}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={e => setCart(c => c.map(i => i.id === item.id ? { ...i, discount: parseFloat(e.target.value) || 0 } : i))}
                          className="w-14 text-center text-sm font-mono border border-border rounded py-1 bg-input-background focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-sm font-mono text-muted-foreground">{item.tax}%</td>
                      <td className="px-3 py-2.5 font-mono text-sm font-semibold text-foreground">₹{lineTotal.toFixed(2)}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600 transition-colors"><X size={13} /></button>
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
      <div className="w-72 bg-card border-l border-border flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold text-foreground">Bill Summary</div>
          <div className="text-xs text-muted-foreground font-mono">INV-2407-090 · {new Date().toLocaleDateString()}</div>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {/* Bill lines */}
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

          {/* Items count */}
          <div className="p-2.5 bg-muted/40 rounded-md text-xs text-muted-foreground flex justify-between">
            <span>{cart.length} items · {cart.reduce((s, i) => s + i.qty, 0)} units</span>
            <span className="font-mono">{customer}</span>
          </div>

          {/* Payment Method */}
          <div>
            <div className="text-xs font-medium text-foreground mb-2">Payment Method</div>
            <div className="grid grid-cols-2 gap-1.5">
              {([["cash", "Cash", Banknote], ["card", "Card", CreditCard], ["upi", "UPI / QR", Smartphone], ["credit", "Credit", Star]] as const).map(([method, label, Icon]) => (
                <button
                  key={method}
                  onClick={() => setPayMethod(method as typeof payMethod)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-xs font-medium transition-colors ${payMethod === method ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                >
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>
          </div>

          {payMethod === "cash" && (
            <div>
              <div className="text-xs font-medium text-foreground mb-1.5">Amount Tendered (₹)</div>
              <input type="number" placeholder={total.toFixed(2)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background font-mono focus:outline-none focus:ring-2 focus:ring-ring/20" />
              <div className="flex justify-between text-xs mt-1.5 text-muted-foreground"><span>Change</span><span className="font-mono text-emerald-600">₹0.00</span></div>
            </div>
          )}
        </div>

        {/* Payment buttons */}
        <div className="p-4 border-t border-border space-y-2">
          <Btn variant="primary" className="w-full justify-center" onClick={() => setPayModal(true)}>
            <CheckCircle2 size={15} />Charge ₹{total.toFixed(2)}
          </Btn>
          <div className="grid grid-cols-2 gap-1.5">
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-md text-xs hover:bg-muted text-muted-foreground transition-colors">
              <Printer size={12} />Print
            </button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border rounded-md text-xs hover:bg-muted text-muted-foreground transition-colors">
              <Mail size={12} />Email
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Complete Payment">
        <div className="p-5 space-y-4">
          <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-2" />
            <div className="text-2xl font-mono font-bold text-emerald-700 dark:text-emerald-300">₹{total.toFixed(2)}</div>
            <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Payment Received · {payMethod.toUpperCase()}</div>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" className="flex-1 justify-center" onClick={() => { setPayModal(false); setReceiptModal(true); }}><Printer size={13} />Print Receipt</Btn>
            <Btn variant="primary" className="flex-1 justify-center" onClick={() => { setPayModal(false); setCart([]); }}>New Sale</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={holdModal} onClose={() => setHoldModal(false)} title="Hold Current Sale">
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">This sale will be held and you can resume it later. Give it a reference name.</p>
          <input placeholder="e.g. Customer: Suresh Nair" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-ring/20" />
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setHoldModal(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => { setHoldModal(false); setToast({ msg: "Sale held successfully", type: "success" }); }}>Hold Sale</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
