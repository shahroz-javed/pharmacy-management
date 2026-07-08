<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\StoreSaleReturnRequest;
use App\Models\Customer;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\SaleReturn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class SaleController extends Controller
{
    public function index(): Response
    {
        $sales = Sale::query()
            ->with('customer:id,name')
            ->withCount('items')
            ->where('status', '!=', 'Held')
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'like', "%{$search}%"));
                });
            })
            ->when(request('status') && request('status') !== 'All', fn ($query) => $query->where('status', request('status')))
            ->when(request('payment_method') && request('payment_method') !== 'All', fn ($query) => $query->where('payment_method', request('payment_method')))
            ->when(request('date'), fn ($query) => $query->whereDate('sold_at', request('date')))
            ->latest('sold_at')
            ->latest('id')
            ->get();

        return Inertia::render('Sales', [
            'sales' => $sales,
            'stats' => [
                'today_total' => Sale::whereDate('sold_at', today())->where('status', '!=', 'Held')->sum('total'),
                'today_count' => Sale::whereDate('sold_at', today())->where('status', '!=', 'Held')->count(),
                'week_total' => Sale::whereBetween('sold_at', [now()->startOfWeek(), now()->endOfWeek()])->where('status', '!=', 'Held')->sum('total'),
                'week_count' => Sale::whereBetween('sold_at', [now()->startOfWeek(), now()->endOfWeek()])->where('status', '!=', 'Held')->count(),
                'returns_total' => SaleReturn::whereDate('created_at', '>=', now()->startOfWeek())->sum('refund_amount'),
                'returns_count' => SaleReturn::whereDate('created_at', '>=', now()->startOfWeek())->count(),
            ],
            'filters' => request()->only(['search', 'status', 'payment_method', 'date']),
        ]);
    }

    public function pos(): Response
    {
        return Inertia::render('POS', [
            'medicines' => Medicine::where('stock', '>', 0)->orderBy('brand_name')->get(),
            'customers' => Customer::orderBy('name')->get(['id', 'name', 'phone', 'credit_balance']),
            'heldSales' => Sale::where('status', 'Held')->with('items.medicine')->latest()->get(),
        ]);
    }

    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $sale = DB::transaction(function () use ($data, $request) {
                $subtotal = 0;
                $discountTotal = 0;
                $taxTotal = 0;

                foreach ($data['items'] as $item) {
                    $lineGross = $item['quantity'] * $item['unit_price'];
                    $lineDiscount = $lineGross * (($item['discount'] ?? 0) / 100);
                    $lineTax = ($lineGross - $lineDiscount) * (($item['tax'] ?? 0) / 100);
                    $subtotal += $lineGross;
                    $discountTotal += $lineDiscount;
                    $taxTotal += $lineTax;
                }

                $total = $subtotal - $discountTotal + $taxTotal;
                $payments = collect($data['payments'] ?? []);
                $isPaid = $data['status'] === 'Paid';

                if ($isPaid && $payments->sum('amount') < round($total, 2) - 0.01) {
                    throw new InvalidArgumentException('Payment amount is less than the sale total.');
                }

                $creditAmount = $payments->where('method', 'Credit')->sum('amount');
                if ($creditAmount > 0 && empty($data['customer_id'])) {
                    throw new InvalidArgumentException('A customer must be selected for credit sales.');
                }

                $methods = $payments->pluck('method')->unique();
                $paymentMethod = $methods->count() > 1 ? 'Split' : $methods->first() ?? 'Cash';

                $sale = Sale::create([
                    'invoice_number' => Sale::generateInvoiceNumber(),
                    'customer_id' => $data['customer_id'] ?? null,
                    'user_id' => $request->user()->id,
                    'subtotal' => $subtotal,
                    'discount_total' => $discountTotal,
                    'tax_total' => $taxTotal,
                    'total' => $total,
                    'payment_method' => $isPaid ? $paymentMethod : 'Cash',
                    'amount_paid' => $isPaid ? $payments->sum('amount') : 0,
                    'status' => $data['status'],
                    'hold_reference' => $data['hold_reference'] ?? null,
                    'prescription_path' => $data['prescription_path'] ?? null,
                    'sold_at' => $isPaid ? now() : null,
                ]);

                foreach ($data['items'] as $item) {
                    $lineGross = $item['quantity'] * $item['unit_price'];
                    $lineDiscount = $lineGross * (($item['discount'] ?? 0) / 100);
                    $lineTax = ($lineGross - $lineDiscount) * (($item['tax'] ?? 0) / 100);

                    $saleItem = $sale->items()->create([
                        'medicine_id' => $item['medicine_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount' => $item['discount'] ?? 0,
                        'tax' => $item['tax'] ?? 0,
                        'total' => $lineGross - $lineDiscount + $lineTax,
                    ]);

                    if ($isPaid) {
                        $medicine = Medicine::findOrFail($item['medicine_id']);
                        $medicine->applyStockMovement(
                            type: StockMovementType::Sale,
                            quantityIn: 0,
                            quantityOut: $item['quantity'],
                            userId: $request->user()->id,
                            reference: $sale->invoice_number,
                            reason: 'POS sale',
                        );
                    }
                }

                if ($isPaid) {
                    foreach ($payments as $payment) {
                        $sale->payments()->create($payment);
                    }

                    if ($creditAmount > 0) {
                        Customer::where('id', $data['customer_id'])->increment('credit_balance', $creditAmount);
                    }

                    if (! empty($data['customer_id'])) {
                        $pointsEarned = (int) floor($total / 100);
                        if ($pointsEarned > 0) {
                            $sale->customer->adjustLoyaltyPoints($pointsEarned, 'Earn');
                            $sale->update(['loyalty_points_earned' => $pointsEarned]);
                        }
                    }
                }

                return $sale;
            });
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['items' => $e->getMessage()]);
        }

        return redirect()->route('sales.show', $sale)->with('success', $sale->status === 'Held' ? 'Sale held successfully' : 'Sale completed successfully');
    }

    public function show(Sale $sale): Response
    {
        $sale->load(['customer', 'items.medicine:id,generic_name,brand_name,strength,sku', 'payments', 'returns.items.saleItem.medicine:id,generic_name,brand_name,strength,sku', 'user:id,name']);

        return Inertia::render('SaleDetail', [
            'sale' => $sale,
        ]);
    }

    public function storeReturn(StoreSaleReturnRequest $request, Sale $sale): RedirectResponse
    {
        $data = $request->validated();

        $quantities = collect($data['items'])
            ->pluck('quantity', 'item_id')
            ->toArray();

        try {
            $sale->processReturn($quantities, $data['refund_method'], $data['reason'] ?? null, $request->user()->id);
        } catch (InvalidArgumentException $e) {
            throw ValidationException::withMessages(['items' => $e->getMessage()]);
        }

        return redirect()->route('sales.show', $sale)->with('success', 'Return processed successfully');
    }
}
