<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'phone', 'email', 'city', 'address', 'loyalty_points', 'credit_balance'])]
class Customer extends Model
{
    protected function casts(): array
    {
        return [
            'loyalty_points' => 'integer',
            'credit_balance' => 'decimal:2',
        ];
    }

    public function creditPayments(): HasMany
    {
        return $this->hasMany(CustomerCreditPayment::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function recordCreditPayment(float $amount, string $method, ?int $userId, ?string $notes = null): CustomerCreditPayment
    {
        $this->decrement('credit_balance', $amount);

        return $this->creditPayments()->create([
            'user_id' => $userId,
            'amount' => $amount,
            'method' => $method,
            'notes' => $notes,
        ]);
    }

    public function adjustLoyaltyPoints(int $points, string $type): void
    {
        if ($type === 'Redeem') {
            $this->decrement('loyalty_points', min($points, $this->loyalty_points));
        } else {
            $this->increment('loyalty_points', $points);
        }
    }
}
