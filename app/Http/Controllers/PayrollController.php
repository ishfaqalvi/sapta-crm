<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\MonthlyPayroll;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    /**
     * Display monthly payroll manager.
     */
    public function index(Request $request): Response
    {
        $currentMonth = (int) $request->query('month', date('n'));
        $currentYear = (int) $request->query('year', date('Y'));
        $search = $request->query('search');

        // Check if payroll records exist for this month/year batch
        $existingCount = MonthlyPayroll::where('month', $currentMonth)
            ->where('year', $currentYear)
            ->count();

        // If no records exist yet for this month, auto-initialize draft records for active employees
        if ($existingCount === 0) {
            $activeEmployees = Employee::where('status', 'active')->get();
            foreach ($activeEmployees as $emp) {
                $payroll = MonthlyPayroll::firstOrCreate(
                    [
                        'employee_id' => $emp->id,
                        'month' => $currentMonth,
                        'year' => $currentYear,
                    ],
                    [
                        'base_salary_pkr' => $emp->base_salary_pkr,
                        'total_working_days' => 26,
                        'leaves_taken' => 0,
                        'allowed_paid_leaves' => $emp->allowed_paid_leaves,
                        'unpaid_leaves' => 0,
                        'daily_rate_pkr' => round($emp->base_salary_pkr / 26, 2),
                        'leave_deduction_pkr' => 0.00,
                        'bonuses_pkr' => 0.00,
                        'other_deductions_pkr' => 0.00,
                        'net_salary_pkr' => $emp->base_salary_pkr,
                        'payment_status' => 'unpaid',
                    ]
                );
                $payroll->recalculate();
                $payroll->save();
            }
        }

        $payrolls = MonthlyPayroll::with(['employee.department', 'employee.designation'])
            ->where('month', $currentMonth)
            ->where('year', $currentYear)
            ->when($search, function ($query, $search) {
                $query->whereHas('employee', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        // Summary Stats
        $totalBaseSalary = MonthlyPayroll::where('month', $currentMonth)->where('year', $currentYear)->sum('base_salary_pkr');
        $totalNetSalary = MonthlyPayroll::where('month', $currentMonth)->where('year', $currentYear)->sum('net_salary_pkr');
        $totalPaidSalary = MonthlyPayroll::where('month', $currentMonth)->where('year', $currentYear)->where('payment_status', 'paid')->sum('net_salary_pkr');
        $totalUnpaidSalary = MonthlyPayroll::where('month', $currentMonth)->where('year', $currentYear)->where('payment_status', '!=', 'paid')->sum('net_salary_pkr');

        return Inertia::render('payroll/index', [
            'payrolls' => $payrolls,
            'summary' => [
                'total_base' => $totalBaseSalary,
                'total_net' => $totalNetSalary,
                'total_paid' => $totalPaidSalary,
                'total_unpaid' => $totalUnpaidSalary,
            ],
            'filters' => [
                'month' => $currentMonth,
                'year' => $currentYear,
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Generate or Sync Payroll Batch for active staff for selected Month & Year.
     */
    public function generateBatch(Request $request): RedirectResponse
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2020', 'max:2099'],
        ]);

        $month = (int) $request->input('month');
        $year = (int) $request->input('year');

        $activeEmployees = Employee::where('status', 'active')->get();
        $generatedCount = 0;

        foreach ($activeEmployees as $emp) {
            $payroll = MonthlyPayroll::firstOrNew([
                'employee_id' => $emp->id,
                'month' => $month,
                'year' => $year,
            ]);

            if (!$payroll->exists) {
                $payroll->base_salary_pkr = $emp->base_salary_pkr;
                $payroll->total_working_days = 26;
                $payroll->leaves_taken = 0;
                $payroll->allowed_paid_leaves = $emp->allowed_paid_leaves;
                $payroll->unpaid_leaves = 0;
                $payroll->daily_rate_pkr = round($emp->base_salary_pkr / 26, 2);
                $payroll->leave_deduction_pkr = 0.00;
                $payroll->bonuses_pkr = 0.00;
                $payroll->other_deductions_pkr = 0.00;
                $payroll->net_salary_pkr = $emp->base_salary_pkr;
                $payroll->payment_status = 'unpaid';
            }

            $payroll->recalculate();
            $payroll->save();
            $generatedCount++;
        }

        return redirect()->back()->with('success', "Payroll batch for month {$month}/{$year} generated for {$generatedCount} active staff members!");
    }

    /**
     * Update individual monthly payroll record (working days, leaves, bonuses).
     */
    public function update(Request $request, MonthlyPayroll $payroll): RedirectResponse
    {
        $validated = $request->validate([
            'total_working_days' => ['required', 'integer', 'min:1', 'max:31'],
            'leaves_taken' => ['required', 'numeric', 'min:0', 'max:31'],
            'allowed_paid_leaves' => ['required', 'numeric', 'min:0'],
            'bonuses_pkr' => ['required', 'numeric', 'min:0'],
            'other_deductions_pkr' => ['required', 'numeric', 'min:0'],
            'payment_status' => ['required', Rule::in(['unpaid', 'processing', 'paid'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $payroll->total_working_days = $validated['total_working_days'];
        $payroll->leaves_taken = $validated['leaves_taken'];
        $payroll->allowed_paid_leaves = $validated['allowed_paid_leaves'];
        $payroll->bonuses_pkr = $validated['bonuses_pkr'];
        $payroll->other_deductions_pkr = $validated['other_deductions_pkr'];
        $payroll->payment_status = $validated['payment_status'];
        $payroll->notes = $validated['notes'] ?? null;

        if ($validated['payment_status'] === 'paid' && !$payroll->payment_date) {
            $payroll->payment_date = now();
        }

        $payroll->recalculate();
        $payroll->save();

        return redirect()->back()->with('success', 'Monthly payroll updated and recalculated successfully!');
    }

    /**
     * Bulk update payment status to Paid or Unpaid.
     */
    public function updateStatus(Request $request, MonthlyPayroll $payroll): RedirectResponse
    {
        $status = $request->input('payment_status');
        if (in_array($status, ['unpaid', 'processing', 'paid'])) {
            $payroll->payment_status = $status;
            $payroll->payment_date = $status === 'paid' ? now() : null;
            $payroll->save();
        }

        return redirect()->back()->with('success', 'Payroll payment status updated successfully!');
    }
}
