export type Page =
  | "login" | "forgot-password" | "reset-password"
  | "dashboard"
  | "medicines" | "medicine-detail" | "medicine-add"
  | "inventory" | "stock-ledger" | "stock-adjustment"
  | "purchases" | "purchase-detail" | "purchase-add"
  | "suppliers" | "supplier-detail"
  | "customers" | "customer-detail"
  | "pos"
  | "sales" | "sale-detail"
  | "prescriptions"
  | "reports"
  | "users"
  | "notifications"
  | "settings";

export type Theme = "light" | "dark";

export interface NavItem {
  id: Page;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}
