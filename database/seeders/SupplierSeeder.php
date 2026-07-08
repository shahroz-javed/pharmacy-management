<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = [
            ['name' => 'MediCorp Pharma', 'contact_person' => 'Rajesh Kumar', 'phone' => '+91 98765 43210', 'email' => 'rajesh@medicorp.in', 'city' => 'Mumbai'],
            ['name' => 'HealthFirst Distributors', 'contact_person' => 'Priya Sharma', 'phone' => '+91 87654 32109', 'email' => 'priya@healthfirst.in', 'city' => 'Delhi'],
            ['name' => 'PharmaLink Wholesale', 'contact_person' => 'Amit Patel', 'phone' => '+91 76543 21098', 'email' => 'amit@pharmalink.in', 'city' => 'Ahmedabad'],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }
    }
}
