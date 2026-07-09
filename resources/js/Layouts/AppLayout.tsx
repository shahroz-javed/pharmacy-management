import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useSettings } from "@/lib/settings";
import type { Theme } from "@/types";

const THEME_COLORS: Record<string, { primary: string; ring: string; sidebarAccent: string; accent: string }> = {
  Blue: { primary: "#1a56db", ring: "#1a56db", sidebarAccent: "#f0f4ff", accent: "#e0e7ff" },
  Green: { primary: "#059669", ring: "#059669", sidebarAccent: "#ecfdf5", accent: "#d1fae5" },
  Violet: { primary: "#7c3aed", ring: "#7c3aed", sidebarAccent: "#f5f3ff", accent: "#ede9fe" },
};

const FONT_SIZES: Record<string, string> = {
  Small: "13px",
  Default: "14px",
  Large: "16px",
};

export function AppLayout({ children, notifCount }: { children: React.ReactNode; notifCount?: number }) {
  const { props } = usePage<{ notifCount: number }>();
  const { theme_color, font_size } = useSettings();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement.style;
    const colors = THEME_COLORS[theme_color] ?? THEME_COLORS.Blue;
    root.setProperty("--primary", colors.primary);
    root.setProperty("--ring", colors.ring);
    root.setProperty("--sidebar-primary", colors.primary);
    root.setProperty("--sidebar-ring", colors.primary);
    root.setProperty("--sidebar-accent", colors.sidebarAccent);
    root.setProperty("--sidebar-accent-foreground", colors.primary);
    root.setProperty("--accent", colors.accent);
    root.setProperty("--accent-foreground", colors.primary);
    root.setProperty("--font-size", FONT_SIZES[font_size] ?? FONT_SIZES.Default);

    return () => {
      root.removeProperty("--primary");
      root.removeProperty("--ring");
      root.removeProperty("--sidebar-primary");
      root.removeProperty("--sidebar-ring");
      root.removeProperty("--sidebar-accent");
      root.removeProperty("--sidebar-accent-foreground");
      root.removeProperty("--accent");
      root.removeProperty("--accent-foreground");
      root.removeProperty("--font-size");
    };
  }, [theme_color, font_size]);

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
