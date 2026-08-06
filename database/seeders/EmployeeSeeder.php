<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;
use App\Models\MonthlyPayroll;
use App\Models\SubDepartment;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds for Departments, Designations, Employees and Payrolls.
     */
    public function run(): void
    {
        // 1. Seed Default Departments & Sub-Departments
        $deptDev = Department::firstOrCreate(['code' => 'DEV'], [
            'name' => 'Software Development',
            'description' => 'Web, Mobile, and Custom Software Engineering Unit',
            'is_active' => true,
        ]);
        $subFe = SubDepartment::firstOrCreate(['department_id' => $deptDev->id, 'name' => 'Frontend Engineering'], ['code' => 'FE', 'is_active' => true]);
        $subBe = SubDepartment::firstOrCreate(['department_id' => $deptDev->id, 'name' => 'Backend Laravel'], ['code' => 'BE', 'is_active' => true]);

        $deptMkt = Department::firstOrCreate(['code' => 'MKT'], [
            'name' => 'Digital Marketing & SEO',
            'description' => 'SEO Retainers, Google Ads, and Content Strategy',
            'is_active' => true,
        ]);
        $subSeo = SubDepartment::firstOrCreate(['department_id' => $deptMkt->id, 'name' => 'Search Engine Optimization'], ['code' => 'SEO', 'is_active' => true]);

        $deptOps = Department::firstOrCreate(['code' => 'OPS'], [
            'name' => 'Operations & HR',
            'description' => 'Agency Management, Payroll, and Support',
            'is_active' => true,
        ]);

        // 2. Seed Designations
        $desigSrDev = Designation::firstOrCreate(['name' => 'Senior Full-Stack Engineer'], ['department_id' => $deptDev->id, 'is_active' => true]);
        $desigLaravel = Designation::firstOrCreate(['name' => 'Laravel Developer'], ['department_id' => $deptDev->id, 'is_active' => true]);
        $desigSeoLead = Designation::firstOrCreate(['name' => 'SEO Specialist & Lead'], ['department_id' => $deptMkt->id, 'is_active' => true]);
        $desigHrManager = Designation::firstOrCreate(['name' => 'HR Operations Manager'], ['department_id' => $deptOps->id, 'is_active' => true]);

        // 3. Seed Sample Staff Members (Employees)
        $sampleStaff = [
            [
                'code' => 'EMP-001',
                'name' => 'Sadiq Khan',
                'email' => 'sadiq.khan@sapta.com',
                'phone' => '+92 300 9876543',
                'dept' => $deptDev->id,
                'sub_dept' => $subBe->id,
                'desig' => $desigSrDev->id,
                'salary' => 200000.00,
                'type' => 'full_time',
            ],
            [
                'code' => 'EMP-002',
                'name' => 'Zainab Ahmed',
                'email' => 'zainab.a@sapta.com',
                'phone' => '+92 321 4567890',
                'dept' => $deptMkt->id,
                'sub_dept' => $subSeo->id,
                'desig' => $desigSeoLead->id,
                'salary' => 150000.00,
                'type' => 'full_time',
            ],
            [
                'code' => 'EMP-003',
                'name' => 'Hamza Ali',
                'email' => 'hamza.ali@sapta.com',
                'phone' => '+92 333 1122334',
                'dept' => $deptDev->id,
                'sub_dept' => $subFe->id,
                'desig' => $desigLaravel->id,
                'salary' => 120000.00,
                'type' => 'full_time',
            ],
            [
                'code' => 'EMP-004',
                'name' => 'Ayesha Malik',
                'email' => 'ayesha.m@sapta.com',
                'phone' => '+92 301 5566778',
                'dept' => $deptOps->id,
                'sub_dept' => null,
                'desig' => $desigHrManager->id,
                'salary' => 135000.00,
                'type' => 'full_time',
            ],
        ];

        foreach ($sampleStaff as $s) {
            $emp = Employee::firstOrCreate(
                ['employee_code' => $s['code']],
                [
                    'name' => $s['name'],
                    'email' => $s['email'],
                    'phone' => $s['phone'],
                    'department_id' => $s['dept'],
                    'sub_department_id' => $s['sub_dept'],
                    'designation_id' => $s['desig'],
                    'employment_type' => $s['type'],
                    'base_salary_pkr' => $s['salary'],
                    'allowed_paid_leaves' => 2,
                    'bank_name' => 'Meezan Bank Limited',
                    'account_number' => '01020304050607',
                    'status' => 'active',
                    'joining_date' => now()->subMonths(6),
                ]
            );

            // Generate Current Month Payroll
            $m = (int) date('n');
            $y = (int) date('Y');
            $payroll = MonthlyPayroll::firstOrCreate(
                [
                    'employee_id' => $emp->id,
                    'month' => $m,
                    'year' => $y,
                ],
                [
                    'base_salary_pkr' => $emp->base_salary_pkr,
                    'total_working_days' => 26,
                    'leaves_taken' => 1,
                    'allowed_paid_leaves' => 2,
                    'unpaid_leaves' => 0,
                    'daily_rate_pkr' => round($emp->base_salary_pkr / 26, 2),
                    'leave_deduction_pkr' => 0.00,
                    'bonuses_pkr' => 5000.00,
                    'other_deductions_pkr' => 0.00,
                    'net_salary_pkr' => $emp->base_salary_pkr + 5000.00,
                    'payment_status' => 'unpaid',
                ]
            );
            $payroll->recalculate();
            $payroll->save();
        }
    }
}
