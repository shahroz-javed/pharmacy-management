<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMedicineRequest extends FormRequest
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
        $medicine = $this->route('medicine');

        return [
            'generic_name' => ['required', 'string', 'max:255'],
            'brand_name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'strength' => ['nullable', 'string', 'max:50'],
            'dosage_form' => ['nullable', 'string', 'max:50'],
            'unit' => ['nullable', 'string', 'max:50'],
            'sku' => [
                'required', 'string', 'max:50',
                Rule::unique('medicines', 'sku')->ignore($medicine?->id),
            ],
            'barcode' => ['nullable', 'string', 'max:100'],
            'prescription_required' => ['boolean'],
            'description' => ['nullable', 'string'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'mrp' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['required', 'numeric', 'min:0', 'max:100'],
            'wholesale_price' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'batch_number' => ['required', 'string', 'max:100'],
            'expiry_date' => ['required', 'date'],
            'stock' => ['required', 'integer', 'min:0'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'storage_location' => ['nullable', 'string', 'max:100'],
            'temperature_storage' => ['nullable', 'string', 'max:50'],
            'image' => ['nullable', 'image', 'max:2048'],
            'status' => ['nullable', Rule::in(['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued', 'Inactive'])],
        ];
    }
}
