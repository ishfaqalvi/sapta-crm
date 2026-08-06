<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\{Client, WebsiteProject, Currency};
use App\Services\CurrencyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Retrieve the authenticated client ID securely.
     */
    protected function getClientId(): int
    {
        $user = Auth::user();

        if (!$user || !$user->client_id) {
            abort(403, 'Unauthorized Client Portal Access');
        }

        return (int) $user->client_id;
    }

    /**
     * Retrieve client model with active currency.
     */
    protected function getClientModel(): Client
    {
        return Client::findOrFail($this->getClientId());
    }

    /**
     * Display a listing of Website Projects for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $search = $request->query('search');
        $status = $request->query('status');

        $projects = WebsiteProject::with(['payments', 'tasks.assignedEmployee'])
            ->where('client_id', $clientId)
            ->when($search, function ($query, $search) {
                $query->where('project_name', 'like', "%{$search}%");
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $stats = [
            'total' => WebsiteProject::where('client_id', $clientId)->count(),
            'in_progress' => WebsiteProject::where('client_id', $clientId)->where('status', 'in_progress')->count(),
            'on_hold' => WebsiteProject::where('client_id', $clientId)->where('status', 'on_hold')->count(),
            'completed' => WebsiteProject::where('client_id', $clientId)->where('status', 'completed')->count(),
        ];

        return Inertia::render('client-portal/projects/index', [
            'client' => $client,
            'projects' => $projects,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
            ],
        ]);
    }

    /**
     * Display the specified Website Project detail page.
     */
    public function show(WebsiteProject $project): Response
    {
        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId) {
            abort(403, 'Unauthorized access to project');
        }

        $client = $this->getClientModel();

        $project->load([
            'client',
            'payments' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'tasks' => function ($q) {
                $q->with('assignedEmployee:id,name,employee_code,avatar')->orderBy('due_date', 'asc');
            },
        ]);

        return Inertia::render('client-portal/projects/show', [
            'client' => $client,
            'project' => $project,
        ]);
    }

    /**
     * Show form for creating a new Website Project for this client.
     */
    public function create(): Response
    {
        $client = $this->getClientModel();
        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('client-portal/projects/create', [
            'client' => $client,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Store a newly created Website Project for this client.
     */
    public function store(Request $request): RedirectResponse
    {
        $clientId = $this->getClientId();

        $validated = $request->validate([
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

        $validated['client_id'] = $clientId;
        $validated['exchange_rate'] = $rate;
        $validated['total_budget_pkr'] = round((float) $validated['total_budget'] * $rate, 2);

        WebsiteProject::create($validated);

        return redirect()->route('client-portal.projects.index')->with('success', 'Project created successfully.');
    }

    /**
     * Show form for editing the specified Website Project.
     */
    public function edit(WebsiteProject $project): Response
    {
        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId) {
            abort(403, 'Unauthorized access to project');
        }

        $client = $this->getClientModel();
        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('client-portal/projects/edit', [
            'client' => $client,
            'project' => $project,
            'currencies' => $currencies,
            'exchange_rates' => CurrencyService::getDefaultRates(),
        ]);
    }

    /**
     * Update the specified Website Project in storage.
     */
    public function update(Request $request, WebsiteProject $project): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId) {
            abort(403, 'Unauthorized access to project');
        }

        $validated = $request->validate([
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

        $project->update($validated);

        return redirect()->route('client-portal.projects.index')->with('success', 'Project details updated successfully.');
    }

    /**
     * Remove the specified Website Project from storage.
     */
    public function destroy(WebsiteProject $project): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId) {
            abort(403, 'Unauthorized access to project');
        }

        $project->delete();

        return redirect()->route('client-portal.projects.index')->with('success', 'Project deleted successfully.');
    }
}
