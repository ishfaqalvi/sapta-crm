<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientService;
use App\Models\ClientCredential;
use App\Models\Currency;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\ServicePayment;
use App\Models\SystemSetting;
use App\Services\CurrencyService;
use App\Traits\AuthorizesClientPortalAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
            ->withSum([
                'payments as collected_amount' => function ($q) {
                    $q->where('status', 'paid');
                }
            ], 'amount_due')
            ->withSum([
                'payments as due_amount' => function ($q) {
                    $q->where('status', '!=', 'paid');
                }
            ], 'amount_due')
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

        $totalCollected = (float) ServicePayment::where('client_id', $clientId)
            ->where('status', 'paid')
            ->sum(DB::raw('CASE WHEN amount_paid > 0 THEN amount_paid ELSE amount_due END'));

        $totalPending = (float) ServicePayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->sum(DB::raw('CASE WHEN amount_due > amount_paid THEN (amount_due - amount_paid) ELSE amount_due END'));

        $stats = [
            'total' => $allServices->count(),
            'active' => $activeServices->count(),
            'paused' => $allServices->where('status', 'paused')->count(),
            'stopped' => $allServices->where('status', 'stopped')->count(),
            'monthly_recurring_total' => (float) $activeServices->sum('monthly_fee'),
            'total_collected' => $totalCollected,
            'total_pending' => $totalPending,
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
                $q->with('invoice')->orderBy('billing_month', 'desc');
            },
            'credentials' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'documents' => function ($q) {
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

        return Inertia::render('client-portal/services/show', [
            'client' => $client,
            'service' => $service,
            'company' => $companySettings,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Service Credentials Handlers
    |--------------------------------------------------------------------------
    */
    public function storeCredential(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-service-credentials');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => ['required', Rule::in(['hosting', 'cms', 'database', 'domain', 'api', 'other'])],
            'client_service_id' => 'nullable|exists:client_services,id',
            'website_project_id' => 'nullable|exists:website_projects,id',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:500',
            'url' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:2000',
        ]);

        $validated['client_id'] = $clientId;

        ClientCredential::create($validated);

        return redirect()->back()->with('success', 'Credential created successfully.');
    }

    public function updateCredential(Request $request, ClientCredential $credential): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-service-credentials');

        $clientId = $this->getClientId();

        if ($credential->client_id !== $clientId) {
            abort(403, 'Unauthorized access to credential');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => ['required', Rule::in(['hosting', 'cms', 'database', 'domain', 'api', 'other'])],
            'client_service_id' => 'nullable|exists:client_services,id',
            'website_project_id' => 'nullable|exists:website_projects,id',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:500',
            'url' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:2000',
        ]);

        $credential->update($validated);

        return redirect()->back()->with('success', 'Credential updated successfully.');
    }

    public function destroyCredential(ClientCredential $credential): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-service-credentials');

        $clientId = $this->getClientId();

        if ($credential->client_id !== $clientId) {
            abort(403, 'Unauthorized access to credential');
        }

        $credential->delete();

        return redirect()->back()->with('success', 'Credential deleted successfully.');
    }

    /**
     * Store a newly created Client Service for the authenticated client.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-services');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $validated = $request->validate([
            'category_id' => 'required|exists:service_categories,id',
            'service_name' => 'required|string|max:255',
            'monthly_fee' => 'required|numeric|min:0',
            'contract_months' => 'nullable|integer|min:1|max:120',
            'start_date' => 'required|date',
            'billing_day' => 'required|integer|between:1,31',
            'status' => ['required', Rule::in(['active', 'paused', 'stopped'])],
            'notes' => 'nullable|string|max:2000',
        ]);

        $validated['client_id'] = $clientId;
        $validated['currency'] = $client->currency ?? 'USD';
        $validated['contract_months'] = $request->filled('contract_months') && (int) $request->contract_months > 0 ? (int) $request->contract_months : null;

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
            'amount_paid_pkr' => 0.00
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
        $client = $this->getClientModel();

        if ($service->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Client Service');
        }

        $validated = $request->validate([
            'category_id' => 'required|exists:service_categories,id',
            'service_name' => 'required|string|max:255',
            'monthly_fee' => 'required|numeric|min:0',
            'contract_months' => 'nullable|integer|min:1|max:120',
            'start_date' => 'required|date',
            'billing_day' => 'required|integer|between:1,31',
            'status' => ['required', Rule::in(['active', 'paused', 'stopped'])],
            'notes' => 'nullable|string|max:2000',
        ]);

        $validated['currency'] = $client->currency ?? $service->currency ?? 'USD';
        $validated['contract_months'] = $request->filled('contract_months') && (int) $request->contract_months > 0 ? (int) $request->contract_months : null;
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
        $this->authorizePermission('create-client-portal-service-payments');

        $clientId = $this->getClientId();

        $request->validate([
            'client_service_id' => 'nullable|exists:client_services,id',
            'billing_month' => 'required|string',
            'amount_due' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'status' => 'nullable|string',
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
        $this->authorizePermission('edit-client-portal-service-payments');

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

        if ($validated['status'] === 'paid') {
            Invoice::syncItemAndCheckInvoicePaid($servicePayment);
        }

        return redirect()->back()->with('success', 'Service payment updated successfully.');
    }

    /**
     * Delete a Service Payment record in Client Portal.
     */
    public function destroyPayment(ServicePayment $servicePayment): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-service-payments');

        $clientId = $this->getClientId();

        if ($servicePayment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Service Payment record');
        }

        if ($servicePayment->status === 'paid') {
            return redirect()->back()->with('error', 'Paid service payment records cannot be deleted.');
        }

        $servicePayment->delete();

        return redirect()->back()->with('success', 'Service payment record deleted successfully.');
    }

    /**
     * Generate an official system Invoice for a Service Payment record.
     */
    public function generatePaymentInvoice(ServicePayment $servicePayment): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($servicePayment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Service Payment record');
        }

        if ($servicePayment->invoice()->exists()) {
            return redirect()->back()->with('error', 'An invoice has already been generated for this service payment record.');
        }

        $service = $servicePayment->service;
        $currency = $service ? ($service->currency ?? 'USD') : 'USD';
        $rate = CurrencyService::getRate($currency);

        $invoiceNumber = Invoice::generateNextInvoiceNumber();

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'client_id' => $servicePayment->client_id,
            'currency_code' => $currency,
            'exchange_rate_to_pkr' => $rate,
            'subtotal' => $servicePayment->amount_due,
            'tax_rate' => 0.00,
            'tax_amount' => 0.00,
            'discount' => 0.00,
            'total_amount' => $servicePayment->amount_due,
            'total_amount_pkr' => round((float) $servicePayment->amount_due * $rate, 2),
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'due',
            'notes' => 'Invoice generated for service: ' . ($service ? $service->service_name : 'Subscription') . ' (' . $servicePayment->billing_month . ')',
            'created_by' => Auth::id(),
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'description' => 'Service Subscription: ' . ($service ? $service->service_name : 'Subscription') . ' - Billing Month: ' . $servicePayment->billing_month,
            'quantity' => 1.00,
            'unit_price' => $servicePayment->amount_due,
            'amount' => $servicePayment->amount_due,
            'invoiceable_type' => ServicePayment::class,
            'invoiceable_id' => $servicePayment->id,
        ]);

        return redirect()->back()->with('success', "Invoice {$invoiceNumber} generated successfully for service payment.");
    }

    /**
     * Mark a Service Payment record as Paid.
     */
    public function markPaymentAsPaid(ServicePayment $servicePayment): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-service-payments');

        $clientId = $this->getClientId();

        if ($servicePayment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Service Payment record');
        }

        if (!$servicePayment->invoice()->exists()) {
            return redirect()->back()->with('error', 'Please generate an invoice before marking this service payment as paid.');
        }

        $servicePayment->load('service');
        $currency = $servicePayment->service ? $servicePayment->service->currency : 'AED';
        $rate = CurrencyService::getRate($currency);

        $amountPaid = $servicePayment->amount_due > 0 ? $servicePayment->amount_due : $servicePayment->amount_paid;

        $servicePayment->update([
            'status' => 'paid',
            'amount_paid' => $amountPaid,
            'exchange_rate' => $rate,
            'amount_paid_pkr' => round((float) $amountPaid * $rate, 2),
            'payment_date' => $servicePayment->payment_date ?? now()->toDateString(),
        ]);

        Invoice::syncItemAndCheckInvoicePaid($servicePayment);

        return redirect()->back()->with('success', "Service payment for {$servicePayment->billing_month} marked as Paid successfully.");
    }

    /**
     * Store uploaded document for Client Service in Client Portal.
     */
    public function storeDocument(Request $request, ClientService $service): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-service-documents');

        $clientId = $this->getClientId();

        if ($service->client_id !== $clientId) {
            abort(403, 'Unauthorized access to service');
        }

        $allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg', 'webp'];

        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'file' => [
                'required',
                'file',
                'max:25600',
                function ($attribute, $value, $fail) use ($allowedExtensions) {
                    if (!$value || !method_exists($value, 'getClientOriginalExtension'))
                        return;
                    $ext = strtolower($value->getClientOriginalExtension());
                    if (!in_array($ext, $allowedExtensions)) {
                        $fail('The file field must be a file of type: ' . implode(', ', $allowedExtensions) . '.');
                    }
                },
            ],
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $fileSize = $file->getSize();

        $destinationPath = public_path('uploads/documents');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $filename = time() . '_' . uniqid() . '.' . $extension;
        $file->move($destinationPath, $filename);
        $filePath = '/uploads/documents/' . $filename;

        \App\Models\ClientDocument::create([
            'client_id' => $clientId,
            'client_service_id' => $service->id,
            'title' => $request->input('title'),
            'file_path' => $filePath,
            'file_name' => $originalName,
            'file_type' => $extension,
            'file_size' => $fileSize,
        ]);

        return redirect()->back()->with('success', 'Document uploaded successfully.');
    }

    /**
     * Delete document attached to Client Service in Client Portal.
     */
    public function destroyDocument(ClientService $service, \App\Models\ClientDocument $document): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-service-documents');

        $clientId = $this->getClientId();

        if ($service->client_id !== $clientId || $document->client_service_id !== $service->id) {
            abort(403, 'Unauthorized access');
        }

        $physicalPath = public_path($document->file_path);
        if (file_exists($physicalPath)) {
            @unlink($physicalPath);
        }
        $document->delete();

        return redirect()->back()->with('success', 'Document deleted successfully.');
    }
}
