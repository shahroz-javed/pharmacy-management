<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'contact_person', 'phone', 'email', 'city', 'address', 'outstanding_balance'])]
class Supplier extends Model
{
    protected function casts(): array
    {
        return [
            'outstanding_balance' => 'decimal:2',
        ];
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SupplierPayment::class);
    }

    public function recordPayment(float $amount, string $method, ?int $purchaseOrderId, ?int $userId, ?string $notes = null): SupplierPayment
    {
        $this->decrement('outstanding_balance', $amount);

        return $this->payments()->create([
            'purchase_order_id' => $purchaseOrderId,
            'user_id' => $userId,
            'amount' => $amount,
            'method' => $method,
            'notes' => $notes,
        ]);
    }
}
