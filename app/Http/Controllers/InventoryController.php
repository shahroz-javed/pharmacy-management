<?php

namespace App\Http\Controllers;

use App\Enums\StockMovementType;
use App\Http\Requests\StoreInventoryAuditRequest;
use App\Http\Requests\StoreStockAdjustmentRequest;
use App\Http\Requests\StoreStockReturnRequest;
use App\Http\Requests\StoreStockTransferRequest;
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

        $this->assertSufficientStock($medicine, $quantityOut);

        $medicine->applyStockMovement(
            type: $type,
            quantityIn: $quantityIn,
            quantityOut: $quantityOut,
            userId: $request->user()->id,
            reference: $this->nextReference('ADJ'),
            reason: $data['reason'] ?? null,
        );

        return redirect()->route('inventory.index')->with('success', 'Stock adjustment saved successfully');
    }

    public function storeReturn(StoreStockReturnRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $medicine = Medicine::findOrFail($data['medicine_id']);
        $quantity = (int) $data['quantity'];

        [$quantityIn, $quantityOut] = $data['direction'] === 'Customer Return'
            ? [$quantity, 0]
            : [0, $quantity];

        $this->assertSufficientStock($medicine, $quantityOut);

        $medicine->applyStockMovement(
            type: StockMovementType::Returned,
            quantityIn: $quantityIn,
            quantityOut: $quantityOut,
            userId: $request->user()->id,
            reference: $this->nextReference('RET'),
            reason: trim($data['direction'].(($data['reason'] ?? null) ? " — {$data['reason']}" : '')),
        );

        return redirect()->route('inventory.index')->with('success', 'Stock return recorded successfully');
    }

    public function storeTransfer(StoreStockTransferRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $medicine = Medicine::findOrFail($data['medicine_id']);

        // Transfers move stock between locations within the same store, so the
        // net quantity on the medicine record does not change — only the ledger
        // records where it went, since there is no separate per-location stock table.
        $medicine->applyStockMovement(
            type: StockMovementType::Transfer,
            quantityIn: 0,
            quantityOut: 0,
            userId: $request->user()->id,
            reference: $this->nextReference('TRF'),
            reason: $data['reason'] ?? null,
            fromLocation: $data['from_location'],
            toLocation: $data['to_location'],
        );

        return redirect()->route('inventory.index')->with('success', 'Stock transfer recorded successfully');
    }

    public function storeAudit(StoreInventoryAuditRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $medicine = Medicine::findOrFail($data['medicine_id']);
        $counted = (int) $data['counted_quantity'];
        $variance = $counted - $medicine->stock;

        if ($variance === 0) {
            return redirect()->route('inventory.index')->with('success', 'Counted quantity matches system stock — no adjustment needed');
        }

        $medicine->applyStockMovement(
            type: StockMovementType::Adjustment,
            quantityIn: $variance > 0 ? $variance : 0,
            quantityOut: $variance < 0 ? abs($variance) : 0,
            userId: $request->user()->id,
            reference: $this->nextReference('AUD'),
            reason: trim("Inventory audit — counted {$counted}, system had {$medicine->stock}".(($data['reason'] ?? null) ? ". {$data['reason']}" : '')),
        );

        return redirect()->route('inventory.index')->with('success', 'Inventory audit applied successfully');
    }

    private function assertSufficientStock(Medicine $medicine, int $quantityOut): void
    {
        if ($quantityOut > $medicine->stock) {
            throw ValidationException::withMessages([
                'quantity' => "Only {$medicine->stock} units of {$medicine->name} are in stock.",
            ]);
        }
    }

    private function nextReference(string $prefix): string
    {
        return $prefix.'-'.now()->format('ymd').'-'.str_pad((string) (StockMovement::max('id') + 1), 3, '0', STR_PAD_LEFT);
    }
}
