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
- [x] Prescriptions

Backed by `App\Models\Customer`, `App\Models\CustomerCreditPayment`, `App\Http\Controllers\CustomerController`, `customers`/`customer_credit_payments` tables. `credit_balance` and `loyalty_points` live directly on the customer; `Customer::recordCreditPayment()` decrements the balance and writes a `customer_credit_payments` row (method, optional notes) for a full payment history, mirroring `Supplier::recordPayment()`. `Customer::adjustLoyaltyPoints()` adds or redeems points (redeem floors at zero). The Prescriptions section now lists the customer's real `Prescription` history (linked via `customer_id`). Purchase History still renders as an empty state — it needs a dedicated `Sale`-by-customer view, not yet wired up even though `Sale` now exists. Covered by [tests/Feature/CustomerTest.php](tests/Feature/CustomerTest.php) (10 tests).

### 8. POS (Point of Sale) — Dynamic
- [x] Barcode Scanner
- [x] Search Medicine
- [x] Cart
- [x] Discount
- [x] Tax
- [x] Customer Selection
- [x] Prescription Upload
- [x] Payment Methods
- [x] Split Payment
- [x] Print/Email Receipt
- [x] Hold/Resume Sale

Backed by `App\Models\Sale`, `App\Models\SaleItem`, `App\Models\SalePayment`, `App\Http\Controllers\SaleController`. `GET /pos` loads in-stock medicines, customers, any `Held` sales, and `Pending` prescriptions. Checkout posts to `sales.store`: `DB::transaction` computes line totals, creates the `Sale` + `SaleItem` rows, decrements stock per item via `Medicine::applyStockMovement(Sale, ...)` (same ledger as every other module), records one `SalePayment` row per tendered method (`payment_method` becomes `Split` when more than one method is used), increments `Customer::credit_balance` for any `Credit` portion (rejected server-side if no customer is selected), awards 1 loyalty point per ₹100 via `Customer::adjustLoyaltyPoints()`, and — if a prescription was linked — calls `Prescription::dispenseVia()` to flip it to `Dispensed` and stamp its `sale_id`. Holding a sale (`status: Held`) skips all of that — no stock movement, no payment, no dispensing — so it can be resumed later by reloading its cart from `/pos`'s `heldSales` prop. The "Prescription" button opens a picker of pending prescriptions; selecting one loads its attached medicines into the cart at their prescribed quantities and links it to the sale. The barcode field is a plain search box matched against name/SKU/barcode client-side (no hardware scanner integration, but a scanner that types-and-Enters works with it). Covered by [tests/Feature/SaleTest.php](tests/Feature/SaleTest.php) (17 tests).

### 9. Sales Management — Dynamic
- [x] Sales History
- [x] Sale Details
- [x] Return Sale
- [x] Exchange
- [x] Refund

`SaleController::index` lists everything except `Held` sales, with search/status/payment-method/date filters and today/week/returns stats computed from the DB. `SaleController::show` renders the full sale with items, payment breakdown, and return/exchange history. Returns go through `Sale::processReturn()` (mirrors `PurchaseOrder::receive()`): per selected item, validates the quantity against what's left to return, restocks via `applyStockMovement(Returned, ...)`, and writes a `SaleReturn` + `SaleReturnItem` row for the refund history; the sale's status auto-derives to `Partially Returned` or `Returned`. Exchange (`Sale::processExchange()`) does the same return, then — if replacement items were picked — rings up a brand-new `Sale` for them in the same transaction (decrementing stock as a normal `Sale` movement) and settles the price difference: if the replacement costs more, it records an extra payment on the new sale for the difference; if it costs less, the leftover becomes the `SaleReturn`'s cash refund. The two sales are linked via `sale_returns.exchange_sale_id`. `SaleDetail.tsx` has a combined Return/Exchange modal (mode toggle) and a `hidden print:block` receipt (same pattern as `PurchaseDetail.tsx`'s invoice).

### 10. Prescription Management — Dynamic
- [x] Upload Prescription
- [x] View Prescription
- [x] Attach Medicines
- [x] Patient History

