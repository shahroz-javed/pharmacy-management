<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'pharmacy_name' => ['required', 'string', 'max:255'],
            'license_number' => ['nullable', 'string', 'max:100'],
            'gst_number' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'currency' => ['required', Rule::in(['INR', 'USD', 'EUR'])],
            'language' => ['required', Rule::in(['English', 'Hindi', 'Marathi'])],
            'default_tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
            'allow_negative_stock' => ['boolean'],
            'receipt_footer_text' => ['nullable', 'string', 'max:500'],
            'receipt_show_logo' => ['boolean'],
            'printer_name' => ['nullable', 'string', 'max:100'],
            'paper_size' => ['required', Rule::in(['58mm', '80mm', 'A4'])],
            'barcode_prefix' => ['nullable', 'string', 'max:20'],
            'barcode_format' => ['required', Rule::in(['CODE128', 'EAN13', 'UPC'])],
            'theme_color' => ['required', Rule::in(['Blue', 'Green', 'Violet'])],
            'font_size' => ['required', Rule::in(['Small', 'Default', 'Large'])],
        ];
    }
}
