<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
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
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'status' => ['required', Rule::in(['Paid', 'Held'])],
            'hold_reference' => ['nullable', 'string', 'max:255'],
            'prescription_path' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicine_id' => ['required', 'integer', 'exists:medicines,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'payments' => ['required_if:status,Paid', 'array'],
            'payments.*.method' => ['required_with:payments', Rule::in(['Cash', 'Card', 'UPI', 'Credit'])],
            'payments.*.amount' => ['required_with:payments', 'numeric', 'min:0.01'],
        ];
    }
}
