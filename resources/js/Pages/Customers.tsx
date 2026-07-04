import { Link } from "@inertiajs/react";
import { Plus, Download, Eye, Edit2 } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { Toolbar } from "@/Components/ui/Toolbar";
import { SearchInput } from "@/Components/ui/SearchInput";
import { TableHeader } from "@/Components/ui/TableHeader";
import { customers } from "@/mockData";

export default function Customers() {
  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Customers"
          subtitle={`${customers.length} registered customers`}
          actions={<Btn variant="primary" size="sm"><Plus size={13} />Add Customer</Btn>}
        />
        <Toolbar>
          <SearchInput placeholder="Search customers…" value="" onChange={() => {}} />
          <Btn variant="outline" size="sm"><Download size={13} />Export</Btn>
        </Toolbar>
        <Card>
          <table className="w-full">
            <TableHeader cols={["Customer", "Phone", "City", "Loyalty Pts", "Credit", "Prescriptions", "Visits", "Last Visit", ""]} />
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2.5">
                    <Link href={`/customers/${c.id}`} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 text-xs font-semibold">{c.name.charAt(0)}</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">{c.phone}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.city}</td>
                  <td className="px-4 py-2.5"><span className="text-sm font-mono font-semibold text-amber-600">⭐ {c.loyalty}</span></td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">{c.credit > 0 ? <span className="text-red-600">₹{c.credit}</span> : "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.prescriptions}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{c.visits}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{c.lastVisit}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/customers/${c.id}`} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye size={13} /></Link>
                      <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
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
