<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMedicineRequest;
use App\Models\Medicine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MedicineController extends Controller
{
    public function index(): Response
    {
        $medicines = Medicine::query()
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('brand_name', 'like', "%{$search}%")
                        ->orWhere('generic_name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('batch_number', 'like', "%{$search}%");
                });
            })
            ->when(request('category') && request('category') !== 'All', function ($query) {
                $query->where('category', request('category'));
            })
            ->when(request('status') && request('status') !== 'All', function ($query) {
                $query->where('status', request('status'));
            })
            ->orderBy('brand_name')
            ->get();

        return Inertia::render('Medicines', [
            'medicines' => $medicines,
            'categories' => Medicine::query()->distinct()->orderBy('category')->pluck('category'),
            'filters' => request()->only(['search', 'category', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('AddMedicine');
    }

    public function store(StoreMedicineRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['image_path'] = $this->storeImage($request);

        Medicine::create($data);

        return redirect()->route('medicines.index')->with('success', 'Medicine added successfully');
    }

    public function show(Medicine $medicine): Response
    {
        return Inertia::render('MedicineDetail', [
            'medicine' => $medicine,
        ]);
    }

    public function edit(Medicine $medicine): Response
    {
        return Inertia::render('AddMedicine', [
            'medicine' => $medicine,
        ]);
    }

    public function update(StoreMedicineRequest $request, Medicine $medicine): RedirectResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($medicine->image_path) {
                Storage::disk('public')->delete($medicine->image_path);
            }
            $data['image_path'] = $this->storeImage($request);
        }

        $medicine->update($data);

        return redirect()->route('medicines.index')->with('success', 'Medicine updated successfully');
    }

    public function destroy(Medicine $medicine): RedirectResponse
    {
        if ($medicine->image_path) {
            Storage::disk('public')->delete($medicine->image_path);
        }

        $medicine->delete();

        return redirect()->route('medicines.index')->with('success', 'Medicine deleted successfully');
    }

    private function storeImage(StoreMedicineRequest $request): ?string
    {
        if (! $request->hasFile('image')) {
            return null;
        }

        return $request->file('image')->store('medicines', 'public');
    }
}
