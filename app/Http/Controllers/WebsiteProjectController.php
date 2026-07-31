<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\WebsiteProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WebsiteProjectController extends Controller
{
    /**
     * Display a listing of Website Projects.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $currency = $request->query('currency');

        $projects = WebsiteProject::with(['client', 'payments', 'tasks.assignedEmployee'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('project_name', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%")
                                ->orWhere('client_code', 'like', "%{$search}%")
                                ->orWhere('company_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($currency, function ($query, $currency) {
                $query->where('currency', $currency);
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $stats = [
            'total' => WebsiteProject::count(),
            'in_progress' => WebsiteProject::where('status', 'in_progress')->count(),
            'on_hold' => WebsiteProject::where('status', 'on_hold')->count(),
            'completed' => WebsiteProject::where('status', 'completed')->count(),
        ];

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'currency' => $currency ?? '',
            ],
        ]);
    }

    /**
     * Display the specified Website Project detail page.
     */
    public function show(WebsiteProject $websiteProject): Response
    {
        $websiteProject->load([
            'client',
            'payments' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'tasks' => function ($q) {
                $q->with('assignedEmployee:id,name,employee_code,avatar')->orderBy('due_date', 'asc');
            },
        ]);

        return Inertia::render('projects/show', [
            'project' => $websiteProject,
        ]);
    }

    /**
     * Show form for creating a new Website Project.
     */
    public function create(): Response
    {
        $clients = Client::where('status', 'active')->select('id', 'client_code', 'name', 'company_name', 'currency')->get();
        $currencies = \App\Models\Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('projects/create', [
            'clients' => $clients,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Store a newly created Website Project in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'project_name' => ['required', 'string', 'max:255'],
            'total_budget' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'start_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['in_progress', 'on_hold', 'completed', 'cancelled'])],
            'progress_percentage' => ['required', 'integer', 'between:0,100'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : \App\Services\CurrencyService::getRate($validated['currency']);

        $validated['exchange_rate'] = $rate;
        $validated['total_budget_pkr'] = round((float) $validated['total_budget'] * $rate, 2);

        WebsiteProject::create($validated);

        return redirect()->route('website-projects.index')->with('success', 'Website Project created successfully.');
    }

    /**
     * Show form for editing the specified Website Project.
     */
    public function edit(WebsiteProject $websiteProject): Response
    {
        $websiteProject->load('client');
        $clients = Client::select('id', 'client_code', 'name', 'company_name', 'currency')->get();
        $currencies = \App\Models\Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('projects/edit', [
            'project' => $websiteProject,
            'clients' => $clients,
            'currencies' => $currencies,
            'exchange_rates' => \App\Services\CurrencyService::getDefaultRates(),
        ]);
    }

    /**
     * Update the specified Website Project in storage.
     */
    public function update(Request $request, WebsiteProject $websiteProject): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'project_name' => ['required', 'string', 'max:255'],
            'total_budget' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'start_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['in_progress', 'on_hold', 'completed', 'cancelled'])],
            'progress_percentage' => ['required', 'integer', 'between:0,100'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : \App\Services\CurrencyService::getRate($validated['currency']);

        $validated['exchange_rate'] = $rate;
        $validated['total_budget_pkr'] = round((float) $validated['total_budget'] * $rate, 2);

        $websiteProject->update($validated);

        return redirect()->route('website-projects.index')->with('success', 'Website Project details updated successfully.');
    }

    /**
     * Remove the specified Website Project from storage.
     */
    public function destroy(WebsiteProject $websiteProject): RedirectResponse
    {
        $websiteProject->delete();

        return redirect()->route('website-projects.index')->with('success', 'Website Project deleted successfully.');
    }
}
