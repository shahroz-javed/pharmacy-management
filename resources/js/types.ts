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

export type StockMovementType = "Purchase" | "Sale" | "Adjustment" | "Damaged" | "Expired" | "Returned" | "Transfer";

export interface StockMovement {
  id: number;
  medicine_id: number;
  user_id: number | null;
  type: StockMovementType;
  quantity_in: number;
  quantity_out: number;
  balance_after: number;
  reference: string | null;
  reason: string | null;
  from_location: string | null;
  to_location: string | null;
  created_at: string;
  medicine: Pick<Medicine, "id" | "generic_name" | "brand_name" | "strength" | "sku"> & { name?: string };
  user: { id: number; name: string } | null;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
