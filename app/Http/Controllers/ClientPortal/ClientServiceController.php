<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientService;
use App\Models\Currency;
use App\Models\ServicePayment;
use App\Models\SystemSetting;
use App\Services\CurrencyService;
use App\Traits\AuthorizesClientPortalAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClientServiceController extends Controller
{
    use AuthorizesClientPortalAccess;

    protected function getClientId(): int
    {
        $user = Auth::user();

        if (!$user || !$user->client_id) {
            abort(403, 'Unauthorized Client Portal Access');
        }

        return (int) $user->client_id;
    }

    protected function getClientModel(): Client
    {
        return Client::findOrFail($this->getClientId());
    }

    /**
     * Display a listing of Client Services for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $this->authorizePermission('view-client-portal-services');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = ClientService::where('client_id', $clientId)
            ->with(['category'])
            ->withCount([
                'payments as paid_payments_count' => function ($q) {
                    $q->where('status', 'paid');
                },
            ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('service_name', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('currency')) {
            $query->where('currency', $request->currency);
        }

        $services = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $allServices = ClientService::where('client_id', $clientId)->get();
        $activeServices = $allServices->where('status', 'active');

        $stats = [
            'total' => $allServices->count(),
            'active' => $activeServices->count(),
            'paused' => $allServices->where('status', 'paused')->count(),
            'stopped' => $allServices->where('status', 'stopped')->count(),
            'monthly_recurring_total' => $activeServices->sum('monthly_fee'),
        ];

        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();
        $categories = \App\Models\ServiceCategory::where('is_active', true)->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('client-portal/services/index', [
            'client' => $client,
            'services' => $services,
            'stats' => $stats,
            'currencies' => $currencies,
            'categories' => $categories,
            'filters' => $request->only(['search', 'status', 'currency']),
        ]);
    }

    /**
     * Display detailed view of a Client Service in Client Portal.
     */
    public function show(ClientService $service): Response
    {
        $this->authorizePermission('view-client-portal-services');

        $clientId = $this->getClientId();

        if ($service->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Client Service');
        }

        $client = $this->getClientModel();

        $service->load([
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

        return Inertia::render('client-portal/services/show', [
            'client' => $client,
            'service' => $service,
            'company' => $companySettings,
        ]);
    }

    /**
     * Store a newly created Client Service for the authenticated client.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-services');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'category_id' => 'required|exists:service_categories,id',
            'service_name' => 'required|string|max:255',
            'monthly_fee' => 'required|numeric|min:0',
            'contract_months' => 'nullable|integer|min:1|max:120',
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

        $service = ClientService::create($validated);

        $currentMonth = date('Y-m');
        ServicePayment::create([
            'client_service_id' => $service->id,
            'client_id' => $clientId,
            'billing_month' => $currentMonth,
            'amount_due' => $service->monthly_fee,
            'amount_paid' => 0.00,
            'exchange_rate' => $rate,
            'amount_paid_pkr' => 0.00,
            'status' => 'due_pending',
        ]);

        return redirect()->back()->with('success', 'Service created successfully.');
    }

    /**
     * Update an existing Client Service.
     */
    public function update(Request $request, ClientService $service): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-services');

        $clientId = $this->getClientId();

        if ($service->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Client Service');
        }

        $validated = $request->validate([
            'category_id' => 'required|exists:service_categories,id',
            'service_name' => 'required|string|max:255',
            'monthly_fee' => 'required|numeric|min:0',
            'contract_months' => 'nullable|integer|min:1|max:120',
            'currency' => 'required|string|max:10',
            'start_date' => 'required|date',
            'billing_day' => 'required|integer|between:1,31',
            'status' => ['required', Rule::in(['active', 'paused', 'stopped'])],
            'notes' => 'nullable|string|max:2000',
        ]);

        $rate = CurrencyService::getRate($validated['currency']);
        $validated['exchange_rate'] = $rate;
        $validated['monthly_fee_pkr'] = round((float) $validated['monthly_fee'] * $rate, 2);

        $service->update($validated);

        return redirect()->back()->with('success', 'Service updated successfully.');
    }

    /**
     * Remove specified Client Service.
     */
    public function destroy(ClientService $service): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-services');

        $clientId = $this->getClientId();

        if ($service->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Client Service');
        }

        $hasPaidPayments = ServicePayment::where('client_service_id', $service->id)
            ->where('status', 'paid')
            ->exists();

        if ($hasPaidPayments) {
            return redirect()->back()->with('error', 'Service with paid billing records cannot be deleted.');
        }

        ServicePayment::where('client_service_id', $service->id)->delete();
        $service->delete();

        return redirect()->back()->with('success', 'Service deleted successfully.');
    }

    /**
     * Store or Generate monthly billing log for client services.
     */
    public function generateMonthlyBatch(Request $request): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-services');

        $clientId = $this->getClientId();

        $request->validate([
            'client_service_id' => 'nullable|exists:client_services,id',
            'billing_month' => 'required|string',
            'amount_due' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'status' => 'nullable|string',
            'payment_method' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $month = $request->input('billing_month', date('Y-m'));

        if ($request->filled('client_service_id')) {
            $service = ClientService::where('id', $request->client_service_id)
                ->where('client_id', $clientId)
                ->firstOrFail();

            $rate = CurrencyService::getRate($service->currency);

            ServicePayment::updateOrCreate(
                [
                    'client_service_id' => $service->id,
                    'billing_month' => $month,
                ],
                [
                    'client_id' => $clientId,
                    'amount_due' => $request->filled('amount_due') ? $request->amount_due : $service->monthly_fee,
                    'amount_paid' => $request->filled('amount_paid') ? $request->amount_paid : 0.00,
                    'exchange_rate' => $rate,
                    'amount_paid_pkr' => round((float) ($request->amount_paid ?? 0) * $rate, 2),
                    'payment_date' => $request->payment_date,
                    'status' => $request->status ?? 'due_pending',
                    'payment_method' => $request->payment_method,
                    'notes' => $request->notes,
                ]
            );

            return redirect()->back()->with('success', "Service payment settlement recorded for {$month}.");
        }

        // Batch generate for all client's active services
        $activeServices = ClientService::where('client_id', $clientId)->where('status', 'active')->get();
        $count = 0;

        foreach ($activeServices as $srv) {
            $exists = ServicePayment::where('client_service_id', $srv->id)
                ->where('billing_month', $month)
                ->exists();

            if (!$exists) {
                $rate = CurrencyService::getRate($srv->currency);
                ServicePayment::create([
                    'client_service_id' => $srv->id,
                    'client_id' => $clientId,
                    'billing_month' => $month,
                    'amount_due' => $srv->monthly_fee,
                    'amount_paid' => 0.00,
                    'exchange_rate' => $rate,
                    'amount_paid_pkr' => 0.00,
                    'status' => 'due_pending',
                ]);
                $count++;
            }
        }

        return redirect()->back()->with('success', "{$count} monthly billing logs generated for {$month}.");
    }

    /**
     * Update an existing Service Payment record in Client Portal.
     */
    public function updatePayment(Request $request, ServicePayment $servicePayment): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-services');

        $clientId = $this->getClientId();

        if ($servicePayment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Service Payment record');
        }

        $validated = $request->validate([
            'amount_due' => ['required', 'numeric', 'min:0'],
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'payment_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['paid', 'due_pending', 'overdue'])],
            'payment_method' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $servicePayment->load('service');
        $currency = $servicePayment->service ? $servicePayment->service->currency : 'AED';
        $rate = CurrencyService::getRate($currency);

        $validated['exchange_rate'] = $rate;
        $validated['amount_paid_pkr'] = round((float) $validated['amount_paid'] * $rate, 2);

        $servicePayment->update($validated);

        return redirect()->back()->with('success', 'Service payment updated successfully.');
    }

    /**
     * Delete a Service Payment record in Client Portal.
     */
    public function destroyPayment(ServicePayment $servicePayment): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-services');

        $clientId = $this->getClientId();

        if ($servicePayment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Service Payment record');
        }

        $servicePayment->delete();

        return redirect()->back()->with('success', 'Service payment record deleted successfully.');
    }
}
