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
        Schema::table('client_credentials', function (Blueprint $table) {
            $table->foreignId('website_project_id')->nullable()->after('client_id')->constrained('website_projects')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('client_credentials', function (Blueprint $table) {
            $table->dropForeign(['website_project_id']);
            $table->dropColumn('website_project_id');
        });
    }
};
