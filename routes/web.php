<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::redirect('/', '/dashboard');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
});

Route::get('/pos', function () {
    return Inertia::render('POS');
});

Route::get('/medicines', function () {
    return Inertia::render('Medicines');
});

Route::get('/medicines/add', function () {
    return Inertia::render('AddMedicine');
});

Route::get('/medicines/{id}/edit', function (int $id) {
    return Inertia::render('AddMedicine', ['id' => $id]);
});

Route::get('/medicines/{id}', function (int $id) {
    return Inertia::render('MedicineDetail', ['id' => $id]);
});

Route::get('/inventory', function () {
    return Inertia::render('Inventory');
});

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