Backed by `App\Models\Prescription`, `App\Models\PrescriptionItem`, `App\Http\Controllers\PrescriptionController`, `prescriptions`/`prescription_items` tables. A prescription always has a free-text `patient_name`/`patient_phone` and an optional `customer_id` link (for walk-ins who aren't registered customers yet); `Prescription::generateRxNumber()` mirrors `Sale::generateInvoiceNumber()`'s `RX-YYMM-###` scheme. Uploading stores the file on the `public` disk (`prescriptions/`, same `Storage::disk('public')` pattern as `Medicine::image_path`) and optionally attaches medicine line items in the same request; `PrescriptionController::storeItems` lets the detail page fully replace the attached items later (delete-then-recreate, not a diff). Status starts `Pending` and flips to `Dispensed` only when a POS sale is checked out with that prescription linked (`Prescription::dispenseVia()`, called from `SaleController::store`) — there's no manual "mark dispensed" action, dispensing always goes through an actual sale. Patient History surfaces on the customer profile (`CustomerController::show` now eager-loads `prescriptions`) when a prescription is linked to a `Customer`. Covered by [tests/Feature/PrescriptionTest.php](tests/Feature/PrescriptionTest.php) (8 tests).

### 11. Reports — Dynamic
- [x] Sales Reports
- [x] Purchase Reports
- [x] Inventory Reports
- [x] Profit Reports
- [x] Tax Reports
- [x] Expiry Reports
- [x] Top Selling Medicines
- [x] Dead Stock
- [x] Daily/Monthly Sales
- [x] Export (CSV; PDF via browser print; no Excel)

Backed by `App\Http\Controllers\ReportController`, no new tables — every report is a read-only aggregation over `Sale`/`SaleItem`/`SaleReturn`/`PurchaseOrder`/`Medicine`/`StockMovement`. `GET /reports?type=&period=&from=&to=` resolves a date range (`daily`/`weekly`/`monthly`/`yearly`/`custom`) the same way `SaleController`/`PurchaseOrderController` already build their stats blocks (`whereBetween`, `sum`, `count`), then dispatches to one private method per report type, each returning a uniform `{ stats, chart?, rows }` shape. Notable ones: Profit joins `SaleItem` to `Medicine.purchase_price` for cost of goods; Dead Stock finds medicines with stock but no `Sale`-type `StockMovement` in the period; Top Selling groups `SaleItem` by medicine and ranks by revenue share. `Reports.tsx` renders the `rows` as a generic table (columns derived from whatever keys each report returns) plus a Recharts bar chart for report types that return a `chart` series — no new chart library, `recharts` was already installed and used by `Dashboard.tsx`. **Export**: CSV streams directly from `GET /reports/{type}/export` via `fputcsv` (no package); "PDF" triggers `window.print()` on the report view (no `barryvdh/laravel-dompdf`); Excel export was descoped — no `maatwebsite/excel` or equivalent was added, per the "no new dependencies without approval" rule. Covered by [tests/Feature/ReportTest.php](tests/Feature/ReportTest.php) (10 tests).

### 12. User Management — Dynamic
- [x] Users
- [x] Roles
- [x] Permissions (Owner, Manager, Cashier, Pharmacist, Inventory Staff)

Backed by `App\Http\Controllers\UserController` and the existing `App\Models\User`/`users` table, extended with `role` and `status` columns (migration `2026_07_09_094753_add_role_and_status_to_users_table`). `GET /users` lists staff with search-by-name/email; Add/Edit run through `StoreUserRequest` (name, email, role, password — password optional on edit, hashed via `Hash::make`), Delete is a plain `destroy`. A user can't deactivate or delete their own account (`UserController::update`/`destroy` reject it, enforced both server-side and in the UI by disabling/hiding those controls for the signed-in user's own row). Permissions are **display-only**: a static Role Permissions reference card lists what each of the five roles can do, but nothing in any controller actually gates on `role` yet — mirrors how Settings' Language/Printer/Barcode fields are stored but not wired to behavior. Covered by [tests/Feature/UserTest.php](tests/Feature/UserTest.php) (11 tests).

### 13. Notifications — Dynamic
- [x] Low Stock
- [x] Medicine Expiring
- [x] Out of Stock
- [x] Pending Payments
- [x] New Purchase

