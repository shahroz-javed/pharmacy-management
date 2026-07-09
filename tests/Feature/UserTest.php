<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_index_lists_and_searches(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User']);
        User::factory()->create(['name' => 'Suresh Cashier', 'email' => 'suresh@pharmapro.in']);
        User::factory()->create(['name' => 'Ravi Pharmacist', 'email' => 'ravi@pharmapro.in']);

        $this->actingAs($admin)
            ->get('/users')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Users')->has('users', 3));

        $this->actingAs($admin)
            ->get('/users?search=Suresh')
            ->assertInertia(fn ($page) => $page->has('users', 1));
    }

    public function test_can_create_user(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->post('/users', [
            'name' => 'Priya Inventory',
            'email' => 'priya@pharmapro.in',
            'role' => 'Inventory Staff',
            'status' => 'Active',
            'password' => 'password123',
        ])->assertRedirect('/users');

        $this->assertDatabaseHas('users', [
            'name' => 'Priya Inventory',
            'email' => 'priya@pharmapro.in',
            'role' => 'Inventory Staff',
            'status' => 'Active',
        ]);

        $this->assertTrue(Hash::check('password123', User::where('email', 'priya@pharmapro.in')->first()->password));
    }

    public function test_user_creation_requires_name_email_role_status_and_password(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->post('/users', [])
            ->assertSessionHasErrors(['name', 'email', 'role', 'status', 'password']);
    }

    public function test_user_email_must_be_unique(): void
    {
        $admin = User::factory()->create();
        User::factory()->create(['email' => 'taken@pharmapro.in']);

        $this->actingAs($admin)->post('/users', [
            'name' => 'New User',
            'email' => 'taken@pharmapro.in',
            'role' => 'Cashier',
            'status' => 'Active',
            'password' => 'password123',
        ])->assertSessionHasErrors('email');
    }

    public function test_user_role_must_be_valid(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)->post('/users', [
            'name' => 'New User',
            'email' => 'new@pharmapro.in',
            'role' => 'Superadmin',
            'status' => 'Active',
            'password' => 'password123',
        ])->assertSessionHasErrors('role');
    }

    public function test_can_update_user_without_changing_password(): void
    {
        $admin = User::factory()->create();
        $staff = User::factory()->create(['name' => 'Old Name', 'role' => 'Cashier']);
        $originalPassword = $staff->password;

        $this->actingAs($admin)->put("/users/{$staff->id}", [
            'name' => 'New Name',
            'email' => $staff->email,
            'role' => 'Manager',
            'status' => 'Active',
            'password' => '',
        ])->assertRedirect('/users');

        $staff->refresh();
        $this->assertEquals('New Name', $staff->name);
        $this->assertEquals('Manager', $staff->role);
        $this->assertEquals($originalPassword, $staff->password);
    }

    public function test_can_update_user_password(): void
    {
        $admin = User::factory()->create();
        $staff = User::factory()->create();

        $this->actingAs($admin)->put("/users/{$staff->id}", [
            'name' => $staff->name,
            'email' => $staff->email,
            'role' => $staff->role,
            'status' => 'Active',
            'password' => 'newpassword123',
        ])->assertRedirect('/users');

        $this->assertTrue(Hash::check('newpassword123', $staff->fresh()->password));
    }

    public function test_user_cannot_deactivate_their_own_account(): void
    {
        $admin = User::factory()->create(['status' => 'Active']);

        $this->actingAs($admin)->put("/users/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => $admin->role,
            'status' => 'Inactive',
            'password' => '',
        ])->assertSessionHasErrors('status');

        $this->assertEquals('Active', $admin->fresh()->status);
    }

    public function test_can_delete_another_user(): void
    {
        $admin = User::factory()->create();
        $staff = User::factory()->create();

        $this->actingAs($admin)
            ->delete("/users/{$staff->id}")
            ->assertRedirect('/users');

        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
    }

    public function test_user_cannot_delete_their_own_account(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->delete("/users/{$admin->id}")
            ->assertSessionHasErrors('user');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_user_routes_require_authentication(): void
    {
        $this->get('/users')->assertRedirect('/login');
        $this->post('/users', [])->assertRedirect('/login');
    }
}
