<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@pharmapro.in',
            'password' => bcrypt('aszx1234'),
            'role' => 'Owner',
            'status' => 'Active',
        ]);

        User::factory()->create(['name' => 'Suresh Cashier', 'email' => 'suresh@pharmapro.in', 'role' => 'Cashier']);
        User::factory()->create(['name' => 'Ravi Pharmacist', 'email' => 'ravi@pharmapro.in', 'role' => 'Pharmacist']);
        User::factory()->inactive()->create(['name' => 'Priya Inventory', 'email' => 'priya@pharmapro.in', 'role' => 'Inventory Staff']);

        $this->call(MedicineSeeder::class);
        $this->call(SupplierSeeder::class);
        $this->call(PurchaseOrderSeeder::class);
    }
}
