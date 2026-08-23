<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\MonthlyPayroll;
use App\Models\User;
use App\Notifications\CrmNotification;
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
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-payroll') && !$user->can('view-payroll'))) {
            abort(403, 'Unauthorized. You do not have permission to view monthly payroll.');
        }

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

        $payrolls = MonthlyPayroll::with(['employee.department', 'employee.subDepartment', 'employee.designation'])
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
            ->withQueryString()
            ->through(function ($payroll) {
                return [
                    'id' => $payroll->id,
                    'employee_id' => $payroll->employee_id,
                    'month' => $payroll->month,
                    'year' => $payroll->year,
                    'base_salary_pkr' => $payroll->base_salary_pkr,
                    'total_working_days' => $payroll->total_working_days,
                    'leaves_taken' => $payroll->leaves_taken,
                    'allowed_paid_leaves' => $payroll->allowed_paid_leaves,
                    'unpaid_leaves' => $payroll->unpaid_leaves,
                    'daily_rate_pkr' => $payroll->daily_rate_pkr,
                    'leave_deduction_pkr' => $payroll->leave_deduction_pkr,
                    'bonuses_pkr' => $payroll->bonuses_pkr,
                    'other_deductions_pkr' => $payroll->other_deductions_pkr,
                    'net_salary_pkr' => $payroll->net_salary_pkr,
                    'payment_status' => $payroll->payment_status,
                    'payment_date' => $payroll->payment_date ? $payroll->payment_date->format('d M Y') : null,
                    'notes' => $payroll->notes,
                    'employee' => $payroll->employee,
                ];
            });

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
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('generate-payroll') && !$user->can('generate-payroll'))) {
            abort(403, 'Unauthorized. You do not have permission to generate payroll batches.');
        }

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
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-payroll') && !$user->can('edit-payroll'))) {
            abort(403, 'Unauthorized. You do not have permission to edit or adjust monthly payroll records.');
        }

        // Locked if already paid
        if ($payroll->payment_status === 'paid' && $request->input('payment_status') !== 'paid') {
            return redirect()->back()->with('error', 'Paid payroll records are locked and cannot be changed back to unpaid!');
        }

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

        if ($payroll->payment_status !== 'paid') {
            $payroll->payment_status = $validated['payment_status'];
            if ($validated['payment_status'] === 'paid' && !$payroll->payment_date) {
                $payroll->payment_date = now();
            }
        }

        $payroll->notes = $validated['notes'] ?? null;

        $payroll->recalculate();
        $payroll->save();

        return redirect()->back()->with('success', 'Monthly payroll updated and recalculated successfully!');
    }

    /**
     * Mark payroll as Paid with confirmation & lock.
     */
    public function updateStatus(Request $request, MonthlyPayroll $payroll): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('manage-payroll-status') && !$user->can('manage-payroll-status'))) {
            abort(403, 'Unauthorized. You do not have permission to update salary payment status.');
        }

        // Revert to unpaid is locked once paid
        if ($payroll->payment_status === 'paid') {
            return redirect()->back()->with('error', 'Paid payroll records are permanently locked and cannot be changed back to unpaid!');
        }

        $status = $request->input('payment_status');
        if ($status === 'paid') {
            $payroll->payment_status = 'paid';
            $payroll->payment_date = now();
            $payroll->save();

            // Notify Employee
            if ($payroll->employee_id) {
                $empUser = User::where('employee_id', $payroll->employee_id)->first();
                if ($empUser) {
                    $monthName = date('F', mktime(0, 0, 0, $payroll->month, 10));
                    $empUser->notify(new CrmNotification(
                        "Monthly Salary Paid: {$monthName} {$payroll->year}",
                        "Your salary for {$monthName} {$payroll->year} (PKR " . number_format($payroll->net_salary_pkr, 2) . ") has been processed and marked as PAID.",
                        'payroll_paid',
                        'success',
                        "/payroll/{$payroll->id}/payslip",
                        ['payroll_id' => $payroll->id, 'amount' => $payroll->net_salary_pkr]
                    ));
                }
            }

            return redirect()->back()->with('success', 'Salary payment marked as PAID and locked successfully!');
        }

        return redirect()->back()->with('error', 'Invalid payment status update.');
    }

    /**
     * Render single printable salary slip.
     */
    public function showPayslip(MonthlyPayroll $payroll): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('print-payslips') && !$user->can('print-payslips'))) {
            abort(403, 'Unauthorized. You do not have permission to view or print salary payslips.');
        }

        $payroll->load([
            'employee.department',
            'employee.subDepartment',
            'employee.designation',
            'employee.user',
        ]);

        return Inertia::render('payroll/payslip', [
            'payroll' => $payroll,
        ]);
    }

    /**
     * Render bulk printable salary slips for selected IDs.
     */
    public function bulkPayslips(Request $request): Response|RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('print-payslips') && !$user->can('print-payslips'))) {
            abort(403, 'Unauthorized. You do not have permission to print bulk salary payslips.');
        }

        $rawIds = $request->query('ids');
        if (is_string($rawIds)) {
            $ids = array_filter(array_map('intval', explode(',', $rawIds)));
        } elseif (is_array($rawIds)) {
            $ids = array_filter(array_map('intval', $rawIds));
        } else {
            $ids = [];
        }

        if (empty($ids)) {
            return redirect()->route('payroll.index')->with('error', 'Please select at least one payroll record to view salary slips.');
        }

        $payrolls = MonthlyPayroll::with([
            'employee.department',
            'employee.subDepartment',
            'employee.designation',
            'employee.user',
        ])
        ->whereIn('id', $ids)
        ->get();

        return Inertia::render('payroll/payslip-bulk', [
            'payrolls' => $payrolls,
        ]);
    }

    /**
     * Delete an unpaid monthly payroll record.
     */
    public function destroy(MonthlyPayroll $payroll): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-payroll') && !$user->can('delete-payroll'))) {
            abort(403, 'Unauthorized. You do not have permission to delete monthly payroll records.');
        }

        if ($payroll->payment_status === 'paid') {
            return redirect()->back()->with('error', 'Paid and locked payroll records cannot be deleted!');
        }

        $employeeName = $payroll->employee ? $payroll->employee->name : 'Employee';
        $period = "{$payroll->month}/{$payroll->year}";

        $payroll->delete();

        return redirect()->back()->with('success', "Payroll record for {$employeeName} ({$period}) deleted successfully.");
    }
}
