import { Link } from "@inertiajs/react";
import { Search, Bell, Moon, Sun, Settings } from "lucide-react";
import type { Theme } from "@/types";

export function TopBar({ theme, onToggleTheme, notifCount }: {
  theme: Theme; onToggleTheme: () => void; notifCount: number;
}) {
  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-5 shrink-0 sticky top-0 z-10 print:hidden">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search medicines, invoices, suppliers… (⌘K)"
          className="pl-8 pr-4 py-1.5 text-xs border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 w-72"
        />
      </div>
      <div className="flex items-center gap-1">
        <Link
          href="/notifications"
          className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell size={15} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center font-mono">
              {notifCount}
            </span>
          )}
        </Link>
        <button onClick={onToggleTheme} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <Link href="/settings" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Settings size={15} />
        </Link>
      </div>
    </header>
  );
}
