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
        Schema::table('website_projects', function (Blueprint $table) {
            $table->decimal('exchange_rate', 10, 4)->default(1.0000)->after('currency');
            $table->decimal('total_budget_pkr', 14, 2)->default(0.00)->after('exchange_rate');
        });

        Schema::table('project_payments', function (Blueprint $table) {
            $table->decimal('exchange_rate', 10, 4)->default(1.0000)->after('amount');
            $table->decimal('amount_pkr', 14, 2)->default(0.00)->after('exchange_rate');
        });

        Schema::table('seo_retainers', function (Blueprint $table) {
            $table->decimal('exchange_rate', 10, 4)->default(1.0000)->after('currency');
            $table->decimal('monthly_fee_pkr', 14, 2)->default(0.00)->after('exchange_rate');
        });

        Schema::table('seo_payments', function (Blueprint $table) {
            $table->decimal('exchange_rate', 10, 4)->default(1.0000)->after('amount_paid');
            $table->decimal('amount_paid_pkr', 14, 2)->default(0.00)->after('exchange_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seo_payments', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate', 'amount_paid_pkr']);
        });

        Schema::table('seo_retainers', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate', 'monthly_fee_pkr']);
        });

        Schema::table('project_payments', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate', 'amount_pkr']);
        });

        Schema::table('website_projects', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate', 'total_budget_pkr']);
        });
    }
};
