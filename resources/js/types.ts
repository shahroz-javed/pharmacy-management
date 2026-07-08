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

export interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  outstanding_balance: string;
  orders?: number;
  last_order?: string | null;
  purchase_orders?: PurchaseOrder[];
}

export interface CustomerCreditPayment {
  id: number;
  customer_id: number;
  user_id: number | null;
  amount: string;
  method: string;
  notes: string | null;
  created_at: string;
  user?: { id: number; name: string } | null;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  loyalty_points: number;
  credit_balance: string;
  credit_payments?: CustomerCreditPayment[];
  prescriptions?: Prescription[];
}

export type PurchaseOrderStatus = "Ordered" | "Partial" | "Received";

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  medicine_id: number;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  quantity_received: number;
  unit_price: string;
  tax: string;
  total: string;
  medicine: Pick<Medicine, "id" | "generic_name" | "brand_name" | "strength" | "sku">;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  order_date: string;
  expected_delivery: string | null;
  invoice_number: string | null;
  status: PurchaseOrderStatus;
  subtotal: string;
  tax_total: string;
  total: string;
  items_count?: number;
  supplier: Pick<Supplier, "id" | "name"> | Supplier;
  items?: PurchaseOrderItem[];
}

export type SaleStatus = "Held" | "Paid" | "Partially Returned" | "Returned";
export type PaymentMethod = "Cash" | "Card" | "UPI" | "Credit" | "Split";

export interface SaleItem {
  id: number;
  sale_id: number;
  medicine_id: number;
  quantity: number;
  quantity_returned: number;
  unit_price: string;
  discount: string;
  tax: string;
  total: string;
  medicine: Pick<Medicine, "id" | "generic_name" | "brand_name" | "strength" | "sku">;
}

export interface SalePayment {
  id: number;
  sale_id: number;
  method: Exclude<PaymentMethod, "Split">;
  amount: string;
}

export interface SaleReturnItem {
  id: number;
  sale_return_id: number;
  sale_item_id: number;
  quantity: number;
  amount: string;
  sale_item: SaleItem;
}

export interface SaleReturn {
  id: number;
  sale_id: number;
  exchange_sale_id: number | null;
  user_id: number | null;
  refund_amount: string;
  refund_method: string;
  reason: string | null;
  created_at: string;
  items: SaleReturnItem[];
  exchange_sale?: Pick<Sale, "id" | "invoice_number" | "status" | "total"> | null;
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  total: string;
  payment_method: PaymentMethod;
  amount_paid: string;
  loyalty_points_earned: number;
  status: SaleStatus;
  hold_reference: string | null;
  prescription_path: string | null;
  prescription_id: number | null;
  sold_at: string | null;
  created_at: string;
  items_count?: number;
  customer: Pick<Customer, "id" | "name" | "phone" | "credit_balance"> | null;
  user?: { id: number; name: string } | null;
  items?: SaleItem[];
  payments?: SalePayment[];
  returns?: SaleReturn[];
}

export type PrescriptionStatus = "Pending" | "Dispensed";

export interface PrescriptionItem {
  id: number;
  prescription_id: number;
  medicine_id: number;
  quantity: number;
  dosage_instructions: string | null;
  medicine: Pick<Medicine, "id" | "generic_name" | "brand_name" | "strength" | "sku">;
}

export interface Prescription {
  id: number;
  rx_number: string;
  customer_id: number | null;
  patient_name: string;
  patient_phone: string | null;
  doctor_name: string | null;
  prescribed_date: string;
  file_path: string | null;
  sale_id: number | null;
  status: PrescriptionStatus;
  notes: string | null;
  items_count?: number;
  customer: Pick<Customer, "id" | "name" | "phone"> | null;
  sale?: Pick<Sale, "id" | "invoice_number" | "status" | "total"> | null;
  items?: PrescriptionItem[];
}

export interface CartLine {
  medicine_id: number;
  name: string;
  sku: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  stock: number;
}

export type ReportType = "sales" | "purchase" | "inventory" | "profit" | "tax" | "expiry" | "topselling" | "deadstock" | "daily" | "monthly";

export interface ReportChartPoint {
  date: string;
  sales: number;
}

export interface ReportData {
  stats: Record<string, number>;
  chart?: ReportChartPoint[];
  rows: Record<string, string | number>[];
}
