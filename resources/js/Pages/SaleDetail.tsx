import { Link } from "@inertiajs/react";
import { ChevronLeft, Printer, Mail } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { posCartSeed } from "@/mockData";

export default function SaleDetail({ id }: { id: string }) {
  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-3xl">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/sales" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{id}</h1>
          <Badge status="Paid" />
          <div className="ml-auto flex gap-2">
            <Btn variant="outline" size="sm"><Printer size={13} />Print</Btn>
            <Btn variant="outline" size="sm"><Mail size={13} />Email</Btn>
          </div>
        </div>
        <Card className="p-5">
          <div className="flex justify-between mb-5">
            <div>
              <div className="text-sm font-semibold text-foreground">PharmaPro Medical Store</div>
              <div className="text-xs text-muted-foreground">123, MG Road, Mumbai</div>
              <div className="text-xs text-muted-foreground">GST: 27AABCU9603R1ZX</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Invoice No.</div>
              <div className="text-sm font-mono font-bold text-foreground">{id}</div>
              <div className="text-xs text-muted-foreground mt-1">2025-07-02 · 13:58</div>
            </div>
          </div>
          <div className="flex justify-between mb-5 p-3 bg-muted/40 rounded-md text-sm">
            <div><span className="text-xs text-muted-foreground block">Customer</span>Meena Joshi</div>
            <div><span className="text-xs text-muted-foreground block">Phone</span>+91 88776 65544</div>
            <div><span className="text-xs text-muted-foreground block">Loyalty Pts</span>920 pts</div>
          </div>
          <table className="w-full mb-4">
            <TableHeader cols={["Medicine", "Qty", "Unit Price", "Tax", "Total"]} />
            <tbody>
              {posCartSeed.map(item => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 text-sm text-foreground">{item.name}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">{item.qty}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">₹{item.price.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{item.tax}%</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{(item.qty * item.price * (1 + item.tax / 100) * (1 - item.discount / 100)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1.5 text-sm border-t border-border pt-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">₹367.00</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax (GST)</span><span className="font-mono">₹34.98</span></div>
            <div className="flex justify-between font-semibold text-base border-t border-border pt-2 mt-2">
              <span>Total Paid</span><span className="font-mono text-primary">₹401.98</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>Payment Method</span><span>Card</span></div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
