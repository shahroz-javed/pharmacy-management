import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({ label, value, sub, icon, trend, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; trend?: string; color?: string }) {
  const isPositive = trend && trend.startsWith("+");
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={`p-2 rounded-md ${color || "bg-blue-50 dark:bg-blue-950/30"}`}>{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-foreground font-mono">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend} vs yesterday
        </div>
      )}
    </div>
  );
}
