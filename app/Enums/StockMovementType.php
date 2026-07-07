<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Purchase = 'Purchase';
    case Sale = 'Sale';
    case Adjustment = 'Adjustment';
    case Damaged = 'Damaged';
    case Expired = 'Expired';
    case Returned = 'Returned';
    case Transfer = 'Transfer';
}
