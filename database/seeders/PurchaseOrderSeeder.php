<?php

namespace Database\Seeders;

use App\Models\Medicine;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class PurchaseOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $medicorp = Supplier::where('name', 'MediCorp Pharma')->first();
        $healthFirst = Supplier::where('name', 'HealthFirst Distributors')->first();
        $pharmaLink = Supplier::where('name', 'PharmaLink Wholesale')->first();

        if (! $medicorp || ! $healthFirst || ! $pharmaLink) {
            return;
        }

        $amoxicillin = Medicine::where('sku', 'MED001')->first();
        $paracetamol = Medicine::where('sku', 'MED002')->first();
        $azithromycin = Medicine::where('sku', 'MED007')->first();

        if (! $amoxicillin || ! $paracetamol || ! $azithromycin) {
            return;
        }

        $received = PurchaseOrder::create([
            'po_number' => PurchaseOrder::generatePoNumber(),
            'supplier_id' => $medicorp->id,
            'order_date' => now()->subDays(6),
            'expected_delivery' => now()->subDays(4),
            'invoice_number' => 'MC-INV-4821',
            'status' => 'Ordered',
            'subtotal' => 43303.57,
            'tax_total' => 5196.43,
            'total' => 48500.00,
        ]);
        $received->items()->create([
            'medicine_id' => $amoxicillin->id, 'batch_number' => 'BT2401', 'expiry_date' => '2026-06-30',
            'quantity' => 100, 'unit_price' => 48.00, 'tax' => 12, 'total' => 5376.00,
        ]);
        $medicorp->increment('outstanding_balance', $received->total);
        $received->receive(
            $received->items->mapWithKeys(fn ($item) => [$item->id => $item->quantity])->toArray(),
        );

        $partial = PurchaseOrder::create([
            'po_number' => PurchaseOrder::generatePoNumber(),
            'supplier_id' => $healthFirst->id,
            'order_date' => now()->subDays(3),
            'expected_delivery' => now()->addDays(1),
            'status' => 'Ordered',
            'subtotal' => 19107.14,
            'tax_total' => 2292.86,
            'total' => 21400.00,
        ]);
        $partial->items()->create([
            'medicine_id' => $paracetamol->id, 'batch_number' => 'BT2408', 'expiry_date' => '2027-01-31',
            'quantity' => 200, 'unit_price' => 18.00, 'tax' => 5, 'total' => 3780.00,
        ]);
        $healthFirst->increment('outstanding_balance', $partial->total);
        $partial->receive(
            $partial->items->mapWithKeys(fn ($item) => [$item->id => (int) floor($item->quantity / 2)])->toArray(),
        );

        $ordered = PurchaseOrder::create([
            'po_number' => PurchaseOrder::generatePoNumber(),
            'supplier_id' => $pharmaLink->id,
            'order_date' => now()->subDay(),
            'expected_delivery' => now()->addDays(3),
            'status' => 'Ordered',
            'subtotal' => 58214.29,
            'tax_total' => 6985.71,
            'total' => 65200.00,
        ]);
        $ordered->items()->create([
            'medicine_id' => $azithromycin->id, 'batch_number' => 'BT2409', 'expiry_date' => '2027-03-31',
            'quantity' => 150, 'unit_price' => 65.00, 'tax' => 12, 'total' => 10920.00,
        ]);
        $pharmaLink->increment('outstanding_balance', $ordered->total);
    }
}
