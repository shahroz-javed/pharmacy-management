import { Link } from "@inertiajs/react";
import { Plus, Building2, Phone, Mail, MapPin } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { Toolbar } from "@/Components/ui/Toolbar";
import { SearchInput } from "@/Components/ui/SearchInput";
import { suppliers } from "@/mockData";

export default function Suppliers() {
  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Suppliers"
          subtitle={`${suppliers.length} suppliers`}
          actions={<Btn variant="primary" size="sm"><Plus size={13} />Add Supplier</Btn>}
        />
        <Toolbar>
          <SearchInput placeholder="Search suppliers…" value="" onChange={() => {}} />
          <div className="ml-auto text-xs text-muted-foreground">{suppliers.length} suppliers</div>
        </Toolbar>
        <div className="grid grid-cols-3 gap-3">
          {suppliers.map(s => (
            <Link key={s.id} href={`/suppliers/${s.id}`} className="block">
              <Card className="p-4 cursor-pointer hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                    <Building2 size={18} className="text-violet-600" />
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${s.balance > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                    {s.balance > 0 ? `Due: ₹${s.balance.toLocaleString()}` : "Paid Up"}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.contact}</div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={11} />{s.phone}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail size={11} />{s.email}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={11} />{s.city}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs">
                  <span className="text-muted-foreground">Orders: <span className="font-mono font-medium text-foreground">{s.orders}</span></span>
                  <span className="text-muted-foreground">Last: <span className="font-mono text-foreground">{s.lastOrder}</span></span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
