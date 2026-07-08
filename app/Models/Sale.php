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
    'invoice_number', 'customer_id', 'user_id', 'subtotal', 'discount_total', 'tax_total', 'total',
    'payment_method', 'amount_paid', 'loyalty_points_earned', 'status', 'hold_reference',
    'prescription_path', 'prescription_id', 'sold_at',
])]
class Sale extends Model
{
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'loyalty_points_earned' => 'integer',
            'sold_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturn::class);
    }

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public static function generateInvoiceNumber(): string
    {
        $sequence = str_pad((string) (static::max('id') + 1), 3, '0', STR_PAD_LEFT);

        return 'INV-'.now()->format('ym').'-'.$sequence;
    }

    /**
     * Process a return/refund for some or all of the given sale items, restocking
     * the medicine and recording a Returned movement per item.
     *
     * @param  array<int, int>  $quantities  sale_item_id => quantity to return
     */
    public function processReturn(array $quantities, string $refundMethod, ?string $reason, ?int $userId = null): SaleReturn
    {
        return DB::transaction(function () use ($quantities, $refundMethod, $reason, $userId) {
            $items = $this->items()->whereIn('id', array_keys($quantities))->get()->keyBy('id');

            $saleReturn = $this->returns()->create([
                'user_id' => $userId,
                'refund_amount' => 0,
                'refund_method' => $refundMethod,
                'reason' => $reason,
            ]);

            $refundTotal = 0;

            foreach ($quantities as $itemId => $quantity) {
                $quantity = (int) $quantity;
                if ($quantity <= 0) {
                    continue;
                }

                /** @var SaleItem $item */
                $item = $items->get($itemId);
                if (! $item) {
                    continue;
                }

                $remaining = $item->quantity - $item->quantity_returned;
                if ($quantity > $remaining) {
                    throw new InvalidArgumentException("Cannot return {$quantity} units — only {$remaining} remaining for this item.");
                }

                $unitTotal = $item->quantity > 0 ? $item->total / $item->quantity : 0;
                $amount = round($unitTotal * $quantity, 2);

                $item->medicine->applyStockMovement(
                    type: StockMovementType::Returned,
                    quantityIn: $quantity,
                    quantityOut: 0,
                    userId: $userId,
                    reference: $this->invoice_number,
                    reason: $reason ?? 'Customer return',
                );

                $item->increment('quantity_returned', $quantity);

                $saleReturn->items()->create([
                    'sale_item_id' => $item->id,
                    'quantity' => $quantity,
                    'amount' => $amount,
                ]);

                $refundTotal += $amount;
            }

            $saleReturn->update(['refund_amount' => $refundTotal]);

            $this->refresh();
            $allReturned = $this->items->every(fn (SaleItem $item) => $item->quantity_returned >= $item->quantity);
            $anyReturned = $this->items->contains(fn (SaleItem $item) => $item->quantity_returned > 0);

            $this->status = $allReturned ? 'Returned' : ($anyReturned ? 'Partially Returned' : $this->status);
            $this->save();

            return $saleReturn;
        });
    }
}
