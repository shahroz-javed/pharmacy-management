<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sale_id', 'exchange_sale_id', 'user_id', 'refund_amount', 'refund_method', 'reason'])]
class SaleReturn extends Model
{
    protected function casts(): array
    {
        return [
            'refund_amount' => 'decimal:2',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function exchangeSale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'exchange_sale_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleReturnItem::class);
    }
}
