<?php

namespace Database\Seeders;

use App\Models\Medicine;
use Illuminate\Database\Seeder;

class MedicineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $medicines = [
            ['generic_name' => 'Amoxicillin', 'brand_name' => 'Moxilin', 'category' => 'Antibiotics', 'manufacturer' => 'Sun Pharma', 'strength' => '500mg', 'dosage_form' => 'Capsule', 'unit' => 'Strip', 'sku' => 'MED001', 'batch_number' => 'BT2401', 'expiry_date' => '2026-06-30', 'stock' => 240, 'reorder_level' => 50, 'purchase_price' => 48.00, 'selling_price' => 72.00, 'tax' => 12],
            ['generic_name' => 'Paracetamol', 'brand_name' => 'Calpol', 'category' => 'Analgesics', 'manufacturer' => 'GSK', 'strength' => '650mg', 'dosage_form' => 'Tablet', 'unit' => 'Strip', 'sku' => 'MED002', 'batch_number' => 'BT2402', 'expiry_date' => '2025-12-31', 'stock' => 12, 'reorder_level' => 30, 'purchase_price' => 18.00, 'selling_price' => 28.00, 'tax' => 5],
            ['generic_name' => 'Cetirizine', 'brand_name' => 'Zyrtec', 'category' => 'Antihistamines', 'manufacturer' => 'UCB', 'strength' => '10mg', 'dosage_form' => 'Tablet', 'unit' => 'Strip', 'sku' => 'MED003', 'batch_number' => 'BT2403', 'expiry_date' => '2025-08-31', 'stock' => 0, 'reorder_level' => 20, 'purchase_price' => 22.00, 'selling_price' => 35.00, 'tax' => 12],
            ['generic_name' => 'Metformin', 'brand_name' => 'Glucophage', 'category' => 'Antidiabetic', 'manufacturer' => 'Merck', 'strength' => '500mg', 'dosage_form' => 'Tablet', 'unit' => 'Strip', 'sku' => 'MED004', 'batch_number' => 'BT2404', 'expiry_date' => '2026-03-31', 'stock' => 180, 'reorder_level' => 40, 'purchase_price' => 32.00, 'selling_price' => 52.00, 'tax' => 12],
            ['generic_name' => 'Omeprazole', 'brand_name' => 'Prilosec', 'category' => 'Antacids', 'manufacturer' => 'AstraZeneca', 'strength' => '20mg', 'dosage_form' => 'Capsule', 'unit' => 'Strip', 'sku' => 'MED005', 'batch_number' => 'BT2405', 'expiry_date' => '2025-11-30', 'stock' => 8, 'reorder_level' => 25, 'purchase_price' => 28.00, 'selling_price' => 45.00, 'tax' => 5],
            ['generic_name' => 'Cholecalciferol', 'brand_name' => 'D-Cal', 'category' => 'Vitamins', 'manufacturer' => 'Abbott', 'strength' => '1000IU', 'dosage_form' => 'Tablet', 'unit' => 'Bottle', 'sku' => 'MED006', 'batch_number' => 'BT2406', 'expiry_date' => '2027-02-28', 'stock' => 95, 'reorder_level' => 20, 'purchase_price' => 120.00, 'selling_price' => 195.00, 'tax' => 5],
            ['generic_name' => 'Azithromycin', 'brand_name' => 'Zithromax', 'category' => 'Antibiotics', 'manufacturer' => 'Pfizer', 'strength' => '250mg', 'dosage_form' => 'Tablet', 'unit' => 'Strip', 'sku' => 'MED007', 'batch_number' => 'BT2407', 'expiry_date' => '2026-08-31', 'stock' => 142, 'reorder_level' => 30, 'purchase_price' => 65.00, 'selling_price' => 98.00, 'tax' => 12],
        ];

        foreach ($medicines as $medicine) {
            Medicine::create($medicine);
        }
    }
}
