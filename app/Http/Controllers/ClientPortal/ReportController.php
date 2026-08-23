<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
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
use App\Traits\AuthorizesClientPortalAccess;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
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
     * Build unified payments and financial report dataset.
     */
    protected function buildReportData(Request $request, int $clientId, Client $client): array
    {
        // 1. Fetch Project Milestones / Payments
        $projectPayments = ProjectPayment::where('client_id', $clientId)
            ->with(['websiteProject:id,project_name,currency', 'invoice'])
            ->get()
            ->map(function ($p) use ($client) {
                $rawDate = $p->paid_at ?? $p->created_at;
                $dateStr = $rawDate ? Carbon::parse($rawDate)->format('Y-m-d') : '';
                $status = $this->normalizeStatus($p->status);

                return [
                    'id' => 'project_' . $p->id,
                    'raw_id' => $p->id,
                    'category' => 'project',
                    'category_label' => 'Project Milestone',
                    'parent_id' => $p->website_project_id,
                    'parent_name' => $p->websiteProject ? $p->websiteProject->project_name : 'Website Project',
                    'title' => $p->milestone_title ?: 'Project Milestone Payment',
                    'date' => $dateStr,
                    'due_date' => $p->paid_at ? Carbon::parse($p->paid_at)->format('Y-m-d') : $dateStr,
                    'amount' => (float) $p->amount,
                    'currency' => $p->websiteProject->currency ?? $client->currency ?? 'AED',
                    'status' => $status,
                    'invoice' => $p->invoice ? [
                        'id' => $p->invoice->id,
                        'invoice_number' => $p->invoice->invoice_number,
                        'status' => $p->invoice->status,
                    ] : null,
                ];
            });

        // 2. Fetch Service Subscriptions / Payments
        $servicePayments = ServicePayment::where('client_id', $clientId)
            ->with(['service:id,service_name,currency,monthly_fee', 'invoice'])
            ->get()
            ->map(function ($s) use ($client) {
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
                    'parent_id' => $s->client_service_id,
                    'parent_name' => $s->service ? $s->service->service_name : 'Monthly Service',
                    'title' => "Monthly Billing ({$monthLabel})" . ($s->notes ? " - {$s->notes}" : ""),
                    'date' => $dateStr,
                    'due_date' => $dateStr,
                    'amount' => $amount,
                    'currency' => $s->service->currency ?? $client->currency ?? 'AED',
                    'status' => $status,
                    'invoice' => $s->invoice ? [
                        'id' => $s->invoice->id,
                        'invoice_number' => $s->invoice->invoice_number,
                        'status' => $s->invoice->status,
                    ] : null,
                ];
            });

        // 3. Fetch Domain Registration & Renewal Payments
        $domainPayments = DomainPayment::where('client_id', $clientId)
            ->with(['domain:id,domain_name,client_price_pkr', 'invoice'])
            ->get()
            ->map(function ($d) use ($client) {
                $rawDate = $d->due_date ?? $d->paid_at ?? $d->created_at;
                $dateStr = $rawDate ? Carbon::parse($rawDate)->format('Y-m-d') : '';
                $status = $this->normalizeStatus($d->status);

                return [
                    'id' => 'domain_' . $d->id,
                    'raw_id' => $d->id,
                    'category' => 'domain',
                    'category_label' => 'Domain Registration',
                    'parent_id' => $d->client_domain_id,
                    'parent_name' => $d->domain ? $d->domain->domain_name : 'Domain Record',
                    'title' => $d->title ?: ($d->domain ? "{$d->domain->domain_name} Registration / Renewal" : 'Domain Fee'),
                    'date' => $dateStr,
                    'due_date' => $d->due_date ? Carbon::parse($d->due_date)->format('Y-m-d') : $dateStr,
                    'amount' => (float) $d->amount,
                    'currency' => $client->currency ?? 'AED',
                    'status' => $status,
                    'invoice' => $d->invoice ? [
                        'id' => $d->invoice->id,
                        'invoice_number' => $d->invoice->invoice_number,
                        'status' => $d->invoice->status,
                    ] : null,
                ];
            });

        // 4. Fetch Web Hosting Payments
        $hostingPayments = HostingPayment::where('client_id', $clientId)
            ->with(['hosting:id,hosting_title,client_price_pkr', 'invoice'])
            ->get()
            ->map(function ($h) use ($client) {
                $rawDate = $h->due_date ?? $h->paid_at ?? $h->created_at;
                $dateStr = $rawDate ? Carbon::parse($rawDate)->format('Y-m-d') : '';
                $status = $this->normalizeStatus($h->status);

                return [
                    'id' => 'hosting_' . $h->id,
                    'raw_id' => $h->id,
                    'category' => 'hosting',
                    'category_label' => 'Hosting Package',
                    'parent_id' => $h->client_hosting_id,
                    'parent_name' => $h->hosting ? $h->hosting->hosting_title : 'Hosting Package',
                    'title' => $h->title ?: ($h->hosting ? "{$h->hosting->hosting_title} Renewal" : 'Hosting Fee'),
                    'date' => $dateStr,
                    'due_date' => $h->due_date ? Carbon::parse($h->due_date)->format('Y-m-d') : $dateStr,
                    'amount' => (float) $h->amount,
                    'currency' => $client->currency ?? 'AED',
                    'status' => $status,
                    'invoice' => $h->invoice ? [
                        'id' => $h->invoice->id,
                        'invoice_number' => $h->invoice->invoice_number,
                        'status' => $h->invoice->status,
                    ] : null,
                ];
            });

        // Combine All Payments
        $allTransactions = collect()
            ->concat($projectPayments)
            ->concat($servicePayments)
            ->concat($domainPayments)
            ->concat($hostingPayments);

        // Calculate Overall Lifetime Category Breakdowns before filtering
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

        // Apply Filters
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

            // Search keyword filter
            if ($search !== '') {
                $searchLower = strtolower($search);
                $titleMatch = str_contains(strtolower($item['title']), $searchLower);
                $parentMatch = str_contains(strtolower($item['parent_name']), $searchLower);
                $invoiceMatch = $item['invoice'] && str_contains(strtolower($item['invoice']['invoice_number']), $searchLower);
                if (!$titleMatch && !$parentMatch && !$invoiceMatch) {
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

        // Fetch Selection Options for Dropdowns
        $projectsList = WebsiteProject::where('client_id', $clientId)->select('id', 'project_name')->get();
        $servicesList = ClientService::where('client_id', $clientId)->select('id', 'service_name')->get();
        $domainsList = ClientDomain::where('client_id', $clientId)->select('id', 'domain_name')->get();
        $hostingsList = ClientHosting::where('client_id', $clientId)->select('id', 'hosting_title')->get();

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
            'logo' => SystemSetting::get('company_logo', '/app-logo-icon.png'),
        ];

        return [
            'client' => $client,
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
     * Display comprehensive Client Reports & Financial Statements dashboard.
     */
    public function index(Request $request): Response
    {
        $this->authorizePermission('view-client-portal-reports');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $data = $this->buildReportData($request, $clientId, $client);

        return Inertia::render('client-portal/reports/index', $data);
    }

    /**
     * Download or stream Financial Statement & Payments Report PDF.
     */
    public function pdf(Request $request)
    {
        $this->authorizePermission('view-client-portal-reports');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $data = $this->buildReportData($request, $clientId, $client);

        $pdf = Pdf::loadView('pdf.client-report', $data)
            ->setPaper('a4', 'portrait')
            ->setOption([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif',
            ]);

        $fileName = 'Financial_Report_' . ($client->client_code ?: $client->id) . '_' . date('Ymd_His') . '.pdf';

        return $pdf->stream($fileName);
    }
}

