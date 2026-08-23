<?php

namespace App\Http\Controllers;

use App\Models\Income;
use App\Models\IncomeCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class IncomeController extends Controller
{
    /**
     * Display a listing of income records.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-incomes') && !$user->can('view-incomes'))) {
            abort(403, 'Unauthorized. You do not have permission to view income records.');
        }

        $query = Income::with('category');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        if ($request->filled('category_id')) {
            $query->where('income_category_id', $request->category_id);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('income_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('income_date', '<=', $request->end_date);
        }

        $incomes = $query->orderBy('income_date', 'desc')->orderBy('id', 'desc')->paginate(15)->withQueryString();

        $stats = [
            'total' => (float) Income::sum('amount'),
            'this_month' => (float) Income::whereYear('income_date', now()->year)->whereMonth('income_date', now()->month)->sum('amount'),
            'today' => (float) Income::whereDate('income_date', now()->toDateString())->sum('amount'),
            'count' => Income::count(),
        ];

        $categories = IncomeCategory::where('is_active', true)->orderBy('name', 'asc')->get(['id', 'name']);

        return Inertia::render('incomes/index', [
            'incomes' => $incomes,
            'stats' => $stats,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Export incomes report to Excel / CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-incomes') && !$user->can('view-incomes'))) {
            abort(403, 'Unauthorized. You do not have permission to export income records.');
        }

        $query = Income::with('category');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('title', 'like', "%{$search}%");
        }

        if ($request->filled('category_id')) {
            $query->where('income_category_id', $request->category_id);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('income_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('income_date', '<=', $request->end_date);
        }

        $incomes = $query->orderBy('income_date', 'desc')->orderBy('id', 'desc')->get();

        $fileName = 'incomes_report_' . date('Y-m-d') . '.csv';

        $headers = [
            "Content-type" => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($incomes) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, ['ID', 'Income Title', 'Category', 'Date Received', 'Amount (PKR)', 'Notes']);

            foreach ($incomes as $inc) {
                fputcsv($file, [
                    $inc->id,
                    $inc->title,
                    $inc->category ? $inc->category->name : 'Uncategorized',
                    $inc->income_date ? $inc->income_date->format('d M Y') : '',
                    $inc->amount,
                    $inc->notes ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Store a newly created income record in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-incomes') && !$user->can('create-incomes'))) {
            abort(403, 'Unauthorized. You do not have permission to create income records.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'income_category_id' => ['nullable', 'exists:income_categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'income_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['currency'] = 'PKR';

        Income::create($validated);

        return redirect()->back()->with('success', 'Income entry added successfully.');
    }

    /**
     * Update the specified income record in storage.
     */
    public function update(Request $request, Income $income): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-incomes') && !$user->can('edit-incomes'))) {
            abort(403, 'Unauthorized. You do not have permission to edit income records.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'income_category_id' => ['nullable', 'exists:income_categories,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'income_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['currency'] = 'PKR';

        $income->update($validated);

        return redirect()->back()->with('success', 'Income entry updated successfully.');
    }

    /**
     * Remove the specified income record from storage.
     */
    public function destroy(Income $income): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-incomes') && !$user->can('delete-incomes'))) {
            abort(403, 'Unauthorized. You do not have permission to delete income records.');
        }

        $income->delete();

        return redirect()->back()->with('success', 'Income entry deleted successfully.');
    }
}
