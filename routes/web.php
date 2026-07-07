<?php

use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MedicineController;
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

    Route::get('/purchases', function () {
        return Inertia::render('Purchases');
    });

    Route::get('/purchases/add', function () {
        return Inertia::render('AddPurchase');
    });

    Route::get('/purchases/{id}', function (string $id) {
        return Inertia::render('PurchaseDetail', ['id' => $id]);
    });

    Route::get('/suppliers', function () {
        return Inertia::render('Suppliers');
    });

    Route::get('/suppliers/{id}', function (int $id) {
        return Inertia::render('SupplierDetail', ['id' => $id]);
    });

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
