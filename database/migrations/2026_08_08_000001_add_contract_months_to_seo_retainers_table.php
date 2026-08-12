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
        Schema::table('seo_retainers', function (Blueprint $table) {
            $table->unsignedInteger('contract_months')->default(12)->after('monthly_fee');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seo_retainers', function (Blueprint $table) {
            $table->dropColumn('contract_months');
        });
    }
};
