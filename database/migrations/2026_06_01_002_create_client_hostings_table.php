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
        Schema::create('client_hostings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('hosting_title');
            $table->string('provider')->default('Other');
            $table->string('server_ip')->nullable();
            $table->string('server_type')->nullable();
            $table->enum('billing_cycle', ['monthly', 'quarterly', 'semi_annual', 'annual', 'biennial'])->default('annual');
            $table->date('setup_date')->nullable();
            $table->date('expiry_date');
            $table->decimal('cost_pkr', 12, 2)->default(0.00);
            $table->decimal('client_price_pkr', 12, 2)->default(0.00);
            $table->enum('status', ['active', 'suspended', 'cancelled', 'expired'])->default('active');
            $table->foreignId('primary_domain_id')->nullable()->constrained('client_domains')->onDelete('set null');
            $table->string('disk_space')->nullable();
            $table->string('bandwidth')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_hostings');
    }
};
