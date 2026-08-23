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
        Schema::create('domain_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_domain_id')->constrained('client_domains')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('title');
            $table->decimal('amount', 12, 2);
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->decimal('amount_pkr', 14, 2)->default(0.00);
            $table->enum('payment_type', ['registration', 'renewal', 'transfer', 'other'])->default('renewal');
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->date('due_date')->nullable();
            $table->date('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('domain_payments');
    }
};
