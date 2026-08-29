<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientService;
use App\Models\ClientCredential;
use App\Models\Currency;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\ServicePayment;
use App\Models\ServiceTask;
use App\Models\SystemSetting;
use App\Models\User;
use App\Notifications\CrmNotification;
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

    /**
     * Display a listing of Client Services for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $this->authorizePermission('view-client-portal-services');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $user = Auth::user();
        $employee = null;
        if ($user && ($user->type === 'employee' || $user->employee_id)) {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
        }

        $query = ClientService::where('client_id', $clientId)
            ->with([
                'category',
                'tasks' => function ($q) use ($user, $employee) {
                    if ($user && $user->type === 'employee') {
                        $employeeId = $employee ? $employee->id : 0;
                        $q->where('assigned_employee_id', $employeeId);
                    }
                    $q->with('assignedEmployee');
                },
            ])
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

        if ($user && $user->type === 'employee') {
            $employeeId = $employee ? $employee->id : 0;
            $query->whereHas('tasks', function ($q) use ($employeeId) {
                $q->where('assigned_employee_id', $employeeId);
            });
        }

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

        $allServicesQuery = ClientService::where('client_id', $clientId);
        if ($user && $user->type === 'employee') {
            $employeeId = $employee ? $employee->id : 0;
            $allServicesQuery->whereHas('tasks', function ($q) use ($employeeId) {
                $q->where('assigned_employee_id', $employeeId);
            });
        }
        $allServices = $allServicesQuery->get();
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
     * Display the specified Client Service detail page.
     */
    public function show(ClientService $service): Response
    {
        $this->authorizePermission('view-client-portal-services', null, $service);

        $clientId = $this->getClientId($service->client_id);

        if ($service->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Client Service');
        }

        $client = $this->getClientModel($service->client_id);

        $user = Auth::user();
        $employee = null;
        if ($user && ($user->type === 'employee' || $user->employee_id)) {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
        }

        if ($user && $user->type === 'employee') {
            $employeeId = $employee ? $employee->id : 0;
            $hasAssignedTask = $service->tasks()->where('assigned_employee_id', $employeeId)->exists();
            if (!$hasAssignedTask) {
                abort(403, 'Unauthorized access: No tasks assigned to you on this service.');
            }
        }

        $service->load([
            'category',
            'payments' => function ($q) {
                $q->with(['invoice', 'children', 'parent'])->orderBy('billing_month', 'desc')->orderBy('id', 'asc');
            },
            'tasks' => function ($q) use ($user, $employee) {
                if ($user && $user->type === 'employee') {
                    $employeeId = $employee ? $employee->id : 0;
                    $q->where('assigned_employee_id', $employeeId);
                }
                $q->with('assignedEmployee:id,name,employee_code,avatar')->withCount('messages')->orderBy('due_date', 'asc');
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

        $employees = Employee::select('id', 'name', 'employee_code', 'avatar')
            ->where('status', 'active')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('client-portal/services/show', [
            'client' => $client,
            'service' => $service,
            'company' => $companySettings,
            'employees' => $employees,
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

        // Notify Client Portal User
        $clientUser = $client->user ?: User::where('type', 'client')->where('client_id', $clientId)->first();
        if ($clientUser) {
            $clientUser->notify(new CrmNotification(
                "New Service Registered: {$service->service_name}",
                "A new recurring service '{$service->service_name}' ({$service->currency} " . number_format((float) $service->monthly_fee, 2) . "/mo) has been registered in your client portal.",
                'service_created',
                'info',
                "/client-portal/services/{$service->id}",
                [
                    'service_id' => $service->id,
                    'service_name' => $service->service_name,
                    'client_id' => $clientId,
                ]
            ));
        }

        // Notify Admins if registered by non-admin
        $authUser = Auth::user();
        if ($authUser && $authUser->type !== 'admin') {
            $admins = User::where('type', 'admin')
                ->where('id', '!=', $authUser->id)
                ->get();
            foreach ($admins as $admin) {
                $admin->notify(new CrmNotification(
                    "New Service Registered: {$service->service_name}",
                    "Service '{$service->service_name}' was registered for {$client->name} by {$authUser->name}.",
                    'service_created',
                    'info',
                    "/client-portal/services/{$service->id}",
                    [
                        'service_id' => $service->id,
                        'service_name' => $service->service_name,
                        'client_id' => $clientId,
                    ]
                ));
            }
        }

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
     * Split a parent Service Payment bill into multiple partial installments.
     */
    public function splitPayment(Request $request, ServicePayment $servicePayment): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-service-payments');

        $clientId = $this->getClientId();

        if ($servicePayment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Service Payment record');
        }

        // Rule: Only parent records can be split
        if (!is_null($servicePayment->parent_id)) {
            return redirect()->back()->with('error', 'Only original parent billing records can be split. Child installments cannot be split further.');
        }

        // Rule: Cannot split if invoice is already generated or payment is paid
        if ($servicePayment->invoice()->exists() || $servicePayment->status === 'paid') {
            return redirect()->back()->with('error', 'Cannot split a billing record that already has an invoice generated or is marked as paid.');
        }

        $currentAmountDue = (float) $servicePayment->amount_due;

        $validated = $request->validate([
            'split_amount' => ['required', 'numeric', 'min:0.01', 'max:' . ($currentAmountDue - 0.01)],
            'split_title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ], [
            'split_amount.max' => 'Split amount must be less than current bill amount (' . $currentAmountDue . ').',
        ]);

        $splitAmount = round((float) $validated['split_amount'], 2);
        $remainingAmount = round($currentAmountDue - $splitAmount, 2);

        $existingChildrenCount = $servicePayment->children()->count();
        $childTitle = !empty($validated['split_title'])
            ? $validated['split_title']
            : 'Installment ' . ($existingChildrenCount + 2);

        $parentTitle = $servicePayment->split_title ?: 'Installment 1 (Parent)';

        // 1. Update Parent with remaining amount
        $servicePayment->update([
            'amount_due' => $remainingAmount,
            'split_title' => $parentTitle,
        ]);

        // 2. Create Child record for the split amount
        $service = $servicePayment->service;
        $currency = $service ? ($service->currency ?? 'USD') : 'USD';
        $rate = $servicePayment->exchange_rate ?: CurrencyService::getRate($currency);

        ServicePayment::create([
            'client_service_id' => $servicePayment->client_service_id,
            'client_id' => $servicePayment->client_id,
            'parent_id' => $servicePayment->id,
            'billing_month' => $servicePayment->billing_month,
            'split_title' => $childTitle,
            'amount_due' => $splitAmount,
            'amount_paid' => 0.00,
            'exchange_rate' => $rate,
            'amount_paid_pkr' => 0.00,
            'status' => 'due',
            'notes' => $validated['notes'] ?? 'Split installment from parent bill',
        ]);

        return redirect()->back()->with('success', "Service bill for {$servicePayment->billing_month} split successfully: {$childTitle} ({$splitAmount}) created, Parent updated to ({$remainingAmount}).");
    }

    /**
     * Merge a child split Service Payment bill back into its parent.
     */
    public function mergePayment(ServicePayment $servicePayment): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-service-payments');

        $clientId = $this->getClientId();

        if ($servicePayment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Service Payment record');
        }

        // Rule: Only child records can be merged
        if (is_null($servicePayment->parent_id)) {
            return redirect()->back()->with('error', 'Only split child billing records can be merged back into their parent.');
        }

        // Rule: Cannot merge if invoice is already generated or payment is paid
        if ($servicePayment->invoice()->exists() || $servicePayment->status === 'paid') {
            return redirect()->back()->with('error', 'Cannot merge an installment that already has an invoice generated or is marked as paid.');
        }

        $parent = ServicePayment::find($servicePayment->parent_id);

        if (!$parent) {
            return redirect()->back()->with('error', 'Parent billing record could not be found.');
        }

        $childAmount = (float) $servicePayment->amount_due;
        $newParentAmount = round((float) $parent->amount_due + $childAmount, 2);

        // Update parent with combined amount
        $parent->update([
            'amount_due' => $newParentAmount,
        ]);

        // If parent has no other children after this, clear parent's split_title
        $remainingChildrenCount = ServicePayment::where('parent_id', $parent->id)->where('id', '!=', $servicePayment->id)->count();
        if ($remainingChildrenCount === 0) {
            $parent->update([
                'split_title' => null,
            ]);
        }

        // Delete the child record
        $servicePayment->delete();

        return redirect()->back()->with('success', "Installment of {$childAmount} merged back into Parent bill ({$newParentAmount}) successfully.");
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

        $titleSuffix = $servicePayment->split_title ? ' (' . $servicePayment->split_title . ')' : '';
        $itemDescription = 'Service Subscription: ' . ($service ? $service->service_name : 'Subscription') . ' - Billing Month: ' . $servicePayment->billing_month . $titleSuffix;

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
            'notes' => 'Invoice generated for service: ' . ($service ? $service->service_name : 'Subscription') . ' (' . $servicePayment->billing_month . ')' . $titleSuffix,
            'created_by' => Auth::id(),
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'description' => $itemDescription,
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

    /*
    |--------------------------------------------------------------------------
    | Service Tasks Handlers
    |--------------------------------------------------------------------------
    */
    public function storeTask(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-service-tasks');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'client_service_id' => [
                'required',
                Rule::exists('client_services', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'assigned_employee_id' => 'nullable|exists:employees,id',
            'task_title' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:todo,in_progress,in_review,completed,cancelled',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string|max:2000',
        ]);

        $validated['assigned_employee_id'] = $request->filled('assigned_employee_id') ? $request->assigned_employee_id : null;
        $validated['start_date'] = $request->filled('start_date') ? $request->start_date : null;
        $validated['due_date'] = $request->filled('due_date') ? $request->due_date : null;

        if ($validated['status'] === 'completed') {
            $validated['completed_at'] = now();
        }

        $task = ServiceTask::create($validated);

        if ($task->assigned_employee_id) {
            $employee = Employee::with('user')->find($task->assigned_employee_id);
            if ($employee && $employee->user) {
                $service = ClientService::find($task->client_service_id);
                $serviceName = $service ? $service->service_name : 'Service';
                $employee->user->notify(new CrmNotification(
                    "New Task Assigned: {$task->task_title}",
                    "You have been assigned to task '{$task->task_title}' on service '{$serviceName}'.",
                    'task_assigned',
                    'info',
                    "/tasks/detail/service/{$task->id}",
                    ['task_id' => $task->id, 'type' => 'service']
                ));
            }
        }

        return redirect()->back()->with('success', 'Service task created successfully.');
    }

    public function updateTask(Request $request, ServiceTask $task): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-service-tasks');

        $clientId = $this->getClientId();

        if (!$task->service || $task->service->client_id !== $clientId) {
            abort(403, 'Unauthorized access to task');
        }

        $validated = $request->validate([
            'client_service_id' => [
                'required',
                Rule::exists('client_services', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'assigned_employee_id' => 'nullable|exists:employees,id',
            'task_title' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:todo,in_progress,in_review,completed,cancelled',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string|max:2000',
        ]);

        $validated['assigned_employee_id'] = $request->filled('assigned_employee_id') ? $request->assigned_employee_id : null;
        $validated['start_date'] = $request->filled('start_date') ? $request->start_date : null;
        $validated['due_date'] = $request->filled('due_date') ? $request->due_date : null;

        if ($validated['status'] === 'completed' && $task->status !== 'completed') {
            $validated['completed_at'] = now();
        } elseif ($validated['status'] !== 'completed') {
            $validated['completed_at'] = null;
        }

        $task->update($validated);

        return redirect()->back()->with('success', 'Service task updated successfully.');
    }

    public function updateTaskStatus(Request $request, ServiceTask $task): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-service-tasks');

        $clientId = $this->getClientId();

        if (!$task->service || $task->service->client_id !== $clientId) {
            abort(403, 'Unauthorized access to task');
        }

        $validated = $request->validate([
            'status' => 'required|in:todo,in_progress,in_review,completed,cancelled',
        ]);

        $updateData = ['status' => $validated['status']];
        if ($validated['status'] === 'completed') {
            $updateData['completed_at'] = now();
        } else {
            $updateData['completed_at'] = null;
        }

        $task->update($updateData);

        return redirect()->back()->with('success', 'Service task status updated.');
    }

    public function destroyTask(ServiceTask $task): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-service-tasks');

        $clientId = $this->getClientId();

        if (!$task->service || $task->service->client_id !== $clientId) {
            abort(403, 'Unauthorized access to task');
        }

        $task->delete();

        return redirect()->back()->with('success', 'Service task deleted successfully.');
    }
}
