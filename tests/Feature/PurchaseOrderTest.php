<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseOrderTest extends TestCase
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
            'stock' => 10,
            'reorder_level' => 5,
        ], $overrides));
    }

    public function test_purchase_index_shows_orders_and_stats(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);
        $medicine = $this->makeMedicine();

        $this->actingAs($user)->post('/purchases', [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'items' => [
                ['medicine_id' => $medicine->id, 'batch_number' => 'BT99', 'expiry_date' => '2028-01-01', 'quantity' => 50, 'unit_price' => 18, 'tax' => 5],
            ],
        ]);

        $this->actingAs($user)
            ->get('/purchases')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Purchases')
                ->has('orders', 1)
                ->where('stats.pending_orders', 1)
                ->where('stats.supplier_count', 1)
            );
    }

    public function test_creating_purchase_order_creates_items_and_increases_supplier_balance(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);
        $medicine = $this->makeMedicine();

        $response = $this->actingAs($user)->post('/purchases', [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'expected_delivery' => now()->addDays(3)->toDateString(),
            'invoice_number' => 'INV-001',
            'items' => [
                ['medicine_id' => $medicine->id, 'batch_number' => 'BT99', 'expiry_date' => '2028-01-01', 'quantity' => 100, 'unit_price' => 18, 'tax' => 5],
            ],
        ]);

        $order = PurchaseOrder::firstOrFail();
        $response->assertRedirect("/purchases/{$order->id}");

        $this->assertSame('Ordered', $order->status);
        $this->assertSame(1, $order->items()->count());
        $this->assertEquals(1800, $order->subtotal);
        $this->assertEquals(90, $order->tax_total);
        $this->assertEquals(1890, $order->total);
        $this->assertEquals(1890, $supplier->fresh()->outstanding_balance);

        // Stock must not move until the order is actually received.
        $this->assertSame(10, $medicine->fresh()->stock);
    }

    public function test_purchase_order_requires_at_least_one_item(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);

        $this->actingAs($user)->post('/purchases', [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'items' => [],
        ])->assertSessionHasErrors('items');
    }

    public function test_full_receive_adds_stock_and_marks_received(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);
        $medicine = $this->makeMedicine(['stock' => 10]);

        $this->actingAs($user)->post('/purchases', [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'items' => [
                ['medicine_id' => $medicine->id, 'batch_number' => 'BT99', 'expiry_date' => '2028-01-01', 'quantity' => 100, 'unit_price' => 18, 'tax' => 5],
            ],
        ]);

        $order = PurchaseOrder::with('items')->firstOrFail();
        $item = $order->items->first();

        $this->actingAs($user)->post("/purchases/{$order->id}/receive", [
            'items' => [
                ['item_id' => $item->id, 'quantity' => 100],
            ],
        ])->assertRedirect("/purchases/{$order->id}");

        $this->assertSame(110, $medicine->fresh()->stock);
        $this->assertSame('BT99', $medicine->fresh()->batch_number);
        $this->assertSame('2028-01-01', $medicine->fresh()->expiry_date->format('Y-m-d'));
        $this->assertSame('Received', $order->fresh()->status);

        $movement = StockMovement::where('medicine_id', $medicine->id)->firstOrFail();
        $this->assertSame('Purchase', $movement->type->value);
        $this->assertSame(100, $movement->quantity_in);
        $this->assertSame($order->po_number, $movement->reference);
        $this->assertSame('BT99', $movement->batch_number);
    }

    public function test_partial_receive_marks_order_partial_and_keeps_remaining(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);
        $medicine = $this->makeMedicine(['stock' => 10]);

        $this->actingAs($user)->post('/purchases', [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'items' => [
                ['medicine_id' => $medicine->id, 'batch_number' => 'BT99', 'expiry_date' => '2028-01-01', 'quantity' => 100, 'unit_price' => 18, 'tax' => 5],
            ],
        ]);

        $order = PurchaseOrder::with('items')->firstOrFail();
        $item = $order->items->first();

        $this->actingAs($user)->post("/purchases/{$order->id}/receive", [
            'items' => [
                ['item_id' => $item->id, 'quantity' => 40],
            ],
        ])->assertRedirect("/purchases/{$order->id}");

        $this->assertSame(50, $medicine->fresh()->stock);
        $this->assertSame('Partial', $order->fresh()->status);
        $this->assertSame(40, $item->fresh()->quantity_received);

        // Receive the rest.
        $this->actingAs($user)->post("/purchases/{$order->id}/receive", [
            'items' => [
                ['item_id' => $item->id, 'quantity' => 60],
            ],
        ])->assertRedirect("/purchases/{$order->id}");

        $this->assertSame(110, $medicine->fresh()->stock);
        $this->assertSame('Received', $order->fresh()->status);
    }

    public function test_cannot_receive_more_than_ordered_quantity(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);
        $medicine = $this->makeMedicine(['stock' => 10]);

        $this->actingAs($user)->post('/purchases', [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'items' => [
                ['medicine_id' => $medicine->id, 'batch_number' => 'BT99', 'expiry_date' => '2028-01-01', 'quantity' => 50, 'unit_price' => 18, 'tax' => 5],
            ],
        ]);

        $order = PurchaseOrder::with('items')->firstOrFail();
        $item = $order->items->first();

        $response = $this->actingAs($user)->post("/purchases/{$order->id}/receive", [
            'items' => [
                ['item_id' => $item->id, 'quantity' => 999],
            ],
        ]);

        $response->assertSessionHasErrors();
        $this->assertSame(10, $medicine->fresh()->stock);
        $this->assertSame(0, $item->fresh()->quantity_received);
    }

    public function test_show_includes_supplier_and_items(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);
        $medicine = $this->makeMedicine();

        $this->actingAs($user)->post('/purchases', [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'items' => [
                ['medicine_id' => $medicine->id, 'batch_number' => 'BT99', 'expiry_date' => '2028-01-01', 'quantity' => 20, 'unit_price' => 18, 'tax' => 5],
            ],
        ]);

        $order = PurchaseOrder::firstOrFail();

        $this->actingAs($user)
            ->get("/purchases/{$order->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('PurchaseDetail')
                ->where('order.supplier.name', 'MediCorp Pharma')
                ->has('order.items', 1)
            );
    }
}
