import { Link, router } from "@inertiajs/react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Btn } from "@/Components/ui/Btn";
import { PageHeader } from "@/Components/ui/PageHeader";
import type { Notification } from "@/types";

interface Props {
  notifications: Notification[];
}

const iconMap = {
  warning: <AlertTriangle size={15} className="text-amber-500" />,
  danger: <AlertCircle size={15} className="text-red-500" />,
  info: <Info size={15} className="text-blue-500" />,
  success: <CheckCircle2 size={15} className="text-emerald-500" />,
};

export default function NotificationsPage({ notifications }: Props) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (n: Notification) => {
    if (!n.read) {
      router.post(`/notifications/${n.id}/read`, {}, { preserveScroll: true });
    }
  };

  return (
    <AppLayout>
      <div className="p-5 max-w-3xl">
        <PageHeader
          title="Notifications"
          subtitle={`${unreadCount} unread`}
          actions={
            <Btn
              variant="ghost"
              size="sm"
              disabled={unreadCount === 0}
              onClick={() => router.post("/notifications/read-all", {}, { preserveScroll: true })}
            >
              Mark all as read
            </Btn>
          }
        />
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground">You're all caught up — no notifications right now.</div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Link
                key={n.id}
                href={n.link}
                onClick={() => markRead(n)}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${n.read ? "bg-card border-border" : "bg-primary/3 border-primary/20"} hover:border-primary/30`}
              >
                <div className="mt-0.5 shrink-0">{iconMap[n.type]}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{n.title}</span>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(n.time).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
