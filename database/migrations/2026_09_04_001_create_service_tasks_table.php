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
        Schema::create('service_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_service_id')->constrained('client_services')->onDelete('cascade');
            $table->foreignId('assigned_employee_id')->nullable()->constrained('employees')->onDelete('set null');
            $table->string('task_title');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['todo', 'in_progress', 'in_review', 'completed', 'cancelled'])->default('todo');
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_tasks');
    }
};
