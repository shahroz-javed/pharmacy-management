import { Link } from "@inertiajs/react";
import { ChevronLeft, Edit2, Printer } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { Badge } from "@/Components/ui/Badge";
import { medicines } from "@/mockData";

export default function MedicineDetail({ id }: { id: number }) {
  const m = medicines.find(med => med.id === Number(id)) ?? medicines[0];

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/medicines" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{m.name}</h1>
          <Badge status={m.status} />
          <div className="ml-auto flex gap-2">
            <Link href={`/medicines/${m.id}/edit`}><Btn variant="outline" size="sm"><Edit2 size={13} />Edit</Btn></Link>
            <Btn variant="outline" size="sm"><Printer size={13} />Print Label</Btn>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[["Generic Name", m.generic], ["Brand Name", m.brand], ["Category", m.category], ["Manufacturer", m.manufacturer], ["Strength", m.strength], ["Dosage Form", m.form], ["Unit", m.unit], ["SKU", m.sku]].map(([l, v]) => (
                  <div key={l}><span className="text-xs text-muted-foreground block mb-0.5">{l}</span><span className="font-medium text-foreground font-mono">{v}</span></div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pricing</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-xs text-muted-foreground block mb-0.5">Purchase Price</span><span className="font-mono font-semibold text-foreground">₹{m.purchase.toFixed(2)}</span></div>
                <div><span className="text-xs text-muted-foreground block mb-0.5">Selling Price</span><span className="font-mono font-semibold text-primary">₹{m.selling.toFixed(2)}</span></div>
                <div><span className="text-xs text-muted-foreground block mb-0.5">Margin</span><span className="font-mono font-semibold text-emerald-600">{(((m.selling - m.purchase) / m.purchase) * 100).toFixed(1)}%</span></div>
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Stock</h3>
              <div className="text-3xl font-mono font-bold text-foreground mb-1">{m.stock}</div>
              <div className="text-xs text-muted-foreground mb-3">units in stock</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (m.stock / (m.reorder * 10)) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>0</span><span>Reorder: {m.reorder}</span></div>
            </Card>
            <Card className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Batch Info</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-xs text-muted-foreground block">Batch No.</span><span className="font-mono font-medium">{m.batch}</span></div>
                <div><span className="text-xs text-muted-foreground block">Expiry</span><span className="font-mono font-medium">{m.expiry}</span></div>
                <div><span className="text-xs text-muted-foreground block">Tax (GST)</span><span className="font-mono font-medium">{m.tax}%</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
