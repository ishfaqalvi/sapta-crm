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

        return Inertia::render('client-portal/overview/index', [
            'client' => $client,
            'invoices' => $invoices,
            'quotations' => $quotations,
            'categoryBreakdown' => $this->calculateCategoryBreakdown($client, $canViewProjectBudget, $canViewServiceBudget),
            'canViewOverview' => $canViewOverview,
            'canViewProjectBudget' => $canViewProjectBudget,
            'canViewServiceBudget' => $canViewServiceBudget,
            'canViewInvoices' => $canViewInvoices,
            'canViewQuotations' => $canViewQuotations,
        ]);
    }

    /**
     * Calculate category-wise breakdown for the authenticated client.
     */
    protected function calculateCategoryBreakdown(Client $client, bool $canViewProjectBudget = true, bool $canViewServiceBudget = true): array
    {
        $clientId = $client->id;
        if (!$clientId) {
            return [
                'project' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => 0],
                'service' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => 0],
                'domain'  => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => 0],
                'hosting' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => 0],
            ];
        }

        // 1. Projects (Matches Main Card Total Project Budget, Cleared Funds, and Pending Balance)
        $projects = WebsiteProject::where('client_id', $clientId)->with('payments')->get();
        $projectCount = (int) $projects->count();
        $projectTotal = 0.0;
        $projectPaid = 0.0;
        $projectPending = 0.0;

        if ($canViewProjectBudget) {
            $projectTotal = (float) $projects->sum('total_budget');
            $projectPaid = (float) $projects->sum(function ($p) {
                return $p->payments
                    ->filter(fn($pay) => in_array(strtolower(trim((string)$pay->status)), ['paid', 'completed', 'settled']))
                    ->sum('amount');
            });
            $projectPending = max(0.0, $projectTotal - $projectPaid);
        }

        // 2. Services
        $services = ClientService::where('client_id', $clientId)->with('payments')->get();
        $serviceCount = (int) $services->count();
        $serviceTotal = 0.0;
        $servicePaid = 0.0;
        $servicePending = 0.0;

        if ($canViewServiceBudget) {
            $servicePayments = ServicePayment::where('client_id', $clientId)->get();
            if ($servicePayments->count() > 0) {
                $serviceTotal = (float) $servicePayments->sum(function ($s) {
                    $status = strtolower(trim((string)$s->status));
                    return in_array($status, ['paid', 'completed', 'settled']) && (float) $s->amount_paid > 0
                        ? (float) $s->amount_paid
                        : ((float) $s->amount_due > 0 ? (float) $s->amount_due : 0.0);
                });
                $servicePaid = (float) $servicePayments->filter(fn($s) => in_array(strtolower(trim((string)$s->status)), ['paid', 'completed', 'settled']))->sum(function ($s) {
                    return (float) $s->amount_paid > 0 ? (float) $s->amount_paid : ((float) $s->amount_due > 0 ? (float) $s->amount_due : 0.0);
                });
                $servicePending = (float) $servicePayments->filter(fn($s) => in_array(strtolower(trim((string)$s->status)), ['pending', 'due', 'due_pending', 'unpaid', 'overdue']))->sum(function ($s) {
                    return (float) $s->amount_due > 0 ? (float) $s->amount_due : 0.0;
                });
            } else {
                $serviceTotal = (float) $services->sum('monthly_fee');
                $servicePaid = 0.0;
                $servicePending = $serviceTotal;
            }
        }

        // 3. Domains
        $domains = ClientDomain::where('client_id', $clientId)->with('payments')->get();
        $domainCount = (int) $domains->count();
        $domainPayments = DomainPayment::where('client_id', $clientId)->get();
        if ($domainPayments->count() > 0) {
            $domainTotal = (float) $domainPayments->sum('amount');
            $domainPaid = (float) $domainPayments->filter(fn($d) => in_array(strtolower(trim((string)$d->status)), ['paid', 'completed', 'settled']))->sum('amount');
            $domainPending = (float) $domainPayments->filter(fn($d) => in_array(strtolower(trim((string)$d->status)), ['pending', 'due', 'due_pending', 'unpaid', 'overdue']))->sum('amount');
        } else {
            $domainTotal = (float) $domains->sum('client_price_pkr');
            $domainPaid = 0.0;
            $domainPending = $domainTotal;
        }

        // 4. Hostings
        $hostings = ClientHosting::where('client_id', $clientId)->with('payments')->get();
        $hostingCount = (int) $hostings->count();
        $hostingPayments = HostingPayment::where('client_id', $clientId)->get();
        if ($hostingPayments->count() > 0) {
            $hostingTotal = (float) $hostingPayments->sum('amount');
            $hostingPaid = (float) $hostingPayments->filter(fn($h) => in_array(strtolower(trim((string)$h->status)), ['paid', 'completed', 'settled']))->sum('amount');
            $hostingPending = (float) $hostingPayments->filter(fn($h) => in_array(strtolower(trim((string)$h->status)), ['pending', 'due', 'due_pending', 'unpaid', 'overdue']))->sum('amount');
        } else {
            $hostingTotal = (float) $hostings->sum('client_price_pkr');
            $hostingPaid = 0.0;
            $hostingPending = $hostingTotal;
        }

        return [
            'project' => [
                'total' => round($projectTotal, 2),
                'paid' => round($projectPaid, 2),
                'pending' => round($projectPending, 2),
                'count' => $projectCount,
            ],
            'service' => [
                'total' => round($serviceTotal, 2),
                'paid' => round($servicePaid, 2),
                'pending' => round($servicePending, 2),
                'count' => $serviceCount,
            ],
            'domain' => [
                'total' => round($domainTotal, 2),
                'paid' => round($domainPaid, 2),
                'pending' => round($domainPending, 2),
                'count' => $domainCount,
            ],
            'hosting' => [
                'total' => round($hostingTotal, 2),
                'paid' => round($hostingPaid, 2),
                'pending' => round($hostingPending, 2),
                'count' => $hostingCount,
            ],
        ];
    }
}
