<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

#[Fillable([
    'generic_name', 'brand_name', 'category', 'manufacturer', 'strength', 'dosage_form', 'unit',
    'sku', 'barcode', 'prescription_required', 'description',
    'purchase_price', 'selling_price', 'mrp', 'tax', 'wholesale_price', 'discount',
    'batch_number', 'expiry_date', 'stock', 'reorder_level', 'storage_location', 'temperature_storage',
    'image_path', 'status',
])]
class Medicine extends Model
{
    protected static function booted(): void
    {
        static::saving(function (Medicine $medicine) {
            if (! in_array($medicine->status, ['Discontinued', 'Inactive'], true)) {
                $medicine->status = $medicine->stock <= 0
                    ? 'Out of Stock'
                    : ($medicine->stock <= $medicine->reorder_level ? 'Low Stock' : 'In Stock');
            }
        });
    }

    protected function casts(): array
    {
        return [
            'prescription_required' => 'boolean',
            'purchase_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'mrp' => 'decimal:2',
            'tax' => 'decimal:2',
            'wholesale_price' => 'decimal:2',
            'discount' => 'decimal:2',
            'expiry_date' => 'date',
        ];
    }

    public function getNameAttribute(): string
    {
        return trim("{$this->brand_name} {$this->strength}");
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * Atomically adjust stock and record the movement in the ledger.
     */
    public function applyStockMovement(
        StockMovementType $type,
        int $quantityIn,
        int $quantityOut,
        ?int $userId = null,
        ?string $reference = null,
        ?string $reason = null,
    ): StockMovement {
        return DB::transaction(function () use ($type, $quantityIn, $quantityOut, $userId, $reference, $reason) {
            $medicine = static::query()->lockForUpdate()->findOrFail($this->id);

            $newStock = $medicine->stock + $quantityIn - $quantityOut;

            if ($newStock < 0) {
                throw new InvalidArgumentException("Insufficient stock for {$medicine->name}: has {$medicine->stock}, needs {$quantityOut}.");
            }

            $medicine->stock = $newStock;
            $medicine->save();

            $movement = $medicine->stockMovements()->create([
                'user_id' => $userId,
                'type' => $type,
                'quantity_in' => $quantityIn,
                'quantity_out' => $quantityOut,
                'balance_after' => $newStock,
                'reference' => $reference,
                'reason' => $reason,
            ]);

            $this->setRawAttributes($medicine->getAttributes());

            return $movement;
        });
    }
}
