<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleExchangeRequest extends FormRequest
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
            'refund_method' => ['required', Rule::in(['Original Payment Method', 'Cash', 'Store Credit'])],
            'reason' => ['nullable', 'string', 'max:1000'],
            'return_items' => ['required', 'array', 'min:1'],
            'return_items.*.item_id' => ['required', 'integer', 'exists:sale_items,id'],
            'return_items.*.quantity' => ['required', 'integer', 'min:0'],
            'replacement_items' => ['nullable', 'array'],
            'replacement_items.*.medicine_id' => ['required_with:replacement_items', 'integer', 'exists:medicines,id'],
            'replacement_items.*.quantity' => ['required_with:replacement_items', 'integer', 'min:1'],
            'replacement_items.*.unit_price' => ['required_with:replacement_items', 'numeric', 'min:0'],
            'replacement_items.*.discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'replacement_items.*.tax' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
