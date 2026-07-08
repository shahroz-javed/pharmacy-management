<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleTest extends TestCase
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

    public function test_pos_shows_in_stock_medicines_and_customers(): void
    {
        $user = User::factory()->create();
        $this->makeMedicine(['stock' => 10]);
        $this->makeMedicine(['sku' => 'MED401', 'stock' => 0]);
        Customer::create(['name' => 'Rahul Sharma']);

        $this->actingAs($user)
            ->get('/pos')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('POS')
                ->has('medicines', 1)
                ->has('customers', 1)
            );
    }

    public function test_can_checkout_a_paid_cash_sale_and_deducts_stock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $response = $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 2, 'unit_price' => 28, 'discount' => 0, 'tax' => 5],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 58.8],
            ],
        ]);

        $sale = Sale::firstOrFail();
        $response->assertRedirect("/sales/{$sale->id}");

        $this->assertSame('Paid', $sale->status);
        $this->assertSame('Cash', $sale->payment_method);
        $this->assertEquals(56, $sale->subtotal);
        $this->assertEquals(2.8, $sale->tax_total);
        $this->assertEquals(58.8, $sale->total);
        $this->assertSame(98, $medicine->fresh()->stock);

        $movement = StockMovement::where('medicine_id', $medicine->id)->firstOrFail();
        $this->assertSame('Sale', $movement->type->value);
        $this->assertSame(2, $movement->quantity_out);
        $this->assertSame($sale->invoice_number, $movement->reference);
    }

    public function test_credit_sale_requires_customer_and_increases_credit_balance(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);
        $customer = Customer::create(['name' => 'Rahul Sharma', 'credit_balance' => 0]);

        $response = $this->actingAs($user)->post('/sales', [
            'customer_id' => $customer->id,
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Credit', 'amount' => 100],
            ],
        ]);

        $sale = Sale::firstOrFail();
        $response->assertRedirect("/sales/{$sale->id}");

        $this->assertEquals(100, $customer->fresh()->credit_balance);
    }

    public function test_credit_sale_without_customer_fails_validation(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Credit', 'amount' => 100],
            ],
        ])->assertSessionHasErrors('items');

        $this->assertSame(100, $medicine->fresh()->stock);
        $this->assertSame(0, Sale::count());
    }

    public function test_split_payment_sale_records_multiple_payment_methods(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $response = $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 60],
                ['method' => 'Card', 'amount' => 40],
            ],
        ]);

        $sale = Sale::firstOrFail();
        $response->assertRedirect("/sales/{$sale->id}");

        $this->assertSame('Split', $sale->payment_method);
        $this->assertSame(2, $sale->payments()->count());
        $this->assertEquals(100, $sale->amount_paid);
    }

    public function test_underpaid_sale_fails_validation(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 50],
            ],
        ])->assertSessionHasErrors('items');

        $this->assertSame(100, $medicine->fresh()->stock);
    }

    public function test_customer_earns_loyalty_points_on_paid_sale(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);
        $customer = Customer::create(['name' => 'Rahul Sharma', 'loyalty_points' => 0]);

        $this->actingAs($user)->post('/sales', [
            'customer_id' => $customer->id,
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 250, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 250],
            ],
        ]);

        $this->assertSame(2, $customer->fresh()->loyalty_points);
        $this->assertSame(2, Sale::firstOrFail()->loyalty_points_earned);
    }

    public function test_can_hold_a_sale_without_deducting_stock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $response = $this->actingAs($user)->post('/sales', [
            'status' => 'Held',
            'hold_reference' => 'Counter 1',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
        ]);

        $sale = Sale::firstOrFail();
        $response->assertRedirect("/sales/{$sale->id}");

        $this->assertSame('Held', $sale->status);
        $this->assertNull($sale->sold_at);
        $this->assertSame(100, $medicine->fresh()->stock);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_held_sales_are_excluded_from_sales_index(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Held',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
        ]);

        $this->actingAs($user)
            ->get('/sales')
            ->assertInertia(fn ($page) => $page->has('sales', 0));
    }

    public function test_sale_show_includes_items_and_customer(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);
        $customer = Customer::create(['name' => 'Rahul Sharma']);

        $this->actingAs($user)->post('/sales', [
            'customer_id' => $customer->id,
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 100],
            ],
        ]);

        $sale = Sale::firstOrFail();

        $this->actingAs($user)
            ->get("/sales/{$sale->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SaleDetail')
                ->where('sale.customer.name', 'Rahul Sharma')
                ->has('sale.items', 1)
            );
    }

    public function test_can_process_a_full_return_and_restock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 2, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 200],
            ],
        ]);

        $sale = Sale::with('items')->firstOrFail();
        $item = $sale->items->first();

        $response = $this->actingAs($user)->post("/sales/{$sale->id}/returns", [
            'refund_method' => 'Cash',
            'reason' => 'Customer changed mind',
            'items' => [
                ['item_id' => $item->id, 'quantity' => 2],
            ],
        ]);

        $response->assertRedirect("/sales/{$sale->id}");

        $this->assertSame(100, $medicine->fresh()->stock);
        $this->assertSame('Returned', $sale->fresh()->status);
        $this->assertSame(2, $item->fresh()->quantity_returned);

        $movement = StockMovement::where('medicine_id', $medicine->id)->where('type', 'Returned')->firstOrFail();
        $this->assertSame(2, $movement->quantity_in);

        $saleReturn = $sale->returns()->firstOrFail();
        $this->assertEquals(200, $saleReturn->refund_amount);
    }

    public function test_partial_return_marks_sale_partially_returned(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 4, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 400],
            ],
        ]);

        $sale = Sale::with('items')->firstOrFail();
        $item = $sale->items->first();

        $this->actingAs($user)->post("/sales/{$sale->id}/returns", [
            'refund_method' => 'Cash',
            'items' => [
                ['item_id' => $item->id, 'quantity' => 1],
            ],
        ])->assertRedirect("/sales/{$sale->id}");

        $this->assertSame('Partially Returned', $sale->fresh()->status);
        $this->assertSame(97, $medicine->fresh()->stock);
    }

    public function test_cannot_return_more_than_purchased_quantity(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 100],
            ],
        ]);

        $sale = Sale::with('items')->firstOrFail();
        $item = $sale->items->first();

        $response = $this->actingAs($user)->post("/sales/{$sale->id}/returns", [
            'refund_method' => 'Cash',
            'items' => [
                ['item_id' => $item->id, 'quantity' => 5],
            ],
        ]);

        $response->assertSessionHasErrors();
        $this->assertSame(99, $medicine->fresh()->stock);
    }

    public function test_exchange_for_equal_value_item_requires_no_extra_payment(): void
    {
        $user = User::factory()->create();
        $original = $this->makeMedicine(['stock' => 100]);
        $replacement = $this->makeMedicine(['sku' => 'MED401', 'selling_price' => 100, 'stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $original->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 100],
            ],
        ]);

        $sale = Sale::with('items')->firstOrFail();
        $item = $sale->items->first();

        $response = $this->actingAs($user)->post("/sales/{$sale->id}/exchanges", [
            'refund_method' => 'Cash',
            'reason' => 'Wrong medicine',
            'return_items' => [
                ['item_id' => $item->id, 'quantity' => 1],
            ],
            'replacement_items' => [
                ['medicine_id' => $replacement->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
        ]);

        $this->assertSame(100, $original->fresh()->stock);
        $this->assertSame(99, $replacement->fresh()->stock);

        $exchangeSale = Sale::where('id', '!=', $sale->id)->firstOrFail();
        $response->assertRedirect("/sales/{$exchangeSale->id}");

        $this->assertSame('Paid', $exchangeSale->status);
        $this->assertEquals(100, $exchangeSale->total);
        $this->assertEquals(0, $exchangeSale->amount_paid);

        $saleReturn = $sale->returns()->firstOrFail();
        $this->assertSame($exchangeSale->id, $saleReturn->exchange_sale_id);
        $this->assertEquals(0, $saleReturn->refund_amount);
        $this->assertSame('Returned', $sale->fresh()->status);
    }

    public function test_exchange_for_more_expensive_item_charges_the_difference(): void
    {
        $user = User::factory()->create();
        $original = $this->makeMedicine(['stock' => 100]);
        $replacement = $this->makeMedicine(['sku' => 'MED401', 'selling_price' => 150, 'stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $original->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 100],
            ],
        ]);

        $sale = Sale::with('items')->firstOrFail();
        $item = $sale->items->first();

        $this->actingAs($user)->post("/sales/{$sale->id}/exchanges", [
            'refund_method' => 'Cash',
            'return_items' => [
                ['item_id' => $item->id, 'quantity' => 1],
            ],
            'replacement_items' => [
                ['medicine_id' => $replacement->id, 'quantity' => 1, 'unit_price' => 150, 'discount' => 0, 'tax' => 0],
            ],
        ]);

        $exchangeSale = Sale::where('id', '!=', $sale->id)->firstOrFail();
        $this->assertEquals(150, $exchangeSale->total);
        $this->assertEquals(50, $exchangeSale->amount_paid);
        $this->assertEquals(50, $exchangeSale->payments()->sum('amount'));

        $saleReturn = $sale->returns()->firstOrFail();
        $this->assertEquals(0, $saleReturn->refund_amount);
    }

    public function test_exchange_for_cheaper_item_refunds_the_difference(): void
    {
        $user = User::factory()->create();
        $original = $this->makeMedicine(['stock' => 100]);
        $replacement = $this->makeMedicine(['sku' => 'MED401', 'selling_price' => 60, 'stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $original->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 100],
            ],
        ]);

        $sale = Sale::with('items')->firstOrFail();
        $item = $sale->items->first();

        $this->actingAs($user)->post("/sales/{$sale->id}/exchanges", [
            'refund_method' => 'Cash',
            'return_items' => [
                ['item_id' => $item->id, 'quantity' => 1],
            ],
            'replacement_items' => [
                ['medicine_id' => $replacement->id, 'quantity' => 1, 'unit_price' => 60, 'discount' => 0, 'tax' => 0],
            ],
        ]);

        $exchangeSale = Sale::where('id', '!=', $sale->id)->firstOrFail();
        $this->assertEquals(60, $exchangeSale->total);
        $this->assertEquals(0, $exchangeSale->amount_paid);

        $saleReturn = $sale->returns()->firstOrFail();
        $this->assertEquals(40, $saleReturn->refund_amount);
    }

    public function test_exchange_without_replacement_items_behaves_as_plain_return(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 100]);

        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => 100],
            ],
        ]);

        $sale = Sale::with('items')->firstOrFail();
        $item = $sale->items->first();

        $response = $this->actingAs($user)->post("/sales/{$sale->id}/exchanges", [
            'refund_method' => 'Cash',
            'return_items' => [
                ['item_id' => $item->id, 'quantity' => 1],
            ],
        ]);

        $response->assertRedirect("/sales/{$sale->id}");
        $this->assertSame(1, Sale::count());

        $saleReturn = $sale->returns()->firstOrFail();
        $this->assertNull($saleReturn->exchange_sale_id);
        $this->assertEquals(100, $saleReturn->refund_amount);
    }
}
