import { Link, usePage } from "@inertiajs/react";
import {
  LayoutDashboard, ShoppingCart, Pill, Boxes, Truck, Building2, UserCircle,
  Receipt, BookOpen, BarChart2, Users as UsersIcon, Bell, Settings, LogOut, FlaskConical,
} from "lucide-react";
import type { NavItem } from "@/types";

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "pos", label: "Point of Sale", href: "/pos", icon: <ShoppingCart size={16} /> },
  { id: "medicines", label: "Medicines", href: "/medicines", icon: <Pill size={16} /> },
  { id: "inventory", label: "Inventory", href: "/inventory", icon: <Boxes size={16} /> },
  { id: "purchases", label: "Purchases", href: "/purchases", icon: <Truck size={16} /> },
  { id: "suppliers", label: "Suppliers", href: "/suppliers", icon: <Building2 size={16} /> },
  { id: "customers", label: "Customers", href: "/customers", icon: <UserCircle size={16} /> },
  { id: "sales", label: "Sales", href: "/sales", icon: <Receipt size={16} /> },
  { id: "prescriptions", label: "Prescriptions", href: "/prescriptions", icon: <BookOpen size={16} /> },
  { id: "reports", label: "Reports", href: "/reports", icon: <BarChart2 size={16} /> },
  { id: "users", label: "Users & Roles", href: "/users", icon: <UsersIcon size={16} /> },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: <Bell size={16} />, badge: 3 },
  { id: "settings", label: "Settings", href: "/settings", icon: <Settings size={16} /> },
];

export function Sidebar() {
  const { url } = usePage();

  return (
    <aside className="w-56 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FlaskConical size={16} className="text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold text-sidebar-foreground">PharmaPro</div>
            <div className="text-xs text-muted-foreground">Medical Store</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map(item => {
          const active = url === item.href || url.startsWith(item.href + "/");
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <span className={active ? "text-sidebar-primary" : "text-muted-foreground"}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full font-mono">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">A</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-sidebar-foreground truncate">Admin User</div>
            <div className="text-xs text-muted-foreground">Owner</div>
          </div>
          <button className="text-muted-foreground hover:text-foreground"><LogOut size={14} /></button>
        </div>
      </div>
    </aside>
  );
}
