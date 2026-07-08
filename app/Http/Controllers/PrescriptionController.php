<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePrescriptionItemsRequest;
use App\Http\Requests\StorePrescriptionRequest;
use App\Models\Customer;
use App\Models\Medicine;
use App\Models\Prescription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PrescriptionController extends Controller
{
    public function index(): Response
    {
        $prescriptions = Prescription::query()
            ->with('customer:id,name')
            ->withCount('items')
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('rx_number', 'like', "%{$search}%")
                        ->orWhere('patient_name', 'like', "%{$search}%")
                        ->orWhere('doctor_name', 'like', "%{$search}%");
                });
            })
            ->when(request('status') && request('status') !== 'All', fn ($query) => $query->where('status', request('status')))
            ->latest('prescribed_date')
            ->latest('id')
            ->get();

        return Inertia::render('Prescriptions', [
            'prescriptions' => $prescriptions,
            'customers' => Customer::orderBy('name')->get(['id', 'name', 'phone']),
            'medicines' => Medicine::orderBy('brand_name')->get(['id', 'generic_name', 'brand_name', 'strength', 'sku']),
            'filters' => request()->only(['search', 'status']),
        ]);
    }

    public function store(StorePrescriptionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $prescription = DB::transaction(function () use ($data, $request) {
            $prescription = Prescription::create([
                'rx_number' => Prescription::generateRxNumber(),
                'customer_id' => $data['customer_id'] ?? null,
                'patient_name' => $data['patient_name'],
                'patient_phone' => $data['patient_phone'] ?? null,
                'doctor_name' => $data['doctor_name'] ?? null,
                'prescribed_date' => $data['prescribed_date'],
                'file_path' => $request->hasFile('file') ? $request->file('file')->store('prescriptions', 'public') : null,
                'status' => 'Pending',
                'notes' => $data['notes'] ?? null,
                'user_id' => $request->user()->id,
            ]);

            foreach ($data['items'] ?? [] as $item) {
                $prescription->items()->create($item);
            }

            return $prescription;
        });

        return redirect()->route('prescriptions.show', $prescription)->with('success', 'Prescription uploaded successfully');
    }

    public function show(Prescription $prescription): Response
    {
        $prescription->load(['customer', 'items.medicine:id,generic_name,brand_name,strength,sku', 'sale:id,invoice_number,status,total']);

        return Inertia::render('PrescriptionDetail', [
            'prescription' => $prescription,
            'medicines' => Medicine::orderBy('brand_name')->get(['id', 'generic_name', 'brand_name', 'strength', 'sku']),
        ]);
    }

    public function storeItems(StorePrescriptionItemsRequest $request, Prescription $prescription): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $prescription) {
            $prescription->items()->delete();

            foreach ($data['items'] as $item) {
                $prescription->items()->create($item);
            }
        });

        return redirect()->route('prescriptions.show', $prescription)->with('success', 'Medicines attached successfully');
    }

    public function destroy(Prescription $prescription): RedirectResponse
    {
        if ($prescription->file_path) {
            Storage::disk('public')->delete($prescription->file_path);
        }

        $prescription->delete();

        return redirect()->route('prescriptions.index')->with('success', 'Prescription deleted successfully');
    }
}
