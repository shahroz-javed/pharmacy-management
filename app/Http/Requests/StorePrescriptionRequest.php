<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionRequest extends FormRequest
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
            'patient_name' => ['required', 'string', 'max:255'],
            'patient_phone' => ['nullable', 'string', 'max:30'],
            'doctor_name' => ['nullable', 'string', 'max:255'],
            'prescribed_date' => ['required', 'date'],
            'file' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['nullable', 'array'],
            'items.*.medicine_id' => ['required_with:items', 'integer', 'exists:medicines,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.dosage_instructions' => ['nullable', 'string', 'max:255'],
        ];
    }
}
