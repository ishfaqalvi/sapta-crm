<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Currency;
use App\Models\SeoPayment;
use App\Models\SeoRetainer;
use App\Services\CurrencyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SeoRetainerController extends Controller
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
     * Display a listing of SEO Retainers for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = SeoRetainer::where('client_id', $clientId)
            ->withCount([
                'payments as paid_payments_count' => function ($q) {
                    $q->where('status', 'paid');
                },
            ]);

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('package_name', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Currency Filter
        if ($request->filled('currency')) {
            $query->where('currency', $request->currency);
        }

        $retainers = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $allRetainers = SeoRetainer::where('client_id', $clientId)->get();
        $activeRetainers = $allRetainers->where('status', 'active');

        $stats = [
            'total' => $allRetainers->count(),
            'active' => $activeRetainers->count(),
            'paused' => $allRetainers->where('status', 'paused')->count(),
            'stopped' => $allRetainers->where('status', 'stopped')->count(),
            'monthly_recurring_total' => $activeRetainers->sum('monthly_fee'),
        ];

        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('client-portal/seo/index', [
            'client' => $client,
            'retainers' => $retainers,
            'stats' => $stats,
            'currencies' => $currencies,
            'filters' => $request->only(['search', 'status', 'currency']),
        ]);
    }

    /**
     * Store a newly created SEO Retainer for the authenticated client.
     */
    public function store(Request $request): RedirectResponse
    {
        $clientId = $this->getClientId();

        $validated = $request->validate([
            'package_name' => 'required|string|max:255',
            'monthly_fee' => 'required|numeric|min:0',
            'currency' => 'required|string|max:10',
            'start_date' => 'required|date',
            'billing_day' => 'required|integer|between:1,31',
            'status' => ['required', Rule::in(['active', 'paused', 'stopped'])],
            'notes' => 'nullable|string|max:2000',
        ]);

        $validated['client_id'] = $clientId;

        $rate = CurrencyService::getRate($validated['currency']);
        $validated['exchange_rate'] = $rate;
        $validated['monthly_fee_pkr'] = round((float) $validated['monthly_fee'] * $rate, 2);

        $retainer = SeoRetainer::create($validated);

        // Auto-generate current month payment log for tracking
        $currentMonth = date('Y-m');
        SeoPayment::create([
            'seo_retainer_id' => $retainer->id,
            'client_id' => $clientId,
            'billing_month' => $currentMonth,
            'amount_due' => $retainer->monthly_fee,
            'amount_paid' => 0.00,
            'exchange_rate' => $rate,
            'amount_paid_pkr' => 0.00,
            'status' => 'due_pending',
        ]);

        return redirect()->back()->with('success', 'SEO Retainer subscription created successfully.');
    }

    /**
     * Update an existing SEO Retainer.
     */
    public function update(Request $request, SeoRetainer $seoRetainer): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($seoRetainer->client_id !== $clientId) {
            abort(403, 'Unauthorized access to SEO Retainer');
        }

        $validated = $request->validate([
            'package_name' => 'required|string|max:255',
            'monthly_fee' => 'required|numeric|min:0',
            'currency' => 'required|string|max:10',
            'start_date' => 'required|date',
            'billing_day' => 'required|integer|between:1,31',
            'status' => ['required', Rule::in(['active', 'paused', 'stopped'])],
            'notes' => 'nullable|string|max:2000',
        ]);

        $rate = CurrencyService::getRate($validated['currency']);
        $validated['exchange_rate'] = $rate;
        $validated['monthly_fee_pkr'] = round((float) $validated['monthly_fee'] * $rate, 2);

        $seoRetainer->update($validated);

        return redirect()->back()->with('success', 'SEO Retainer updated successfully.');
    }

    /**
     * Remove the specified SEO Retainer.
     */
    public function destroy(SeoRetainer $seoRetainer): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($seoRetainer->client_id !== $clientId) {
            abort(403, 'Unauthorized access to SEO Retainer');
        }

        // Check if retainer has paid payment logs
        $hasPaidPayments = SeoPayment::where('seo_retainer_id', $seoRetainer->id)
            ->where('status', 'paid')
            ->exists();

        if ($hasPaidPayments) {
            return redirect()->back()->with('error', 'SEO Retainer with paid billing records cannot be deleted to preserve financial calculations.');
        }

        // Delete associated unpaid logs and retainer
        SeoPayment::where('seo_retainer_id', $seoRetainer->id)->delete();
        $seoRetainer->delete();

        return redirect()->back()->with('success', 'SEO Retainer deleted successfully.');
    }
}
