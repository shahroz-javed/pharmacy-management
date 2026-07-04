import { Link } from "@inertiajs/react";
import { ChevronLeft, Truck, DollarSign } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { suppliers } from "@/mockData";

export default function SupplierDetail({ id }: { id: number }) {
  const s = suppliers.find(sup => sup.id === Number(id)) ?? suppliers[0];

  return (
    <AppLayout notifCount={3}>
      <div className="p-5 max-w-4xl">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/suppliers" className="text-muted-foreground hover:text-foreground"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-semibold text-foreground">{s.name}</h1>
          <div className="ml-auto">
            <Link href="/purchases/add">
              <Btn variant="primary" size="sm"><Truck size={13} />New Purchase Order</Btn>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="p-4 col-span-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[["Contact Person", s.contact], ["Phone", s.phone], ["Email", s.email], ["City", s.city], ["Total Orders", s.orders.toString()], ["Outstanding Balance", `₹${s.balance.toLocaleString()}`]].map(([l, v]) => (
                <div key={l}><span className="text-xs text-muted-foreground block mb-0.5">{l}</span><span className="font-medium text-foreground">{v}</span></div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Balance</div>
            <div className="text-3xl font-mono font-bold text-foreground">₹{s.balance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mb-4">outstanding</div>
            <Btn variant="primary" size="sm" className="w-full justify-center"><DollarSign size={13} />Record Payment</Btn>
          </Card>
        </div>
        <Card>
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">Purchase History</div>
          <table className="w-full">
            <TableHeader cols={["PO Number", "Date", "Items", "Amount", "Status"]} />
            <tbody>
              {[["PO-2407-021", "2025-07-01", 12, 48500, "Received"], ["PO-2406-018", "2025-06-15", 8, 28200, "Received"]].map(([poId, date, items, amt, status]) => (
                <tr key={poId as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-xs font-mono text-primary">{poId as string}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{date as string}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{items as number}</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold text-foreground">₹{(amt as number).toLocaleString()}</td>
                  <td className="px-4 py-2.5"><Badge status={status as string} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}
