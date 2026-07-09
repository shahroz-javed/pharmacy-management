<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
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

    public function test_notifications_index_lists_low_stock_alert(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 3, 'reorder_level' => 5]);

        $this->actingAs($user)
            ->get('/notifications')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('NotificationsPage')
                ->where('notifications.0.id', "low-stock-{$medicine->id}")
                ->where('notifications.0.read', false)
            );
    }

    public function test_notifications_index_lists_out_of_stock_alert(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['sku' => 'MED401', 'stock' => 0, 'reorder_level' => 5]);

        $this->actingAs($user)
            ->get('/notifications')
            ->assertInertia(fn ($page) => $page
                ->has('notifications', 1)
                ->where('notifications.0.id', "out-of-stock-{$medicine->id}")
            );
    }

    public function test_notifications_index_lists_expiring_medicine(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['sku' => 'MED402', 'expiry_date' => now()->addDays(10)->toDateString()]);

        $this->actingAs($user)
            ->get('/notifications')
            ->assertInertia(fn ($page) => $page
                ->where('notifications.0.id', "expiring-{$medicine->id}")
                ->where('notifications.0.type', 'warning')
            );
    }

    public function test_notifications_index_lists_pending_supplier_payment(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma', 'outstanding_balance' => 500]);

        $this->actingAs($user)
            ->get('/notifications')
            ->assertInertia(fn ($page) => $page
                ->where('notifications.0.id', "pending-payment-{$supplier->id}")
            );
    }

    public function test_notifications_index_lists_new_purchase_order(): void
    {
        $user = User::factory()->create();
        $supplier = Supplier::create(['name' => 'MediCorp Pharma']);
        $medicine = $this->makeMedicine(['sku' => 'MED403']);

        $this->actingAs($user)->post('/purchases', [
            'supplier_id' => $supplier->id,
            'order_date' => now()->toDateString(),
            'items' => [
                ['medicine_id' => $medicine->id, 'batch_number' => 'BT99', 'expiry_date' => '2028-01-01', 'quantity' => 10, 'unit_price' => 18, 'tax' => 5],
            ],
        ]);
        $order = PurchaseOrder::latest('id')->first();

        $response = $this->actingAs($user)->get('/notifications');
        $ids = collect($response->getOriginalContent()->getData()['page']['props']['notifications'])->pluck('id');

        $this->assertContains("new-purchase-{$order->id}", $ids);
    }

    public function test_marking_a_notification_read_persists_per_user(): void
    {
        $user = User::factory()->create();
        $medicine = $this->makeMedicine(['stock' => 3, 'reorder_level' => 5]);
        $key = "low-stock-{$medicine->id}";

        $this->actingAs($user)->post("/notifications/{$key}/read")->assertRedirect();

        $this->actingAs($user)
            ->get('/notifications')
            ->assertInertia(fn ($page) => $page->where('notifications.0.read', true));
    }

    public function test_mark_all_read_clears_unread_count(): void
    {
        $user = User::factory()->create();
        $this->makeMedicine(['stock' => 3, 'reorder_level' => 5]);
        $this->makeMedicine(['sku' => 'MED401', 'stock' => 0, 'reorder_level' => 5]);

        $this->actingAs($user)->post('/notifications/read-all')->assertRedirect();

        $this->actingAs($user)
            ->get('/notifications')
            ->assertInertia(fn ($page) => $page
                ->where('notifications.0.read', true)
                ->where('notifications.1.read', true)
            );
    }

    public function test_unread_notif_count_is_shared_across_pages(): void
    {
        $user = User::factory()->create();
        $this->makeMedicine(['stock' => 0, 'reorder_level' => 5]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertInertia(fn ($page) => $page->where('notifCount', 1));
    }

    public function test_notifications_require_authentication(): void
    {
        $this->get('/notifications')->assertRedirect('/login');
    }
}
