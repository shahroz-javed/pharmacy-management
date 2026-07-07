<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->string('generic_name');
            $table->string('brand_name');
            $table->string('category');
            $table->string('manufacturer')->nullable();
            $table->string('strength')->nullable();
            $table->string('dosage_form')->nullable();
            $table->string('unit')->nullable();
            $table->string('sku')->unique();
            $table->string('barcode')->nullable();
            $table->boolean('prescription_required')->default(false);
            $table->text('description')->nullable();
            $table->decimal('purchase_price', 10, 2)->default(0);
            $table->decimal('selling_price', 10, 2)->default(0);
            $table->decimal('mrp', 10, 2)->nullable();
            $table->decimal('tax', 5, 2)->default(0);
            $table->decimal('wholesale_price', 10, 2)->nullable();
            $table->decimal('discount', 5, 2)->default(0);
            $table->string('batch_number');
            $table->date('expiry_date');
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('reorder_level')->default(0);
            $table->string('storage_location')->nullable();
            $table->string('temperature_storage')->nullable();
            $table->string('image_path')->nullable();
            $table->string('status')->default('In Stock');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
