<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;
use App\Models\SubDepartment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $departmentId = $request->query('department_id');
        $status = $request->query('status');

        $employees = Employee::with(['department', 'subDepartment', 'designation', 'user'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($departmentId, function ($query, $deptId) {
                $query->where('department_id', $deptId);
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $departments = Department::with('subDepartments')->where('is_active', true)->get();

        return Inertia::render('employees/index', [
            'employees' => $employees,
            'departments' => $departments,
            'filters' => [
                'search' => $search ?? '',
                'department_id' => $departmentId ?? '',
                'status' => $status ?? '',
            ],
        ]);
    }

    /**
     * Show the form for creating a new employee.
     */
    public function create(): Response
    {
        $departments = Department::with('subDepartments')->where('is_active', true)->get();
        $designations = Designation::where('is_active', true)->get();
        $users = User::select('id', 'name', 'email')->get();

        return Inertia::render('employees/create', [
            'departments' => $departments,
            'designations' => $designations,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created employee.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('employees', 'email')],
            'phone' => ['nullable', 'string', 'max:50'],
            'joining_date' => ['required', 'date'],
            'department_id' => ['required', 'exists:departments,id'],
            'sub_department_id' => ['required', 'exists:sub_departments,id'],
            'designation_id' => ['required', 'exists:designations,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time', 'contract', 'intern'])],
            'base_salary_pkr' => ['required', 'numeric', 'min:0'],
            'allowed_paid_leaves' => ['required', 'numeric', 'min:0'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:255'],
            'iban' => ['nullable', 'string', 'max:255'],
            'emergency_contact' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(['active', 'inactive', 'resigned'])],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
        ]);

        // Auto-generate sequential Employee Code (e.g. EMP-001)
        $latestId = Employee::max('id') ?? 0;
        $employeeCode = 'EMP-' . str_pad($latestId + 1, 3, '0', STR_PAD_LEFT);

        $employee = new Employee();
        $employee->employee_code = $employeeCode;
        $employee->name = trim($validated['name']);
        $employee->email = trim(strtolower($validated['email']));
        $employee->phone = $validated['phone'] ?? null;
        $employee->joining_date = $validated['joining_date'];
        $employee->department_id = $validated['department_id'];
        $employee->sub_department_id = $validated['sub_department_id'];
        $employee->designation_id = $validated['designation_id'];
        $employee->user_id = $validated['user_id'] ?? null;
        $employee->employment_type = $validated['employment_type'];
        $employee->base_salary_pkr = $validated['base_salary_pkr'];
        $employee->allowed_paid_leaves = $validated['allowed_paid_leaves'];
        $employee->bank_name = $validated['bank_name'] ?? null;
        $employee->account_number = $validated['account_number'] ?? null;
        $employee->iban = $validated['iban'] ?? null;
        $employee->emergency_contact = $validated['emergency_contact'];
        $employee->notes = $validated['notes'] ?? null;
        $employee->status = $validated['status'];

        if ($request->hasFile('avatar')) {
            $employee->avatar = $request->file('avatar');
        }

        $employee->save();

        return redirect()->route('employees.index')->with('success', 'Employee profile created successfully!');
    }

    /**
     * Display the specified employee profile detail page.
     */
    public function show(Employee $employee): Response
    {
        $employee->load([
            'department',
            'subDepartment',
            'designation',
            'user',
            'payrolls' => function ($q) {
                $q->orderBy('year', 'desc')->orderBy('month', 'desc');
            },
            'assignedTasks' => function ($q) {
                $q->with('websiteProject:id,project_name')->orderBy('due_date', 'asc');
            },
        ]);

        return Inertia::render('employees/show', [
            'employee' => $employee,
        ]);
    }

    /**
     * Show the form for editing the specified employee.
     */
    public function edit(Employee $employee): Response
    {
        $departments = Department::with('subDepartments')->where('is_active', true)->get();
        $designations = Designation::where('is_active', true)->get();
        $users = User::select('id', 'name', 'email')->get();

        return Inertia::render('employees/edit', [
            'employee' => $employee->load(['department', 'subDepartment', 'designation', 'user']),
            'departments' => $departments,
            'designations' => $designations,
            'users' => $users,
        ]);
    }

    /**
     * Update the specified employee.
     */
    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('employees', 'email')->ignore($employee->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'joining_date' => ['required', 'date'],
            'department_id' => ['required', 'exists:departments,id'],
            'sub_department_id' => ['required', 'exists:sub_departments,id'],
            'designation_id' => ['required', 'exists:designations,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'employment_type' => ['required', Rule::in(['full_time', 'part_time', 'contract', 'intern'])],
            'base_salary_pkr' => ['required', 'numeric', 'min:0'],
            'allowed_paid_leaves' => ['required', 'numeric', 'min:0'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:255'],
            'iban' => ['nullable', 'string', 'max:255'],
            'emergency_contact' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(['active', 'inactive', 'resigned'])],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'remove_avatar' => ['boolean'],
        ]);

        $employee->name = trim($validated['name']);
        $employee->email = trim(strtolower($validated['email']));
        $employee->phone = $validated['phone'] ?? null;
        $employee->joining_date = $validated['joining_date'];
        $employee->department_id = $validated['department_id'];
        $employee->sub_department_id = $validated['sub_department_id'];
        $employee->designation_id = $validated['designation_id'];
        $employee->user_id = $validated['user_id'] ?? null;
        $employee->employment_type = $validated['employment_type'];
        $employee->base_salary_pkr = $validated['base_salary_pkr'];
        $employee->allowed_paid_leaves = $validated['allowed_paid_leaves'];
        $employee->bank_name = $validated['bank_name'] ?? null;
        $employee->account_number = $validated['account_number'] ?? null;
        $employee->iban = $validated['iban'] ?? null;
        $employee->emergency_contact = $validated['emergency_contact'];
        $employee->notes = $validated['notes'] ?? null;
        $employee->status = $validated['status'];

        if ($request->boolean('remove_avatar')) {
            $employee->avatar = null;
        } elseif ($request->hasFile('avatar')) {
            $employee->avatar = $request->file('avatar');
        }

        $employee->save();

        return redirect()->route('employees.index')->with('success', 'Employee profile updated successfully!');
    }

    /**
     * Remove the specified employee.
     */
    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();
        return redirect()->back()->with('success', 'Employee profile deleted successfully!');
    }
}
