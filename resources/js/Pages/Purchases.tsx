import { Link } from "@inertiajs/react";
import { Download, Plus, Truck, Clock, Building2, Eye, Printer } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { StatCard } from "@/Components/ui/StatCard";
import { SearchInput } from "@/Components/ui/SearchInput";
import { Toolbar } from "@/Components/ui/Toolbar";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { suppliers } from "@/mockData";

const pos = [
  { id: "PO-2407-021", supplier: "MediCorp Pharma", date: "2025-07-01", items: 12, amount: 48500, status: "Received" },
  { id: "PO-2407-020", supplier: "HealthFirst Distributors", date: "2025-06-28", items: 8, amount: 21400, status: "Partial" },
  { id: "PO-2407-019", supplier: "PharmaLink Wholesale", date: "2025-06-25", items: 20, amount: 64200, status: "Received" },
  { id: "PO-2407-018", supplier: "MediCorp Pharma", date: "2025-06-20", items: 5, amount: 18900, status: "Ordered" },
];

export default function Purchases() {
  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Purchase Management"
          subtitle="Manage purchase orders and supplier invoices"
          actions={
            <>
              <Btn variant="outline" size="sm"><Download size={13} />Export</Btn>
              <Link href="/purchases/add">
                <Btn variant="primary" size="sm"><Plus size={13} />New Purchase Order</Btn>
              </Link>
            </>
          }
        />
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard label="This Month" value="₹1,52,000" sub="4 purchase orders" icon={<Truck size={16} className="text-blue-600" />} color="bg-blue-50 dark:bg-blue-950/20" />
          <StatCard label="Pending Orders" value="2" icon={<Clock size={16} className="text-amber-600" />} color="bg-amber-50 dark:bg-amber-950/20" />
          <StatCard label="Suppliers" value="3" icon={<Building2 size={16} className="text-violet-600" />} color="bg-violet-50 dark:bg-violet-950/20" />
        </div>
        <Toolbar>
          <SearchInput placeholder="Search purchase orders…" value="" onChange={() => {}} />
          <select className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none"><option>All Suppliers</option>{suppliers.map(s => <option key={s.id}>{s.name}</option>)}</select>
          <select className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none"><option>All Status</option><option>Ordered</option><option>Received</option><option>Partial</option></select>
        </Toolbar>
        <Card>
          <table className="w-full">
            <TableHeader cols={["PO Number", "Supplier", "Date", "Items", "Amount", "Status", ""]} />
            <tbody>
              {pos.map(po => (
                <tr key={po.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2.5 text-xs font-mono text-primary">{po.id}</td>
                  <td className="px-4 py-2.5 text-sm text-foreground">{po.supplier}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{po.date}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{po.items} items</td>
                  <td className="px-4 py-2.5 text-sm font-mono font-semibold text-foreground">₹{po.amount.toLocaleString()}</td>
                  <td className="px-4 py-2.5"><Badge status={po.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/purchases/${po.id}`} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye size={13} /></Link>
                      <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Printer size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppLayout>
  );
}
