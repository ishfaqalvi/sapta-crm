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
        Schema::create('monthly_payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->integer('month'); // 1 - 12
            $table->integer('year'); // e.g. 2026
            $table->decimal('base_salary_pkr', 12, 2);
            $table->integer('total_working_days')->default(26);
            $table->decimal('leaves_taken', 5, 2)->default(0.00);
            $table->decimal('allowed_paid_leaves', 5, 2)->default(2.00);
            $table->decimal('unpaid_leaves', 5, 2)->default(0.00);
            $table->decimal('daily_rate_pkr', 12, 2)->default(0.00);
            $table->decimal('leave_deduction_pkr', 12, 2)->default(0.00);
            $table->decimal('bonuses_pkr', 12, 2)->default(0.00);
            $table->decimal('other_deductions_pkr', 12, 2)->default(0.00);
            $table->decimal('net_salary_pkr', 12, 2)->default(0.00);
            $table->enum('payment_status', ['unpaid', 'processing', 'paid'])->default('unpaid');
            $table->date('payment_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_payrolls');
    }
};
