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
        Schema::table('quotations', function (Blueprint $table) {
            $table->enum('status', ['draft', 'sent', 'accepted', 'paid', 'rejected', 'expired'])
                ->default('draft')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])
                ->default('draft')
                ->change();
        });
    }
};
