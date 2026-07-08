import { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { ChevronLeft, Printer, PackageCheck, Check } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { Modal } from "@/Components/ui/Modal";
import { Toast } from "@/Components/ui/Toast";
import type { PurchaseOrder } from "@/types";

export default function PurchaseDetail({ order }: { order: PurchaseOrder }) {
  const [receiveModal, setReceiveModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const items = order.items ?? [];
  const fullyReceived = order.status === "Received";

  const { data, setData, post, processing, errors } = useForm({
    items: items.map(item => ({
      item_id: item.id,
      quantity: String(item.quantity - item.quantity_received),
    })),
  });

  const submitReceive = () => {
    post(`/purchases/${order.id}/receive`, {
      preserveScroll: true,
      onSuccess: () => { setReceiveModal(false); setToast({ msg: "Purchase received successfully", type: "success" }); },
      onError: () => setToast({ msg: "Please fix the errors and try again", type: "error" }),
    });
  };

  const setQuantity = (itemId: number, value: string) => {
    setData("items", data.items.map(it => (it.item_id === itemId ? { ...it, quantity: value } : it)));
  };

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex items-center gap-2 mb-5">
          <Link href="/purchases" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{order.po_number}</h1>
          <Badge status={order.status} />
          <div className="ml-auto flex gap-2">
            {!fullyReceived && (
              <Btn variant="primary" size="sm" onClick={() => setReceiveModal(true)}><PackageCheck size={13} />Receive Purchase</Btn>
            )}
            <Btn variant="outline" size="sm" onClick={() => window.print()}><Printer size={13} />Print</Btn>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            ["Supplier", order.supplier.name],
            ["PO Date", order.order_date],
            ["Expected Delivery", order.expected_delivery ?? "—"],
            ["Invoice No.", order.invoice_number ?? "—"],
            ["Status", order.status],
            ["Amount", `₹${Number(order.total).toLocaleString()}`],
          ].map(([l, v]) => (
            <div key={l} className="bg-card border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-0.5">{l}</div>
              <div className="text-sm font-medium text-foreground font-mono">{v}</div>
            </div>
          ))}
        </div>
        <Card>
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Purchase Items</div>
          <table className="w-full">
            <TableHeader cols={["Medicine", "Batch", "Expiry", "Qty", "Received", "Unit Price", "Tax", "Total"]} />
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-sm text-foreground">{item.medicine.brand_name} {item.medicine.strength}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{item.batch_number}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{item.expiry_date}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">{item.quantity_received} / {item.quantity}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">₹{Number(item.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{item.tax}%</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Modal open={receiveModal} onClose={() => setReceiveModal(false)} title="Receive Purchase" width="max-w-2xl">
          <div className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">Enter the quantity actually received for each item. Partial receipts are supported — leave the rest for a later delivery.</p>
            <table className="w-full">
              <TableHeader cols={["Medicine", "Ordered", "Already Received", "Receive Now"]} />
              <tbody>
                {items.map(item => {
                  const remaining = item.quantity - item.quantity_received;
                  const row = data.items.find(it => it.item_id === item.id);
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 text-sm text-foreground">{item.medicine.brand_name} {item.medicine.strength}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{item.quantity_received}</td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={row?.quantity ?? "0"}
                          onChange={e => setQuantity(item.id, e.target.value)}
                          disabled={remaining <= 0}
                          className="w-20 px-2 py-1.5 text-sm border border-border rounded bg-input-background focus:outline-none font-mono text-center disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {errors.items && <p className="text-xs text-red-500">{errors.items}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="outline" onClick={() => setReceiveModal(false)}>Cancel</Btn>
              <Btn variant="primary" disabled={processing} onClick={submitReceive}><Check size={13} />Confirm Receive</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
