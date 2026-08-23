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
        Schema::create('client_domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('domain_name');
            $table->string('registrar')->default('Other');
            $table->date('registration_date')->nullable();
            $table->date('expiry_date');
            $table->decimal('renewal_cost_pkr', 12, 2)->default(0.00);
            $table->decimal('client_price_pkr', 12, 2)->default(0.00);
            $table->boolean('auto_renew')->default(false);
            $table->boolean('has_hosting_bundle')->default(false);
            $table->string('nameserver_1')->nullable();
            $table->string('nameserver_2')->nullable();
            $table->string('nameserver_3')->nullable();
            $table->string('nameserver_4')->nullable();
            $table->enum('status', ['active', 'pending_renewal', 'expired', 'transferred'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_domains');
    }
};
