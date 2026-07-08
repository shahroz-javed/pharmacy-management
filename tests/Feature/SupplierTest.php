<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    public function test_supplier_index_lists_and_searches(): void
    {
        $user = User::factory()->create();
        Supplier::create(['name' => 'MediCorp Pharma', 'city' => 'Mumbai']);
        Supplier::create(['name' => 'HealthFirst Distributors', 'city' => 'Delhi']);

        $this->actingAs($user)
            ->get('/suppliers')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Suppliers')->has('suppliers', 2));

        $this->actingAs($user)
            ->get('/suppliers?search=MediCorp')
            ->assertInertia(fn ($page) => $page->has('suppliers', 1));
    }

    public function test_can_create_supplier(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/suppliers', [
            'name' => 'PharmaLink Wholesale',
            'contact_person' => 'Amit Patel',
            'phone' => '+91 76543 21098',
            'email' => 'amit@pharmalink.in',
            'city' => 'Ahmedabad',
        ])->assertRedirect('/suppliers');

        $this->assertDatabaseHas('suppliers', ['name' => 'PharmaLink Wholesale']);
    }

    public function test_supplier_name_is_required(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/suppliers', [
            'name' => '',
        ])->assertSessionHasErrors('name');
    }

    public function test_supplier_detail_shows_purchase_history(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);

        $this->actingAs($user)
            ->get("/suppliers/{$supplier->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SupplierDetail')
                ->where('supplier.name', 'MediCorp Pharma')
            );
    }

    public function test_recording_payment_reduces_outstanding_balance(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma', 'outstanding_balance' => 48500]);

        $this->actingAs($user)->post("/suppliers/{$supplier->id}/payments", [
            'amount' => 20000,
            'method' => 'Bank Transfer',
        ])->assertRedirect("/suppliers/{$supplier->id}");

        $this->assertEquals(28500, $supplier->fresh()->outstanding_balance);
        $this->assertDatabaseHas('supplier_payments', [
            'supplier_id' => $supplier->id,
            'amount' => 20000,
            'method' => 'Bank Transfer',
        ]);
    }

    public function test_payment_amount_must_be_positive(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma', 'outstanding_balance' => 1000]);

        $this->actingAs($user)->post("/suppliers/{$supplier->id}/payments", [
            'amount' => 0,
            'method' => 'Cash',
        ])->assertSessionHasErrors('amount');
    }

    public function test_can_delete_supplier(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);

        $this->actingAs($user)
            ->delete("/suppliers/{$supplier->id}")
            ->assertRedirect('/suppliers');

        $this->assertDatabaseMissing('suppliers', ['id' => $supplier->id]);
    }
}
