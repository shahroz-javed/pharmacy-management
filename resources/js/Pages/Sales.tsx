import { useState } from "react";
import { Link } from "@inertiajs/react";
import {
  Download, Plus, Activity, TrendingUp, RefreshCw, DollarSign,
  Eye, Printer, ChevronLeft, ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { Card } from "@/Components/ui/Card";
import { PageHeader } from "@/Components/ui/PageHeader";
import { StatCard } from "@/Components/ui/StatCard";
import { SearchInput } from "@/Components/ui/SearchInput";
import { Toolbar } from "@/Components/ui/Toolbar";
import { TableHeader } from "@/Components/ui/TableHeader";
import { Badge } from "@/Components/ui/Badge";
import { Modal } from "@/Components/ui/Modal";
import { recentSales } from "@/mockData";

export default function Sales() {
  const [returnModal, setReturnModal] = useState(false);

  return (
    <AppLayout notifCount={3}>
      <div className="p-5">
        <PageHeader
          title="Sales History"
          subtitle="View all transactions and returns"
          actions={
            <>
              <Btn variant="outline" size="sm"><Download size={13} />Export</Btn>
              <Link href="/pos">
                <Btn variant="primary" size="sm"><Plus size={13} />New Sale</Btn>
              </Link>
            </>
          }
        />
        <div className="grid grid-cols-4 gap-3 mb-5">
          <StatCard label="Today" value="₹18,240" sub="124 sales" icon={<Activity size={16} className="text-blue-600" />} color="bg-blue-50 dark:bg-blue-950/20" />
          <StatCard label="This Week" value="₹1,04,600" sub="724 sales" icon={<TrendingUp size={16} className="text-emerald-600" />} color="bg-emerald-50 dark:bg-emerald-950/20" />
          <StatCard label="Returns" value="₹2,140" sub="8 returns" icon={<RefreshCw size={16} className="text-amber-600" />} color="bg-amber-50 dark:bg-amber-950/20" />
          <StatCard label="Net Sales" value="₹1,02,460" icon={<DollarSign size={16} className="text-violet-600" />} color="bg-violet-50 dark:bg-violet-950/20" />
        </div>
        <Toolbar>
          <SearchInput placeholder="Search invoice, customer…" value="" onChange={() => {}} />
          <input type="date" className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none" />
          <select className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none"><option>All Status</option><option>Paid</option><option>Pending</option><option>Cancelled</option></select>
          <select className="px-3 py-2 text-sm border border-border rounded-md bg-card text-foreground focus:outline-none"><option>All Methods</option><option>Cash</option><option>Card</option><option>UPI</option><option>Credit</option></select>
        </Toolbar>
        <Card>
          <table className="w-full">
            <TableHeader cols={["Invoice", "Customer", "Date & Time", "Items", "Subtotal", "Tax", "Total", "Payment", "Status", ""]} />
            <tbody>
              {recentSales.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-2.5 text-xs font-mono text-primary">
                    <Link href={`/sales/${s.id}`} className="hover:underline">{s.id}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-foreground">{s.customer}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">2025-07-02 · {s.time}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.items}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">₹{(s.total * 0.88).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">₹{(s.total * 0.12).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-sm font-mono font-semibold text-foreground">₹{s.total.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.payment}</td>
                  <td className="px-4 py-2.5"><Badge status={s.status} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/sales/${s.id}`} className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Eye size={13} /></Link>
                      <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"><Printer size={13} /></button>
                      <button onClick={() => setReturnModal(true)} className="p-1.5 hover:bg-amber-50 rounded text-muted-foreground hover:text-amber-600"><RefreshCw size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Showing 1–5 of 89</span>
            <div className="flex gap-1">
              <button className="px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted"><ChevronLeft size={12} /></button>
              <button className="px-2.5 py-1.5 text-xs border border-border rounded bg-primary text-primary-foreground">1</button>
              <button className="px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted">2</button>
              <button className="px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted">3</button>
              <button className="px-2.5 py-1.5 text-xs border border-border rounded hover:bg-muted"><ChevronRight size={12} /></button>
            </div>
          </div>
        </Card>

        <Modal open={returnModal} onClose={() => setReturnModal(false)} title="Process Return / Refund" width="max-w-xl">
          <div className="p-5 space-y-4">
            <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">Invoice: <span className="font-mono font-medium text-foreground">INV-2407-088</span> · ₹628.00 · Meena Joshi</div>
            <div><label className="text-xs font-medium text-foreground block mb-2">Select Items to Return</label>
              {[{ name: "Paracetamol 650mg", qty: 2, price: 28 }, { name: "Vitamin D3 1000IU", qty: 1, price: 195 }].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-foreground flex-1">{item.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">Qty: {item.qty}</span>
                  <span className="text-xs font-mono font-medium">₹{(item.qty * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div><label className="text-xs font-medium text-foreground block mb-1.5">Refund Method</label>
              <select className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background focus:outline-none"><option>Original Payment Method</option><option>Cash</option><option>Store Credit</option></select>
            </div>
            <div><label className="text-xs font-medium text-foreground block mb-1.5">Reason</label>
              <textarea rows={2} placeholder="Return reason…" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-input-background resize-none focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="outline" onClick={() => setReturnModal(false)}>Cancel</Btn>
              <Btn variant="danger" onClick={() => setReturnModal(false)}><RefreshCw size={13} />Process Return</Btn>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
