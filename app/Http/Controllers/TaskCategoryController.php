<?php

namespace App\Http\Controllers;

use App\Models\TaskCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskCategoryController extends Controller
{
    /**
     * Display a listing of task categories.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-task-categories') && !$user->can('view-task-categories') && !$user->hasPermissionTo('view-tasks') && !$user->can('view-tasks'))) {
            abort(403, 'Unauthorized. You do not have permission to view task categories.');
        }

        $query = TaskCategory::query()->withCount('tasks');

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
            'total' => TaskCategory::count(),
            'active' => TaskCategory::where('is_active', true)->count(),
            'inactive' => TaskCategory::where('is_active', false)->count(),
        ];

        return Inertia::render('task-categories/index', [
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Store a newly created task category.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-task-categories') && !$user->can('create-task-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to create task categories.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:task_categories,name'],
            'is_active' => ['boolean'],
        ]);

        TaskCategory::create($validated);

        return redirect()->back()->with('success', 'Task category created successfully.');
    }

    /**
     * Update the specified task category.
     */
    public function update(Request $request, TaskCategory $taskCategory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-task-categories') && !$user->can('edit-task-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to edit task categories.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:task_categories,name,' . $taskCategory->id],
            'is_active' => ['boolean'],
        ]);

        $taskCategory->update($validated);

        return redirect()->back()->with('success', 'Task category updated successfully.');
    }

    /**
     * Remove the specified task category.
     */
    public function destroy(TaskCategory $taskCategory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-task-categories') && !$user->can('delete-task-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to delete task categories.');
        }

        if ($taskCategory->tasks()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete task category assigned to existing tasks.');
        }

        $taskCategory->delete();

        return redirect()->back()->with('success', 'Task category deleted successfully.');
    }
}
