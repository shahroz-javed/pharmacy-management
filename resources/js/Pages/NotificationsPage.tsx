import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { PageHeader } from "@/Components/ui/PageHeader";

const notificationsSeed = [
  { id: 1, type: "warning", title: "Low Stock Alert", message: "Paracetamol 650mg - only 12 strips remaining", time: "2 min ago", read: false },
  { id: 2, type: "danger", title: "Out of Stock", message: "Cetirizine 10mg is completely out of stock", time: "15 min ago", read: false },
  { id: 3, type: "warning", title: "Expiring Soon", message: "Omeprazole 20mg batch BT2405 expires in 4 months", time: "1 hr ago", read: false },
  { id: 4, type: "info", title: "Purchase Received", message: "PO-2407-021 from MediCorp Pharma has been received", time: "3 hrs ago", read: true },
  { id: 5, type: "info", title: "New Customer", message: "Meena Joshi registered as a new customer", time: "5 hrs ago", read: true },
];

const iconMap = {
  warning: <AlertTriangle size={15} className="text-amber-500" />,
  danger: <AlertCircle size={15} className="text-red-500" />,
  info: <Info size={15} className="text-blue-500" />,
  success: <CheckCircle2 size={15} className="text-emerald-500" />,
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(notificationsSeed);

  return (
    <AppLayout notifCount={notifs.filter(n => !n.read).length}>
      <div className="p-5 max-w-3xl">
        <PageHeader
          title="Notifications"
          subtitle={`${notifs.filter(n => !n.read).length} unread`}
          actions={<Btn variant="ghost" size="sm" onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))}>Mark all as read</Btn>}
        />
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id} onClick={() => setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x))}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${n.read ? "bg-card border-border" : "bg-primary/3 border-primary/20"} hover:border-primary/30`}>
              <div className="mt-0.5 shrink-0">{iconMap[n.type as keyof typeof iconMap]}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{n.title}</span>
                  <span className="text-xs text-muted-foreground font-mono">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
