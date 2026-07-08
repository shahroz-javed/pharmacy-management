<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierPaymentRequest;
use App\Http\Requests\StoreSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(): Response
    {
        $suppliers = Supplier::query()
            ->withCount('purchaseOrders')
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('contact_person', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->get()
            ->map(fn (Supplier $supplier) => [
                ...$supplier->toArray(),
                'orders' => $supplier->purchase_orders_count,
                'last_order' => $supplier->purchaseOrders()->latest('order_date')->value('order_date'),
            ]);

        return Inertia::render('Suppliers', [
            'suppliers' => $suppliers,
            'filters' => request()->only(['search']),
        ]);
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        Supplier::create($request->validated());

        return redirect()->route('suppliers.index')->with('success', 'Supplier added successfully');
    }

    public function show(Supplier $supplier): Response
    {
        $supplier->load(['purchaseOrders' => fn ($q) => $q->latest('order_date')]);

        return Inertia::render('SupplierDetail', [
            'supplier' => $supplier,
        ]);
    }

    public function update(StoreSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());

        return redirect()->route('suppliers.index')->with('success', 'Supplier updated successfully');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return redirect()->route('suppliers.index')->with('success', 'Supplier deleted successfully');
    }

    public function storePayment(StoreSupplierPaymentRequest $request, Supplier $supplier): RedirectResponse
    {
        $data = $request->validated();

        $supplier->recordPayment(
            amount: (float) $data['amount'],
            method: $data['method'],
            purchaseOrderId: $data['purchase_order_id'] ?? null,
            userId: $request->user()->id,
            notes: $data['notes'] ?? null,
        );

        return redirect()->route('suppliers.show', $supplier)->with('success', 'Payment recorded successfully');
    }
}
