<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MedicineTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_medicine_crud_flow(): void
    {
        $user = User::factory()->create();

        // Index page loads with seeded-style data
        $medicine = Medicine::create([
            'generic_name' => 'Paracetamol',
            'brand_name' => 'Calpol',
            'category' => 'Analgesics',
            'sku' => 'MED100',
            'purchase_price' => 18,
            'selling_price' => 28,
            'tax' => 5,
            'batch_number' => 'BT9001',
            'expiry_date' => '2027-01-01',
            'stock' => 12,
            'reorder_level' => 30,
        ]);

        $this->assertSame('Low Stock', $medicine->fresh()->status);

        $this->actingAs($user)
            ->get('/medicines')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Medicines')
                ->has('medicines', 1)
                ->where('medicines.0.sku', 'MED100')
            );

        // Search filter
        $this->actingAs($user)
            ->get('/medicines?search=Calpol')
            ->assertInertia(fn ($page) => $page->has('medicines', 1));

        $this->actingAs($user)
            ->get('/medicines?search=NoSuchThing')
            ->assertInertia(fn ($page) => $page->has('medicines', 0));

        // Create with image upload
        $image = UploadedFile::fake()->image('med.jpg');

        $this->actingAs($user)->post('/medicines', [
            'generic_name' => 'Amoxicillin',
            'brand_name' => 'Moxilin',
            'category' => 'Antibiotics',
            'sku' => 'MED101',
            'purchase_price' => 48,
            'selling_price' => 72,
            'tax' => 12,
            'batch_number' => 'BT9002',
            'expiry_date' => '2027-06-01',
            'stock' => 240,
            'reorder_level' => 50,
            'image' => $image,
        ])->assertRedirect('/medicines');

        $created = Medicine::where('sku', 'MED101')->firstOrFail();
        $this->assertSame('In Stock', $created->status);
        $this->assertNotNull($created->image_path);
        \Illuminate\Support\Facades\Storage::disk('public')->assertExists($created->image_path);

        // Show page
        $this->actingAs($user)
            ->get("/medicines/{$created->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('MedicineDetail')
                ->where('medicine.sku', 'MED101')
            );

        // Edit page preloads data
        $this->actingAs($user)
            ->get("/medicines/{$created->id}/edit")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('AddMedicine')
                ->where('medicine.sku', 'MED101')
            );

        // Update via method-spoofed multipart POST (mirrors frontend useForm.post with _method=put)
        $this->actingAs($user)->post("/medicines/{$created->id}", [
            '_method' => 'put',
            'generic_name' => 'Amoxicillin',
            'brand_name' => 'Moxilin',
            'category' => 'Antibiotics',
            'sku' => 'MED101',
            'purchase_price' => 48,
            'selling_price' => 75,
            'tax' => 12,
            'batch_number' => 'BT9002',
            'expiry_date' => '2027-06-01',
            'stock' => 5,
            'reorder_level' => 50,
        ])->assertRedirect('/medicines');

        $updated = $created->fresh();
        $this->assertEquals(75, $updated->selling_price);
        $this->assertSame('Low Stock', $updated->status);

        // Delete
        $this->actingAs($user)
            ->delete("/medicines/{$created->id}")
            ->assertRedirect('/medicines');

        $this->assertNull(Medicine::find($created->id));
        \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($updated->image_path);
    }

    public function test_edit_page_returns_form_ready_expiry_date_and_discount(): void
    {
        $user = User::factory()->create();
        $medicine = Medicine::create([
            'generic_name' => 'Paracetamol', 'brand_name' => 'Calpol', 'category' => 'Analgesics',
            'sku' => 'MED150', 'purchase_price' => 18, 'selling_price' => 28, 'tax' => 5,
            'discount' => 15, 'batch_number' => 'BT1', 'expiry_date' => '2027-03-15',
            'stock' => 10, 'reorder_level' => 5,
        ]);

        // expiry_date must come back as a plain YYYY-MM-DD string so <input type="date">
        // can preselect it — anything with a time/timezone suffix renders blank in the browser.
        $this->actingAs($user)
            ->get("/medicines/{$medicine->id}/edit")
            ->assertInertia(fn ($page) => $page
                ->where('medicine.expiry_date', '2027-03-15')
                ->where('medicine.discount', '15.00')
            );
    }

    public function test_discount_persists_through_update(): void
    {
        $user = User::factory()->create();
        $medicine = Medicine::create([
            'generic_name' => 'Paracetamol', 'brand_name' => 'Calpol', 'category' => 'Analgesics',
            'sku' => 'MED151', 'purchase_price' => 18, 'selling_price' => 28, 'tax' => 5,
            'batch_number' => 'BT1', 'expiry_date' => '2027-03-15', 'stock' => 10, 'reorder_level' => 5,
        ]);

        $this->actingAs($user)->post("/medicines/{$medicine->id}", [
            '_method' => 'put',
            'generic_name' => 'Paracetamol', 'brand_name' => 'Calpol', 'category' => 'Analgesics',
            'sku' => 'MED151', 'purchase_price' => 18, 'selling_price' => 28, 'tax' => 5,
            'discount' => 20, 'batch_number' => 'BT1', 'expiry_date' => '2027-03-15',
            'stock' => 10, 'reorder_level' => 5,
        ])->assertRedirect('/medicines');

        $this->assertEquals(20, $medicine->fresh()->discount);
    }

    public function test_sku_must_be_unique(): void
    {
        $user = User::factory()->create();
        Medicine::create([
            'generic_name' => 'Paracetamol', 'brand_name' => 'Calpol', 'category' => 'Analgesics',
            'sku' => 'MED200', 'purchase_price' => 18, 'selling_price' => 28, 'tax' => 5,
            'batch_number' => 'BT1', 'expiry_date' => '2027-01-01', 'stock' => 10, 'reorder_level' => 5,
        ]);

        $this->actingAs($user)->post('/medicines', [
            'generic_name' => 'Other', 'brand_name' => 'Other', 'category' => 'Analgesics',
            'sku' => 'MED200', 'purchase_price' => 1, 'selling_price' => 2, 'tax' => 0,
            'batch_number' => 'BT2', 'expiry_date' => '2027-01-01', 'stock' => 1, 'reorder_level' => 1,
        ])->assertSessionHasErrors('sku');
    }
}
