<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplierPaymentRequest extends FormRequest
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
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', Rule::in(['Cash', 'Card', 'Bank Transfer', 'Cheque'])],
            'purchase_order_id' => ['nullable', 'integer', 'exists:purchase_orders,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
