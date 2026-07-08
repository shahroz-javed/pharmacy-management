<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\PurchaseOrder;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Support\Carbon as SupportCarbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(): Response
    {
        $type = request('type', 'sales');
        [$from, $to] = $this->resolveRange();

        return Inertia::render('Reports', [
            'reportType' => $type,
            'period' => request('period', 'monthly'),
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'data' => $this->buildReport($type, $from, $to),
        ]);
    }

    public function export(string $type): StreamedResponse
    {
        [$from, $to] = $this->resolveRange();
        $data = $this->buildReport($type, $from, $to);

        $rows = $data['rows'] ?? [];
        $filename = "{$type}-report-{$from->toDateString()}-to-{$to->toDateString()}.csv";

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            if (! empty($rows)) {
                fputcsv($handle, array_keys($rows[0]));
                foreach ($rows as $row) {
                    fputcsv($handle, $row);
                }
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveRange(): array
    {
        $period = request('period', 'monthly');

        if ($period === 'custom' && request('from') && request('to')) {
            return [SupportCarbon::parse(request('from'))->startOfDay(), SupportCarbon::parse(request('to'))->endOfDay()];
        }

        return match ($period) {
            'daily' => [now()->startOfDay(), now()->endOfDay()],
            'weekly' => [now()->startOfWeek(), now()->endOfWeek()],
            'yearly' => [now()->startOfYear(), now()->endOfYear()],
            default => [now()->startOfMonth(), now()->endOfMonth()],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function buildReport(string $type, Carbon $from, Carbon $to): array
    {
        return match ($type) {
            'sales' => $this->salesReport($from, $to),
            'purchase' => $this->purchaseReport($from, $to),
            'inventory' => $this->inventoryReport(),
            'profit' => $this->profitReport($from, $to),
            'tax' => $this->taxReport($from, $to),
            'expiry' => $this->expiryReport(),
            'topselling' => $this->topSellingReport($from, $to),
            'deadstock' => $this->deadStockReport($from, $to),
            'daily' => $this->dailySalesReport($from, $to),
            'monthly' => $this->monthlySalesReport($from, $to),
            default => [],
        };
    }

    private function paidSales(Carbon $from, Carbon $to)
    {
        return Sale::where('status', '!=', 'Held')->whereBetween('sold_at', [$from, $to]);
    }

    private function salesReport(Carbon $from, Carbon $to): array
    {
        $sales = $this->paidSales($from, $to)->get();
        $returnsTotal = SaleReturn::whereHas('sale', fn ($q) => $q->whereBetween('sold_at', [$from, $to]))->sum('refund_amount');

        $byDay = $sales->groupBy(fn (Sale $s) => $s->sold_at->toDateString())
            ->map(function ($daySales, $date) {
                $gross = $daySales->sum('total');
                $tax = $daySales->sum('tax_total');

                return [
                    'date' => $date,
                    'transactions' => $daySales->count(),
                    'gross_sales' => round((float) $gross, 2),
                    'tax' => round((float) $tax, 2),
                ];
            })
            ->sortBy('date')
            ->values();

        return [
            'stats' => [
                'total_sales' => round((float) $sales->sum('total'), 2),
                'transactions' => $sales->count(),
                'avg_sale' => $sales->count() > 0 ? round((float) $sales->sum('total') / $sales->count(), 2) : 0,
                'returns_total' => round((float) $returnsTotal, 2),
            ],
            'chart' => $byDay->map(fn ($d) => ['date' => $d['date'], 'sales' => $d['gross_sales']])->values(),
            'rows' => $byDay->toArray(),
        ];
    }

    private function purchaseReport(Carbon $from, Carbon $to): array
    {
        $orders = PurchaseOrder::with('supplier:id,name')->whereBetween('order_date', [$from, $to])->get();

        $bySupplier = $orders->groupBy('supplier_id')->map(function ($group) {
            return [
                'supplier' => $group->first()->supplier->name ?? 'Unknown',
                'orders' => $group->count(),
                'total' => round((float) $group->sum('total'), 2),
            ];
        })->values();

        return [
            'stats' => [
                'total_purchases' => round((float) $orders->sum('total'), 2),
                'order_count' => $orders->count(),
                'received_count' => $orders->where('status', 'Received')->count(),
                'pending_count' => $orders->whereIn('status', ['Ordered', 'Partial'])->count(),
            ],
            'chart' => $bySupplier->map(fn ($r) => ['date' => $r['supplier'], 'sales' => $r['total']])->values(),
            'rows' => $bySupplier->toArray(),
        ];
    }

    private function inventoryReport(): array
    {
        $medicines = Medicine::orderBy('brand_name')->get();
        $byStatus = $medicines->groupBy('status')->map->count();

        $rows = $medicines->map(fn (Medicine $m) => [
            'medicine' => $m->name,
            'category' => $m->category,
            'stock' => $m->stock,
            'reorder_level' => $m->reorder_level,
            'status' => $m->status,
            'stock_value' => round((float) $m->purchase_price * $m->stock, 2),
        ])->toArray();

        return [
            'stats' => [
                'total_medicines' => $medicines->count(),
                'in_stock' => $byStatus->get('In Stock', 0),
                'low_stock' => $byStatus->get('Low Stock', 0),
                'out_of_stock' => $byStatus->get('Out of Stock', 0),
                'stock_value' => round($medicines->sum(fn (Medicine $m) => (float) $m->purchase_price * $m->stock), 2),
            ],
            'rows' => $rows,
        ];
    }

    private function profitReport(Carbon $from, Carbon $to): array
    {
        $saleItems = SaleItem::with('medicine:id,generic_name,brand_name,strength,purchase_price')
            ->whereHas('sale', fn ($q) => $q->where('status', '!=', 'Held')->whereBetween('sold_at', [$from, $to]))
            ->get();

        $revenue = (float) $saleItems->sum('total');
        $cost = $saleItems->sum(fn (SaleItem $i) => (float) $i->medicine->purchase_price * $i->quantity);
        $purchaseCost = (float) PurchaseOrder::whereBetween('order_date', [$from, $to])->sum('total');

        $byDay = $saleItems->groupBy(fn (SaleItem $i) => $i->sale->sold_at->toDateString())
            ->map(function ($items, $date) {
                $rev = (float) $items->sum('total');
                $cogs = $items->sum(fn (SaleItem $i) => (float) $i->medicine->purchase_price * $i->quantity);

                return ['date' => $date, 'revenue' => round($rev, 2), 'cost' => round($cogs, 2), 'profit' => round($rev - $cogs, 2)];
            })
            ->sortBy('date')
            ->values();

        return [
            'stats' => [
                'revenue' => round($revenue, 2),
                'cost_of_goods' => round($cost, 2),
                'gross_profit' => round($revenue - $cost, 2),
                'purchase_cost' => round($purchaseCost, 2),
            ],
            'chart' => $byDay->map(fn ($d) => ['date' => $d['date'], 'sales' => $d['profit']])->values(),
            'rows' => $byDay->toArray(),
        ];
    }

    private function taxReport(Carbon $from, Carbon $to): array
    {
        $sales = $this->paidSales($from, $to)->get();
        $purchases = PurchaseOrder::whereBetween('order_date', [$from, $to])->get();

        $byDay = $sales->groupBy(fn (Sale $s) => $s->sold_at->toDateString())
            ->map(fn ($daySales, $date) => [
                'date' => $date,
                'sales_tax_collected' => round((float) $daySales->sum('tax_total'), 2),
                'taxable_sales' => round((float) $daySales->sum('subtotal'), 2),
            ])
            ->sortBy('date')
            ->values();

        return [
            'stats' => [
                'tax_collected' => round((float) $sales->sum('tax_total'), 2),
                'tax_paid_on_purchases' => round((float) $purchases->sum('tax_total'), 2),
                'net_tax_liability' => round((float) $sales->sum('tax_total') - (float) $purchases->sum('tax_total'), 2),
                'taxable_sales' => round((float) $sales->sum('subtotal'), 2),
            ],
            'rows' => $byDay->toArray(),
        ];
    }

    private function expiryReport(): array
    {
        $soon = now()->addDays(90);

        $medicines = Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $soon)
            ->where('stock', '>', 0)
            ->orderBy('expiry_date')
            ->get();

        $expired = $medicines->filter(fn (Medicine $m) => $m->expiry_date->isPast());
        $expiringSoon = $medicines->filter(fn (Medicine $m) => ! $m->expiry_date->isPast());

        $rows = $medicines->map(fn (Medicine $m) => [
            'medicine' => $m->name,
            'batch_number' => $m->batch_number,
            'expiry_date' => $m->expiry_date->toDateString(),
            'stock' => $m->stock,
            'days_remaining' => (int) now()->startOfDay()->diffInDays($m->expiry_date->startOfDay(), false),
            'status' => $m->expiry_date->isPast() ? 'Expired' : 'Expiring Soon',
        ])->toArray();

        return [
            'stats' => [
                'expired_count' => $expired->count(),
                'expiring_soon_count' => $expiringSoon->count(),
                'expired_stock_value' => round($expired->sum(fn (Medicine $m) => (float) $m->purchase_price * $m->stock), 2),
                'at_risk_stock_value' => round($medicines->sum(fn (Medicine $m) => (float) $m->purchase_price * $m->stock), 2),
            ],
            'rows' => $rows,
        ];
    }

    private function topSellingReport(Carbon $from, Carbon $to): array
    {
        $items = SaleItem::with('medicine:id,generic_name,brand_name,strength,category,purchase_price')
            ->whereHas('sale', fn ($q) => $q->where('status', '!=', 'Held')->whereBetween('sold_at', [$from, $to]))
            ->get();

        $totalRevenue = (float) $items->sum('total');

        $rows = $items->groupBy('medicine_id')
            ->map(function ($group) use ($totalRevenue) {
                $medicine = $group->first()->medicine;
                $revenue = (float) $group->sum('total');
                $unitsSold = (int) $group->sum('quantity');
                $cost = $unitsSold * (float) $medicine->purchase_price;

                return [
                    'medicine' => $medicine->name,
                    'category' => $medicine->category,
                    'units_sold' => $unitsSold,
                    'revenue' => round($revenue, 2),
                    'profit' => round($revenue - $cost, 2),
                    'share_pct' => $totalRevenue > 0 ? round($revenue / $totalRevenue * 100, 1) : 0,
                ];
            })
            ->sortByDesc('revenue')
            ->values()
            ->toArray();

        return [
            'stats' => [
                'total_revenue' => round($totalRevenue, 2),
                'medicines_sold' => count($rows),
                'total_units' => $items->sum('quantity'),
            ],
            'rows' => $rows,
        ];
    }

    private function deadStockReport(Carbon $from, Carbon $to): array
    {
        $soldMedicineIds = StockMovement::where('type', 'Sale')
            ->whereBetween('created_at', [$from, $to])
            ->distinct()
            ->pluck('medicine_id');

        $deadStock = Medicine::where('stock', '>', 0)
            ->whereNotIn('id', $soldMedicineIds)
            ->orderByDesc('stock')
            ->get();

        $rows = $deadStock->map(fn (Medicine $m) => [
            'medicine' => $m->name,
            'category' => $m->category,
            'stock' => $m->stock,
            'stock_value' => round((float) $m->purchase_price * $m->stock, 2),
            'last_sold' => optional(
                StockMovement::where('medicine_id', $m->id)->where('type', 'Sale')->latest('created_at')->first()
            )?->created_at?->toDateString() ?? 'Never',
        ])->toArray();

        return [
            'stats' => [
                'dead_stock_count' => $deadStock->count(),
                'dead_stock_value' => round($deadStock->sum(fn (Medicine $m) => (float) $m->purchase_price * $m->stock), 2),
            ],
            'rows' => $rows,
        ];
    }

    private function dailySalesReport(Carbon $from, Carbon $to): array
    {
        return $this->salesReport($from, $to);
    }

    private function monthlySalesReport(Carbon $from, Carbon $to): array
    {
        $sales = Sale::where('status', '!=', 'Held')->whereBetween('sold_at', [$from, $to])->get();

        $byMonth = $sales->groupBy(fn (Sale $s) => $s->sold_at->format('Y-m'))
            ->map(fn ($group, $month) => [
                'month' => $month,
                'transactions' => $group->count(),
                'total_sales' => round((float) $group->sum('total'), 2),
                'avg_sale' => $group->count() > 0 ? round((float) $group->sum('total') / $group->count(), 2) : 0,
            ])
            ->sortBy('month')
            ->values();

        return [
            'stats' => [
                'total_sales' => round((float) $sales->sum('total'), 2),
                'transactions' => $sales->count(),
                'months_covered' => $byMonth->count(),
            ],
            'chart' => $byMonth->map(fn ($d) => ['date' => $d['month'], 'sales' => $d['total_sales']])->values(),
            'rows' => $byMonth->toArray(),
        ];
    }
}
