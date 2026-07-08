<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['medicine_id', 'user_id', 'type', 'quantity_in', 'quantity_out', 'balance_after', 'reference', 'reason', 'from_location', 'to_location', 'batch_number', 'expiry_date'])]
class StockMovement extends Model
{
    protected function casts(): array
    {
        return [
            'type' => StockMovementType::class,
            'expiry_date' => 'date:Y-m-d',
        ];
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
