<?php

namespace App\Http\Controllers;

use App\Models\Medicine;
use App\Models\NotificationState;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = $this->buildNotifications($request->user()->id);

        return Inertia::render('NotificationsPage', [
            'notifications' => $notifications->values(),
        ]);
    }

    public function markRead(Request $request, string $key): RedirectResponse
    {
        NotificationState::updateOrCreate(
            ['user_id' => $request->user()->id, 'notification_key' => $key],
            ['read_at' => now()],
        );

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $keys = $this->buildNotifications($request->user()->id)->pluck('id');

        foreach ($keys as $key) {
            NotificationState::updateOrCreate(
                ['user_id' => $request->user()->id, 'notification_key' => $key],
                ['read_at' => now()],
            );
        }

        return back();
    }

    /**
     * Live-generated notifications from current stock, expiry, and payment state,
     * merged with each user's stored read state (there's no notifications table —
     * these are computed fresh every request, same approach as ReportController).
     */
    public function unreadCountFor(int $userId): int
    {
        return $this->buildNotifications($userId)->reject(fn (array $n) => $n['read'])->count();
    }

    private function buildNotifications(int $userId): Collection
    {
        $states = NotificationState::where('user_id', $userId)->get()->keyBy('notification_key');

        $items = collect()
            ->merge($this->lowStockNotifications())
            ->merge($this->outOfStockNotifications())
            ->merge($this->expiringNotifications())
            ->merge($this->pendingPaymentNotifications())
            ->merge($this->newPurchaseNotifications());

        return $items
            ->map(function (array $n) use ($states) {
                $state = $states->get($n['id']);

                return [
                    ...$n,
                    'read' => (bool) $state?->read_at,
                ];
            })
            ->sortByDesc('sort_at')
            ->values();
    }

    private function lowStockNotifications(): Collection
    {
        return Medicine::where('status', 'Low Stock')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Medicine $m) => [
                'id' => "low-stock-{$m->id}",
                'type' => 'warning',
                'title' => 'Low Stock Alert',
                'message' => "{$m->name} - only {$m->stock} {$m->unit} remaining",
                'time' => $m->updated_at,
                'sort_at' => $m->updated_at,
                'link' => route('medicines.show', $m),
            ]);
    }

    private function outOfStockNotifications(): Collection
    {
        return Medicine::where('status', 'Out of Stock')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Medicine $m) => [
                'id' => "out-of-stock-{$m->id}",
                'type' => 'danger',
                'title' => 'Out of Stock',
                'message' => "{$m->name} is completely out of stock",
                'time' => $m->updated_at,
                'sort_at' => $m->updated_at,
                'link' => route('medicines.show', $m),
            ]);
    }

    private function expiringNotifications(): Collection
    {
        return Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays(90))
            ->where('stock', '>', 0)
            ->orderBy('expiry_date')
            ->get()
            ->map(fn (Medicine $m) => [
                'id' => "expiring-{$m->id}",
                'type' => $m->expiry_date->isPast() ? 'danger' : 'warning',
                'title' => $m->expiry_date->isPast() ? 'Medicine Expired' : 'Expiring Soon',
                'message' => $m->expiry_date->isPast()
                    ? "{$m->name} batch {$m->batch_number} expired on {$m->expiry_date->toFormattedDateString()}"
                    : "{$m->name} batch {$m->batch_number} expires on {$m->expiry_date->toFormattedDateString()}",
                'time' => $m->expiry_date,
                'sort_at' => $m->created_at,
                'link' => route('medicines.show', $m),
            ]);
    }

    private function pendingPaymentNotifications(): Collection
    {
        return Supplier::where('outstanding_balance', '>', 0)
            ->orderByDesc('outstanding_balance')
            ->get()
            ->map(fn (Supplier $s) => [
                'id' => "pending-payment-{$s->id}",
                'type' => 'info',
                'title' => 'Pending Payment',
                'message' => "₹{$s->outstanding_balance} outstanding to {$s->name}",
                'time' => $s->updated_at,
                'sort_at' => $s->updated_at,
                'link' => route('suppliers.show', $s),
            ]);
    }

    private function newPurchaseNotifications(): Collection
    {
        return PurchaseOrder::with('supplier:id,name')
            ->where('created_at', '>=', now()->subDays(7))
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PurchaseOrder $po) => [
                'id' => "new-purchase-{$po->id}",
                'type' => 'success',
                'title' => 'New Purchase Order',
                'message' => "{$po->po_number} from {$po->supplier->name} — {$po->status}",
                'time' => $po->created_at,
                'sort_at' => $po->created_at,
                'link' => route('purchases.show', $po),
            ]);
    }
}
