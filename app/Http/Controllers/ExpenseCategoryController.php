<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseCategoryController extends Controller
{
    /**
     * Display a listing of expense categories.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-expense-categories') && !$user->can('view-expense-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to view expense categories.');
        }

        $query = ExpenseCategory::query()->withCount('expenses');

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
            'total' => ExpenseCategory::count(),
            'active' => ExpenseCategory::where('is_active', true)->count(),
            'inactive' => ExpenseCategory::where('is_active', false)->count(),
        ];

        return Inertia::render('expense-categories/index', [
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Store a newly created expense category in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-expense-categories') && !$user->can('create-expense-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to create expense categories.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:expense_categories,name'],
            'is_active' => ['boolean'],
        ]);

        ExpenseCategory::create($validated);

        return redirect()->back()->with('success', 'Expense category created successfully.');
    }

    /**
     * Update the specified expense category in storage.
     */
    public function update(Request $request, ExpenseCategory $expenseCategory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-expense-categories') && !$user->can('edit-expense-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to edit expense categories.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:expense_categories,name,' . $expenseCategory->id],
            'is_active' => ['boolean'],
        ]);

        $expenseCategory->update($validated);

        return redirect()->back()->with('success', 'Expense category updated successfully.');
    }

    /**
     * Remove the specified expense category from storage.
     */
    public function destroy(ExpenseCategory $expenseCategory): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-expense-categories') && !$user->can('delete-expense-categories'))) {
            abort(403, 'Unauthorized. You do not have permission to delete expense categories.');
        }

        if ($expenseCategory->expenses()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete expense category assigned to existing expense entries.');
        }

        $expenseCategory->delete();

        return redirect()->back()->with('success', 'Expense category deleted successfully.');
    }
}
