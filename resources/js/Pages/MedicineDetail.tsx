import { Link } from "@inertiajs/react";
import { ChevronLeft, Edit2, Printer } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import type { Medicine } from "@/types";

export default function MedicineDetail({ medicine: m }: { medicine: Medicine }) {
  const purchase = Number(m.purchase_price);
  const selling = Number(m.selling_price);
  const margin = purchase > 0 ? (((selling - purchase) / purchase) * 100).toFixed(1) : "0.0";

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl print:hidden">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/medicines" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{m.name}</h1>
          <Badge status={m.status} />
          <div className="ml-auto flex gap-2">
            <Link href={`/medicines/${m.id}/edit`}><Btn variant="outline" size="sm"><Edit2 size={13} />Edit</Btn></Link>
            <Btn variant="outline" size="sm" onClick={() => window.print()}><Printer size={13} />Print Label</Btn>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            {m.image_path && (
              <Card className="p-4 flex justify-center">
                <img src={`/storage/${m.image_path}`} alt={m.name} className="w-32 h-32 object-cover rounded-lg" />
              </Card>
            )}
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ["Generic Name", m.generic_name], ["Brand Name", m.brand_name], ["Category", m.category],
                  ["Manufacturer", m.manufacturer], ["Strength", m.strength], ["Dosage Form", m.dosage_form],
                  ["Unit", m.unit], ["SKU", m.sku],
                ].map(([l, v]) => (
                  <div key={l}><span className="text-xs text-muted-foreground block mb-0.5">{l}</span><span className="font-medium text-foreground font-mono">{v || "—"}</span></div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pricing</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-xs text-muted-foreground block mb-0.5">Purchase Price</span><span className="font-mono font-semibold text-foreground">₹{purchase.toFixed(2)}</span></div>
                <div><span className="text-xs text-muted-foreground block mb-0.5">Selling Price</span><span className="font-mono font-semibold text-primary">₹{selling.toFixed(2)}</span></div>
                <div><span className="text-xs text-muted-foreground block mb-0.5">Margin</span><span className="font-mono font-semibold text-emerald-600">{margin}%</span></div>
                {m.mrp && <div><span className="text-xs text-muted-foreground block mb-0.5">MRP</span><span className="font-mono font-semibold text-foreground">₹{Number(m.mrp).toFixed(2)}</span></div>}
                {m.wholesale_price && <div><span className="text-xs text-muted-foreground block mb-0.5">Wholesale Price</span><span className="font-mono font-semibold text-foreground">₹{Number(m.wholesale_price).toFixed(2)}</span></div>}
                <div><span className="text-xs text-muted-foreground block mb-0.5">Discount</span><span className="font-mono font-semibold text-foreground">{Number(m.discount).toFixed(1)}%</span></div>
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Stock</h3>
              <div className="text-3xl font-mono font-bold text-foreground mb-1">{m.stock}</div>
              <div className="text-xs text-muted-foreground mb-3">units in stock</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (m.stock / (Math.max(m.reorder_level, 1) * 10)) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>0</span><span>Reorder: {m.reorder_level}</span></div>
            </Card>
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Batch Info</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-xs text-muted-foreground block">Batch No.</span><span className="font-mono font-medium">{m.batch_number}</span></div>
                <div><span className="text-xs text-muted-foreground block">Expiry</span><span className="font-mono font-medium">{m.expiry_date}</span></div>
                <div><span className="text-xs text-muted-foreground block">Tax (GST)</span><span className="font-mono font-medium">{m.tax}%</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Printable label — only rendered visually when printing */}
      <div className="hidden print:block p-6">
        <div className="border-2 border-black rounded-md p-4 w-80 font-mono">
          <div className="text-base font-bold mb-1">{m.name}</div>
          <div className="text-xs mb-2">{m.generic_name}</div>
          <div className="text-xs space-y-0.5">
            <div>SKU: {m.sku}</div>
            <div>Batch: {m.batch_number}</div>
            <div>Expiry: {m.expiry_date}</div>
            {m.manufacturer && <div>Mfr: {m.manufacturer}</div>}
          </div>
          <div className="text-lg font-bold mt-2">₹{selling.toFixed(2)}</div>
        </div>
      </div>
    </AppLayout>
  );
}
