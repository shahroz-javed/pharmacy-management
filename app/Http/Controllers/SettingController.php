<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SettingsPage', [
            'settings' => Setting::current(),
        ]);
    }

    public function update(StoreSettingRequest $request): RedirectResponse
    {
        $setting = Setting::current();
        $data = $request->validated();

        if ($request->hasFile('logo')) {
            if ($setting->logo_path) {
                Storage::disk('public')->delete($setting->logo_path);
            }
            $data['logo_path'] = $request->file('logo')->store('settings', 'public');
        }

        $setting->update($data);

        return back()->with('success', 'Settings updated successfully');
    }

    /**
     * Stream a JSON snapshot of every business table as a downloadable backup.
     */
    public function backup(): StreamedResponse
    {
        $tables = ['settings', 'medicines', 'stock_movements', 'suppliers', 'supplier_payments',
            'purchase_orders', 'purchase_order_items', 'customers', 'customer_credit_payments',
            'sales', 'sale_items', 'sale_payments', 'sale_returns', 'sale_return_items',
            'prescriptions', 'prescription_items'];

        $filename = 'pharmacy-backup-'.now()->format('Y-m-d-His').'.json';

        return response()->streamDownload(function () use ($tables) {
            $snapshot = collect($tables)->mapWithKeys(fn (string $table) => [
                $table => DB::table($table)->get(),
            ]);

            echo $snapshot->toJson(JSON_PRETTY_PRINT);
        }, $filename, ['Content-Type' => 'application/json']);
    }
}
