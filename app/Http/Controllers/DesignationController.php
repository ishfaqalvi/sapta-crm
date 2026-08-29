<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Designation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DesignationController extends Controller
{
    /**
     * Display a listing of job designations.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-designations') && !$user->can('view-designations'))) {
            abort(403, 'Unauthorized. You do not have permission to view designations.');
        }

        $search = $request->query('search');

        $designations = Designation::with('department')
            ->withCount('employees')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhereHas('department', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $departments = Department::select('id', 'name')->where('is_active', true)->get();

        return Inertia::render('designations/index', [
            'designations' => $designations,
            'departments' => $departments,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created designation.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-designations') && !$user->can('create-designations'))) {
            abort(403, 'Unauthorized. You do not have permission to create designations.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        Designation::create([
            'name' => trim($validated['name']),
            'department_id' => $validated['department_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Designation created successfully!');
    }

    /**
     * Update the specified designation.
     */
    public function update(Request $request, Designation $designation): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-designations') && !$user->can('edit-designations'))) {
            abort(403, 'Unauthorized. You do not have permission to edit designations.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $designation->update([
            'name' => trim($validated['name']),
            'department_id' => $validated['department_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Designation updated successfully!');
    }

    /**
     * Remove the specified designation.
     */
    public function destroy(Designation $designation): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-designations') && !$user->can('delete-designations'))) {
            abort(403, 'Unauthorized. You do not have permission to delete designations.');
        }

        if ($designation->employees()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete designation assigned to existing employees.');
        }

        $designation->delete();
        return redirect()->back()->with('success', 'Designation deleted successfully!');
    }
}
