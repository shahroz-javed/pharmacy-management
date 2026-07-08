<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'purchase_order_id', 'medicine_id', 'batch_number', 'expiry_date',
    'quantity', 'quantity_received', 'unit_price', 'tax', 'total',
])]
class PurchaseOrderItem extends Model
{
    protected function casts(): array
    {
        return [
            'expiry_date' => 'date:Y-m-d',
            'unit_price' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }
}
