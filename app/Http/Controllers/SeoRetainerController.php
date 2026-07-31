<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\SeoPayment;
use App\Models\SeoRetainer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SeoRetainerController extends Controller
{
    /**
     * Display listing of SEO Retainers.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $currency = $request->query('currency');

        $retainers = SeoRetainer::with(['client'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('package_name', 'like', "%{$search}%")
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
            'total' => SeoRetainer::count(),
            'active' => SeoRetainer::where('status', 'active')->count(),
            'paused' => SeoRetainer::where('status', 'paused')->count(),
            'stopped' => SeoRetainer::where('status', 'stopped')->count(),
        ];

        return Inertia::render('seo/retainers/index', [
            'retainers' => $retainers,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'currency' => $currency ?? '',
            ],
        ]);
    }

    /**
     * Show form for creating a new SEO Retainer.
     */
    public function create(): Response
    {
        $clients = Client::where('status', 'active')->select('id', 'client_code', 'name', 'company_name', 'currency')->get();
        $currencies = \App\Models\Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('seo/retainers/create', [
            'clients' => $clients,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Store a newly created SEO Retainer and auto-generate initial monthly payment log.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'package_name' => ['required', 'string', 'max:255'],
            'monthly_fee' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'start_date' => ['required', 'date'],
            'billing_day' => ['required', 'integer', 'between:1,31'],
            'status' => ['required', Rule::in(['active', 'paused', 'stopped'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : \App\Services\CurrencyService::getRate($validated['currency']);

        $validated['exchange_rate'] = $rate;
        $validated['monthly_fee_pkr'] = round((float) $validated['monthly_fee'] * $rate, 2);

        $retainer = SeoRetainer::create($validated);

        // Auto-generate current month payment log for tracking
        $currentMonth = date('Y-m');
        SeoPayment::create([
            'seo_retainer_id' => $retainer->id,
            'client_id' => $retainer->client_id,
            'billing_month' => $currentMonth,
            'amount_due' => $retainer->monthly_fee,
            'amount_paid' => 0.00,
            'exchange_rate' => $rate,
            'amount_paid_pkr' => 0.00,
            'status' => 'due_pending',
        ]);

        return redirect()->route('seo-retainers.index')->with('success', 'SEO Retainer created and initial billing log generated.');
    }

    /**
     * Show form for editing SEO Retainer.
     */
    public function edit(SeoRetainer $seoRetainer): Response
    {
        $seoRetainer->load('client');
        $clients = Client::select('id', 'client_code', 'name', 'company_name', 'currency')->get();
        $currencies = \App\Models\Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('seo/retainers/edit', [
            'retainer' => $seoRetainer,
            'clients' => $clients,
            'currencies' => $currencies,
            'exchange_rates' => \App\Services\CurrencyService::getDefaultRates(),
        ]);
    }

    /**
     * Update specified SEO Retainer in storage.
     */
    public function update(Request $request, SeoRetainer $seoRetainer): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'package_name' => ['required', 'string', 'max:255'],
            'monthly_fee' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'max:10'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'start_date' => ['required', 'date'],
            'billing_day' => ['required', 'integer', 'between:1,31'],
            'status' => ['required', Rule::in(['active', 'paused', 'stopped'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : \App\Services\CurrencyService::getRate($validated['currency']);

        $validated['exchange_rate'] = $rate;
        $validated['monthly_fee_pkr'] = round((float) $validated['monthly_fee'] * $rate, 2);

        $seoRetainer->update($validated);

        return redirect()->route('seo-retainers.index')->with('success', 'SEO Retainer updated successfully.');
    }

    /**
     * Remove specified SEO Retainer.
     */
    public function destroy(SeoRetainer $seoRetainer): RedirectResponse
    {
        $seoRetainer->delete();

        return redirect()->route('seo-retainers.index')->with('success', 'SEO Retainer deleted successfully.');
    }
}
