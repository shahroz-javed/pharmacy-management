import { Link } from "@inertiajs/react";
import { ChevronLeft, Edit2, ShoppingCart } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { customers, recentSales } from "@/mockData";

export default function CustomerDetail({ id }: { id: number }) {
  const c = customers.find(cust => cust.id === Number(id)) ?? customers[0];

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/customers" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{c.name}</h1>
          <div className="ml-auto flex gap-2">
            <Btn variant="outline" size="sm"><Edit2 size={13} />Edit</Btn>
            <Link href="/pos">
              <Btn variant="primary" size="sm"><ShoppingCart size={13} />New Sale</Btn>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-4 col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold">{c.name.charAt(0)}</div>
              <div>
                <div className="text-base font-semibold text-foreground">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.email} · {c.phone}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["City", c.city], ["Total Visits", c.visits.toString()], ["Last Visit", c.lastVisit], ["Prescriptions", c.prescriptions.toString()]].map(([l, v]) => (
                <div key={l}><span className="text-xs text-muted-foreground block">{l}</span><span className="font-medium text-foreground">{v}</span></div>
              ))}
            </div>
          </Card>
          <div className="space-y-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-0.5">Loyalty Points</div>
              <div className="text-2xl font-mono font-bold text-amber-600">⭐ {c.loyalty}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-0.5">Credit Balance</div>
              <div className={`text-2xl font-mono font-bold ${c.credit > 0 ? "text-red-600" : "text-emerald-600"}`}>₹{c.credit}</div>
            </Card>
          </div>
        </div>
        <Card>
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Purchase History</div>
          <table className="w-full">
            <TableHeader cols={["Invoice", "Date", "Items", "Total", "Payment", "Status"]} />
            <tbody>
              {recentSales.slice(0, 3).map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-xs font-mono text-primary">{s.id}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">2025-07-02 · {s.time}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.items}</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{s.total.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.payment}</td>
                  <td className="px-4 py-2.5"><Badge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}
