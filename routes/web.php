<?php

use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('/', '/dashboard');

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    });

    Route::get('/pos', function () {
        return Inertia::render('POS');
    });

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

    Route::get('/customers', function () {
        return Inertia::render('Customers');
    });

    Route::get('/customers/{id}', function (int $id) {
        return Inertia::render('CustomerDetail', ['id' => $id]);
    });

    Route::get('/sales', function () {
        return Inertia::render('Sales');
    });

    Route::get('/sales/{id}', function (string $id) {
        return Inertia::render('SaleDetail', ['id' => $id]);
    });

    Route::get('/prescriptions', function () {
        return Inertia::render('Prescriptions');
    });

    Route::get('/reports', function () {
        return Inertia::render('Reports');
    });

    Route::get('/users', function () {
        return Inertia::render('Users');
    });

    Route::get('/notifications', function () {
        return Inertia::render('NotificationsPage');
    });

    Route::get('/settings', function () {
        return Inertia::render('SettingsPage');
    });
});