Backed by `App\Http\Controllers\NotificationController` and `App\Models\NotificationState` (`notification_states` table, migration `2026_07_09_065418_create_notification_states_table`). There's no notifications table storing events — each type is computed live every request (same read-only-aggregation approach as `ReportController`): Low Stock / Out of Stock from `Medicine::status`, Medicine Expiring from `Medicine::expiry_date` within 90 days (including already-expired), Pending Payments from `Supplier::outstanding_balance` > 0, New Purchase from `PurchaseOrder`s created in the last 7 days. Each notification gets a stable id like `low-stock-{medicine_id}`; `notification_states` stores per-user `read_at` so read state persists across requests without a real events log. `POST /notifications/{key}/read` marks one read, `POST /notifications/read-all` marks every currently-generated notification read. The unread count is shared globally via `HandleInertiaRequests` as the `notifCount` Inertia prop, read by `AppLayout`/`TopBar`'s bell icon on every page (previously hardcoded to `3`). Covered by [tests/Feature/NotificationTest.php](tests/Feature/NotificationTest.php) (9 tests).

### 14. Settings — Dynamic
- [x] Business Information [Applied to: printed receipts/invoices/labels (SaleDetail, PurchaseDetail, MedicineDetail) and every page via the shared `settings` Inertia prop]
- [x] Pharmacy Logo [Applied to: receipt/invoice header when "Show logo on receipt" is on]
- [x] GST/VAT [Applied to: printed receipt/invoice header]
- [x] Receipt Template [Applied to: SaleDetail/PurchaseDetail printable footer text]
- [x] POS Settings [Applied to: default tax rate + reorder level prefilled on Add Medicine]
- [x] Currency [Applied to: every ₹ amount app-wide via `useCurrency()`]
- [x] Language [Not applied — stored but no i18n/translation layer exists yet]
- [x] Backup [Applied to: `GET /settings/backup` download]
- [x] Printer Settings [Not applied — no server-side/native print pipeline to target a named printer; the app still uses `window.print()`]
- [x] Barcode Settings [Not applied — POS/medicine barcode fields are free-text lookups, not a generated-barcode renderer]
- [x] Theme [Applied to: color (Blue/Green/Violet) and font size, live app-wide via CSS custom properties in `AppLayout`]

Backed by `App\Models\Setting`, `App\Http\Controllers\SettingController`, `settings` table (migration `2026_07_09_071112_create_settings_table`). There's exactly one row — `Setting::current()` is a singleton accessor used by the controller — since a single pharmacy only needs one active configuration, not a per-user or versioned settings table. `GET /settings` renders it, `PUT /settings` validates and saves (logo upload follows the same `Storage::disk('public')` + delete-old-then-store-new pattern as `Medicine::image_path`). **Backup**: `GET /settings/backup` streams a JSON snapshot of every business table (`response()->streamDownload`, no new dependency, mirrors the CSV export approach in `ReportController`). Covered by [tests/Feature/SettingTest.php](tests/Feature/SettingTest.php) (7 tests).

**App-wide wiring**: `settings` is shared globally via `HandleInertiaRequests` (alongside `notifCount`), so every page can read it without prop drilling. `resources/js/lib/settings.ts` exposes `useSettings()` and `useCurrency()` (`fmt`/`fmtCompact`/`symbol`) — every hardcoded `₹` literal across all Pages was replaced with these, so switching Currency in Settings changes the symbol everywhere immediately (INR ₹ / USD $ / EUR €; only display formatting, no FX conversion). `AppLayout` applies `theme_color`/`font_size` live by overriding the `--primary`/`--ring`/`--sidebar-*`/`--accent`/`--font-size` CSS custom properties already defined in `resources/css/app.css`, on top of the existing light/dark toggle. `SaleDetail.tsx`/`PurchaseDetail.tsx`'s printable receipt/invoice and `MedicineDetail.tsx`'s printable label now pull real business name/address/GST/logo instead of the old hardcoded "PharmaPro Medical Store" text, and the receipt/invoice footer uses `receipt_footer_text` when set. `AddMedicine.tsx` prefills a new medicine's tax and reorder level from `default_tax_rate`/`low_stock_threshold` (existing medicines keep their own values on edit). Language, Printer, and Barcode settings are persisted and editable but not yet wired to any behavior — there's no translation layer, native print-target selection, or barcode image generation in the app to plug them into.

## Suggested order for making remaining modules dynamic

Every module is now dynamic. Remaining gaps: Dashboard still renders from `mockData.ts` (stats not DB-backed), Customer purchase history is an empty state, and permission enforcement (actually gating routes/actions by `User::role`) hasn't been built despite roles/permissions now existing on the User Management page.
