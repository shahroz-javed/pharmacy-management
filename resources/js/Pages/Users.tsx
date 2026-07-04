import { Plus, Edit2, Trash2 } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";

const users = [
  { id: 1, name: "Admin User", email: "admin@pharmapro.in", role: "Owner", status: "Active", lastLogin: "2025-07-02 14:32" },
  { id: 2, name: "Suresh Cashier", email: "suresh@pharmapro.in", role: "Cashier", status: "Active", lastLogin: "2025-07-02 09:14" },
  { id: 3, name: "Ravi Pharmacist", email: "ravi@pharmapro.in", role: "Pharmacist", status: "Active", lastLogin: "2025-07-01 18:45" },
  { id: 4, name: "Priya Inventory", email: "priya@pharmapro.in", role: "Inventory Staff", status: "Inactive", lastLogin: "2025-06-28 11:20" },
];

const roleColors: Record<string, string> = {
  Owner: "bg-violet-50 text-violet-700 border-violet-200",
  Manager: "bg-blue-50 text-blue-700 border-blue-200",
  Cashier: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pharmacist: "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Inventory Staff": "bg-amber-50 text-amber-700 border-amber-200",
};

export default function Users() {
  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Users & Roles"
          subtitle="Manage staff access and permissions"
          actions={<Btn variant="primary" size="sm"><Plus size={13} />Invite User</Btn>}
        />
        <div className="grid grid-cols-5 gap-3 mb-5">
          {["Owner", "Manager", "Cashier", "Pharmacist", "Inventory Staff"].map(role => (
            <Card key={role} className="p-3 text-center">
              <div className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border mb-1 ${roleColors[role]}`}>{role}</div>
              <div className="text-xs text-muted-foreground">{users.filter(u => u.role === role).length} user(s)</div>
            </Card>
          ))}
        </div>
        <Card>
          <table className="w-full">
            <TableHeader cols={["User", "Email", "Role", "Status", "Last Login", ""]} />
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">{u.name.charAt(0)}</div>
                      <span className="text-sm font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded border font-medium ${roleColors[u.role]}`}>{u.role}</span></td>
                  <td className="px-4 py-2.5"><Badge status={u.status} /></td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{u.lastLogin}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                      <button className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-600"><Trash2 size={13} /></button>
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
