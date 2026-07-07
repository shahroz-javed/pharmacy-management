<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Http\Requests\StoreStockAdjustmentRequest;
use App\Models\Medicine;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(): Response
    {
        $medicines = Medicine::query()
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('brand_name', 'like', "%{$search}%")
                        ->orWhere('generic_name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->orderBy('brand_name')
            ->get();

        $ledgerType = request('ledger_type');

        $ledger = StockMovement::query()
            ->with('medicine:id,generic_name,brand_name,strength,sku', 'user:id,name')
            ->when($ledgerType && $ledgerType !== 'All', fn ($query) => $query->where('type', $ledgerType))
            ->latest('created_at')
            ->latest('id')
            ->paginate(25, pageName: 'ledger_page')
            ->withQueryString();

        return Inertia::render('Inventory', [
            'medicines' => $medicines,
            'ledger' => $ledger,
            'stats' => [
                'total_skus' => Medicine::count(),
                'low_stock' => Medicine::where('status', 'Low Stock')->count(),
                'out_of_stock' => Medicine::where('status', 'Out of Stock')->count(),
                'expiring_soon' => Medicine::query()
                    ->whereDate('expiry_date', '<=', now()->addMonths(6))
                    ->whereDate('expiry_date', '>=', now())
                    ->count(),
            ],
            'filters' => request()->only(['search', 'ledger_type']),
        ]);
    }

    public function storeAdjustment(StoreStockAdjustmentRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $medicine = Medicine::findOrFail($data['medicine_id']);

        [$type, $quantityIn, $quantityOut] = match ($data['adjustment_type']) {
            'Add Stock' => [StockMovementType::Adjustment, (int) $data['quantity'], 0],
            'Remove Stock' => [StockMovementType::Adjustment, 0, (int) $data['quantity']],
            'Damage Write-off' => [StockMovementType::Damaged, 0, (int) $data['quantity']],
            'Expired Write-off' => [StockMovementType::Expired, 0, (int) $data['quantity']],
        };

        if ($quantityOut > $medicine->stock) {
            throw ValidationException::withMessages([
                'quantity' => "Only {$medicine->stock} units of {$medicine->name} are in stock.",
            ]);
        }

        $medicine->applyStockMovement(
            type: $type,
            quantityIn: $quantityIn,
            quantityOut: $quantityOut,
            userId: $request->user()->id,
            reference: 'ADJ-'.now()->format('ymd').'-'.str_pad((string) (StockMovement::max('id') + 1), 3, '0', STR_PAD_LEFT),
            reason: $data['reason'] ?? null,
        );

        return redirect()->route('inventory.index')->with('success', 'Stock adjustment saved successfully');
    }
}
