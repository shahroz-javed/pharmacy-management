<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    private function makeMedicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'generic_name' => 'Paracetamol',
            'brand_name' => 'Calpol',
            'category' => 'Analgesics',
            'sku' => 'MED300',
            'purchase_price' => 18,
            'selling_price' => 28,
            'tax' => 5,
            'batch_number' => 'BT1',
            'expiry_date' => '2027-01-01',
            'stock' => 50,
            'reorder_level' => 20,
        ], $overrides));
    }

    public function test_inventory_index_shows_stock_and_stats(): void
    {
        $user = User::factory()->create();
        $this->makeMedicine();
        $this->makeMedicine(['sku' => 'MED301', 'stock' => 5, 'reorder_level' => 20]);

        $this->actingAs($user)
            ->get('/inventory')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Inventory')
                ->has('medicines', 2)
                ->where('stats.total_skus', 2)
                ->where('stats.low_stock', 1)
            );
    }

    public function test_add_stock_adjustment_increases_stock_and_writes_ledger(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/adjustments', [
            'medicine_id' => $medicine->id,
            'adjustment_type' => 'Add Stock',
            'quantity' => 30,
            'reason' => 'Stock count correction',
        ])->assertRedirect('/inventory');

        $this->assertSame(80, $medicine->fresh()->stock);

        $movement = StockMovement::where('medicine_id', $medicine->id)->firstOrFail();
        $this->assertSame('Adjustment', $movement->type->value);
        $this->assertSame(30, $movement->quantity_in);
        $this->assertSame(0, $movement->quantity_out);
        $this->assertSame(80, $movement->balance_after);
        $this->assertSame($user->id, $movement->user_id);
    }

    public function test_remove_stock_adjustment_decreases_stock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/adjustments', [
            'medicine_id' => $medicine->id,
            'adjustment_type' => 'Remove Stock',
            'quantity' => 10,
        ])->assertRedirect('/inventory');

        $this->assertSame(40, $medicine->fresh()->stock);
    }

    public function test_damage_write_off_reduces_stock_and_logs_as_damaged(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/adjustments', [
            'medicine_id' => $medicine->id,
            'adjustment_type' => 'Damage Write-off',
            'quantity' => 5,
            'reason' => 'Bottles broke in transit',
        ])->assertRedirect('/inventory');

        $this->assertSame(45, $medicine->fresh()->stock);
        $this->assertSame('Damaged', StockMovement::where('medicine_id', $medicine->id)->firstOrFail()->type->value);
    }

    public function test_expired_write_off_logs_as_expired(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/adjustments', [
            'medicine_id' => $medicine->id,
            'adjustment_type' => 'Expired Write-off',
            'quantity' => 8,
        ])->assertRedirect('/inventory');

        $this->assertSame(42, $medicine->fresh()->stock);
        $this->assertSame('Expired', StockMovement::where('medicine_id', $medicine->id)->firstOrFail()->type->value);
    }

    public function test_cannot_remove_more_stock_than_available(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 5]);

        $this->actingAs($user)->post('/inventory/adjustments', [
            'medicine_id' => $medicine->id,
            'adjustment_type' => 'Remove Stock',
            'quantity' => 10,
        ])->assertSessionHasErrors('quantity');

        $this->assertSame(5, $medicine->fresh()->stock);
    }

    public function test_stock_falling_to_reorder_level_updates_status_to_low_stock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50, 'reorder_level' => 20]);
        $this->assertSame('In Stock', $medicine->fresh()->status);

        $this->actingAs($user)->post('/inventory/adjustments', [
            'medicine_id' => $medicine->id,
            'adjustment_type' => 'Remove Stock',
            'quantity' => 35,
        ]);

        $this->assertSame(15, $medicine->fresh()->stock);
        $this->assertSame('Low Stock', $medicine->fresh()->status);
    }

    public function test_ledger_filters_by_type(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/adjustments', [
            'medicine_id' => $medicine->id, 'adjustment_type' => 'Damage Write-off', 'quantity' => 3,
        ]);
        $this->actingAs($user)->post('/inventory/adjustments', [
            'medicine_id' => $medicine->id, 'adjustment_type' => 'Add Stock', 'quantity' => 20,
        ]);

        $this->actingAs($user)
            ->get('/inventory?ledger_type=Damaged')
            ->assertInertia(fn ($page) => $page
                ->has('ledger.data', 1)
                ->where('ledger.data.0.type', 'Damaged')
            );
    }

    public function test_adjustment_requires_valid_medicine_and_positive_quantity(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/inventory/adjustments', [
            'medicine_id' => 999,
            'adjustment_type' => 'Add Stock',
            'quantity' => 0,
        ])->assertSessionHasErrors(['medicine_id', 'quantity']);
    }

    public function test_customer_return_adds_stock_back(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/returns', [
            'medicine_id' => $medicine->id,
            'direction' => 'Customer Return',
            'quantity' => 4,
            'reason' => 'Wrong item sold',
        ])->assertRedirect('/inventory');

        $this->assertSame(54, $medicine->fresh()->stock);
        $movement = StockMovement::where('medicine_id', $medicine->id)->firstOrFail();
        $this->assertSame('Returned', $movement->type->value);
        $this->assertSame(4, $movement->quantity_in);
        $this->assertSame(0, $movement->quantity_out);
    }

    public function test_return_to_supplier_removes_stock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/returns', [
            'medicine_id' => $medicine->id,
            'direction' => 'Return to Supplier',
            'quantity' => 10,
        ])->assertRedirect('/inventory');

        $this->assertSame(40, $medicine->fresh()->stock);
        $movement = StockMovement::where('medicine_id', $medicine->id)->firstOrFail();
        $this->assertSame('Returned', $movement->type->value);
        $this->assertSame(0, $movement->quantity_in);
        $this->assertSame(10, $movement->quantity_out);
    }

    public function test_return_to_supplier_cannot_exceed_available_stock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 5]);

        $this->actingAs($user)->post('/inventory/returns', [
            'medicine_id' => $medicine->id,
            'direction' => 'Return to Supplier',
            'quantity' => 10,
        ])->assertSessionHasErrors('quantity');

        $this->assertSame(5, $medicine->fresh()->stock);
    }

    public function test_transfer_logs_locations_without_changing_net_stock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/transfers', [
            'medicine_id' => $medicine->id,
            'from_location' => 'Shelf A3',
            'to_location' => 'Counter 1',
            'quantity' => 10,
            'reason' => 'Restocking counter',
        ])->assertRedirect('/inventory');

        $this->assertSame(50, $medicine->fresh()->stock);

        $movement = StockMovement::where('medicine_id', $medicine->id)->firstOrFail();
        $this->assertSame('Transfer', $movement->type->value);
        $this->assertSame('Shelf A3', $movement->from_location);
        $this->assertSame('Counter 1', $movement->to_location);
        $this->assertSame(50, $movement->balance_after);
    }

    public function test_transfer_requires_different_locations(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/transfers', [
            'medicine_id' => $medicine->id,
            'from_location' => 'Shelf A3',
            'to_location' => 'Shelf A3',
            'quantity' => 10,
        ])->assertSessionHasErrors('to_location');
    }

    public function test_audit_with_higher_count_increases_stock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/audits', [
            'medicine_id' => $medicine->id,
            'counted_quantity' => 60,
        ])->assertRedirect('/inventory');

        $this->assertSame(60, $medicine->fresh()->stock);
        $movement = StockMovement::where('medicine_id', $medicine->id)->firstOrFail();
        $this->assertSame('Adjustment', $movement->type->value);
        $this->assertSame(10, $movement->quantity_in);
        $this->assertSame(0, $movement->quantity_out);
    }

    public function test_audit_with_lower_count_decreases_stock(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/audits', [
            'medicine_id' => $medicine->id,
            'counted_quantity' => 44,
            'reason' => 'Annual stocktake',
        ])->assertRedirect('/inventory');

        $this->assertSame(44, $medicine->fresh()->stock);
        $movement = StockMovement::where('medicine_id', $medicine->id)->firstOrFail();
        $this->assertSame(0, $movement->quantity_in);
        $this->assertSame(6, $movement->quantity_out);
    }

    public function test_audit_with_matching_count_creates_no_movement(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 50]);

        $this->actingAs($user)->post('/inventory/audits', [
            'medicine_id' => $medicine->id,
            'counted_quantity' => 50,
        ])->assertRedirect('/inventory');

        $this->assertSame(50, $medicine->fresh()->stock);
        $this->assertSame(0, StockMovement::where('medicine_id', $medicine->id)->count());
    }
}
