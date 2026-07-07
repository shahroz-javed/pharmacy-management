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

export interface Medicine {
  id: number;
  generic_name: string;
  brand_name: string;
  category: string;
  manufacturer: string | null;
  strength: string | null;
  dosage_form: string | null;
  unit: string | null;
  sku: string;
  barcode: string | null;
  prescription_required: boolean;
  description: string | null;
  purchase_price: string;
  selling_price: string;
  mrp: string | null;
  tax: string;
  wholesale_price: string | null;
  discount: string;
  batch_number: string;
  expiry_date: string;
  stock: number;
  reorder_level: number;
  storage_location: string | null;
  temperature_storage: string | null;
  image_path: string | null;
  status: string;
  name: string;
}
