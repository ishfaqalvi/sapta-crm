<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
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

        if (!$user || !$user->client_id) {
            abort(403, 'Unauthorized Client Portal Access');
        }

        $client = Client::findOrFail($user->client_id);

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

        return Inertia::render('client-portal/overview/index', [
            'client' => $client,
            'invoices' => $invoices,
            'canViewOverview' => $canViewOverview,
            'canViewProjectBudget' => $canViewProjectBudget,
            'canViewServiceBudget' => $canViewServiceBudget,
            'canViewInvoices' => $canViewInvoices,
        ]);
    }
}
