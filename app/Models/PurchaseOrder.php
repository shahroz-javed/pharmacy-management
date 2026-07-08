<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

#[Fillable([
    'po_number', 'supplier_id', 'user_id', 'order_date', 'expected_delivery',
    'invoice_number', 'status', 'subtotal', 'tax_total', 'total',
])]
class PurchaseOrder extends Model
{
    protected function casts(): array
    {
        return [
            'order_date' => 'date:Y-m-d',
            'expected_delivery' => 'date:Y-m-d',
            'subtotal' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public static function generatePoNumber(): string
    {
        $sequence = str_pad((string) (static::max('id') + 1), 3, '0', STR_PAD_LEFT);

        return 'PO-'.now()->format('ym').'-'.$sequence;
    }

    /**
     * Receive some or all of the ordered quantity for each given item, pushing
     * stock into the medicine catalogue and recording a Purchase movement per item.
     *
     * @param  array<int, int>  $quantities  purchase_order_item_id => quantity to receive now
     */
    public function receive(array $quantities, ?int $userId = null): void
    {
        DB::transaction(function () use ($quantities, $userId) {
            $items = $this->items()->whereIn('id', array_keys($quantities))->get()->keyBy('id');

            foreach ($quantities as $itemId => $quantity) {
                $quantity = (int) $quantity;
                if ($quantity <= 0) {
                    continue;
                }

                /** @var PurchaseOrderItem $item */
                $item = $items->get($itemId);
                if (! $item) {
                    continue;
                }

                $remaining = $item->quantity - $item->quantity_received;
                if ($quantity > $remaining) {
                    throw new InvalidArgumentException("Cannot receive {$quantity} units — only {$remaining} remaining for this item.");
                }

                $item->medicine->applyStockMovement(
                    type: StockMovementType::Purchase,
                    quantityIn: $quantity,
                    quantityOut: 0,
                    userId: $userId,
                    reference: $this->po_number,
                    reason: "Received from {$this->supplier->name}",
                    batchNumber: $item->batch_number,
                    expiryDate: $item->expiry_date->format('Y-m-d'),
                );

                $item->increment('quantity_received', $quantity);
            }

            $this->refresh();
            $allReceived = $this->items->every(fn (PurchaseOrderItem $item) => $item->quantity_received >= $item->quantity);
            $anyReceived = $this->items->contains(fn (PurchaseOrderItem $item) => $item->quantity_received > 0);

            $this->status = $allReceived ? 'Received' : ($anyReceived ? 'Partial' : 'Ordered');
            $this->save();
        });
    }
}
