<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientService;
use App\Models\ServiceCategory;
use App\Models\ServicePayment;
use App\Models\SystemSetting;
use App\Services\CurrencyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClientServiceController extends Controller
{
    /**
     * Display listing of Client Services.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $currency = $request->query('currency');
        $categoryId = $request->query('category_id');

        $services = ClientService::with(['client', 'category'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('service_name', 'like', "%{$search}%")
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
            'total' => ClientService::count(),
            'active' => ClientService::where('status', 'active')->count(),
            'paused' => ClientService::where('status', 'paused')->count(),
            'stopped' => ClientService::where('status', 'stopped')->count(),
        ];

        $categories = ServiceCategory::where('is_active', true)->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('services/index', [
            'services' => $services,
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
     * Show form for creating a new Client Service.
     */
    public function create(): Response
    {
        $clients = Client::where('status', 'active')->select('id', 'client_code', 'name', 'company_name', 'currency')->get();
        $currencies = \App\Models\Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();
        $categories = ServiceCategory::where('is_active', true)->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('services/create', [
            'clients' => $clients,
            'currencies' => $currencies,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created Client Service and auto-generate initial monthly payment log.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'category_id' => ['required', 'exists:service_categories,id'],
            'service_name' => ['required', 'string', 'max:255'],
            'monthly_fee' => ['required', 'numeric', 'min:0'],
            'contract_months' => ['required', 'integer', 'min:1', 'max:120'],
            'currency' => ['required', 'string', 'max:10'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'start_date' => ['required', 'date'],
            'billing_day' => ['required', 'integer', 'between:1,31'],
            'status' => ['required', Rule::in(['active', 'paused', 'stopped'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : CurrencyService::getRate($validated['currency']);

        $validated['exchange_rate'] = $rate;
        $validated['monthly_fee_pkr'] = round((float) $validated['monthly_fee'] * $rate, 2);

        $service = ClientService::create($validated);

        // Auto-generate current month payment log for tracking
        $currentMonth = date('Y-m');
        ServicePayment::create([
            'client_service_id' => $service->id,
            'client_id' => $service->client_id,
            'billing_month' => $currentMonth,
            'amount_due' => $service->monthly_fee,
            'amount_paid' => 0.00,
            'exchange_rate' => $rate,
            'amount_paid_pkr' => 0.00,
            'status' => 'due_pending',
        ]);

        return redirect()->route('services.index')->with('success', 'Service created successfully and initial billing log generated.');
    }

    /**
     * Display detailed view of a Client Service including payment logs and printable invoices.
     */
    public function show(ClientService $service): Response
    {
        $service->load([
            'client',
            'category',
            'payments' => function ($q) {
                $q->orderBy('billing_month', 'desc');
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

        return Inertia::render('services/show', [
            'service' => $service,
            'company' => $companySettings,
        ]);
    }

    /**
     * Show form for editing Client Service.
     */
    public function edit(ClientService $service): Response
    {
        $service->load(['client', 'category']);
        $clients = Client::select('id', 'client_code', 'name', 'company_name', 'currency')->get();
        $currencies = \App\Models\Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();
        $categories = ServiceCategory::where('is_active', true)->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('services/edit', [
            'service' => $service,
            'clients' => $clients,
            'currencies' => $currencies,
            'categories' => $categories,
            'exchange_rates' => CurrencyService::getDefaultRates(),
        ]);
    }

    /**
     * Update specified Client Service in storage.
     */
    public function update(Request $request, ClientService $service): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'category_id' => ['required', 'exists:service_categories,id'],
            'service_name' => ['required', 'string', 'max:255'],
            'monthly_fee' => ['required', 'numeric', 'min:0'],
            'contract_months' => ['required', 'integer', 'min:1', 'max:120'],
            'currency' => ['required', 'string', 'max:10'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'start_date' => ['required', 'date'],
            'billing_day' => ['required', 'integer', 'between:1,31'],
            'status' => ['required', Rule::in(['active', 'paused', 'stopped'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : CurrencyService::getRate($validated['currency']);

        $validated['exchange_rate'] = $rate;
        $validated['monthly_fee_pkr'] = round((float) $validated['monthly_fee'] * $rate, 2);

        $service->update($validated);

        return redirect()->route('services.index')->with('success', 'Service updated successfully.');
    }

    /**
     * Remove specified Client Service.
     */
    public function destroy(ClientService $service): RedirectResponse
    {
        $service->delete();

        return redirect()->route('services.index')->with('success', 'Service deleted successfully.');
    }
}
