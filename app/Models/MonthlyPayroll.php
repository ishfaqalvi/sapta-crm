<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonthlyPayroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'month',
        'year',
        'base_salary_pkr',
        'total_working_days',
        'leaves_taken',
        'allowed_paid_leaves',
        'unpaid_leaves',
        'daily_rate_pkr',
        'leave_deduction_pkr',
        'bonuses_pkr',
        'other_deductions_pkr',
        'net_salary_pkr',
        'payment_status',
        'payment_date',
        'notes',
    ];

    protected $casts = [
        'base_salary_pkr' => 'decimal:2',
        'leaves_taken' => 'float',
        'allowed_paid_leaves' => 'float',
        'unpaid_leaves' => 'float',
        'daily_rate_pkr' => 'decimal:2',
        'leave_deduction_pkr' => 'decimal:2',
        'bonuses_pkr' => 'decimal:2',
        'other_deductions_pkr' => 'decimal:2',
        'net_salary_pkr' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Auto-calculate salary components.
     */
    public function recalculate(): void
    {
        $workingDays = max(1, (int) $this->total_working_days);
        $allowedLeaves = max(0, (float) $this->allowed_paid_leaves);
        $leavesTaken = max(0, (float) $this->leaves_taken);

        $unpaidLeaves = max(0, $leavesTaken - $allowedLeaves);
        $dailyRate = (float) $this->base_salary_pkr / $workingDays;
        $leaveDeduction = $unpaidLeaves * $dailyRate;

        $this->unpaid_leaves = $unpaidLeaves;
        $this->daily_rate_pkr = round($dailyRate, 2);
        $this->leave_deduction_pkr = round($leaveDeduction, 2);

        $net = (float) $this->base_salary_pkr - $leaveDeduction + (float) $this->bonuses_pkr - (float) $this->other_deductions_pkr;
        $this->net_salary_pkr = max(0, round($net, 2));
    }
}
