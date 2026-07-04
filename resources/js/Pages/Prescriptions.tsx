import { Plus, Eye, ZoomIn } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { Toolbar } from "@/Components/ui/Toolbar";
import { SearchInput } from "@/Components/ui/SearchInput";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";

const prescriptions = [
  { id: "RX-001", patient: "Meena Joshi", doctor: "Dr. Ramesh Pillai", date: "2025-07-01", medicines: 3, status: "Dispensed" },
  { id: "RX-002", patient: "Suresh Nair", doctor: "Dr. Anita Sharma", date: "2025-07-02", medicines: 2, status: "Pending" },
  { id: "RX-003", patient: "Walk-in", doctor: "Dr. Rajiv Mehta", date: "2025-06-30", medicines: 4, status: "Dispensed" },
];

export default function Prescriptions() {
  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Prescriptions"
          subtitle="Manage and track all prescriptions"
          actions={<Btn variant="primary" size="sm"><Plus size={13} />Upload Prescription</Btn>}
        />
        <Toolbar>
          <SearchInput placeholder="Search by patient, doctor, RX ID…" value="" onChange={() => {}} />
          <select className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none"><option>All Status</option><option>Pending</option><option>Dispensed</option></select>
        </Toolbar>
        <Card>
          <table className="w-full">
            <TableHeader cols={["RX ID", "Patient", "Doctor", "Date", "Medicines", "Status", ""]} />
            <tbody>
              {prescriptions.map(rx => (
                <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2.5 text-xs font-mono text-primary">{rx.id}</td>
                  <td className="px-4 py-2.5 text-sm text-foreground">{rx.patient}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{rx.doctor}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{rx.date}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{rx.medicines} items</td>
                  <td className="px-4 py-2.5"><Badge status={rx.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye size={13} /></button>
                      <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><ZoomIn size={13} /></button>
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
