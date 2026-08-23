<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Currency;
use App\Models\DomainPayment;
use App\Models\HostingPayment;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\ProjectPayment;
use App\Models\ServicePayment;
use App\Models\SystemSetting;
use App\Services\CurrencyService;
use App\Traits\AuthorizesClientPortalAccess;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    use AuthorizesClientPortalAccess;

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
     * Display a listing of Invoices for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $this->authorizePermission('view-client-portal-invoices');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = Invoice::where('client_id', $clientId)
            ->with(['items']);

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->orderBy('issue_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        $allInvoices = Invoice::where('client_id', $clientId)->get();

        $stats = [
            'total' => $allInvoices->count(),
            'paid_total' => $allInvoices->where('status', 'paid')->sum('total_amount'),
            'pending_total' => $allInvoices->whereIn('status', ['draft', 'sent', 'due'])->sum('total_amount'),
            'overdue_count' => $allInvoices->where('status', 'overdue')->count(),
        ];

        return Inertia::render('client-portal/invoices/index', [
            'client' => $client,
            'invoices' => $invoices,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new Invoice on a separate page.
     */
    public function create(): Response
    {
        $this->authorizePermission('create-client-portal-invoices');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol', 'exchange_rate_to_pkr')->get();

        $pendingProjects = ProjectPayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->whereDoesntHave('invoiceItems')
            ->with('websiteProject:id,project_title')
            ->get()
            ->map(function ($item) {
                $projName = $item->websiteProject?->project_title ?? 'Website Project';
                return [
                    'id' => $item->id,
                    'title' => "Project: {$projName} - {$item->milestone_title}",
                    'subtitle' => $projName,
                    'amount' => (float) $item->amount,
                    'amount_pkr' => (float) $item->amount_pkr,
                    'due_date' => $item->due_date ?? $item->paid_at ?? null,
                    'category' => 'project',
                    'category_label' => 'Project Milestone',
                    'invoiceable_type' => ProjectPayment::class,
                    'invoiceable_id' => $item->id,
                ];
            });

        $pendingServices = ServicePayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->whereDoesntHave('invoiceItems')
            ->with('service:id,service_name')
            ->get()
            ->map(function ($item) {
                $serviceName = $item->service?->service_name ?? 'Service';
                $period = $item->billing_period ?: ($item->billing_month ? date('M Y', strtotime($item->billing_month)) : 'Monthly Retainer');
                return [
                    'id' => $item->id,
                    'title' => "Service: {$serviceName} ({$period})",
                    'subtitle' => $serviceName,
                    'amount' => (float) ($item->amount_due ?: $item->amount_paid ?: $item->amount),
                    'amount_pkr' => (float) ($item->amount_paid_pkr ?: $item->amount_pkr),
                    'due_date' => $item->payment_date ?? $item->due_date ?? null,
                    'category' => 'service',
                    'category_label' => 'Monthly Recurring Service',
                    'invoiceable_type' => ServicePayment::class,
                    'invoiceable_id' => $item->id,
                ];
            });

        $pendingDomains = DomainPayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->whereDoesntHave('invoiceItems')
            ->with('domain:id,domain_name')
            ->get()
            ->map(function ($item) {
                $domainName = $item->domain?->domain_name ?? 'Domain';
                $type = ucfirst(str_replace('_', ' ', $item->payment_type ?: 'renewal'));
                return [
                    'id' => $item->id,
                    'title' => "Domain {$type}: {$domainName}",
                    'subtitle' => $domainName,
                    'amount' => (float) $item->amount,
                    'amount_pkr' => (float) $item->amount_pkr,
                    'due_date' => $item->due_date ?? null,
                    'category' => 'domain',
                    'category_label' => 'Domain Registration/Renewal',
                    'invoiceable_type' => DomainPayment::class,
                    'invoiceable_id' => $item->id,
                ];
            });

        $pendingHostings = HostingPayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->whereDoesntHave('invoiceItems')
            ->with(['hosting:id,hosting_title,billing_cycle,primary_domain_id', 'hosting.primaryDomain:id,domain_name'])
            ->get()
            ->map(function ($item) {
                $hostingTitle = $item->hosting?->hosting_title ?? 'Web Hosting';
                $domainName = $item->hosting?->primaryDomain?->domain_name;
                $type = ucfirst(str_replace('_', ' ', $item->payment_type ?: 'subscription'));
                $cycle = $item->hosting?->billing_cycle ? ' (' . ucfirst(str_replace('_', ' ', $item->hosting->billing_cycle)) . ')' : '';
                $domainSuffix = $domainName ? " - {$domainName}" : '';
                return [
                    'id' => $item->id,
                    'title' => "Hosting: {$hostingTitle}{$cycle}{$domainSuffix} - {$type}",
                    'subtitle' => $hostingTitle,
                    'amount' => (float) $item->amount,
                    'amount_pkr' => (float) $item->amount_pkr,
                    'due_date' => $item->due_date ?? null,
                    'category' => 'hosting',
                    'category_label' => 'Hosting Subscription/Renewal',
                    'invoiceable_type' => HostingPayment::class,
                    'invoiceable_id' => $item->id,
                ];
            });

        return Inertia::render('client-portal/invoices/create', [
            'client' => $client,
            'currencies' => $currencies,
            'nextInvoiceNumber' => Invoice::generateNextInvoiceNumber(),
            'pendingProjects' => $pendingProjects,
            'pendingServices' => $pendingServices,
            'pendingDomains' => $pendingDomains,
            'pendingHostings' => $pendingHostings,
        ]);
    }

    /**
     * Display specified Invoice detail page in Client Portal.
     */
    public function show(Invoice $invoice): Response
    {
        $this->authorizePermission('view-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        $client = $this->getClientModel();

        $invoice->load(['client', 'items']);

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Office #402, Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
            'logo' => SystemSetting::get('company_logo', '/app-logo-icon.png'),
        ];

        return Inertia::render('client-portal/invoices/show', [
            'client' => $client,
            'invoice' => $invoice,
            'company' => $companySettings,
        ]);
    }

    /**
     * Show the form for editing an existing Invoice.
     */
    public function edit(Invoice $invoice): Response|RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        if ($invoice->status === 'paid') {
            return redirect()->back()->with('error', 'Paid invoices cannot be edited.');
        }

        $client = $this->getClientModel();
        $invoice->load([
            'items' => function ($q) {
                $q->orderBy('id', 'asc');
            }
        ]);

        // Enrich existing invoice items with category identifiers
        $invoice->items->transform(function ($item) {
            $category = 'manual';
            $categoryLabel = 'Custom Item';

            if ($item->invoiceable_type) {
                if (str_contains($item->invoiceable_type, 'ProjectPayment') || str_contains($item->invoiceable_type, 'WebsiteProject')) {
                    $category = 'project';
                    $categoryLabel = 'Project Milestone';
                } elseif (str_contains($item->invoiceable_type, 'ServicePayment') || str_contains($item->invoiceable_type, 'ClientService')) {
                    $category = 'service';
                    $categoryLabel = 'Monthly Service';
                } elseif (str_contains($item->invoiceable_type, 'DomainPayment') || str_contains($item->invoiceable_type, 'ClientDomain')) {
                    $category = 'domain';
                    $categoryLabel = 'Domain Registration/Renewal';
                } elseif (str_contains($item->invoiceable_type, 'HostingPayment') || str_contains($item->invoiceable_type, 'ClientHosting')) {
                    $category = 'hosting';
                    $categoryLabel = 'Hosting Renewal';
                }
            }

            $item->category = $category;
            $item->category_label = $categoryLabel;
            return $item;
        });

        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol', 'exchange_rate_to_pkr')->get();

        $pendingProjects = ProjectPayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->where(function ($q) use ($invoice) {
                $q->whereDoesntHave('invoiceItems')
                    ->orWhereHas('invoiceItems', fn($iq) => $iq->where('invoice_id', $invoice->id));
            })
            ->with('websiteProject:id,project_title')
            ->get()
            ->map(function ($item) {
                $projName = $item->websiteProject?->project_title ?? 'Website Project';
                return [
                    'id' => $item->id,
                    'title' => "Project: {$projName} - {$item->milestone_title}",
                    'subtitle' => $projName,
                    'amount' => (float) $item->amount,
                    'amount_pkr' => (float) $item->amount_pkr,
                    'due_date' => $item->due_date ?? null,
                    'category' => 'project',
                    'category_label' => 'Project Milestone',
                    'invoiceable_type' => ProjectPayment::class,
                    'invoiceable_id' => $item->id,
                ];
            });

        $pendingServices = ServicePayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->where(function ($q) use ($invoice) {
                $q->whereDoesntHave('invoiceItems')
                    ->orWhereHas('invoiceItems', fn($iq) => $iq->where('invoice_id', $invoice->id));
            })
            ->with('service:id,service_name')
            ->get()
            ->map(function ($item) {
                $serviceName = $item->service?->service_name ?? 'Service';
                $period = $item->billing_period ?: ($item->billing_month ? date('M Y', strtotime($item->billing_month)) : 'Monthly Retainer');
                return [
                    'id' => $item->id,
                    'title' => "Service: {$serviceName} ({$period})",
                    'subtitle' => $serviceName,
                    'amount' => (float) ($item->amount_due ?: $item->amount_paid ?: $item->amount),
                    'amount_pkr' => (float) ($item->amount_paid_pkr ?: $item->amount_pkr),
                    'due_date' => $item->due_date ?? null,
                    'category' => 'service',
                    'category_label' => 'Monthly Recurring Service',
                    'invoiceable_type' => ServicePayment::class,
                    'invoiceable_id' => $item->id,
                ];
            });

        $pendingDomains = DomainPayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->where(function ($q) use ($invoice) {
                $q->whereDoesntHave('invoiceItems')
                    ->orWhereHas('invoiceItems', fn($iq) => $iq->where('invoice_id', $invoice->id));
            })
            ->with('domain:id,domain_name')
            ->get()
            ->map(function ($item) {
                $domainName = $item->domain?->domain_name ?? 'Domain';
                $type = ucfirst(str_replace('_', ' ', $item->payment_type ?: 'renewal'));
                return [
                    'id' => $item->id,
                    'title' => "Domain {$type}: {$domainName}",
                    'subtitle' => $domainName,
                    'amount' => (float) $item->amount,
                    'amount_pkr' => (float) $item->amount_pkr,
                    'due_date' => $item->due_date ?? null,
                    'category' => 'domain',
                    'category_label' => 'Domain Registration/Renewal',
                    'invoiceable_type' => DomainPayment::class,
                    'invoiceable_id' => $item->id,
                ];
            });

        $pendingHostings = HostingPayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->where(function ($q) use ($invoice) {
                $q->whereDoesntHave('invoiceItems')
                    ->orWhereHas('invoiceItems', fn($iq) => $iq->where('invoice_id', $invoice->id));
            })
            ->with(['hosting:id,hosting_title,billing_cycle,primary_domain_id', 'hosting.primaryDomain:id,domain_name'])
            ->get()
            ->map(function ($item) {
                $hostingTitle = $item->hosting?->hosting_title ?? 'Web Hosting';
                $domainName = $item->hosting?->primaryDomain?->domain_name;
                $type = ucfirst(str_replace('_', ' ', $item->payment_type ?: 'subscription'));
                $cycle = $item->hosting?->billing_cycle ? ' (' . ucfirst(str_replace('_', ' ', $item->hosting->billing_cycle)) . ')' : '';
                $domainSuffix = $domainName ? " - {$domainName}" : '';
                return [
                    'id' => $item->id,
                    'title' => "Hosting: {$hostingTitle}{$cycle}{$domainSuffix} - {$type}",
                    'subtitle' => $hostingTitle,
                    'amount' => (float) $item->amount,
                    'amount_pkr' => (float) $item->amount_pkr,
                    'due_date' => $item->due_date ?? null,
                    'category' => 'hosting',
                    'category_label' => 'Hosting Subscription/Renewal',
                    'invoiceable_type' => HostingPayment::class,
                    'invoiceable_id' => $item->id,
                ];
            });

        return Inertia::render('client-portal/invoices/edit', [
            'client' => $client,
            'invoice' => $invoice,
            'currencies' => $currencies,
            'pendingProjects' => $pendingProjects,
            'pendingServices' => $pendingServices,
            'pendingDomains' => $pendingDomains,
            'pendingHostings' => $pendingHostings,
        ]);
    }

    /**
     * Store a newly created Invoice in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-invoices');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $validated = $request->validate([
            'invoice_number' => 'required|string|max:100|unique:invoices,invoice_number',
            'issue_date' => 'required|date',
            'due_date' => 'required|date',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:due,paid,cancelled',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.invoiceable_type' => 'nullable|string',
            'items.*.invoiceable_id' => 'nullable|integer',
        ]);

        $currencyCode = $client->currency ?: 'USD';
        $rate = CurrencyService::getRate($currencyCode);
        $status = $validated['status'] ?? 'due';

        DB::transaction(function () use ($validated, $clientId, $currencyCode, $rate, $status, &$invoice) {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += ((float) $item['quantity'] * (float) $item['unit_price']);
            }

            $taxRate = (float) ($validated['tax_rate'] ?? 0);
            $taxAmount = ($subtotal * $taxRate) / 100;
            $discount = (float) ($validated['discount'] ?? 0);
            $totalAmount = max(0, $subtotal + $taxAmount - $discount);
            $totalAmountPkr = round($totalAmount * $rate, 2);

            $invoice = Invoice::create([
                'client_id' => $clientId,
                'invoice_number' => $validated['invoice_number'],
                'currency_code' => $currencyCode,
                'exchange_rate_to_pkr' => $rate,
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'discount' => $discount,
                'total_amount' => $totalAmount,
                'total_amount_pkr' => $totalAmountPkr,
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'status' => $status,
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'created_by' => Auth::id(),
            ]);

            foreach ($validated['items'] as $item) {
                $amount = (float) $item['quantity'] * (float) $item['unit_price'];
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'amount' => $amount,
                    'invoiceable_type' => $item['invoiceable_type'] ?? null,
                    'invoiceable_id' => $item['invoiceable_id'] ?? null,
                ]);
            }

            if ($status === 'paid') {
                $invoice->syncPaidStatusForItems();
            }
        });

        return redirect()->route('client-portal.invoices.index')->with('success', 'Invoice created successfully.');
    }

    /**
     * Update the specified Invoice in storage.
     */
    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-invoices');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        if ($invoice->status === 'paid') {
            return redirect()->back()->with('error', 'Paid invoices cannot be edited.');
        }

        $validated = $request->validate([
            'invoice_number' => 'required|string|max:100|unique:invoices,invoice_number,' . $invoice->id,
            'issue_date' => 'required|date',
            'due_date' => 'required|date',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:due,paid,cancelled',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:500',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.invoiceable_type' => 'nullable|string',
            'items.*.invoiceable_id' => 'nullable|integer',
        ]);

        $currencyCode = $client->currency ?: 'USD';
        $rate = CurrencyService::getRate($currencyCode);
        $status = $validated['status'] ?? $invoice->status ?? 'due';

        DB::transaction(function () use ($validated, $invoice, $currencyCode, $rate, $status) {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += ((float) $item['quantity'] * (float) $item['unit_price']);
            }

            $taxRate = (float) ($validated['tax_rate'] ?? 0);
            $taxAmount = ($subtotal * $taxRate) / 100;
            $discount = (float) ($validated['discount'] ?? 0);
            $totalAmount = max(0, $subtotal + $taxAmount - $discount);
            $totalAmountPkr = round($totalAmount * $rate, 2);

            $invoice->update([
                'invoice_number' => $validated['invoice_number'],
                'currency_code' => $currencyCode,
                'exchange_rate_to_pkr' => $rate,
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'discount' => $discount,
                'total_amount' => $totalAmount,
                'total_amount_pkr' => $totalAmountPkr,
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'status' => $status,
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
            ]);

            $invoice->items()->delete();
            foreach ($validated['items'] as $item) {
                $amount = (float) $item['quantity'] * (float) $item['unit_price'];
                $invoice->items()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'amount' => $amount,
                    'invoiceable_type' => $item['invoiceable_type'] ?? null,
                    'invoiceable_id' => $item['invoiceable_id'] ?? null,
                ]);
            }

            if ($status === 'paid') {
                $invoice->syncPaidStatusForItems();
            }
        });

        return redirect()->route('client-portal.invoices.index')->with('success', 'Invoice updated successfully.');
    }

    /**
     * Update status of an invoice.
     */
    public function updateStatus(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        $validated = $request->validate([
            'status' => ['required', 'in:due,paid,cancelled'],
        ]);

        $invoice->update(['status' => $validated['status']]);

        if ($validated['status'] === 'paid') {
            $invoice->syncPaidStatusForItems();
        }

        return redirect()->back()->with('success', "Invoice status updated to {$validated['status']}.");
    }

    /**
     * Remove the specified Invoice from storage.
     */
    public function destroy(Invoice $invoice): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        if ($invoice->status === 'paid') {
            return redirect()->back()->with('error', 'Paid invoices cannot be deleted.');
        }

        $invoice->items()->delete();
        $invoice->delete();

        return redirect()->route('client-portal.invoices.index')->with('success', 'Invoice deleted successfully.');
    }

    /**
     * Download or stream Invoice PDF.
     */
    public function pdf(Invoice $invoice)
    {
        $this->authorizePermission('print-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        $invoice->load(['client', 'items']);

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Office #402, Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
            'logo' => SystemSetting::get('company_logo', '/app-logo-icon.png'),
        ];

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'company' => $companySettings,
        ]);

        return $pdf->stream("Invoice-{$invoice->invoice_number}.pdf");
    }
}
