<?php

namespace App\Http\Controllers;

use App\Models\ProjectPayment;
use App\Models\WebsiteProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectPaymentController extends Controller
{
    /**
     * Display a listing of Website Project Milestone Payments.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $stage = $request->query('stage');

        $payments = ProjectPayment::with(['websiteProject', 'client'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('milestone_title', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%")
                                ->orWhere('client_code', 'like', "%{$search}%");
                        })
                        ->orWhereHas('websiteProject', function ($pq) use ($search) {
                            $pq->where('project_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($stage, function ($query, $stage) {
                $query->where('payment_stage', $stage);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $projects = WebsiteProject::with('client')->whereIn('status', ['in_progress', 'on_hold'])->get();

        $stats = [
            'total' => ProjectPayment::count(),
            'paid' => ProjectPayment::where('status', 'paid')->count(),
            'pending' => ProjectPayment::where('status', 'pending')->count(),
            'total_paid_pkr' => ProjectPayment::where('status', 'paid')->sum('amount_pkr'),
            'total_pending_pkr' => ProjectPayment::where('status', 'pending')->sum('amount_pkr'),
        ];

        return Inertia::render('projects/payments/index', [
            'payments' => $payments,
            'projects' => $projects,
            'stats' => $stats,
            'exchange_rates' => \App\Services\CurrencyService::getDefaultRates(),
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'stage' => $stage ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created milestone payment record.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'website_project_id' => ['required', 'exists:website_projects,id'],
            'milestone_title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'payment_stage' => ['required', Rule::in(['advance', 'partial', 'full'])],
            'status' => ['required', Rule::in(['pending', 'paid'])],
            'paid_at' => ['nullable', 'date'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $project = WebsiteProject::findOrFail($validated['website_project_id']);
        $validated['client_id'] = $project->client_id;

        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : \App\Services\CurrencyService::getRate($project->currency);

        $validated['exchange_rate'] = $rate;
        $validated['amount_pkr'] = round((float) $validated['amount'] * $rate, 2);

        if ($validated['status'] === 'paid' && empty($validated['paid_at'])) {
            $validated['paid_at'] = date('Y-m-d');
        }

        ProjectPayment::create($validated);

        return redirect()->route('website-payments.index')->with('success', 'Project milestone payment recorded successfully.');
    }

    /**
     * Update specified milestone payment status and settlement details.
     */
    public function update(Request $request, ProjectPayment $websitePayment): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'payment_stage' => ['required', Rule::in(['advance', 'partial', 'full'])],
            'status' => ['required', Rule::in(['pending', 'paid'])],
            'paid_at' => ['nullable', 'date'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $project = $websitePayment->websiteProject;
        $currency = $project ? $project->currency : 'PKR';

        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : ($websitePayment->exchange_rate > 0 ? (float) $websitePayment->exchange_rate : \App\Services\CurrencyService::getRate($currency));

        $validated['exchange_rate'] = $rate;
        $validated['amount_pkr'] = round((float) $validated['amount'] * $rate, 2);

        if ($validated['status'] === 'paid' && empty($validated['paid_at'])) {
            $validated['paid_at'] = date('Y-m-d');
        }

        $websitePayment->update($validated);

        return redirect()->route('website-payments.index')->with('success', 'Project payment milestone updated successfully.');
    }

    /**
     * Remove specified milestone payment record.
     */
    public function destroy(ProjectPayment $websitePayment): RedirectResponse
    {
        $websitePayment->delete();

        return redirect()->route('website-payments.index')->with('success', 'Project payment milestone deleted.');
    }
}
