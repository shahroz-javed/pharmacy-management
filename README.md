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

Legend: **Dynamic** = backed by a database table, model, controller, and validated forms. **Static (UI only)** = page renders from hardcoded mock data in `resources/js/mockData.ts`, no persistence yet. `[x]` = done, `[ ]` = not implemented yet.

### 1. Authentication — Dynamic
- [x] Login
- [x] Forgot Password
- [x] Reset Password

Backed by `App\Http\Controllers\Auth\*` (Laravel Breeze-style session auth), routes in [routes/auth.php](routes/auth.php), `users` table.

### 2. Dashboard — Static (UI only)
- [ ] Today's Sales
- [ ] Monthly Revenue
- [ ] Profit
- [ ] Purchases
- [ ] Low Stock Alerts
- [ ] Expiring Medicines
- [ ] Out of Stock
- [ ] Recent Sales
- [ ] Quick Actions
- [ ] Charts
- [ ] Sales Analytics

Renders `Dashboard.tsx` with data from `mockData.ts`. No controller or DB-backed stats yet.

### 3. Medicines — Dynamic
- [x] Medicine List
- [x] Search
- [x] Filters
- [x] Add Medicine
- [x] Edit Medicine
- [x] Medicine Details
- [x] Print Label

Backed by `App\Models\Medicine`, `App\Http\Controllers\MedicineController`, `medicines` table (migration `2026_07_07_082814_create_medicines_table`). Supports search/category/status filtering, create/edit with image upload, delete, auto-computed stock status (In Stock / Low Stock / Out of Stock), and a printable label (`window.print()` with a dedicated print-only layout). Covered by [tests/Feature/MedicineTest.php](tests/Feature/MedicineTest.php).

### 4. Inventory Management — Dynamic
- [x] Current Stock
- [x] Stock Ledger
- [x] Stock Movement
- [x] Stock Adjustment
- [x] Damaged Stock
- [x] Expired Stock
- [x] Returned Stock
- [x] Transfer Stock
- [x] Inventory Audit

Backed by `App\Models\StockMovement`, `App\Http\Controllers\InventoryController`, `stock_movements` table (migrations `2026_07_07_084624_create_stock_movements_table`, `2026_07_07_091353_add_locations_to_stock_movements_table`). Every movement (Purchase, Sale, Adjustment, Damaged, Expired, Returned, Transfer — see `App\Enums\StockMovementType`) is written as one ledger row via `Medicine::applyStockMovement()`, which locks the row, applies the delta, and rejects moves that would push stock negative. All tabs read this same ledger filtered by type:
- **Adjustment**: Add Stock / Remove Stock / Damage Write-off / Expired Write-off
- **Returned Stock**: Customer Return (adds stock back) or Return to Supplier (removes stock), with a reason
- **Transfer Stock**: records From/To location and quantity as a ledger entry with zero net stock change — there's no multi-warehouse table, so this is a log of where stock physically moved within the one store, not a per-location balance
- **Inventory Audit**: enter a counted quantity per medicine, see the variance against system stock, and applying it writes an `Adjustment` movement that reconciles stock to the count (no-op if they already match)

Covered by [tests/Feature/InventoryTest.php](tests/Feature/InventoryTest.php) (17 tests).

### 5. Purchase Management — Dynamic
- [x] Purchase Orders
- [x] Suppliers
- [x] Receive Inventory
- [x] Purchase History
- [x] Purchase Invoice

Backed by `App\Models\PurchaseOrder`, `App\Models\PurchaseOrderItem`, `App\Http\Controllers\PurchaseOrderController`, `purchase_orders`/`purchase_order_items` tables. Creating a PO records line items and puts the full amount on the supplier's `outstanding_balance` (credit). Receiving is a separate step (`PurchaseOrder::receive()`) that supports partial receipt per item — each unit received creates a `Purchase` stock movement (via `Medicine::applyStockMovement()`) and updates the medicine's current batch/expiry, while the item's own `batch_number`/`expiry_date`/`quantity_received` are kept on `purchase_order_items` for history. Order status auto-derives to Ordered / Partial / Received based on how much of each item has been received. Covered by [tests/Feature/PurchaseOrderTest.php](tests/Feature/PurchaseOrderTest.php) (7 tests).

`PurchaseDetail.tsx` renders a dedicated print-only purchase invoice (pharmacy header, supplier bill-from block, itemized table, subtotal/tax/total) via `window.print()`, following the same `hidden print:block` pattern used for the medicine print label and sale receipt.

### 6. Supplier Management — Dynamic
- [x] Supplier List
- [x] Supplier Profile
- [x] Contact Details
- [x] Purchase History
- [x] Outstanding Balance

Backed by `App\Models\Supplier`, `App\Models\SupplierPayment`, `App\Http\Controllers\SupplierController`, `suppliers`/`supplier_payments` tables. `outstanding_balance` increases when a purchase order is created (credit) and decreases via `Supplier::recordPayment()`, which also writes a `supplier_payments` row (method, optional linked PO, notes) for a full payment history. Covered by [tests/Feature/SupplierTest.php](tests/Feature/SupplierTest.php).

### 7. Customer Management — Dynamic
- [x] Customer List
- [x] Customer Profile
- [ ] Purchase History
- [x] Loyalty Points
- [x] Credit Balance
- [ ] Prescriptions

