<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_index_lists_and_searches(): void
    {
        $user = User::factory()->create();
        Customer::create(['name' => 'Rahul Sharma', 'city' => 'Mumbai']);
        Customer::create(['name' => 'Priya Verma', 'city' => 'Delhi']);

        $this->actingAs($user)
            ->get('/customers')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Customers')->has('customers', 2));

        $this->actingAs($user)
            ->get('/customers?search=Rahul')
            ->assertInertia(fn ($page) => $page->has('customers', 1));
    }

    public function test_can_create_customer(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/customers', [
            'name' => 'Anjali Mehta',
            'phone' => '+91 98765 43210',
            'email' => 'anjali@example.com',
            'city' => 'Pune',
        ])->assertRedirect('/customers');

        $this->assertDatabaseHas('customers', ['name' => 'Anjali Mehta']);
    }

    public function test_customer_name_is_required(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/customers', [
            'name' => '',
        ])->assertSessionHasErrors('name');
    }

    public function test_customer_detail_shows_credit_payment_history(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['name' => 'Rahul Sharma']);

        $this->actingAs($user)
            ->get("/customers/{$customer->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('CustomerDetail')
                ->where('customer.name', 'Rahul Sharma')
            );
    }

    public function test_can_update_customer(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['name' => 'Rahul Sharma']);

        $this->actingAs($user)->put("/customers/{$customer->id}", [
            'name' => 'Rahul S. Sharma',
            'city' => 'Nagpur',
        ])->assertRedirect('/customers');

        $this->assertEquals('Rahul S. Sharma', $customer->fresh()->name);
    }

    public function test_recording_payment_reduces_credit_balance(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['name' => 'Rahul Sharma', 'credit_balance' => 1500]);

        $this->actingAs($user)->post("/customers/{$customer->id}/payments", [
            'amount' => 500,
            'method' => 'Cash',
        ])->assertRedirect("/customers/{$customer->id}");

        $this->assertEquals(1000, $customer->fresh()->credit_balance);
        $this->assertDatabaseHas('customer_credit_payments', [
            'customer_id' => $customer->id,
            'amount' => 500,
            'method' => 'Cash',
        ]);
    }

    public function test_payment_amount_must_be_positive(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['name' => 'Rahul Sharma', 'credit_balance' => 1000]);

        $this->actingAs($user)->post("/customers/{$customer->id}/payments", [
            'amount' => 0,
            'method' => 'Cash',
        ])->assertSessionHasErrors('amount');
    }

    public function test_adding_loyalty_points_increments_balance(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['name' => 'Rahul Sharma', 'loyalty_points' => 100]);

        $this->actingAs($user)->post("/customers/{$customer->id}/loyalty", [
            'points' => 50,
            'type' => 'Add',
        ])->assertRedirect("/customers/{$customer->id}");

        $this->assertEquals(150, $customer->fresh()->loyalty_points);
    }

    public function test_redeeming_loyalty_points_decrements_balance_and_floors_at_zero(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['name' => 'Rahul Sharma', 'loyalty_points' => 30]);

        $this->actingAs($user)->post("/customers/{$customer->id}/loyalty", [
            'points' => 50,
            'type' => 'Redeem',
        ])->assertRedirect("/customers/{$customer->id}");

        $this->assertEquals(0, $customer->fresh()->loyalty_points);
    }

    public function test_can_delete_customer(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create(['name' => 'Rahul Sharma']);

        $this->actingAs($user)
            ->delete("/customers/{$customer->id}")
            ->assertRedirect('/customers');

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }
}
