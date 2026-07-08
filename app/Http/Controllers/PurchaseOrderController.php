<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReceivePurchaseOrderRequest;
use App\Http\Requests\StorePurchaseOrderRequest;
use App\Models\Medicine;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class PurchaseOrderController extends Controller
{
    public function index(): Response
    {
        $orders = PurchaseOrder::query()
            ->with('supplier:id,name')
            ->withCount('items')
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('po_number', 'like', "%{$search}%")
                        ->orWhereHas('supplier', fn ($sq) => $sq->where('name', 'like', "%{$search}%"));
                });
            })
            ->when(request('supplier_id'), fn ($query) => $query->where('supplier_id', request('supplier_id')))
            ->when(request('status') && request('status') !== 'All', fn ($query) => $query->where('status', request('status')))
            ->latest('order_date')
            ->latest('id')
            ->get();

        return Inertia::render('Purchases', [
            'orders' => $orders,
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
            'stats' => [
                'month_total' => PurchaseOrder::whereMonth('order_date', now()->month)->whereYear('order_date', now()->year)->sum('total'),
                'month_count' => PurchaseOrder::whereMonth('order_date', now()->month)->whereYear('order_date', now()->year)->count(),
                'pending_orders' => PurchaseOrder::whereIn('status', ['Ordered', 'Partial'])->count(),
                'supplier_count' => Supplier::count(),
            ],
            'filters' => request()->only(['search', 'supplier_id', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('AddPurchase', [
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
            'medicines' => Medicine::orderBy('brand_name')->get(['id', 'generic_name', 'brand_name', 'strength', 'sku', 'purchase_price']),
        ]);
    }

    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $order = DB::transaction(function () use ($data) {
            $subtotal = 0;
            $taxTotal = 0;

            foreach ($data['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $subtotal += $lineSubtotal;
                $taxTotal += $lineSubtotal * (($item['tax'] ?? 0) / 100);
            }

            $order = PurchaseOrder::create([
                'po_number' => PurchaseOrder::generatePoNumber(),
                'supplier_id' => $data['supplier_id'],
                'user_id' => request()->user()->id,
                'order_date' => $data['order_date'],
                'expected_delivery' => $data['expected_delivery'] ?? null,
                'invoice_number' => $data['invoice_number'] ?? null,
                'status' => 'Ordered',
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'total' => $subtotal + $taxTotal,
            ]);

            foreach ($data['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineTax = $lineSubtotal * (($item['tax'] ?? 0) / 100);

                $order->items()->create([
                    'medicine_id' => $item['medicine_id'],
                    'batch_number' => $item['batch_number'],
                    'expiry_date' => $item['expiry_date'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax' => $item['tax'] ?? 0,
                    'total' => $lineSubtotal + $lineTax,
                ]);
            }

            // Purchase orders are taken on credit — the supplier is owed the full
            // amount until a payment is recorded against it.
            $order->supplier->increment('outstanding_balance', $order->total);

            return $order;
        });

        return redirect()->route('purchases.show', $order)->with('success', 'Purchase order created successfully');
    }

    public function show(PurchaseOrder $purchase): Response
    {
        $purchase->load(['supplier', 'items.medicine:id,generic_name,brand_name,strength,sku']);

        return Inertia::render('PurchaseDetail', [
            'order' => $purchase,
        ]);
    }

    public function receive(ReceivePurchaseOrderRequest $request, PurchaseOrder $purchase): RedirectResponse
    {
        $quantities = collect($request->validated('items'))
            ->pluck('quantity', 'item_id')
            ->toArray();

        try {
            $purchase->receive($quantities, $request->user()->id);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['items' => $e->getMessage()]);
        }

        return redirect()->route('purchases.show', $purchase)->with('success', 'Purchase received successfully');
    }
}
