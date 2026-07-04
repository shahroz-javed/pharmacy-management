import { Link } from "@inertiajs/react";
import { ChevronLeft, Printer, Download } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { medicines } from "@/mockData";

export default function PurchaseDetail({ id }: { id: string }) {
  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/purchases" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{id}</h1>
          <Badge status="Received" />
          <div className="ml-auto flex gap-2">
            <Btn variant="outline" size="sm"><Printer size={13} />Print</Btn>
            <Btn variant="outline" size="sm"><Download size={13} />Download</Btn>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[["Supplier", "MediCorp Pharma"], ["PO Date", "2025-07-01"], ["Received Date", "2025-07-02"], ["Invoice No.", "MC-INV-4821"], ["Payment Status", "Pending"], ["Amount", "₹48,500"]].map(([l, v]) => (
            <div key={l} className="bg-card border border-border rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-0.5">{l}</div>
              <div className="text-sm font-medium text-foreground font-mono">{v}</div>
            </div>
          ))}
        </div>
        <Card>
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Purchase Items</div>
          <table className="w-full">
            <TableHeader cols={["Medicine", "Batch", "Expiry", "Qty", "Unit Price", "Tax", "Total"]} />
            <tbody>
              {medicines.slice(0, 4).map(m => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-sm text-foreground">{m.name}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{m.batch}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{m.expiry}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">30</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">₹{m.purchase.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{m.tax}%</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{(m.purchase * 30 * (1 + m.tax / 100)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}