Backed by `App\Models\Customer`, `App\Models\CustomerCreditPayment`, `App\Http\Controllers\CustomerController`, `customers`/`customer_credit_payments` tables. `credit_balance` and `loyalty_points` live directly on the customer; `Customer::recordCreditPayment()` decrements the balance and writes a `customer_credit_payments` row (method, optional notes) for a full payment history, mirroring `Supplier::recordPayment()`. `Customer::adjustLoyaltyPoints()` adds or redeems points (redeem floors at zero). Purchase History and Prescriptions sections render as empty states — they'll populate once Sales and Prescription Management become dynamic. Covered by [tests/Feature/CustomerTest.php](tests/Feature/CustomerTest.php) (10 tests).

### 8. POS (Point of Sale) — Dynamic
- [x] Barcode Scanner
- [x] Search Medicine
- [x] Cart
- [x] Discount
- [x] Tax
- [x] Customer Selection
- [ ] Prescription Upload
- [x] Payment Methods
- [x] Split Payment
- [x] Print/Email Receipt
- [x] Hold/Resume Sale

Backed by `App\Models\Sale`, `App\Models\SaleItem`, `App\Models\SalePayment`, `App\Http\Controllers\SaleController`. `GET /pos` loads in-stock medicines, customers, and any `Held` sales. Checkout posts to `sales.store`: `DB::transaction` computes line totals, creates the `Sale` + `SaleItem` rows, decrements stock per item via `Medicine::applyStockMovement(Sale, ...)` (same ledger as every other module), records one `SalePayment` row per tendered method (`payment_method` becomes `Split` when more than one method is used), increments `Customer::credit_balance` for any `Credit` portion (rejected server-side if no customer is selected), and awards 1 loyalty point per ₹100 via `Customer::adjustLoyaltyPoints()`. Holding a sale (`status: Held`) skips all of that — no stock movement, no payment — so it can be resumed later by reloading its cart from `/pos`'s `heldSales` prop. The barcode field is a plain search box matched against name/SKU/barcode client-side (no hardware scanner integration, but a scanner that types-and-Enters works with it). Prescription upload is not implemented yet — it depends on Prescription Management (§10). Covered by [tests/Feature/SaleTest.php](tests/Feature/SaleTest.php) (13 tests).

### 9. Sales Management — Dynamic
- [x] Sales History
- [x] Sale Details
- [x] Return Sale
- [ ] Exchange
- [x] Refund

`SaleController::index` lists everything except `Held` sales, with search/status/payment-method/date filters and today/week/returns stats computed from the DB. `SaleController::show` renders the full sale with items, payment breakdown, and return history. Returns go through `Sale::processReturn()` (mirrors `PurchaseOrder::receive()`): per selected item, validates the quantity against what's left to return, restocks via `applyStockMovement(Returned, ...)`, and writes a `SaleReturn` + `SaleReturnItem` row for the refund history; the sale's status auto-derives to `Partially Returned` or `Returned`. `SaleDetail.tsx` has a `hidden print:block` receipt (same pattern as `PurchaseDetail.tsx`'s invoice). Exchange (return + immediate replacement in one flow) has no dedicated UI yet — do a return, then a new POS sale.

### 10. Prescription Management — Static (UI only)
- [ ] Upload Prescription
- [ ] View Prescription
- [ ] Attach Medicines
- [ ] Patient History

Renders `Prescriptions.tsx` from `mockData.ts`. No table/controller yet.

### 11. Reports — Static (UI only)
- [ ] Sales Reports
- [ ] Purchase Reports
- [ ] Inventory Reports
- [ ] Profit Reports
- [ ] Tax Reports
- [ ] Expiry Reports
- [ ] Top Selling Medicines
- [ ] Dead Stock
- [ ] Daily/Monthly Sales
- [ ] Export (PDF/Excel/CSV)

Renders `Reports.tsx` from `mockData.ts` (`salesData`). No aggregation queries or export wired up yet.

### 12. User Management — Static (UI only)
- [ ] Users
- [ ] Roles
- [ ] Permissions (Owner, Manager, Cashier, Pharmacist, Inventory Staff)

Renders `Users.tsx` from mock data. Only the base `users` table exists (for auth); no roles/permissions schema yet.

### 13. Notifications — Static (UI only)
- [ ] Low Stock
- [ ] Medicine Expiring
- [ ] Out of Stock
- [ ] Pending Payments
- [ ] New Purchase

Renders `NotificationsPage.tsx` from mock data. No notifications table/events yet.

### 14. Settings — Static (UI only)
- [ ] Business Information
- [ ] Pharmacy Logo
- [ ] GST/VAT
- [ ] Receipt Template
- [ ] POS Settings
- [ ] Currency
- [ ] Language
- [ ] Backup
- [ ] Printer Settings
- [ ] Barcode Settings
- [ ] Theme

Renders `SettingsPage.tsx` from mock data. No settings table/controller yet.

## Suggested order for making remaining modules dynamic

Prescription Management is the natural next step now that Sales/POS exists (it needs a `sale_id`/`patient` link and feeds POS's prescription upload), then Reports (reads across Sales/Purchases/Inventory), and finally Users/Roles and Settings.
