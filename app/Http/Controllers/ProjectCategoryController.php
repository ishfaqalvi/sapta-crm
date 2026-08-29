<?php

namespace App\Http\Controllers;

use App\Models\ProjectCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectCategoryController extends Controller
{
    /**
     * Display a listing of project categories.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-project-categories') && !$user->can('view-project-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to view project categories.');
        }

        $query = ProjectCategory::query()->withCount('projects');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $categories = $query->orderBy('name', 'asc')->paginate(15)->withQueryString();

        $stats = [
            'total' => ProjectCategory::count(),
            'active' => ProjectCategory::where('is_active', true)->count(),
            'inactive' => ProjectCategory::where('is_active', false)->count(),
        ];

        return Inertia::render('project-categories/index', [
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-project-categories') && !$user->can('create-project-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to create project categories.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:project_categories,name'],
            'is_active' => ['boolean'],
        ]);

        ProjectCategory::create($validated);

        return redirect()->back()->with('success', 'Project category created successfully.');
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, ProjectCategory $projectCategory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-project-categories') && !$user->can('edit-project-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to edit project categories.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:project_categories,name,' . $projectCategory->id],
            'is_active' => ['boolean'],
        ]);

        $projectCategory->update($validated);

        return redirect()->back()->with('success', 'Project category updated successfully.');
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(ProjectCategory $projectCategory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-project-categories') && !$user->can('delete-project-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to delete project categories.');
        }

        if ($projectCategory->projects()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete category assigned to existing projects.');
        }

        $projectCategory->delete();

        return redirect()->back()->with('success', 'Project category deleted successfully.');
    }
}
