<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'rx_number', 'customer_id', 'patient_name', 'patient_phone', 'doctor_name',
    'prescribed_date', 'file_path', 'sale_id', 'status', 'notes', 'user_id',
])]
class Prescription extends Model
{
    protected function casts(): array
    {
        return [
            'prescribed_date' => 'date:Y-m-d',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    public static function generateRxNumber(): string
    {
        $sequence = str_pad((string) (static::max('id') + 1), 3, '0', STR_PAD_LEFT);

        return 'RX-'.now()->format('ym').'-'.$sequence;
    }

    public function dispenseVia(Sale $sale): void
    {
        $this->update(['sale_id' => $sale->id, 'status' => 'Dispensed']);
    }
}
