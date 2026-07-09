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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            // Business Information
            $table->string('pharmacy_name')->default('My Pharmacy');
            $table->string('license_number')->nullable();
            $table->string('gst_number')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->text('address')->nullable();
            $table->string('logo_path')->nullable();
            // Currency & Language
            $table->string('currency', 10)->default('INR');
            $table->string('language', 50)->default('English');
            // POS Settings
            $table->decimal('default_tax_rate', 5, 2)->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(10);
            $table->boolean('allow_negative_stock')->default(false);
            // Receipt Template
            $table->text('receipt_footer_text')->nullable();
            $table->boolean('receipt_show_logo')->default(true);
            // Printer Settings
            $table->string('printer_name')->nullable();
            $table->string('paper_size', 20)->default('80mm');
            // Barcode Settings
            $table->string('barcode_prefix', 20)->nullable();
            $table->string('barcode_format', 20)->default('CODE128');
            // Theme & Display
            $table->string('theme_color', 20)->default('Blue');
            $table->string('font_size', 20)->default('Default');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
