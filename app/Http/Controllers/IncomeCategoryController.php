<?php

namespace App\Http\Controllers;

use App\Models\IncomeCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IncomeCategoryController extends Controller
{
    /**
     * Display a listing of income categories.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-income-categories') && !$user->can('view-income-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to view income categories.');
        }

        $query = IncomeCategory::query()->withCount('incomes');

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
            'total' => IncomeCategory::count(),
            'active' => IncomeCategory::where('is_active', true)->count(),
            'inactive' => IncomeCategory::where('is_active', false)->count(),
        ];

        return Inertia::render('income-categories/index', [
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Store a newly created income category in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-income-categories') && !$user->can('create-income-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to create income categories.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:income_categories,name'],
            'is_active' => ['boolean'],
        ]);

        IncomeCategory::create($validated);

        return redirect()->back()->with('success', 'Income category created successfully.');
    }

    /**
     * Update the specified income category in storage.
     */
    public function update(Request $request, IncomeCategory $incomeCategory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-income-categories') && !$user->can('edit-income-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to edit income categories.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:income_categories,name,' . $incomeCategory->id],
            'is_active' => ['boolean'],
        ]);

        $incomeCategory->update($validated);

        return redirect()->back()->with('success', 'Income category updated successfully.');
    }

    /**
     * Remove the specified income category from storage.
     */
    public function destroy(IncomeCategory $incomeCategory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-income-categories') && !$user->can('delete-income-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to delete income categories.');
        }

        if ($incomeCategory->incomes()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete income category assigned to existing income entries.');
        }

        $incomeCategory->delete();

        return redirect()->back()->with('success', 'Income category deleted successfully.');
    }
}
