<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientDomain;
use App\Models\ClientHosting;
use App\Models\ClientService;
use App\Models\DomainPayment;
use App\Models\HostingPayment;
use App\Models\ProjectPayment;
use App\Models\ServicePayment;
use App\Models\SystemSetting;
use App\Models\WebsiteProject;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Check if user is authorized to view admin reports.
     */
    protected function authorizeAccess(): void
    {
        $user = Auth::user();
        if (!$user) {
            abort(401);
        }

        // Allow Super Admin or user with view-reports permission
        $roles = $user->roles ?? [];
        $isSuperAdmin = collect($roles)->some(fn($r) => in_array(strtolower($r), ['super admin', 'super-admin']));

        if (!$isSuperAdmin && !$user->can('view-reports')) {
            // Also fallback to checking Spatie permissions if method exists
            if (method_exists($user, 'hasPermissionTo') && !$user->hasPermissionTo('view-reports')) {
                abort(403, 'Unauthorized to view financial reports.');
            }
        }
    }

    /**
     * Normalize status across various database status variations.
     */
    protected function normalizeStatus(?string $status): string
    {
        $st = strtolower(trim((string) $status));
        if (in_array($st, ['paid', 'completed', 'settled'])) {
            return 'paid';
        }
        if (in_array($st, ['overdue'])) {
            return 'overdue';
        }
        if (in_array($st, ['cancelled', 'void'])) {
            return 'cancelled';
        }
        // 'due', 'due_pending', 'pending', 'unpaid', 'draft', 'sent'
        return 'pending';
    }

    /**
     * Build unified payments and cross-client financial report dataset.
     */
    protected function buildReportData(Request $request): array
    {
        $clientId = $request->get('client_id');
        $isAllClients = !$clientId || $clientId === 'all';

        // 1. Fetch Project Milestones / Payments
        $projectQuery = ProjectPayment::query()
            ->with(['client:id,name,company_name,client_code,currency', 'websiteProject:id,project_name,currency', 'invoice']);

        if (!$isAllClients) {
            $projectQuery->where('client_id', (int) $clientId);
        }

        $projectPayments = $projectQuery->get()->map(function ($p) {
            $rawDate = $p->paid_at ?? $p->created_at;
            $dateStr = $rawDate ? Carbon::parse($rawDate)->format('Y-m-d') : '';
            $status = $this->normalizeStatus($p->status);

            return [
                'id' => 'project_' . $p->id,
                'raw_id' => $p->id,
                'category' => 'project',
                'category_label' => 'Project Milestone',
                'client_id' => $p->client_id,
                'client' => $p->client ? [
                    'id' => $p->client->id,
                    'name' => $p->client->name,
                    'company_name' => $p->client->company_name,
                    'client_code' => $p->client->client_code,
                    'currency' => $p->client->currency ?? 'AED',
                ] : null,
                'parent_id' => $p->website_project_id,
                'parent_name' => $p->websiteProject ? $p->websiteProject->project_name : 'Website Project',
                'title' => $p->milestone_title ?: 'Project Milestone Payment',
                'date' => $dateStr,
                'due_date' => $p->paid_at ? Carbon::parse($p->paid_at)->format('Y-m-d') : $dateStr,
                'amount' => (float) $p->amount,
                'currency' => $p->websiteProject->currency ?? ($p->client->currency ?? 'AED'),
                'status' => $status,
                'invoice' => $p->invoice ? [
                    'id' => $p->invoice->id,
                    'invoice_number' => $p->invoice->invoice_number,
                    'status' => $p->invoice->status,
                ] : null,
            ];
        });

        // 2. Fetch Service Subscriptions / Payments
        $serviceQuery = ServicePayment::query()
            ->with(['client:id,name,company_name,client_code,currency', 'service:id,service_name,currency,monthly_fee', 'invoice']);

        if (!$isAllClients) {
            $serviceQuery->where('client_id', (int) $clientId);
        }

        $servicePayments = $serviceQuery->get()->map(function ($s) {
            $rawDate = $s->payment_date ?? ($s->billing_month ? Carbon::parse($s->billing_month)->startOfMonth() : $s->created_at);
            $dateStr = $rawDate ? Carbon::parse($rawDate)->format('Y-m-d') : '';
            $monthLabel = $s->billing_month ? Carbon::parse($s->billing_month)->format('M Y') : 'Cycle';
            $status = $this->normalizeStatus($s->status);

            $amount = (float) ($status === 'paid' && (float) $s->amount_paid > 0
                ? $s->amount_paid
                : ((float) $s->amount_due > 0 ? $s->amount_due : ($s->service ? $s->service->monthly_fee : 0)));

            return [
                'id' => 'service_' . $s->id,
                'raw_id' => $s->id,
                'category' => 'service',
                'category_label' => 'Service Subscription',
                'client_id' => $s->client_id,
                'client' => $s->client ? [
                    'id' => $s->client->id,
                    'name' => $s->client->name,
                    'company_name' => $s->client->company_name,
                    'client_code' => $s->client->client_code,
                    'currency' => $s->client->currency ?? 'AED',
                ] : null,
                'parent_id' => $s->client_service_id,
                'parent_name' => $s->service ? $s->service->service_name : 'Monthly Service',
                'title' => "Monthly Billing ({$monthLabel})" . ($s->notes ? " - {$s->notes}" : ""),
                'date' => $dateStr,
                'due_date' => $dateStr,
                'amount' => $amount,
                'currency' => $s->service->currency ?? ($s->client->currency ?? 'AED'),
                'status' => $status,
                'invoice' => $s->invoice ? [
                    'id' => $s->invoice->id,
                    'invoice_number' => $s->invoice->invoice_number,
                    'status' => $s->invoice->status,
                ] : null,
            ];
        });

        // 3. Fetch Domain Registration & Renewal Payments
        $domainQuery = DomainPayment::query()
            ->with(['client:id,name,company_name,client_code,currency', 'domain:id,domain_name,client_price_pkr', 'invoice']);

        if (!$isAllClients) {
            $domainQuery->where('client_id', (int) $clientId);
        }

        $domainPayments = $domainQuery->get()->map(function ($d) {
            $rawDate = $d->due_date ?? $d->paid_at ?? $d->created_at;
            $dateStr = $rawDate ? Carbon::parse($rawDate)->format('Y-m-d') : '';
            $status = $this->normalizeStatus($d->status);

            return [
                'id' => 'domain_' . $d->id,
                'raw_id' => $d->id,
                'category' => 'domain',
                'category_label' => 'Domain Registration',
                'client_id' => $d->client_id,
                'client' => $d->client ? [
                    'id' => $d->client->id,
                    'name' => $d->client->name,
                    'company_name' => $d->client->company_name,
                    'client_code' => $d->client->client_code,
                    'currency' => $d->client->currency ?? 'AED',
                ] : null,
                'parent_id' => $d->client_domain_id,
                'parent_name' => $d->domain ? $d->domain->domain_name : 'Domain Record',
                'title' => $d->title ?: ($d->domain ? "{$d->domain->domain_name} Registration / Renewal" : 'Domain Fee'),
                'date' => $dateStr,
                'due_date' => $d->due_date ? Carbon::parse($d->due_date)->format('Y-m-d') : $dateStr,
                'amount' => (float) $d->amount,
                'currency' => $d->client->currency ?? 'AED',
                'status' => $status,
                'invoice' => $d->invoice ? [
                    'id' => $d->invoice->id,
                    'invoice_number' => $d->invoice->invoice_number,
                    'status' => $d->invoice->status,
                ] : null,
            ];
        });

        // 4. Fetch Web Hosting Payments
        $hostingQuery = HostingPayment::query()
            ->with(['client:id,name,company_name,client_code,currency', 'hosting:id,hosting_title,client_price_pkr', 'invoice']);

        if (!$isAllClients) {
            $hostingQuery->where('client_id', (int) $clientId);
        }

        $hostingPayments = $hostingQuery->get()->map(function ($h) {
            $rawDate = $h->due_date ?? $h->paid_at ?? $h->created_at;
            $dateStr = $rawDate ? Carbon::parse($rawDate)->format('Y-m-d') : '';
            $status = $this->normalizeStatus($h->status);

            return [
                'id' => 'hosting_' . $h->id,
                'raw_id' => $h->id,
                'category' => 'hosting',
                'category_label' => 'Hosting Package',
                'client_id' => $h->client_id,
                'client' => $h->client ? [
                    'id' => $h->client->id,
                    'name' => $h->client->name,
                    'company_name' => $h->client->company_name,
                    'client_code' => $h->client->client_code,
                    'currency' => $h->client->currency ?? 'AED',
                ] : null,
                'parent_id' => $h->client_hosting_id,
                'parent_name' => $h->hosting ? $h->hosting->hosting_title : 'Hosting Package',
                'title' => $h->title ?: ($h->hosting ? "{$h->hosting->hosting_title} Renewal" : 'Hosting Fee'),
                'date' => $dateStr,
                'due_date' => $h->due_date ? Carbon::parse($h->due_date)->format('Y-m-d') : $dateStr,
                'amount' => (float) $h->amount,
                'currency' => $h->client->currency ?? 'AED',
                'status' => $status,
                'invoice' => $h->invoice ? [
                    'id' => $h->invoice->id,
                    'invoice_number' => $h->invoice->invoice_number,
                    'status' => $h->invoice->status,
                ] : null,
            ];
        });

        // Combine All Transactions
        $allTransactions = collect()
            ->concat($projectPayments)
            ->concat($servicePayments)
            ->concat($domainPayments)
            ->concat($hostingPayments);

        // Overall Category Breakdowns before sub-filtering
        $categoryBreakdown = [
            'project' => [
                'total' => (float) $projectPayments->sum('amount'),
                'paid' => (float) $projectPayments->where('status', 'paid')->sum('amount'),
                'pending' => (float) $projectPayments->whereIn('status', ['pending', 'overdue'])->sum('amount'),
                'count' => $projectPayments->count(),
            ],
            'service' => [
                'total' => (float) $servicePayments->sum('amount'),
                'paid' => (float) $servicePayments->where('status', 'paid')->sum('amount'),
                'pending' => (float) $servicePayments->whereIn('status', ['pending', 'overdue'])->sum('amount'),
                'count' => $servicePayments->count(),
            ],
            'domain' => [
                'total' => (float) $domainPayments->sum('amount'),
                'paid' => (float) $domainPayments->where('status', 'paid')->sum('amount'),
                'pending' => (float) $domainPayments->whereIn('status', ['pending', 'overdue'])->sum('amount'),
                'count' => $domainPayments->count(),
            ],
            'hosting' => [
                'total' => (float) $hostingPayments->sum('amount'),
                'paid' => (float) $hostingPayments->where('status', 'paid')->sum('amount'),
                'pending' => (float) $hostingPayments->whereIn('status', ['pending', 'overdue'])->sum('amount'),
                'count' => $hostingPayments->count(),
            ],
        ];

        // Apply Detailed Filters
        $categoryFilter = $request->get('category', 'all');
        $statusFilter = $request->get('status', 'all');
        $projectId = $request->get('project_id');
        $serviceId = $request->get('service_id');
        $domainId = $request->get('domain_id');
        $hostingId = $request->get('hosting_id');
        $fromDate = $request->get('from_date');
        $toDate = $request->get('to_date');
        $search = trim((string) $request->get('search', ''));

        $filtered = $allTransactions->filter(function ($item) use ($categoryFilter, $statusFilter, $projectId, $serviceId, $domainId, $hostingId, $fromDate, $toDate, $search) {
            // Category filter
            if ($categoryFilter && $categoryFilter !== 'all' && $item['category'] !== $categoryFilter) {
                return false;
            }

            // Status filter
            if ($statusFilter && $statusFilter !== 'all') {
                if ($statusFilter === 'pending' && !in_array($item['status'], ['pending', 'due_pending'])) {
                    return false;
                } elseif ($statusFilter !== 'pending' && $item['status'] !== $statusFilter) {
                    return false;
                }
            }

            // Entity specific filters
            if ($projectId && ($item['category'] !== 'project' || (int) $item['parent_id'] !== (int) $projectId)) {
                return false;
            }
            if ($serviceId && ($item['category'] !== 'service' || (int) $item['parent_id'] !== (int) $serviceId)) {
                return false;
            }
            if ($domainId && ($item['category'] !== 'domain' || (int) $item['parent_id'] !== (int) $domainId)) {
                return false;
            }
            if ($hostingId && ($item['category'] !== 'hosting' || (int) $item['parent_id'] !== (int) $hostingId)) {
                return false;
            }

            // Date range filter
            if ($fromDate && $item['date'] && $item['date'] < $fromDate) {
                return false;
            }
            if ($toDate && $item['date'] && $item['date'] > $toDate) {
                return false;
            }

            // Search filter
            if ($search !== '') {
                $searchLower = strtolower($search);
                $titleMatch = str_contains(strtolower($item['title']), $searchLower);
                $parentMatch = str_contains(strtolower($item['parent_name']), $searchLower);
                $clientNameMatch = $item['client'] && (str_contains(strtolower($item['client']['name']), $searchLower) || str_contains(strtolower($item['client']['client_code']), $searchLower) || str_contains(strtolower($item['client']['company_name'] ?? ''), $searchLower));
                $invoiceMatch = $item['invoice'] && str_contains(strtolower($item['invoice']['invoice_number']), $searchLower);
                if (!$titleMatch && !$parentMatch && !$clientNameMatch && !$invoiceMatch) {
                    return false;
                }
            }

            return true;
        })->sortByDesc('date')->values();

        // Calculate KPI Totals on Filtered Result
        $totalBilled = (float) $filtered->sum('amount');
        $totalPaid = (float) $filtered->where('status', 'paid')->sum('amount');
        $totalPending = (float) $filtered->where('status', 'pending')->sum('amount');
        $totalOverdue = (float) $filtered->where('status', 'overdue')->sum('amount');
        $totalCancelled = (float) $filtered->where('status', 'cancelled')->sum('amount');

        $kpi = [
            'total_billed' => $totalBilled,
            'total_paid' => $totalPaid,
            'total_pending' => $totalPending,
            'total_overdue' => $totalOverdue,
            'total_cancelled' => $totalCancelled,
            'count_all' => $filtered->count(),
            'count_paid' => $filtered->where('status', 'paid')->count(),
            'count_pending' => $filtered->where('status', 'pending')->count(),
            'count_overdue' => $filtered->where('status', 'overdue')->count(),
            'count_cancelled' => $filtered->where('status', 'cancelled')->count(),
        ];

        // Fetch Dropdown Filter Options
        $clientsList = Client::select('id', 'name', 'company_name', 'client_code', 'currency')
            ->orderBy('name')
            ->get();

        $projectsQuery = WebsiteProject::select('id', 'project_name', 'client_id');
        $servicesQuery = ClientService::select('id', 'service_name', 'client_id');
        $domainsQuery = ClientDomain::select('id', 'domain_name', 'client_id');
        $hostingsQuery = ClientHosting::select('id', 'hosting_title', 'client_id');

        if (!$isAllClients) {
            $projectsQuery->where('client_id', (int) $clientId);
            $servicesQuery->where('client_id', (int) $clientId);
            $domainsQuery->where('client_id', (int) $clientId);
            $hostingsQuery->where('client_id', (int) $clientId);
        }

        $projectsList = $projectsQuery->get();
        $servicesList = $servicesQuery->get();
        $domainsList = $domainsQuery->get();
        $hostingsList = $hostingsQuery->get();

        // Selected Client Details (if filtered)
        $selectedClient = !$isAllClients ? Client::find($clientId) : null;

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
            'logo' => SystemSetting::get('company_logo', '/app-logo-icon.png'),
        ];

        return [
            'selectedClient' => $selectedClient,
            'clients' => $clientsList,
            'transactions' => $filtered,
            'kpi' => $kpi,
            'categoryBreakdown' => $categoryBreakdown,
            'options' => [
                'projects' => $projectsList,
                'services' => $servicesList,
                'domains' => $domainsList,
                'hostings' => $hostingsList,
            ],
            'filters' => [
                'client_id' => $clientId ?: 'all',
                'category' => $categoryFilter,
                'status' => $statusFilter,
                'project_id' => $projectId,
                'service_id' => $serviceId,
                'domain_id' => $domainId,
                'hosting_id' => $hostingId,
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'search' => $search,
            ],
            'company' => $companySettings,
        ];
    }

    /**
     * Display comprehensive Admin Financial & Client Reports Ledger.
     */
    public function index(Request $request): Response
    {
        $this->authorizeAccess();

        $data = $this->buildReportData($request);

        return Inertia::render('reports/index', $data);
    }

    /**
     * Download or stream Admin Financial Statement PDF Report.
     */
    public function pdf(Request $request)
    {
        $this->authorizeAccess();

        $data = $this->buildReportData($request);

        $pdf = Pdf::loadView('pdf.admin-report', $data)
            ->setPaper('a4', 'portrait')
            ->setOption([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif',
            ]);

        $clientPrefix = $data['selectedClient'] ? ($data['selectedClient']->client_code ?: $data['selectedClient']->id) : 'All_Clients';
        $fileName = 'Financial_Report_' . $clientPrefix . '_' . date('Ymd_His') . '.pdf';

        return $pdf->stream($fileName);
    }
}
