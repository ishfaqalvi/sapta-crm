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
        Schema::create('seo_retainers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('package_name');
            $table->decimal('monthly_fee', 12, 2);
            $table->string('currency', 10)->default('AED');
            $table->date('start_date')->nullable();
            $table->unsignedTinyInteger('billing_day')->default(1);
            $table->enum('status', ['active', 'paused', 'stopped'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('seo_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seo_retainer_id')->constrained('seo_retainers')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('billing_month', 20); // e.g. 2026-07
            $table->decimal('amount_due', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0.00);
            $table->date('payment_date')->nullable();
            $table->enum('status', ['cleared', 'due_pending', 'overdue'])->default('due_pending');
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
        Schema::dropIfExists('seo_payments');
        Schema::dropIfExists('seo_retainers');
    }
};
