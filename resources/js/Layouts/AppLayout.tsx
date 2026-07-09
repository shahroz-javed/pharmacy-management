import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { Theme } from "@/types";

export function AppLayout({ children, notifCount }: { children: React.ReactNode; notifCount?: number }) {
  const { props } = usePage<{ notifCount: number }>();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <TopBar theme={theme} onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")} notifCount={notifCount ?? props.notifCount ?? 0} />
        <main className="flex-1 overflow-y-auto print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
