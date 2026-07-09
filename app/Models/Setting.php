<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'pharmacy_name', 'license_number', 'gst_number', 'phone', 'email', 'website', 'address', 'logo_path',
    'currency', 'language',
    'default_tax_rate', 'low_stock_threshold', 'allow_negative_stock',
    'receipt_footer_text', 'receipt_show_logo',
    'printer_name', 'paper_size',
    'barcode_prefix', 'barcode_format',
    'theme_color', 'font_size',
])]
class Setting extends Model
{
    protected function casts(): array
    {
        return [
            'default_tax_rate' => 'decimal:2',
            'allow_negative_stock' => 'boolean',
            'receipt_show_logo' => 'boolean',
        ];
    }

    /**
     * The application has exactly one settings row, created on first access.
     */
    public static function current(): self
    {
        return static::query()->first() ?? static::create([])->refresh();
    }
}
