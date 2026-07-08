<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerCreditPaymentRequest;
use App\Http\Requests\StoreCustomerLoyaltyRequest;
use App\Http\Requests\StoreCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        $customers = Customer::query()
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('Customers', [
            'customers' => $customers,
            'filters' => request()->only(['search']),
        ]);
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        Customer::create($request->validated());

        return redirect()->route('customers.index')->with('success', 'Customer added successfully');
    }

    public function show(Customer $customer): Response
    {
        $customer->load(['creditPayments' => fn ($q) => $q->latest()]);

        return Inertia::render('CustomerDetail', [
            'customer' => $customer,
        ]);
    }

    public function update(StoreCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        return redirect()->route('customers.index')->with('success', 'Customer updated successfully');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $customer->delete();

        return redirect()->route('customers.index')->with('success', 'Customer deleted successfully');
    }

    public function storeCreditPayment(StoreCustomerCreditPaymentRequest $request, Customer $customer): RedirectResponse
    {
        $data = $request->validated();

        $customer->recordCreditPayment(
            amount: (float) $data['amount'],
            method: $data['method'],
            userId: $request->user()->id,
            notes: $data['notes'] ?? null,
        );

        return redirect()->route('customers.show', $customer)->with('success', 'Payment recorded successfully');
    }

    public function storeLoyalty(StoreCustomerLoyaltyRequest $request, Customer $customer): RedirectResponse
    {
        $data = $request->validated();

        $customer->adjustLoyaltyPoints((int) $data['points'], $data['type']);

        return redirect()->route('customers.show', $customer)->with('success', 'Loyalty points updated successfully');
    }
}
