# Pharmacy Management System

Laravel + Inertia.js (React/TypeScript) pharmacy management system. Design source: [design/README.md](design/README.md).

## Running the project

```
composer install
npm install
php artisan migrate --seed
composer dev
```

Default login: `admin@pharmapro.in` / `admin123`

## Module status

Legend: **Dynamic** = backed by a database table, model, controller, and validated forms. **Static (UI only)** = page renders from hardcoded mock data in `resources/js/mockData.ts`, no persistence yet.

### 1. Authentication — Dynamic
- Login
- Forgot Password
- Reset Password

Backed by `App\Http\Controllers\Auth\*` (Laravel Breeze-style session auth), routes in [routes/auth.php](routes/auth.php), `users` table.

### 2. Dashboard — Static (UI only)
- Today's Sales, Monthly Revenue, Profit, Purchases, Low Stock Alerts, Expiring Medicines, Out of Stock, Recent Sales, Quick Actions, Charts, Sales Analytics

Renders `Dashboard.tsx` with data from `mockData.ts`. No controller or DB-backed stats yet.

### 3. Medicines — Dynamic
- Medicine List []
- Search
- Filters
- Add Medicine
- Edit Medicine
- Medicine Details
- Print Label

### 4. Inventory Management — Dynamic
- Current Stock, Stock Ledger, Stock Adjustment, Damaged Stock, Expired Stock, Returned Stock, Transfer Stock, Inventory Audit

Backed by `App\Models\StockMovement`, `App\Http\Controllers\InventoryController`, `stock_movements` table (migrations `2026_07_07_084624_create_stock_movements_table`, `2026_07_07_091353_add_locations_to_stock_movements_table`). Every movement (Purchase, Sale, Adjustment, Damaged, Expired, Returned, Transfer — see `App\Enums\StockMovementType`) is written as one ledger row via `Medicine::applyStockMovement()`, which locks the row, applies the delta, and rejects moves that would push stock negative. All tabs (Current Stock, Stock Ledger, Adjustments, Damaged, Expired, Returned, Transfers, Inventory Audit) read this same ledger filtered by type. Supports:
- **Adjustment**: Add Stock / Remove Stock / Damage Write-off / Expired Write-off
- **Returned Stock**: Customer Return (adds stock back) or Return to Supplier (removes stock), with a reason
- **Transfer Stock**: records From/To location and quantity as a ledger entry with zero net stock change — there's no multi-warehouse table, so this is a log of where stock physically moved within the one store, not a per-location balance
- **Inventory Audit**: enter a counted quantity per medicine, see the variance against system stock, and applying it writes an `Adjustment` movement that reconciles stock to the count (no-op if they already match)

Covered by [tests/Feature/InventoryTest.php](tests/Feature/InventoryTest.php) (17 tests).

### 5. Purchase Management — Static (UI only)
- Purchase Orders, Suppliers, Receive Inventory, Purchase History, Purchase Invoice

Renders `Purchases.tsx`, `AddPurchase.tsx`, `PurchaseDetail.tsx` from `mockData.ts`. No `purchases` table/controller yet.

### 6. Supplier Management — Static (UI only)
- Supplier List, Supplier Profile, Contact Details, Purchase History, Outstanding Balance

Renders `Suppliers.tsx`, `SupplierDetail.tsx` from `mockData.ts`. No `suppliers` table/controller yet.

### 7. Customer Management — Static (UI only)
- Customer List, Customer Profile, Purchase History, Loyalty Points, Credit Balance, Prescriptions

Renders `Customers.tsx`, `CustomerDetail.tsx` from `mockData.ts`. No `customers` table/controller yet.

### 8. POS (Point of Sale) — Static (UI only)
- Barcode Scanner, Search Medicine, Cart, Discount, Tax, Customer Selection, Prescription Upload, Payment Methods, Split Payment, Print/Email Receipt, Hold/Resume Sale

Renders `POS.tsx` from `mockData.ts` (`posCartSeed`, `medicines`). No sale persistence yet — cart/checkout is in-memory only.

### 9. Sales Management — Static (UI only)
- Sales History, Sale Details, Return Sale, Exchange, Refund

Renders `Sales.tsx`, `SaleDetail.tsx` from `mockData.ts`. No `sales` table/controller yet.

### 10. Prescription Management — Static (UI only)
- Upload Prescription, View Prescription, Attach Medicines, Patient History

Renders `Prescriptions.tsx` from `mockData.ts`. No table/controller yet.

### 11. Reports — Static (UI only)
- Sales, Purchase, Inventory, Profit, Tax, Expiry Reports, Top Selling Medicines, Dead Stock, Daily/Monthly Sales; PDF/Excel/CSV export

Renders `Reports.tsx` from `mockData.ts` (`salesData`). No aggregation queries or export wired up yet.

### 12. User Management — Static (UI only)
- Users, Roles, Permissions (Owner, Manager, Cashier, Pharmacist, Inventory Staff)

Renders `Users.tsx` from mock data. Only the base `users` table exists (for auth); no roles/permissions schema yet.

### 13. Notifications — Static (UI only)
- Low Stock, Medicine Expiring, Out of Stock, Pending Payments, New Purchase

Renders `NotificationsPage.tsx` from mock data. No notifications table/events yet.

### 14. Settings — Static (UI only)
- Business Information, Logo, GST/VAT, Receipt Template, POS Settings, Currency, Language, Backup, Printer/Barcode Settings, Theme

Renders `SettingsPage.tsx` from mock data. No settings table/controller yet.

## Suggested order for making remaining modules dynamic

Purchases is the natural next step (it will create `Purchase` stock movements against the same ledger), followed by Suppliers/Customers (needed by Purchases/Sales/POS), then Sales/POS together (since POS creates Sales and `Sale` stock movements), then Prescriptions, Reports (reads across the above), and finally Users/Roles and Settings.
