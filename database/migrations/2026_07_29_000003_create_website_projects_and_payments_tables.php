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
            $table->string('project_name');
            $table->decimal('total_budget', 12, 2);
            $table->string('currency', 10)->default('AED');
            $table->date('start_date')->nullable();
            $table->date('deadline')->nullable();
            $table->enum('status', ['in_progress', 'on_hold', 'completed', 'cancelled'])->default('in_progress');
            $table->unsignedTinyInteger('progress_percentage')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('project_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_project_id')->constrained('website_projects')->onDelete('cascade');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->string('milestone_title');
            $table->decimal('amount', 12, 2);
            $table->enum('payment_stage', ['advance', 'partial', 'full'])->default('advance');
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->date('paid_at')->nullable();
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
        Schema::dropIfExists('project_payments');
        Schema::dropIfExists('website_projects');
    }
};
