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
        Schema::create('client_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained('service_categories')->onDelete('set null');
            $table->string('service_name');
            $table->decimal('monthly_fee', 12, 2);
            $table->unsignedInteger('contract_months')->default(12);
            $table->string('currency', 10)->default('AED');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->decimal('monthly_fee_pkr', 12, 2)->default(0.00);
            $table->date('start_date')->nullable();
            $table->unsignedTinyInteger('billing_day')->default(1);
            $table->enum('status', ['active', 'paused', 'stopped'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('service_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_service_id')->constrained('client_services')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('billing_month', 20); // e.g. 2026-08
            $table->decimal('amount_due', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0.00);
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->decimal('amount_paid_pkr', 12, 2)->default(0.00);
            $table->date('payment_date')->nullable();
            $table->enum('status', ['paid', 'due_pending', 'overdue'])->default('due_pending');
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_payments');
        Schema::dropIfExists('client_services');
    }
};
