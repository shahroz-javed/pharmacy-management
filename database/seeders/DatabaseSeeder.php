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
        ]);

        $this->call(MedicineSeeder::class);
        $this->call(SupplierSeeder::class);
        $this->call(PurchaseOrderSeeder::class);
    }
}
