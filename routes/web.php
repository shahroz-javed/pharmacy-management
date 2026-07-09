<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('/', '/dashboard');

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    });

    Route::get('/pos', [SaleController::class, 'pos'])->name('pos');

    Route::get('/medicines/add', [MedicineController::class, 'create'])->name('medicines.create');
    Route::resource('medicines', MedicineController::class)->except(['create'])->parameters(['medicines' => 'medicine']);

    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory/adjustments', [InventoryController::class, 'storeAdjustment'])->name('inventory.adjustments.store');
    Route::post('/inventory/returns', [InventoryController::class, 'storeReturn'])->name('inventory.returns.store');
    Route::post('/inventory/transfers', [InventoryController::class, 'storeTransfer'])->name('inventory.transfers.store');
    Route::post('/inventory/audits', [InventoryController::class, 'storeAudit'])->name('inventory.audits.store');

    Route::get('/purchases/add', [PurchaseOrderController::class, 'create'])->name('purchases.create');
    Route::post('/purchases/{purchase}/receive', [PurchaseOrderController::class, 'receive'])->name('purchases.receive');
    Route::resource('purchases', PurchaseOrderController::class)
        ->only(['index', 'store', 'show'])
        ->parameters(['purchases' => 'purchase']);

    Route::resource('suppliers', SupplierController::class)
        ->except(['create', 'edit'])
        ->parameters(['suppliers' => 'supplier']);
    Route::post('/suppliers/{supplier}/payments', [SupplierController::class, 'storePayment'])->name('suppliers.payments.store');

    Route::resource('customers', CustomerController::class)
        ->except(['create', 'edit'])
        ->parameters(['customers' => 'customer']);
    Route::post('/customers/{customer}/payments', [CustomerController::class, 'storeCreditPayment'])->name('customers.payments.store');
    Route::post('/customers/{customer}/loyalty', [CustomerController::class, 'storeLoyalty'])->name('customers.loyalty.store');

    Route::resource('sales', SaleController::class)
        ->only(['index', 'store', 'show'])
        ->parameters(['sales' => 'sale']);
    Route::post('/sales/{sale}/returns', [SaleController::class, 'storeReturn'])->name('sales.returns.store');
    Route::post('/sales/{sale}/exchanges', [SaleController::class, 'storeExchange'])->name('sales.exchanges.store');

    Route::resource('prescriptions', PrescriptionController::class)
        ->only(['index', 'store', 'show', 'destroy'])
        ->parameters(['prescriptions' => 'prescription']);
    Route::post('/prescriptions/{prescription}/items', [PrescriptionController::class, 'storeItems'])->name('prescriptions.items.store');

    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/{type}/export', [ReportController::class, 'export'])->name('reports.export');

    Route::get('/users', function () {
        return Inertia::render('Users');
    });

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{key}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    Route::get('/settings', function () {
        return Inertia::render('SettingsPage');
    });
});
