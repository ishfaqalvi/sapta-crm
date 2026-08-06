<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ProjectPayment;
use App\Models\WebsiteProject;
use App\Services\CurrencyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MilestoneController extends Controller
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
     * Retrieve client model securely.
     */
    protected function getClientModel(): Client
    {
        return Client::findOrFail($this->getClientId());
    }

    /**
     * Display a listing of Website Project Milestones & Budget Settlements.
     */
    public function index(Request $request): Response
    {
        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        // Get all project IDs belonging to this client
        $projectIds = WebsiteProject::where('client_id', $clientId)->pluck('id')->toArray();

        $query = ProjectPayment::whereIn('website_project_id', $projectIds)
            ->with([
                'websiteProject:id,project_name,client_id,currency,total_budget',
            ]);

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('milestone_title', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhere('payment_method', 'like', "%{$search}%")
                    ->orWhereHas('websiteProject', function ($pq) use ($search) {
                        $pq->where('project_name', 'like', "%{$search}%");
                    });
            });
        }

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Stage Filter
        if ($request->filled('stage')) {
            $query->where('payment_stage', $request->stage);
        }

        // Project Filter
        if ($request->filled('project_id')) {
            $query->where('website_project_id', $request->project_id);
        }

        $milestones = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $projects = WebsiteProject::where('client_id', $clientId)
            ->select('id', 'project_name', 'currency', 'total_budget')
            ->orderBy('project_name', 'asc')
            ->get();

        // Stats calculation
        $allMilestones = ProjectPayment::whereIn('website_project_id', $projectIds)->get();
        $totalProjectsBudget = WebsiteProject::where('client_id', $clientId)->sum('total_budget');

        $stats = [
            'total_milestones' => $allMilestones->count(),
            'paid_count' => $allMilestones->where('status', 'paid')->count(),
            'pending_count' => $allMilestones->where('status', 'pending')->count(),
            'total_paid_amount' => $allMilestones->where('status', 'paid')->sum('amount'),
            'total_pending_amount' => $allMilestones->where('status', 'pending')->sum('amount'),
            'total_budget_allocated' => $totalProjectsBudget,
        ];

        return Inertia::render('client-portal/milestones/index', [
            'client' => $client,
            'milestones' => $milestones,
            'projects' => $projects,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'stage', 'project_id']),
        ]);
    }

    /**
     * Store a newly created milestone payment record.
     */
    public function store(Request $request): RedirectResponse
    {
        $clientId = $this->getClientId();

        $validated = $request->validate([
            'website_project_id' => [
                'required',
                Rule::exists('website_projects', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'milestone_title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'payment_stage' => ['required', Rule::in(['advance', 'partial', 'full'])],
            'status' => ['required', Rule::in(['pending', 'paid'])],
            'paid_at' => 'nullable|date',
            'payment_method' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $project = WebsiteProject::where('id', $validated['website_project_id'])
            ->where('client_id', $clientId)
            ->firstOrFail();

        $validated['client_id'] = $clientId;

        $rate = CurrencyService::getRate($project->currency);
        $validated['exchange_rate'] = $rate;
        $validated['amount_pkr'] = round((float) $validated['amount'] * $rate, 2);

        if ($validated['status'] === 'paid' && empty($validated['paid_at'])) {
            $validated['paid_at'] = now()->toDateString();
        }

        ProjectPayment::create($validated);

        return redirect()->back()->with('success', 'Project milestone created successfully.');
    }

    /**
     * Update an existing milestone payment record.
     */
    public function update(Request $request, ProjectPayment $milestone): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($milestone->client_id !== $clientId) {
            abort(403, 'Unauthorized access to milestone');
        }

        $validated = $request->validate([
            'website_project_id' => [
                'required',
                Rule::exists('website_projects', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'milestone_title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'payment_stage' => ['required', Rule::in(['advance', 'partial', 'full'])],
            'status' => ['required', Rule::in(['pending', 'paid'])],
            'paid_at' => 'nullable|date',
            'payment_method' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $project = WebsiteProject::where('id', $validated['website_project_id'])
            ->where('client_id', $clientId)
            ->firstOrFail();

        $rate = CurrencyService::getRate($project->currency);
        $validated['exchange_rate'] = $rate;
        $validated['amount_pkr'] = round((float) $validated['amount'] * $rate, 2);

        if ($validated['status'] === 'paid' && empty($validated['paid_at'])) {
            $validated['paid_at'] = now()->toDateString();
        } elseif ($validated['status'] === 'pending') {
            $validated['paid_at'] = null;
        }

        $milestone->update($validated);

        return redirect()->back()->with('success', 'Project milestone updated successfully.');
    }

    /**
     * Remove the specified milestone payment record.
     */
    public function destroy(ProjectPayment $milestone): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($milestone->client_id !== $clientId) {
            abort(403, 'Unauthorized access to milestone');
        }

        if ($milestone->status === 'paid') {
            return redirect()->back()->with('error', 'Paid / settled milestone payments cannot be deleted to preserve financial calculations and audit records.');
        }

        $milestone->delete();

        return redirect()->back()->with('success', 'Project milestone deleted successfully.');
    }
}
