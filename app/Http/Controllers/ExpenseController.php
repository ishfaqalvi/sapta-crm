<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExpenseController extends Controller
{
    /**
     * Display a listing of expense records.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-expenses') && !$user->can('view-expenses'))) {
            abort(403, 'Unauthorized. You do not have permission to view expense records.');
        }

        $query = Expense::with('category');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->category_id);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('expense_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('expense_date', '<=', $request->end_date);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->orderBy('id', 'desc')->paginate(15)->withQueryString();

        $stats = [
            'total' => (float) Expense::sum('amount'),
            'this_month' => (float) Expense::whereYear('expense_date', now()->year)->whereMonth('expense_date', now()->month)->sum('amount'),
            'today' => (float) Expense::whereDate('expense_date', now()->toDateString())->sum('amount'),
            'count' => Expense::count(),
        ];

        $categories = ExpenseCategory::where('is_active', true)->orderBy('name', 'asc')->get(['id', 'name']);

        return Inertia::render('expenses/index', [
            'expenses' => $expenses,
            'stats' => $stats,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Export expenses report to Excel / CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-expenses') && !$user->can('view-expenses'))) {
            abort(403, 'Unauthorized. You do not have permission to export expense records.');
        }

        $query = Expense::with('category');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->category_id);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('expense_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('expense_date', '<=', $request->end_date);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->orderBy('id', 'desc')->get();

        $fileName = 'expenses_report_' . date('Y-m-d') . '.csv';

        $headers = [
            "Content-type" => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($expenses) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, ['ID', 'Expense Title', 'Category', 'Expense Date', 'Amount (PKR)', 'Notes']);

            foreach ($expenses as $exp) {
                fputcsv($file, [
                    $exp->id,
                    $exp->title,
                    $exp->category ? $exp->category->name : 'Uncategorized',
                    $exp->expense_date ? $exp->expense_date->format('d M Y') : '',
                    $exp->amount,
                    $exp->notes ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Store a newly created expense record in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-expenses') && !$user->can('create-expenses'))) {
            abort(403, 'Unauthorized. You do not have permission to create expense records.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'expense_category_id' => ['nullable', 'exists:expense_categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['currency'] = 'PKR';

        Expense::create($validated);

        return redirect()->back()->with('success', 'Expense entry added successfully.');
    }

    /**
     * Update the specified expense record in storage.
     */
    public function update(Request $request, Expense $expense): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-expenses') && !$user->can('edit-expenses'))) {
            abort(403, 'Unauthorized. You do not have permission to edit expense records.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'expense_category_id' => ['nullable', 'exists:expense_categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['currency'] = 'PKR';

        $expense->update($validated);

        return redirect()->back()->with('success', 'Expense entry updated successfully.');
    }

    /**
     * Remove the specified expense record from storage.
     */
    public function destroy(Expense $expense): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-expenses') && !$user->can('delete-expenses'))) {
            abort(403, 'Unauthorized. You do not have permission to delete expense records.');
        }

        $expense->delete();

        return redirect()->back()->with('success', 'Expense entry deleted successfully.');
    }
}
