<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\SubDepartment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments and sub-departments.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $departments = Department::with([
            'subDepartments' => function ($q) {
                $q->withCount('employees');
            },
            'designations',
        ])
            ->withCount(['employees', 'subDepartments', 'designations'])
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhereHas('subDepartments', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('departments/index', [
            'departments' => $departments,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('departments', 'code')],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        Department::create([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'description' => $validated['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Department created successfully!');
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, Department $department): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('departments', 'code')->ignore($department->id)],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $department->update([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'description' => $validated['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Department updated successfully!');
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Department $department): RedirectResponse
    {
        if ($department->employees()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete department assigned to existing employees.');
        }

        if ($department->designations()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete department assigned to existing designations.');
        }

        if ($department->subDepartments()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete department having sub-departments. Delete or reassign sub-departments first.');
        }

        $department->delete();
        return redirect()->back()->with('success', 'Department deleted successfully!');
    }

    /**
     * Store a sub-department under a specific department.
     */
    public function storeSubDepartment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        SubDepartment::create([
            'department_id' => $validated['department_id'],
            'name' => trim($validated['name']),
            'code' => $validated['code'] ? strtoupper(trim($validated['code'])) : null,
            'description' => $validated['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Sub-department added successfully!');
    }

    /**
     * Update a sub-department.
     */
    public function updateSubDepartment(Request $request, SubDepartment $subDepartment): RedirectResponse
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $subDepartment->update([
            'department_id' => $validated['department_id'],
            'name' => trim($validated['name']),
            'code' => $validated['code'] ? strtoupper(trim($validated['code'])) : null,
            'description' => $validated['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Sub-department updated successfully!');
    }

    /**
     * Remove a sub-department.
     */
    public function destroySubDepartment(SubDepartment $subDepartment): RedirectResponse
    {
        if ($subDepartment->employees()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete sub-department assigned to existing employees.');
        }

        $subDepartment->delete();
        return redirect()->back()->with('success', 'Sub-department deleted successfully!');
    }
}
