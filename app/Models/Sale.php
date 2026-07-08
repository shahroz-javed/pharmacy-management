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
            $saleReturn = $this->returns()->create([
                'user_id' => $userId,
                'refund_amount' => 0,
                'refund_method' => $refundMethod,
                'reason' => $reason,
            ]);

            $refundTotal = $this->returnItems($quantities, $saleReturn, $reason, $userId);

            $saleReturn->update(['refund_amount' => $refundTotal]);
            $this->syncReturnStatus();

            return $saleReturn;
        });
    }

    /**
     * Return some or all of the given sale items and, in the same transaction,
     * ring up a brand-new Sale for the replacement items. Any price difference
     * between what was returned and what was taken instead is settled via an
     * additional payment (customer owes more) or added to the refund (store owes
     * the customer). The two sides are linked through SaleReturn::exchange_sale_id.
     *
     * @param  array<int, int>  $returnQuantities  sale_item_id => quantity to return
     * @param  array<int, array{medicine_id: int, quantity: int, unit_price: float, discount?: float, tax?: float}>  $replacementItems
     */
    public function processExchange(array $returnQuantities, array $replacementItems, string $refundMethod, ?string $reason, ?int $userId = null): SaleReturn
    {
        return DB::transaction(function () use ($returnQuantities, $replacementItems, $refundMethod, $reason, $userId) {
            $saleReturn = $this->returns()->create([
                'user_id' => $userId,
                'refund_amount' => 0,
                'refund_method' => $refundMethod,
                'reason' => $reason,
            ]);

            $refundTotal = $this->returnItems($returnQuantities, $saleReturn, $reason, $userId);
            $this->syncReturnStatus();

            $replacementSale = null;
            $replacementTotal = 0;

            if (! empty($replacementItems)) {
                $replacementSale = static::create([
                    'invoice_number' => static::generateInvoiceNumber(),
                    'customer_id' => $this->customer_id,
                    'user_id' => $userId,
                    'status' => 'Paid',
                    'payment_method' => 'Cash',
                    'sold_at' => now(),
                ]);

                $subtotal = 0;
                $discountTotal = 0;
                $taxTotal = 0;

                foreach ($replacementItems as $item) {
                    $lineGross = $item['quantity'] * $item['unit_price'];
                    $lineDiscount = $lineGross * (($item['discount'] ?? 0) / 100);
                    $lineTax = ($lineGross - $lineDiscount) * (($item['tax'] ?? 0) / 100);
                    $lineTotal = $lineGross - $lineDiscount + $lineTax;

                    $subtotal += $lineGross;
                    $discountTotal += $lineDiscount;
                    $taxTotal += $lineTax;
                    $replacementTotal += $lineTotal;

                    $replacementSale->items()->create([
                        'medicine_id' => $item['medicine_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount' => $item['discount'] ?? 0,
                        'tax' => $item['tax'] ?? 0,
                        'total' => $lineTotal,
                    ]);

                    Medicine::findOrFail($item['medicine_id'])->applyStockMovement(
                        type: StockMovementType::Sale,
                        quantityIn: 0,
                        quantityOut: $item['quantity'],
                        userId: $userId,
                        reference: $replacementSale->invoice_number,
                        reason: "Exchange for {$this->invoice_number}",
                    );
                }

                $difference = round($replacementTotal - $refundTotal, 2);
                $amountPaid = max($difference, 0);

                $replacementSale->update([
                    'subtotal' => $subtotal,
                    'discount_total' => $discountTotal,
                    'tax_total' => $taxTotal,
                    'total' => $replacementTotal,
                    'amount_paid' => $amountPaid,
                ]);

                if ($amountPaid > 0) {
                    $replacementSale->payments()->create(['method' => $refundMethod === 'Store Credit' ? 'Cash' : $refundMethod, 'amount' => $amountPaid]);
                }

                // The returned value first pays for the replacement items; only
                // whatever is left over (if the replacement costs less) is an
                // actual cash refund back to the customer.
                $refundTotal = max(round($refundTotal - $replacementTotal, 2), 0);

                $saleReturn->update(['exchange_sale_id' => $replacementSale->id]);
            }

            $saleReturn->update(['refund_amount' => max($refundTotal, 0)]);

            return $saleReturn;
        });
    }

    /**
     * @param  array<int, int>  $quantities  sale_item_id => quantity to return
     */
    private function returnItems(array $quantities, SaleReturn $saleReturn, ?string $reason, ?int $userId): float
    {
        $items = $this->items()->whereIn('id', array_keys($quantities))->get()->keyBy('id');
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

        return $refundTotal;
    }

    private function syncReturnStatus(): void
    {
        $this->refresh();
        $allReturned = $this->items->every(fn (SaleItem $item) => $item->quantity_returned >= $item->quantity);
        $anyReturned = $this->items->contains(fn (SaleItem $item) => $item->quantity_returned > 0);

        $this->status = $allReturned ? 'Returned' : ($anyReturned ? 'Partially Returned' : $this->status);
        $this->save();
    }
}
