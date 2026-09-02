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
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('quotation_number', 50)->unique();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            
            $table->string('currency_code', 10)->default('AED');
            $table->decimal('exchange_rate_to_pkr', 12, 4)->default(1.0000);
            
            $table->string('subject', 255)->nullable();
            $table->string('customer_prefix', 50)->default('Mr/Mrs');
            $table->string('customer_name', 255)->nullable();
            $table->string('customer_email', 255)->nullable();
            $table->string('customer_phone', 100)->nullable();
            $table->text('customer_address')->nullable();
            
            // Customizable Company Header Details
            $table->string('company_name', 255)->nullable();
            $table->string('company_phone', 100)->nullable();
            $table->text('company_address')->nullable();
            $table->string('company_email', 255)->nullable();
            $table->string('company_whatsapp', 100)->nullable();
            $table->string('company_logo', 255)->nullable();
            
            // Quotation Content Text
            $table->string('greeting', 255)->default('Dear Sir/Mam,');
            $table->text('opening_text')->nullable();
            $table->text('closing_text')->nullable();
            
            // Financials
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('tax_rate', 5, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('discount', 12, 2)->default(0.00);
            $table->decimal('total_amount', 12, 2)->default(0.00);
            $table->decimal('total_amount_pkr', 12, 2)->default(0.00);
            
            // Dates & Status
            $table->date('date');
            $table->date('expiry_date')->nullable();
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])->default('draft');
            
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();
            
            // Signature Section
            $table->string('authorized_by_text', 255)->nullable();
            $table->string('signature_image', 255)->nullable();
            
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
