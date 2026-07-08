import { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { ChevronLeft, Save, Plus, X } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Toast } from "@/Components/ui/Toast";
import type { Medicine, Supplier } from "@/types";

interface Props {
  suppliers: Pick<Supplier, "id" | "name">[];
  medicines: Pick<Medicine, "id" | "generic_name" | "brand_name" | "strength" | "sku" | "purchase_price">[];
}

interface ItemRow {
  medicine_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: string;
  unit_price: string;
  tax: string;
}

function emptyItem(defaultPrice = ""): ItemRow {
  return { medicine_id: "", batch_number: "", expiry_date: "", quantity: "1", unit_price: defaultPrice, tax: "12" };
}

export default function AddPurchase({ suppliers, medicines }: Props) {
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data, setData, post, processing, errors } = useForm({
    supplier_id: "",
    order_date: new Date().toISOString().slice(0, 10),
    expected_delivery: "",
    invoice_number: "",
    items: [emptyItem()] as ItemRow[],
  });

  const items = data.items;

  const updateItem = (i: number, patch: Partial<ItemRow>) => {
    setData("items", items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  };

  const addItem = () => setData("items", [...items, emptyItem()]);
  const removeItem = (i: number) => setData("items", items.filter((_, j) => j !== i));

  const lineTotal = (item: ItemRow) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const tax = Number(item.tax) || 0;
    return qty * price * (1 + tax / 100);
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  const taxTotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) * ((Number(it.tax) || 0) / 100), 0);
  const total = subtotal + taxTotal;

  const submit = () => {
    post("/purchases", {
      onSuccess: () => setToast({ msg: "Purchase order created successfully", type: "success" }),
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-5xl">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/purchases" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">New Purchase Order</h1>
          <div className="ml-auto flex gap-2">
            <Link href="/purchases"><Btn variant="outline">Cancel</Btn></Link>
            <Btn variant="primary" disabled={processing} onClick={submit}><Save size={13} />Save Order</Btn>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-4 col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Supplier *</label>
              <select value={data.supplier_id} onChange={e => setData("supplier_id", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none">
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.supplier_id && <p className="text-xs text-red-500 mt-1">{errors.supplier_id}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">PO Date *</label>
              <input type="date" value={data.order_date} onChange={e => setData("order_date", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
              {errors.order_date && <p className="text-xs text-red-500 mt-1">{errors.order_date}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Expected Delivery</label>
              <input type="date" value={data.expected_delivery} onChange={e => setData("expected_delivery", e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Invoice No.</label>
              <input type="text" value={data.invoice_number} onChange={e => setData("invoice_number", e.target.value)} placeholder="Supplier invoice number" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-foreground mb-3">Order Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span className="font-mono">{items.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-mono">₹{taxTotal.toFixed(2)}</span></div>
              <div className="h-px bg-border" />
              <div className="flex justify-between font-semibold"><span>Total</span><span className="font-mono text-primary">₹{total.toFixed(2)}</span></div>
            </div>
          </Card>
        </div>
        <Card>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Purchase Items</span>
            <Btn variant="outline" size="sm" onClick={addItem}><Plus size={13} />Add Item</Btn>
          </div>
          <table className="w-full">
            <TableHeader cols={["Medicine", "Batch No.", "Expiry", "Qty", "Unit Price", "Tax %", "Total", ""]} />
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 w-52">
                    <select
                      value={item.medicine_id}
                      onChange={e => {
                        const med = medicines.find(m => String(m.id) === e.target.value);
                        updateItem(i, { medicine_id: e.target.value, unit_price: med ? med.purchase_price : item.unit_price });
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none"
                    >
                      <option value="">Select medicine</option>
                      {medicines.map(m => <option key={m.id} value={m.id}>{m.brand_name} {m.strength}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5"><input type="text" value={item.batch_number} onChange={e => updateItem(i, { batch_number: e.target.value })} placeholder="BT240X" className="w-24 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none font-mono" /></td>
                  <td className="px-3 py-2.5"><input type="date" value={item.expiry_date} onChange={e => updateItem(i, { expiry_date: e.target.value })} className="w-32 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none" /></td>
                  <td className="px-3 py-2.5"><input type="number" value={item.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} className="w-16 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none font-mono text-center" /></td>
                  <td className="px-3 py-2.5"><input type="number" value={item.unit_price} onChange={e => updateItem(i, { unit_price: e.target.value })} className="w-24 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none font-mono" /></td>
                  <td className="px-3 py-2.5">
                    <select value={item.tax} onChange={e => updateItem(i, { tax: e.target.value })} className="w-16 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none">
                      <option value={0}>0%</option><option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-sm font-mono font-medium text-foreground">₹{lineTotal(item).toFixed(2)}</td>
                  <td className="px-3 py-2.5"><button onClick={() => removeItem(i)} className="p-1 text-muted-foreground hover:text-red-600"><X size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {errors.items && <p className="text-xs text-red-500 px-3 py-2">{errors.items}</p>}
        </Card>
      </div>
    </AppLayout>
  );
}
