<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PrescriptionTest extends TestCase
{
    use RefreshDatabase;

    private function makeMedicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'generic_name' => 'Paracetamol',
            'brand_name' => 'Calpol',
            'category' => 'Analgesics',
            'sku' => 'MED400',
            'purchase_price' => 18,
            'selling_price' => 28,
            'tax' => 5,
            'batch_number' => 'BT1',
            'expiry_date' => '2027-01-01',
            'stock' => 100,
            'reorder_level' => 5,
        ], $overrides));
    }

    public function test_prescription_index_lists_and_searches(): void
    {
        $user = User::factory()->create();
        Prescription::create(['rx_number' => 'RX-2607-001', 'patient_name' => 'Rahul Sharma', 'prescribed_date' => now()]);
        Prescription::create(['rx_number' => 'RX-2607-002', 'patient_name' => 'Priya Verma', 'prescribed_date' => now()]);

        $this->actingAs($user)
            ->get('/prescriptions')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Prescriptions')->has('prescriptions', 2));

        $this->actingAs($user)
            ->get('/prescriptions?search=Rahul')
            ->assertInertia(fn ($page) => $page->has('prescriptions', 1));
    }

    public function test_can_upload_prescription_with_file_and_items(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['name' => 'Rahul Sharma']);
        $medicine = $this->makeMedicine();
        $file = UploadedFile::fake()->image('rx.jpg');

        $response = $this->actingAs($user)->post('/prescriptions', [
            'customer_id' => $customer->id,
            'patient_name' => 'Rahul Sharma',
            'patient_phone' => '+91 98765 43210',
            'doctor_name' => 'Dr. Mehta',
            'prescribed_date' => now()->toDateString(),
            'file' => $file,
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 10, 'dosage_instructions' => 'Twice daily'],
            ],
        ]);

        $prescription = Prescription::firstOrFail();
        $response->assertRedirect("/prescriptions/{$prescription->id}");

        $this->assertSame('Pending', $prescription->status);
        $this->assertNotNull($prescription->file_path);
        Storage::disk('public')->assertExists($prescription->file_path);
        $this->assertSame(1, $prescription->items()->count());
        $this->assertSame('RX-'.now()->format('ym').'-001', $prescription->rx_number);
    }

    public function test_patient_name_is_required(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/prescriptions', [
            'prescribed_date' => now()->toDateString(),
        ])->assertSessionHasErrors('patient_name');
    }

    public function test_prescription_show_includes_customer_and_items(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['name' => 'Rahul Sharma']);
        $prescription = Prescription::create([
            'rx_number' => 'RX-2607-001',
            'customer_id' => $customer->id,
            'patient_name' => 'Rahul Sharma',
            'prescribed_date' => now(),
        ]);

        $this->actingAs($user)
            ->get("/prescriptions/{$prescription->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('PrescriptionDetail')
                ->where('prescription.customer.name', 'Rahul Sharma')
            );
    }

    public function test_can_attach_medicines_to_existing_prescription(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine();
        $prescription = Prescription::create(['rx_number' => 'RX-2607-001', 'patient_name' => 'Rahul Sharma', 'prescribed_date' => now()]);

        $response = $this->actingAs($user)->post("/prescriptions/{$prescription->id}/items", [
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 5, 'dosage_instructions' => 'Once daily'],
            ],
        ]);

        $response->assertRedirect("/prescriptions/{$prescription->id}");
        $this->assertSame(1, $prescription->items()->count());
        $this->assertSame(5, $prescription->items()->first()->quantity);
    }

    public function test_attaching_medicines_replaces_previous_items(): void
    {
        $user = User::factory()->create();
        $medicineA = $this->makeMedicine();
        $medicineB = $this->makeMedicine(['sku' => 'MED401']);
        $prescription = Prescription::create(['rx_number' => 'RX-2607-001', 'patient_name' => 'Rahul Sharma', 'prescribed_date' => now()]);
        $prescription->items()->create(['medicine_id' => $medicineA->id, 'quantity' => 3]);

        $this->actingAs($user)->post("/prescriptions/{$prescription->id}/items", [
            'items' => [
                ['medicine_id' => $medicineB->id, 'quantity' => 7],
            ],
        ])->assertRedirect("/prescriptions/{$prescription->id}");

        $this->assertSame(1, $prescription->items()->count());
        $this->assertSame($medicineB->id, $prescription->items()->first()->medicine_id);
    }

    public function test_sale_with_prescription_id_dispenses_prescription(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);
        $prescription = Prescription::create(['rx_number' => 'RX-2607-001', 'patient_name' => 'Rahul Sharma', 'prescribed_date' => now()]);
        $prescription->items()->create(['medicine_id' => $medicine->id, 'quantity' => 10]);

        $response = $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'prescription_id' => $prescription->id,
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 10, 'unit_price' => 28, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 280],
            ],
        ]);

        $sale = Sale::firstOrFail();
        $response->assertRedirect("/sales/{$sale->id}");

        $this->assertSame('Dispensed', $prescription->fresh()->status);
        $this->assertSame($sale->id, $prescription->fresh()->sale_id);
    }

    public function test_can_delete_prescription_and_its_file(): void
    {
        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('rx.jpg');

        $this->actingAs($user)->post('/prescriptions', [
            'patient_name' => 'Rahul Sharma',
            'prescribed_date' => now()->toDateString(),
            'file' => $file,
        ]);

        $prescription = Prescription::firstOrFail();
        $path = $prescription->file_path;

        $this->actingAs($user)
            ->delete("/prescriptions/{$prescription->id}")
            ->assertRedirect('/prescriptions');

        $this->assertDatabaseMissing('prescriptions', ['id' => $prescription->id]);
        Storage::disk('public')->assertMissing($path);
    }
}
