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
        Schema::table('service_payments', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('client_id')->constrained('service_payments')->onDelete('cascade');
            $table->string('split_title')->nullable()->after('billing_month');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_payments', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'split_title']);
        });
    }
};
