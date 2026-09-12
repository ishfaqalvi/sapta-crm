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
use App\Models\WebsiteProject;
use App\Traits\AuthorizesClientPortalAccess;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OverviewController extends Controller
{
    use AuthorizesClientPortalAccess;

    /**
     * Retrieve the authenticated client model securely from session.
     */
    protected function getAuthenticatedClient(bool $withRelations = true): Client
    {
        $user = Auth::user();
        $client = $this->getClientModel();

        if (!$withRelations) {
            return $client;
        }

        $employee = null;
        if ($user && ($user->type === 'employee' || $user->employee_id)) {
            $employee = $user->employee ?: \App\Models\Employee::where('user_id', $user->id)->first();
        }

        return $client->load([
            'websiteProjects' => function ($q) use ($user, $employee) {
                if ($user && $user->type === 'employee') {
                    $employeeId = $employee ? $employee->id : 0;
                    $q->whereHas('tasks', function ($tq) use ($employeeId) {
                        $tq->where('assigned_employee_id', $employeeId);
                    });
                }
                $q->with([
                    'payments',
                    'tasks' => function ($tq) use ($user, $employee) {
                        if ($user && $user->type === 'employee') {
                            $employeeId = $employee ? $employee->id : 0;
                            $tq->where('assigned_employee_id', $employeeId);
                        }
                        $tq->with('assignedEmployee');
                    }
                ])->latest();
            },
            'clientServices' => function ($q) use ($user, $employee) {
                if ($user && $user->type === 'employee') {
                    $employeeId = $employee ? $employee->id : 0;
                    $q->whereHas('tasks', function ($tq) use ($employeeId) {
                        $tq->where('assigned_employee_id', $employeeId);
                    });
                }
                $q->with([
                    'category',
                    'payments',
                    'tasks' => function ($tq) use ($user, $employee) {
                        if ($user && $user->type === 'employee') {
                            $employeeId = $employee ? $employee->id : 0;
                            $tq->where('assigned_employee_id', $employeeId);
                        }
                        $tq->with('assignedEmployee');
                    }
                ])->latest();
            },
            'projectPayments' => function ($q) {
                $q->with('websiteProject')->latest();
            },
            'domains' => function ($q) {
                $q->with('payments')->latest();
            },
            'hostings' => function ($q) {
                $q->with('payments')->latest();
            },
            'credentials' => function ($q) {
                $q->latest();
            },
            'quotations' => function ($q) {
                $q->latest();
            },
        ]);
    }

    /**
     * Client Portal Dashboard & Overview
     */
    public function index(): Response
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $isSuperAdmin = $user->type === 'admin' || $user->hasRole('Super Admin') || $user->hasRole('admin');

        $canViewOverview = $isSuperAdmin
            || ($user->hasPermissionTo('view-client-portal-overview') || $user->can('view-client-portal-overview'));

        $canViewProjectBudget = $isSuperAdmin
            || ($user->hasPermissionTo('view-client-portal-project-budget') || $user->can('view-client-portal-project-budget')
                || $user->hasPermissionTo('view-client-portal-overview-budget') || $user->can('view-client-portal-overview-budget'));

        $canViewServiceBudget = $isSuperAdmin
            || ($user->hasPermissionTo('view-client-portal-service-budget') || $user->can('view-client-portal-service-budget')
                || $user->hasPermissionTo('view-client-portal-overview-budget') || $user->can('view-client-portal-overview-budget'));

        $canViewInvoices = $isSuperAdmin
            || ($user->hasPermissionTo('view-client-portal-invoices') || $user->can('view-client-portal-invoices'));

        $canViewQuotations = $isSuperAdmin
            || ($user->hasPermissionTo('view-client-portal-quotations') || $user->can('view-client-portal-quotations'));

        $client = $this->getAuthenticatedClient($canViewOverview);

        // Sanitize projects financial data if project budget cannot be viewed
        if (!$canViewProjectBudget && $client->relationLoaded('websiteProjects')) {
            $client->websiteProjects->each(function ($project) {
                $project->makeHidden(['total_budget']);
                $project->total_budget = null;
                if ($project->relationLoaded('payments')) {
                    $project->setRelation('payments', collect());
                }
            });
            if ($client->relationLoaded('projectPayments')) {
                $client->setRelation('projectPayments', collect());
            }
        }

        // Sanitize services financial data if service budget cannot be viewed
        if (!$canViewServiceBudget && $client->relationLoaded('clientServices')) {
            $client->clientServices->each(function ($service) {
                $service->makeHidden(['monthly_fee', 'monthly_fee_pkr']);
                $service->monthly_fee = null;
                $service->monthly_fee_pkr = null;
                if ($service->relationLoaded('payments')) {
                    $service->setRelation('payments', collect());
                }
            });
        }

        $invoices = [];
        if ($canViewInvoices && $canViewOverview && $client->id) {
            $invoices = \App\Models\Invoice::where('client_id', $client->id)
                ->with('items')
                ->latest()
                ->take(15)
                ->get();
        }

        $quotations = [];
        if ($canViewQuotations && $canViewOverview && $client->id) {
            $quotations = \App\Models\Quotation::where('client_id', $client->id)
                ->with('items')
                ->latest()
                ->take(10)
                ->get();
        }

        [$kpi, $categoryBreakdown] = $this->calculateReportKpiAndBreakdown($client, $canViewProjectBudget, $canViewServiceBudget);

        return Inertia::render('client-portal/overview/index', [
            'client' => $client,
            'invoices' => $invoices,
            'quotations' => $quotations,
            'kpi' => $kpi,
            'categoryBreakdown' => $categoryBreakdown,
            'canViewOverview' => $canViewOverview,
            'canViewProjectBudget' => $canViewProjectBudget,
            'canViewServiceBudget' => $canViewServiceBudget,
            'canViewInvoices' => $canViewInvoices,
            'canViewQuotations' => $canViewQuotations,
        ]);
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
     * Calculate financial KPI and category-wise breakdown for the authenticated client.
     * Aligned 100% with ReportController.
     */
    protected function calculateReportKpiAndBreakdown(Client $client, bool $canViewProjectBudget = true, bool $canViewServiceBudget = true): array
    {
        $clientId = $client->id;
        $defaultBreakdown = [
            'project' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => 0],
            'service' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => 0],
            'domain'  => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => 0],
            'hosting' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => 0],
        ];
        $defaultKpi = [
            'total_billed' => 0.0,
            'total_paid' => 0.0,
            'total_pending' => 0.0,
            'total_overdue' => 0.0,
            'total_unpaid' => 0.0,
            'total_cancelled' => 0.0,
            'count_all' => 0,
            'count_paid' => 0,
            'count_pending' => 0,
            'count_overdue' => 0,
            'count_unpaid' => 0,
            'count_cancelled' => 0,
        ];

        if (!$clientId) {
            return [$defaultKpi, $defaultBreakdown];
        }

        // 1. Fetch Project Milestones / Payments
        $projectPayments = collect();
        if ($canViewProjectBudget) {
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
                    ];
                });
        }

        // 2. Fetch Service Subscriptions / Payments
        $servicePayments = collect();
        if ($canViewServiceBudget) {
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
                    ];
                });
        }

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
                ];
            });

        // Combine All Payments
        $allTransactions = collect()
            ->concat($projectPayments)
            ->concat($servicePayments)
            ->concat($domainPayments)
            ->concat($hostingPayments);

        // Overall Category Breakdowns
        $categoryBreakdown = [
            'project' => [
                'total' => round((float) $projectPayments->sum('amount'), 2),
                'paid' => round((float) $projectPayments->where('status', 'paid')->sum('amount'), 2),
                'pending' => round((float) $projectPayments->whereIn('status', ['pending', 'overdue'])->sum('amount'), 2),
                'count' => $projectPayments->count(),
            ],
            'service' => [
                'total' => round((float) $servicePayments->sum('amount'), 2),
                'paid' => round((float) $servicePayments->where('status', 'paid')->sum('amount'), 2),
                'pending' => round((float) $servicePayments->whereIn('status', ['pending', 'overdue'])->sum('amount'), 2),
                'count' => $servicePayments->count(),
            ],
            'domain' => [
                'total' => round((float) $domainPayments->sum('amount'), 2),
                'paid' => round((float) $domainPayments->where('status', 'paid')->sum('amount'), 2),
                'pending' => round((float) $domainPayments->whereIn('status', ['pending', 'overdue'])->sum('amount'), 2),
                'count' => $domainPayments->count(),
            ],
            'hosting' => [
                'total' => round((float) $hostingPayments->sum('amount'), 2),
                'paid' => round((float) $hostingPayments->where('status', 'paid')->sum('amount'), 2),
                'pending' => round((float) $hostingPayments->whereIn('status', ['pending', 'overdue'])->sum('amount'), 2),
                'count' => $hostingPayments->count(),
            ],
        ];

        // Overall KPI Totals
        $totalBilled = (float) $allTransactions->sum('amount');
        $totalPaid = (float) $allTransactions->where('status', 'paid')->sum('amount');
        $totalPending = (float) $allTransactions->where('status', 'pending')->sum('amount');
        $totalOverdue = (float) $allTransactions->where('status', 'overdue')->sum('amount');
        $totalUnpaid = (float) $allTransactions->whereIn('status', ['pending', 'overdue'])->sum('amount');
        $totalCancelled = (float) $allTransactions->where('status', 'cancelled')->sum('amount');

        $kpi = [
            'total_billed' => round($totalBilled, 2),
            'total_paid' => round($totalPaid, 2),
            'total_pending' => round($totalPending, 2),
            'total_overdue' => round($totalOverdue, 2),
            'total_unpaid' => round($totalUnpaid, 2),
            'total_cancelled' => round($totalCancelled, 2),
            'count_all' => $allTransactions->count(),
            'count_paid' => $allTransactions->where('status', 'paid')->count(),
            'count_pending' => $allTransactions->where('status', 'pending')->count(),
            'count_overdue' => $allTransactions->where('status', 'overdue')->count(),
            'count_unpaid' => $allTransactions->whereIn('status', ['pending', 'overdue'])->count(),
            'count_cancelled' => $allTransactions->where('status', 'cancelled')->count(),
        ];

        return [$kpi, $categoryBreakdown];
    }

    /**
     * Backward-compatible helper for calculating category breakdown.
     */
    protected function calculateCategoryBreakdown(Client $client, bool $canViewProjectBudget = true, bool $canViewServiceBudget = true): array
    {
        [, $categoryBreakdown] = $this->calculateReportKpiAndBreakdown($client, $canViewProjectBudget, $canViewServiceBudget);
        return $categoryBreakdown;
    }
}

