import { useState } from "react";
import { Link } from "@inertiajs/react";
import { ChevronLeft, Save, Plus, X } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { suppliers, medicines } from "@/mockData";

export default function AddPurchase() {
  const [items, setItems] = useState([{ med: "Amoxicillin 500mg", qty: 100, price: 48, tax: 12 }]);

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-5xl">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/purchases" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">New Purchase Order</h1>
          <div className="ml-auto flex gap-2">
            <Link href="/purchases"><Btn variant="outline">Cancel</Btn></Link>
            <Btn variant="primary"><Save size={13} />Save Order</Btn>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-4 col-span-2 grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-foreground block mb-1.5">Supplier *</label>
              <select className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                {suppliers.map(s => <option key={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium text-foreground block mb-1.5">PO Date *</label>
              <input type="date" defaultValue="2025-07-02" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
            </div>
            <div><label className="text-xs font-medium text-foreground block mb-1.5">Expected Delivery</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
            </div>
            <div><label className="text-xs font-medium text-foreground block mb-1.5">Invoice No.</label>
              <input type="text" placeholder="Supplier invoice number" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-foreground mb-3">Order Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span className="font-mono">1</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">₹4,800</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-mono">₹576</span></div>
              <div className="h-px bg-border" />
              <div className="flex justify-between font-semibold"><span>Total</span><span className="font-mono text-primary">₹5,376</span></div>
            </div>
          </Card>
        </div>
        <Card>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Purchase Items</span>
            <Btn variant="outline" size="sm" onClick={() => setItems([...items, { med: "", qty: 1, price: 0, tax: 12 }])}><Plus size={13} />Add Item</Btn>
          </div>
          <table className="w-full">
            <TableHeader cols={["Medicine", "Batch No.", "Expiry", "Qty", "Unit Price", "Tax %", "Total", ""]} />
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 w-52">
                    <select value={item.med} onChange={e => setItems(items.map((it, j) => j === i ? { ...it, med: e.target.value } : it))} className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none">
                      {medicines.map(m => <option key={m.id}>{m.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5"><input type="text" placeholder="BT240X" className="w-24 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none font-mono" /></td>
                  <td className="px-3 py-2.5"><input type="month" className="w-28 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none" /></td>
                  <td className="px-3 py-2.5"><input type="number" value={item.qty} onChange={e => setItems(items.map((it, j) => j === i ? { ...it, qty: parseInt(e.target.value) } : it))} className="w-16 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none font-mono text-center" /></td>
                  <td className="px-3 py-2.5"><input type="number" value={item.price} onChange={e => setItems(items.map((it, j) => j === i ? { ...it, price: parseFloat(e.target.value) } : it))} className="w-24 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none font-mono" /></td>
                  <td className="px-3 py-2.5">
                    <select value={item.tax} onChange={e => setItems(items.map((it, j) => j === i ? { ...it, tax: parseInt(e.target.value) } : it))} className="w-16 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none">
                      <option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-sm font-mono font-medium text-foreground">₹{(item.qty * item.price * (1 + item.tax / 100)).toFixed(2)}</td>
                  <td className="px-3 py-2.5"><button onClick={() => setItems(items.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-red-600"><X size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}
