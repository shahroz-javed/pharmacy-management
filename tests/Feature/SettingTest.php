<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SettingTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'pharmacy_name' => 'PharmaPro Medical Store',
            'license_number' => 'DL-MH-2024-00123',
            'gst_number' => '27AABCU9603R1ZX',
            'phone' => '+91 98765 43210',
            'email' => 'admin@pharmapro.in',
            'website' => 'www.pharmapro.in',
            'address' => '123, MG Road, Mumbai',
            'currency' => 'INR',
            'language' => 'English',
            'default_tax_rate' => 5,
            'low_stock_threshold' => 10,
            'allow_negative_stock' => false,
            'receipt_footer_text' => 'Thank you for shopping with us!',
            'receipt_show_logo' => true,
            'printer_name' => 'EPSON TM-T82',
            'paper_size' => '80mm',
            'barcode_prefix' => 'PH',
            'barcode_format' => 'CODE128',
            'theme_color' => 'Blue',
            'font_size' => 'Default',
        ], $overrides);
    }

    public function test_settings_index_creates_and_returns_the_singleton_row(): void
    {
        $user = User::factory()->create();

        $this->assertDatabaseCount('settings', 0);

        $this->actingAs($user)
            ->get('/settings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('SettingsPage')
                ->where('settings.pharmacy_name', 'My Pharmacy')
                ->where('settings.currency', 'INR')
            );

        $this->assertDatabaseCount('settings', 1);
    }

    public function test_settings_can_be_updated(): void
    {
        $user = User::factory()->create();
        Setting::current();

        $this->actingAs($user)
            ->put('/settings', $this->validPayload(['pharmacy_name' => 'New Pharmacy Name']))
            ->assertRedirect();

        $this->assertDatabaseHas('settings', ['pharmacy_name' => 'New Pharmacy Name']);
    }

    public function test_settings_update_validates_required_fields(): void
    {
        $user = User::factory()->create();
        Setting::current();

        $this->actingAs($user)
            ->put('/settings', $this->validPayload(['pharmacy_name' => '']))
            ->assertSessionHasErrors('pharmacy_name');
    }

    public function test_settings_update_rejects_invalid_currency(): void
    {
        $user = User::factory()->create();
        Setting::current();

        $this->actingAs($user)
            ->put('/settings', $this->validPayload(['currency' => 'GBP']))
            ->assertSessionHasErrors('currency');
    }

    public function test_uploading_a_logo_stores_it_and_replaces_the_previous_one(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        Setting::current();

        $this->actingAs($user)->put('/settings', array_merge($this->validPayload(), [
            'logo' => UploadedFile::fake()->image('logo.png'),
        ]));

        $firstPath = Setting::current()->logo_path;
        $this->assertNotNull($firstPath);
        Storage::disk('public')->assertExists($firstPath);

        $this->actingAs($user)->put('/settings', array_merge($this->validPayload(), [
            'logo' => UploadedFile::fake()->image('logo2.png'),
        ]));

        $secondPath = Setting::current()->logo_path;
        $this->assertNotEquals($firstPath, $secondPath);
        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($secondPath);
    }

    public function test_backup_download_streams_a_json_snapshot(): void
    {
        $user = User::factory()->create();
        Setting::current();

        $response = $this->actingAs($user)->get('/settings/backup');

        $response->assertOk();
        $response->assertHeader('content-type', 'application/json');
    }

    public function test_settings_routes_require_authentication(): void
    {
        $this->get('/settings')->assertRedirect('/login');
        $this->put('/settings', [])->assertRedirect('/login');
        $this->get('/settings/backup')->assertRedirect('/login');
    }
}
