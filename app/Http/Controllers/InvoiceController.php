<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientDomain;
use App\Models\ClientHosting;
use App\Models\ClientService;
use App\Models\Currency;
use App\Models\DomainPayment;
use App\Models\HostingPayment;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\ProjectPayment;
use App\Models\ServicePayment;
use App\Models\SystemSetting;
use App\Models\WebsiteProject;
use App\Models\User;
use App\Notifications\CrmNotification;
use App\Services\CurrencyService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    /**
     * Display a listing of all Invoices.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-invoices') && !$user->can('view-invoices'))) {
            abort(403, 'Unauthorized. You do not have permission to view invoices.');
        }

        $query = Invoice::with(['client', 'items']);

        // Search Filter (Invoice #, Client Name, Company Name)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%")
                            ->orWhere('client_code', 'like', "%{$search}%");
                    });
            });
        }

        // Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Client Filter
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $invoices = $query->latest('id')->paginate(12)->withQueryString();

        $stats = [
            'total_invoiced' => (float) Invoice::sum('total_amount_pkr'),
            'total_paid' => (float) Invoice::where('status', 'paid')->sum('total_amount_pkr'),
            'total_unpaid' => (float) Invoice::whereIn('status', ['sent', 'draft', 'overdue'])->sum('total_amount_pkr'),
            'overdue_count' => Invoice::where('status', 'overdue')->count(),
        ];

        $clients = Client::select('id', 'name', 'company_name', 'client_code')->orderBy('name')->get();

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
            'stats' => $stats,
            'clients' => $clients,
            'filters' => $request->only(['search', 'status', 'client_id']),
        ]);
    }

    /**
     * Show form for creating a new general or pre-filled invoice.
     */
    public function create(Request $request): Response
    {
        $clients = Client::select('id', 'name', 'company_name', 'client_code', 'currency')->orderBy('name')->get();
        $currencies = Currency::where('is_active', true)->get();

        $selectedClientId = $request->query('client_id');
        $pendingProjects = [];
        $pendingServices = [];
        $pendingDomains = [];
        $pendingHostings = [];

        if ($selectedClientId) {
            $pendingProjects = ProjectPayment::where('client_id', $selectedClientId)
                ->where('status', '!=', 'paid')
                ->whereDoesntHave('invoiceItems')
                ->with('websiteProject:id,project_name')
                ->get()
                ->map(function ($item) {
                    $projName = $item->websiteProject?->project_name ?? 'Website Project';
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

            $pendingServices = ServicePayment::where('client_id', $selectedClientId)
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

            $pendingDomains = DomainPayment::where('client_id', $selectedClientId)
                ->where('status', '!=', 'paid')
                ->whereDoesntHave('invoiceItems')
                ->with('domain:id,domain_name,registration_date,expiry_date')
                ->get()
                ->map(function ($item) {
                    $domainName = $item->domain?->domain_name ?? 'Domain';
                    $type = ucfirst(str_replace('_', ' ', $item->payment_type ?: 'renewal'));
                    $startDate = $item->due_date ?? $item->domain?->registration_date ?? now();
                    $endDate = $item->domain?->expiry_date ?? ($startDate ? Carbon::parse($startDate)->addYear() : null);
                    $durationText = ($startDate && $endDate)
                        ? ' (Duration: ' . Carbon::parse($startDate)->format('d M Y') . ' to ' . Carbon::parse($endDate)->format('d M Y') . ')'
                        : '';
                    return [
                        'id' => $item->id,
                        'title' => "Domain {$type}: {$domainName}{$durationText}",
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

            $pendingHostings = HostingPayment::where('client_id', $selectedClientId)
                ->where('status', '!=', 'paid')
                ->whereDoesntHave('invoiceItems')
                ->with(['hosting:id,hosting_title,billing_cycle,primary_domain_id,setup_date,expiry_date', 'hosting.primaryDomain:id,domain_name'])
                ->get()
                ->map(function ($item) {
                    $hostingTitle = $item->hosting?->hosting_title ?? 'Web Hosting';
                    $domainName = $item->hosting?->primaryDomain?->domain_name;
                    $type = ucfirst(str_replace('_', ' ', $item->payment_type ?: 'subscription'));
                    $cycle = $item->hosting?->billing_cycle ? ' (' . ucfirst(str_replace('_', ' ', $item->hosting->billing_cycle)) . ')' : '';
                    $domainSuffix = $domainName ? " - {$domainName}" : '';

                    $startDate = $item->due_date ?? $item->hosting?->setup_date ?? now();
                    $endDate = $item->hosting?->expiry_date;
                    if (!$endDate && $startDate) {
                        $cycleType = strtolower($item->hosting?->billing_cycle ?? 'annual');
                        $endDate = match ($cycleType) {
                            'monthly' => Carbon::parse($startDate)->addMonth(),
                            'quarterly' => Carbon::parse($startDate)->addMonths(3),
                            'semi_annual' => Carbon::parse($startDate)->addMonths(6),
                            'biennial' => Carbon::parse($startDate)->addYears(2),
                            'triennial' => Carbon::parse($startDate)->addYears(3),
                            default => Carbon::parse($startDate)->addYear(),
                        };
                    }
                    $durationText = ($startDate && $endDate)
                        ? ' (Duration: ' . Carbon::parse($startDate)->format('d M Y') . ' to ' . Carbon::parse($endDate)->format('d M Y') . ')'
                        : '';
                    return [
                        'id' => $item->id,
                        'title' => "Hosting: {$hostingTitle}{$cycle}{$domainSuffix} - {$type}{$durationText}",
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
        }

        return Inertia::render('invoices/create', [
            'clients' => $clients,
            'currencies' => $currencies,
            'selectedClientId' => $selectedClientId ? (int)$selectedClientId : null,
            'nextInvoiceNumber' => Invoice::generateNextInvoiceNumber(),
            'pendingProjects' => $pendingProjects,
            'pendingServices' => $pendingServices,
            'pendingDomains' => $pendingDomains,
            'pendingHostings' => $pendingHostings,
        ]);
    }

    /**
     * Store a newly created invoice with line items.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'status' => ['nullable', 'in:due,paid,cancelled'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.invoiceable_type' => ['nullable', 'string'],
            'items.*.invoiceable_id' => ['nullable', 'integer'],
        ]);

        $client = Client::findOrFail($validated['client_id']);
        $currencyCode = $client->currency ?: 'USD';
        $exchangeRate = CurrencyService::getRate($currencyCode);
        $status = $validated['status'] ?? 'due';

        DB::transaction(function () use ($validated, $client, $currencyCode, $exchangeRate, $status, &$invoice) {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += ((float)$item['quantity'] * (float)$item['unit_price']);
            }

            $taxRate = (float)($validated['tax_rate'] ?? 0);
            $taxAmount = ($subtotal * $taxRate) / 100;
            $discount = (float)($validated['discount'] ?? 0);
            $totalAmount = max(0, $subtotal + $taxAmount - $discount);
            $totalAmountPkr = round($totalAmount * $exchangeRate, 2);

            $invoice = Invoice::create([
                'invoice_number' => Invoice::generateNextInvoiceNumber(),
                'client_id' => $client->id,
                'currency_code' => $currencyCode,
                'exchange_rate_to_pkr' => $exchangeRate,
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
                $amount = (float)$item['quantity'] * (float)$item['unit_price'];
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

        // Notify Client Users
        if ($invoice->client_id) {
            $clientUsers = User::where('client_id', $invoice->client_id)->get();
            foreach ($clientUsers as $clientUser) {
                $clientUser->notify(new CrmNotification(
                    "New Invoice Issued: #{$invoice->invoice_number}",
                    "Invoice #{$invoice->invoice_number} for {$invoice->currency_code} " . number_format($invoice->total_amount, 2) . " has been issued.",
                    'invoice_issued',
                    'info',
                    "/client/invoices/{$invoice->id}",
                    ['invoice_id' => $invoice->id, 'amount' => $invoice->total_amount]
                ));
            }
        }

        return redirect()->route('invoices.show', $invoice->id)->with('success', 'Invoice generated successfully!');
    }

    /**
     * Show form for editing an existing invoice.
     */
    public function edit(Invoice $invoice): Response|RedirectResponse
    {
        if ($invoice->status === 'paid') {
            return redirect()->route('invoices.show', $invoice->id)->with('error', 'Paid invoices cannot be edited.');
        }

        $clients = Client::select('id', 'name', 'company_name', 'client_code', 'currency')->orderBy('name')->get();
        $currencies = Currency::where('is_active', true)->get();

        $invoice->load(['client', 'items' => function ($q) {
            $q->orderBy('id', 'asc');
        }]);

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

        $clientId = $invoice->client_id;
        $pendingProjects = ProjectPayment::where('client_id', $clientId)
            ->where('status', '!=', 'paid')
            ->where(function ($q) use ($invoice) {
                $q->whereDoesntHave('invoiceItems')
                    ->orWhereHas('invoiceItems', fn($iq) => $iq->where('invoice_id', $invoice->id));
            })
            ->with('websiteProject:id,project_name')
            ->get()
            ->map(function ($item) {
                $projName = $item->websiteProject?->project_name ?? 'Website Project';
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
            ->with('domain:id,domain_name,registration_date,expiry_date')
            ->get()
            ->map(function ($item) {
                $domainName = $item->domain?->domain_name ?? 'Domain';
                $type = ucfirst(str_replace('_', ' ', $item->payment_type ?: 'renewal'));
                $startDate = $item->due_date ?? $item->domain?->registration_date ?? now();
                $endDate = $item->domain?->expiry_date ?? ($startDate ? Carbon::parse($startDate)->addYear() : null);
                $durationText = ($startDate && $endDate)
                    ? ' (Duration: ' . Carbon::parse($startDate)->format('d M Y') . ' to ' . Carbon::parse($endDate)->format('d M Y') . ')'
                    : '';

                return [
                    'id' => $item->id,
                    'title' => "Domain {$type}: {$domainName}{$durationText}",
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
            ->with(['hosting:id,hosting_title,billing_cycle,primary_domain_id,setup_date,expiry_date', 'hosting.primaryDomain:id,domain_name'])
            ->get()
            ->map(function ($item) {
                $hostingTitle = $item->hosting?->hosting_title ?? 'Web Hosting';
                $domainName = $item->hosting?->primaryDomain?->domain_name;
                $type = ucfirst(str_replace('_', ' ', $item->payment_type ?: 'subscription'));
                $cycle = $item->hosting?->billing_cycle ? ' (' . ucfirst(str_replace('_', ' ', $item->hosting->billing_cycle)) . ')' : '';
                $domainSuffix = $domainName ? " - {$domainName}" : '';

                $startDate = $item->due_date ?? $item->hosting?->setup_date ?? now();
                $endDate = $item->hosting?->expiry_date;
                if (!$endDate && $startDate) {
                    $cycleType = strtolower($item->hosting?->billing_cycle ?? 'annual');
                    $endDate = match ($cycleType) {
                        'monthly' => Carbon::parse($startDate)->addMonth(),
                        'quarterly' => Carbon::parse($startDate)->addMonths(3),
                        'semi_annual' => Carbon::parse($startDate)->addMonths(6),
                        'biennial' => Carbon::parse($startDate)->addYears(2),
                        'triennial' => Carbon::parse($startDate)->addYears(3),
                        default => Carbon::parse($startDate)->addYear(),
                    };
                }
                $durationText = ($startDate && $endDate)
                    ? ' (Duration: ' . Carbon::parse($startDate)->format('d M Y') . ' to ' . Carbon::parse($endDate)->format('d M Y') . ')'
                    : '';

                return [
                    'id' => $item->id,
                    'title' => "Hosting: {$hostingTitle}{$cycle}{$domainSuffix} - {$type}{$durationText}",
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

        return Inertia::render('invoices/edit', [
            'invoice' => $invoice,
            'clients' => $clients,
            'currencies' => $currencies,
            'pendingProjects' => $pendingProjects,
            'pendingServices' => $pendingServices,
            'pendingDomains' => $pendingDomains,
            'pendingHostings' => $pendingHostings,
        ]);
    }

    /**
     * Update an existing invoice in storage.
     */
    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'paid') {
            return redirect()->route('invoices.show', $invoice->id)->with('error', 'Paid invoices cannot be edited.');
        }

        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:due,paid,cancelled'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.invoiceable_type' => ['nullable', 'string'],
            'items.*.invoiceable_id' => ['nullable', 'integer'],
        ]);

        $client = Client::findOrFail($validated['client_id']);
        $currencyCode = $client->currency ?: 'USD';
        $exchangeRate = CurrencyService::getRate($currencyCode);
        $status = $validated['status'] ?? $invoice->status ?? 'due';

        DB::transaction(function () use ($validated, $client, $currencyCode, $exchangeRate, $status, $invoice) {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $subtotal += ((float)$item['quantity'] * (float)$item['unit_price']);
            }

            $taxRate = (float)($validated['tax_rate'] ?? 0);
            $taxAmount = ($subtotal * $taxRate) / 100;
            $discount = (float)($validated['discount'] ?? 0);
            $totalAmount = max(0, $subtotal + $taxAmount - $discount);
            $totalAmountPkr = round($totalAmount * $exchangeRate, 2);

            $invoice->update([
                'client_id' => $client->id,
                'currency_code' => $currencyCode,
                'exchange_rate_to_pkr' => $exchangeRate,
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
                $amount = (float)$item['quantity'] * (float)$item['unit_price'];
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

        if ($status === 'paid' && $invoice->wasChanged('status')) {
            if ($invoice->client_id) {
                $clientUsers = User::where('client_id', $invoice->client_id)->get();
                foreach ($clientUsers as $clientUser) {
                    $clientUser->notify(new CrmNotification(
                        "Payment Confirmed: Invoice #{$invoice->invoice_number}",
                        "Payment for Invoice #{$invoice->invoice_number} ({$invoice->currency_code} " . number_format($invoice->total_amount, 2) . ") has been marked as PAID. Thank you!",
                        'invoice_paid',
                        'success',
                        "/client/invoices/{$invoice->id}",
                        ['invoice_id' => $invoice->id, 'amount' => $invoice->total_amount]
                    ));
                }
            }
        }

        return redirect()->route('invoices.show', $invoice->id)->with('success', 'Invoice updated successfully!');
    }

    /**
     * Generate 1-Click Invoice directly from a specific record (Domain, Hosting, Project Payment).
     * Enforces Duplicate Prevention.
     */
    public function generateFromRecord(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:domain,hosting,project_payment'],
            'id' => ['required', 'integer'],
        ]);

        $type = $validated['type'];
        $recordId = $validated['id'];

        $modelClass = match ($type) {
            'domain' => ClientDomain::class,
            'hosting' => ClientHosting::class,
            'project_payment' => ProjectPayment::class,
        };

        // 1. DUPLICATE PREVENTION CHECK
        $existingItem = InvoiceItem::where('invoiceable_type', $modelClass)
            ->where('invoiceable_id', $recordId)
            ->whereHas('invoice', function ($q) {
                $q->where('status', '!=', 'cancelled');
            })
            ->with('invoice')
            ->first();

        if ($existingItem && $existingItem->invoice) {
            return redirect()->route('invoices.show', $existingItem->invoice->id)
                ->with('info', 'An active invoice for this record already exists!');
        }

        // 2. CREATE NEW INVOICE IF NO DUPLICATE EXISTS
        DB::transaction(function () use ($type, $recordId, &$invoice) {
            if ($type === 'domain') {
                $domain = ClientDomain::findOrFail($recordId);
                $client = $domain->client;
                $description = "Domain Renewal: {$domain->domain_name} (1 Year)";
                $unitPrice = (float) $domain->client_price_pkr;
                $dueDate = $domain->expiry_date ? $domain->expiry_date->format('Y-m-d') : date('Y-m-d', strtotime('+7 days'));
                $clientId = $domain->client_id;
                $modelClass = ClientDomain::class;
            } elseif ($type === 'hosting') {
                $hosting = ClientHosting::with('primaryDomain')->findOrFail($recordId);
                $client = $hosting->client;
                $cycle = ucfirst(str_replace('_', ' ', $hosting->billing_cycle));
                $domainSuffix = $hosting->primaryDomain?->domain_name ? " - {$hosting->primaryDomain->domain_name}" : '';
                $description = "Hosting: {$hosting->hosting_title} ({$cycle}){$domainSuffix} - Renewal";
                $unitPrice = (float) $hosting->client_price_pkr;
                $dueDate = $hosting->expiry_date ? $hosting->expiry_date->format('Y-m-d') : date('Y-m-d', strtotime('+7 days'));
                $clientId = $hosting->client_id;
                $modelClass = ClientHosting::class;
            } else {
                $payment = ProjectPayment::with('websiteProject')->findOrFail($recordId);
                $client = $payment->client;
                $projTitle = $payment->websiteProject?->project_name ?? 'Website Project';
                $description = "Project: {$projTitle} - {$payment->milestone_title}";
                $unitPrice = (float) $payment->amount_pkr;
                $dueDate = date('Y-m-d', strtotime('+7 days'));
                $clientId = $payment->client_id;
                $modelClass = ProjectPayment::class;
            }

            $invoice = Invoice::create([
                'invoice_number' => Invoice::generateNextInvoiceNumber(),
                'client_id' => $clientId,
                'currency_code' => 'PKR',
                'exchange_rate_to_pkr' => 1.0000,
                'subtotal' => $unitPrice,
                'tax_rate' => 0.00,
                'tax_amount' => 0.00,
                'discount' => 0.00,
                'total_amount' => $unitPrice,
                'total_amount_pkr' => $unitPrice,
                'issue_date' => date('Y-m-d'),
                'due_date' => $dueDate,
                'status' => 'due',
                'notes' => 'Generated automatically from service record.',
                'terms' => SystemSetting::get('invoice_default_terms', 'Payment is due within 7 days of invoice date.'),
                'created_by' => Auth::id(),
            ]);

            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => $description,
                'quantity' => 1,
                'unit_price' => $unitPrice,
                'amount' => $unitPrice,
                'invoiceable_type' => $modelClass,
                'invoiceable_id' => $recordId,
            ]);
        });

        return redirect()->route('invoices.show', $invoice->id)->with('success', 'Invoice created successfully!');
    }

    /**
     * Display detailed invoice view.
     */
    public function show(Invoice $invoice): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-invoices') && !$user->can('view-invoices'))) {
            abort(403, 'Unauthorized. You do not have permission to view invoices.');
        }

        $invoice->load(['client', 'items.invoiceable', 'creator']);

        $companyInfo = [
            'company_name' => SystemSetting::get('company_name', 'SAPTA TECHNOLOGIES'),
            'company_phone' => SystemSetting::get('company_phone', '+92 300 0000000'),
            'company_email' => SystemSetting::get('company_email', 'billing@saptatech.com'),
            'company_address' => SystemSetting::get('company_address', 'Lahore, Pakistan'),
        ];

        return Inertia::render('invoices/show', [
            'invoice' => $invoice,
            'companyInfo' => $companyInfo,
        ]);
    }

    /**
     * Stream or download PDF invoice.
     */
    public function downloadPdf(Invoice $invoice)
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-invoices') && !$user->can('view-invoices'))) {
            abort(403, 'Unauthorized. You do not have permission to view or download invoices.');
        }

        $invoice->load(['client', 'items.invoiceable', 'creator']);

        $companyInfo = [
            'company_name' => SystemSetting::get('company_name', 'SAPTA TECHNOLOGIES'),
            'company_phone' => SystemSetting::get('company_phone', '+92 300 0000000'),
            'company_email' => SystemSetting::get('company_email', 'billing@saptatech.com'),
            'company_address' => SystemSetting::get('company_address', 'Lahore, Pakistan'),
        ];

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'company' => $companyInfo,
        ]);

        return $pdf->stream("Invoice_{$invoice->invoice_number}.pdf");
    }

    /**
     * Internal helper to synchronize Paid status for linked invoiceable records.
     */
    protected function syncPaidStatusForInvoice(Invoice $invoice): void
    {
        foreach ($invoice->items as $item) {
            if (!$item->invoiceable_type || !$item->invoiceable_id) continue;

            if ($item->invoiceable_type === ProjectPayment::class) {
                $payment = ProjectPayment::find($item->invoiceable_id);
                if ($payment) {
                    $payment->update([
                        'status' => 'paid',
                        'paid_at' => now(),
                    ]);
                }
            } elseif ($item->invoiceable_type === ClientDomain::class) {
                $domain = ClientDomain::find($item->invoiceable_id);
                if ($domain) {
                    $newExpiry = $domain->expiry_date
                        ? \Carbon\Carbon::parse($domain->expiry_date)->addYear()
                        : now()->addYear();

                    $domain->update([
                        'status' => 'active',
                        'expiry_date' => $newExpiry->format('Y-m-d'),
                    ]);
                }
            } elseif ($item->invoiceable_type === ClientHosting::class) {
                $hosting = ClientHosting::find($item->invoiceable_id);
                if ($hosting) {
                    $currentExpiry = $hosting->expiry_date ? \Carbon\Carbon::parse($hosting->expiry_date) : now();
                    $newExpiry = match ($hosting->billing_cycle) {
                        'monthly' => $currentExpiry->addMonth(),
                        'quarterly' => $currentExpiry->addMonths(3),
                        'semi_annual' => $currentExpiry->addMonths(6),
                        'biennial' => $currentExpiry->addYears(2),
                        default => $currentExpiry->addYear(),
                    };

                    $hosting->update([
                        'status' => 'active',
                        'expiry_date' => $newExpiry->format('Y-m-d'),
                    ]);
                }
            }
        }
    }
}
