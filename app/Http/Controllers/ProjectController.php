<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\CurrencyService;
use App\Models\{Client, ProjectCategory, WebsiteProject, SystemSetting, Currency};

class ProjectController extends Controller
{
    /**
     * Display a listing of Website Projects.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $currency = $request->query('currency');
        $categoryId = $request->query('category_id');

        $projects = WebsiteProject::with(['client', 'category', 'payments', 'tasks.assignedEmployee'])
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
            ->when($categoryId, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
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

        $categories = ProjectCategory::where('is_active', true)->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'stats' => $stats,
            'categories' => $categories,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'currency' => $currency ?? '',
                'category_id' => $categoryId ?? '',
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
            'category',
            'payments' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'tasks' => function ($q) {
                $q->with('assignedEmployee:id,name,employee_code,avatar')->orderBy('due_date', 'asc');
            },
            'credentials' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
        ]);

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Office #402, Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
            'logo' => SystemSetting::get('company_logo', '/app-logo-icon.png'),
        ];

        return Inertia::render('projects/show', [
            'project' => $websiteProject,
            'companySettings' => $companySettings,
        ]);
    }

    /**
     * Show form for creating a new Website Project.
     */
    public function create(): Response
    {
        $clients = Client::where('status', 'active')->select('id', 'client_code', 'name', 'company_name', 'currency')->get();
        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();
        $categories = ProjectCategory::where('is_active', true)->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('projects/create', [
            'clients' => $clients,
            'currencies' => $currencies,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created Website Project in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'category_id' => ['required', 'exists:project_categories,id'],
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
            : CurrencyService::getRate($validated['currency']);

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
        $websiteProject->load(['client', 'category']);
        $clients = Client::select('id', 'client_code', 'name', 'company_name', 'currency')->get();
        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();
        $categories = ProjectCategory::where('is_active', true)->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('projects/edit', [
            'project' => $websiteProject,
            'clients' => $clients,
            'currencies' => $currencies,
            'categories' => $categories,
            'exchange_rates' => CurrencyService::getDefaultRates(),
        ]);
    }

    /**
     * Update the specified Website Project in storage.
     */
    public function update(Request $request, WebsiteProject $websiteProject): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'category_id' => ['required', 'exists:project_categories,id'],
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
            : CurrencyService::getRate($validated['currency']);

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
