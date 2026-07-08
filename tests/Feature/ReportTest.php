<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
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

    private function makeSale($user, Medicine $medicine, int $quantity, float $unitPrice): Sale
    {
        $this->actingAs($user)->post('/sales', [
            'status' => 'Paid',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => $quantity, 'unit_price' => $unitPrice, 'discount' => 0, 'tax' => 5],
            ],
            'payments' => [
                ['method' => 'Cash', 'amount' => round($quantity * $unitPrice * 1.05, 2)],
            ],
        ]);

        return Sale::latest('id')->first();
    }

    public function test_reports_index_defaults_to_sales_report(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/reports')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Reports')
                ->where('reportType', 'sales')
                ->has('data.stats')
            );
    }

    public function test_sales_report_aggregates_paid_sales_only(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine();

        $this->makeSale($user, $medicine, 2, 100);
        $this->makeSale($user, $medicine, 1, 50);

        // A held sale must not be counted.
        $this->actingAs($user)->post('/sales', [
            'status' => 'Held',
            'items' => [
                ['medicine_id' => $medicine->id, 'quantity' => 1, 'unit_price' => 100, 'discount' => 0, 'tax' => 0],
            ],
        ]);

        $response = $this->actingAs($user)->get('/reports?type=sales&period=monthly');

        $response->assertInertia(fn ($page) => $page
            ->component('Reports')
            ->where('data.stats.transactions', 2)
            ->where('data.stats.total_sales', 262.5)
        );
    }

    public function test_purchase_report_groups_by_supplier(): void
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

        $response = $this->actingAs($user)->get('/reports?type=purchase&period=monthly');

        $response->assertInertia(fn ($page) => $page
            ->component('Reports')
            ->where('data.stats.order_count', 1)
            ->where('data.rows.0.supplier', 'MediCorp Pharma')
        );
    }

    public function test_inventory_report_counts_stock_statuses(): void
    {
        $user = User::factory()->create();
        $this->makeMedicine(['stock' => 50, 'reorder_level' => 5]);
        $this->makeMedicine(['sku' => 'MED401', 'stock' => 2, 'reorder_level' => 5]);
        $this->makeMedicine(['sku' => 'MED402', 'stock' => 0, 'reorder_level' => 5]);

        $response = $this->actingAs($user)->get('/reports?type=inventory');

        $response->assertInertia(fn ($page) => $page
            ->component('Reports')
            ->where('data.stats.total_medicines', 3)
            ->where('data.stats.in_stock', 1)
            ->where('data.stats.low_stock', 1)
            ->where('data.stats.out_of_stock', 1)
        );
    }

    public function test_profit_report_computes_revenue_minus_cost_of_goods(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['purchase_price' => 18, 'stock' => 100]);

        $this->makeSale($user, $medicine, 10, 28);

        $response = $this->actingAs($user)->get('/reports?type=profit&period=monthly');

        $response->assertInertia(fn ($page) => $page
            ->component('Reports')
            ->where('data.stats.cost_of_goods', 180)
            ->where('data.stats.gross_profit', 114)
        );
    }

    public function test_expiry_report_flags_expired_and_expiring_medicines(): void
    {
        $user = User::factory()->create();
        $this->makeMedicine(['expiry_date' => now()->subDays(5)->toDateString(), 'stock' => 10]);
        $this->makeMedicine(['sku' => 'MED401', 'expiry_date' => now()->addDays(30)->toDateString(), 'stock' => 10]);
        $this->makeMedicine(['sku' => 'MED402', 'expiry_date' => now()->addYears(2)->toDateString(), 'stock' => 10]);

        $response = $this->actingAs($user)->get('/reports?type=expiry');

        $response->assertInertia(fn ($page) => $page
            ->component('Reports')
            ->where('data.stats.expired_count', 1)
            ->where('data.stats.expiring_soon_count', 1)
        );
    }

    public function test_top_selling_report_ranks_medicines_by_revenue(): void
    {
        $user = User::factory()->create();
        $best = $this->makeMedicine(['sku' => 'MED500', 'purchase_price' => 10]);
        $worst = $this->makeMedicine(['sku' => 'MED501', 'purchase_price' => 10]);

        $this->makeSale($user, $best, 20, 100);
        $this->makeSale($user, $worst, 1, 50);

        $response = $this->actingAs($user)->get('/reports?type=topselling&period=monthly');

        $response->assertInertia(fn ($page) => $page
            ->component('Reports')
            ->where('data.rows.0.medicine', $best->name)
            ->where('data.stats.medicines_sold', 2)
        );
    }

    public function test_dead_stock_report_excludes_recently_sold_medicines(): void
    {
        $user = User::factory()->create();
        $sold = $this->makeMedicine(['sku' => 'MED600', 'stock' => 100]);
        $dead = $this->makeMedicine(['sku' => 'MED601', 'stock' => 50]);

        $this->makeSale($user, $sold, 1, 50);

        $response = $this->actingAs($user)->get('/reports?type=deadstock&period=monthly');

        $response->assertInertia(fn ($page) => $page
            ->component('Reports')
            ->where('data.stats.dead_stock_count', 1)
            ->where('data.rows.0.medicine', $dead->name)
        );
    }

    public function test_csv_export_streams_a_csv_file(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine();
        $this->makeSale($user, $medicine, 1, 100);

        $response = $this->actingAs($user)->get('/reports/sales/export?period=monthly');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_reports_require_authentication(): void
    {
        $this->get('/reports')->assertRedirect('/login');
    }
}
