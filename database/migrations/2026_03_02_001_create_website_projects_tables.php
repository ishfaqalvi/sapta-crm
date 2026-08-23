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
        Schema::create('website_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained('project_categories')->onDelete('set null');
            $table->string('project_name');
            $table->decimal('total_budget', 12, 2);
            $table->string('currency', 10)->default('AED');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000);
            $table->decimal('total_budget_pkr', 14, 2)->default(0.00);
            $table->date('start_date')->nullable();
            $table->date('deadline')->nullable();
            $table->enum('status', ['in_progress', 'on_hold', 'completed', 'cancelled'])->default('in_progress');
            $table->unsignedTinyInteger('progress_percentage')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('website_projects');
    }
};
