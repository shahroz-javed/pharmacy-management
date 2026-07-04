export interface Medicine {
  id: number; name: string; generic: string; brand: string; category: string; manufacturer: string;
  strength: string; form: string; unit: string; sku: string; batch: string; expiry: string;
  stock: number; reorder: number; purchase: number; selling: number; tax: number; status: string;
}

export const medicines: Medicine[] = [
  { id: 1, name: "Amoxicillin 500mg", generic: "Amoxicillin", brand: "Moxilin", category: "Antibiotics", manufacturer: "Sun Pharma", strength: "500mg", form: "Capsule", unit: "Strip", sku: "MED001", batch: "BT2401", expiry: "2026-06", stock: 240, reorder: 50, purchase: 48.00, selling: 72.00, tax: 12, status: "In Stock" },
  { id: 2, name: "Paracetamol 650mg", generic: "Paracetamol", brand: "Calpol", category: "Analgesics", manufacturer: "GSK", strength: "650mg", form: "Tablet", unit: "Strip", sku: "MED002", batch: "BT2402", expiry: "2025-12", stock: 12, reorder: 30, purchase: 18.00, selling: 28.00, tax: 5, status: "Low Stock" },
  { id: 3, name: "Cetirizine 10mg", generic: "Cetirizine", brand: "Zyrtec", category: "Antihistamines", manufacturer: "UCB", strength: "10mg", form: "Tablet", unit: "Strip", sku: "MED003", batch: "BT2403", expiry: "2025-08", stock: 0, reorder: 20, purchase: 22.00, selling: 35.00, tax: 12, status: "Out of Stock" },
  { id: 4, name: "Metformin 500mg", generic: "Metformin", brand: "Glucophage", category: "Antidiabetic", manufacturer: "Merck", strength: "500mg", form: "Tablet", unit: "Strip", sku: "MED004", batch: "BT2404", expiry: "2026-03", stock: 180, reorder: 40, purchase: 32.00, selling: 52.00, tax: 12, status: "In Stock" },
  { id: 5, name: "Omeprazole 20mg", generic: "Omeprazole", brand: "Prilosec", category: "Antacids", manufacturer: "AstraZeneca", strength: "20mg", form: "Capsule", unit: "Strip", sku: "MED005", batch: "BT2405", expiry: "2025-11", stock: 8, reorder: 25, purchase: 28.00, selling: 45.00, tax: 5, status: "Low Stock" },
  { id: 6, name: "Vitamin D3 1000IU", generic: "Cholecalciferol", brand: "D-Cal", category: "Vitamins", manufacturer: "Abbott", strength: "1000IU", form: "Tablet", unit: "Bottle", sku: "MED006", batch: "BT2406", expiry: "2027-02", stock: 95, reorder: 20, purchase: 120.00, selling: 195.00, tax: 5, status: "In Stock" },
  { id: 7, name: "Azithromycin 250mg", generic: "Azithromycin", brand: "Zithromax", category: "Antibiotics", manufacturer: "Pfizer", strength: "250mg", form: "Tablet", unit: "Strip", sku: "MED007", batch: "BT2407", expiry: "2026-08", stock: 142, reorder: 30, purchase: 65.00, selling: 98.00, tax: 12, status: "In Stock" },
];

export interface CustomerRow { id: number; name: string; phone: string; email: string; city: string; loyalty: number; credit: number; prescriptions: number; visits: number; lastVisit: string }

export const customers: CustomerRow[] = [
  { id: 1, name: "Suresh Nair", phone: "+91 99887 76655", email: "suresh@email.com", city: "Bangalore", loyalty: 480, credit: 0, prescriptions: 3, visits: 24, lastVisit: "2025-07-01" },
  { id: 2, name: "Meena Joshi", phone: "+91 88776 65544", email: "meena@email.com", city: "Pune", loyalty: 920, credit: 500, prescriptions: 7, visits: 48, lastVisit: "2025-07-02" },
  { id: 3, name: "Dr. Ramesh Pillai", phone: "+91 77665 54433", email: "ramesh@clinic.in", city: "Chennai", loyalty: 1240, credit: 2000, prescriptions: 0, visits: 62, lastVisit: "2025-06-30" },
];

export interface SupplierRow { id: number; name: string; contact: string; phone: string; email: string; city: string; balance: number; orders: number; lastOrder: string }

export const suppliers: SupplierRow[] = [
  { id: 1, name: "MediCorp Pharma", contact: "Rajesh Kumar", phone: "+91 98765 43210", email: "rajesh@medicorp.in", city: "Mumbai", balance: 48500, orders: 24, lastOrder: "2025-06-28" },
  { id: 2, name: "HealthFirst Distributors", contact: "Priya Sharma", phone: "+91 87654 32109", email: "priya@healthfirst.in", city: "Delhi", balance: 12000, orders: 18, lastOrder: "2025-07-01" },
  { id: 3, name: "PharmaLink Wholesale", contact: "Amit Patel", phone: "+91 76543 21098", email: "amit@pharmalink.in", city: "Ahmedabad", balance: 0, orders: 31, lastOrder: "2025-06-15" },
];

export interface SaleRow { id: string; customer: string; items: number; total: number; payment: string; time: string; status: string }

export const recentSales: SaleRow[] = [
  { id: "INV-2407-089", customer: "Walk-in", items: 3, total: 284.50, payment: "Cash", time: "14:32", status: "Paid" },
  { id: "INV-2407-088", customer: "Meena Joshi", items: 5, total: 628.00, payment: "Card", time: "13:58", status: "Paid" },
  { id: "INV-2407-087", customer: "Walk-in", items: 2, total: 96.00, payment: "UPI", time: "13:21", status: "Paid" },
  { id: "INV-2407-086", customer: "Suresh Nair", items: 8, total: 1240.00, payment: "Credit", time: "12:44", status: "Pending" },
  { id: "INV-2407-085", customer: "Walk-in", items: 1, total: 45.00, payment: "Cash", time: "12:09", status: "Paid" },
];

export interface CartLine { id: number; name: string; sku: string; qty: number; price: number; discount: number; tax: number }

export const posCartSeed: CartLine[] = [
  { id: 1, name: "Paracetamol 650mg", sku: "MED002", qty: 2, price: 28.00, discount: 0, tax: 5 },
  { id: 2, name: "Vitamin D3 1000IU", sku: "MED006", qty: 1, price: 195.00, discount: 10, tax: 5 },
  { id: 3, name: "Amoxicillin 500mg", sku: "MED001", qty: 1, price: 72.00, discount: 0, tax: 12 },
];

export interface SalesDayRow { date: string; sales: number; purchases: number; profit: number }

export const salesData: SalesDayRow[] = [
  { date: "Jun 27", sales: 12400, purchases: 8200, profit: 4200 },
  { date: "Jun 28", sales: 14800, purchases: 9100, profit: 5700 },
  { date: "Jun 29", sales: 11200, purchases: 7400, profit: 3800 },
  { date: "Jun 30", sales: 16500, purchases: 10200, profit: 6300 },
  { date: "Jul 1", sales: 18900, purchases: 11800, profit: 7100 },
  { date: "Jul 2", sales: 15300, purchases: 9600, profit: 5700 },
  { date: "Jul 3", sales: 21200, purchases: 13100, profit: 8100 },
];
