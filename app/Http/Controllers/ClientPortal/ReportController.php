<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientService;
use App\Models\Invoice;
use App\Models\ProjectPayment;
use App\Models\ServicePayment;
use App\Models\SystemSetting;
use App\Models\WebsiteProject;
use App\Traits\AuthorizesClientPortalAccess;
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
     * Display comprehensive Client Reports & Financial Statements dashboard.
     */
    public function index(Request $request): Response
    {
        $this->authorizePermission('view-client-portal-reports');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        // 1. Fetch Invoices & build Invoice Log
        $invoices = Invoice::where('client_id', $clientId)
            ->with('websiteProject:id,project_name,currency')
            ->latest()
            ->get();

        $invoiceLog = $invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'type' => $inv->websiteProject ? 'Project Invoice' : 'General Invoice',
                'description' => $inv->websiteProject ? $inv->websiteProject->project_name : 'Billing Statement #' . $inv->invoice_number,
                'issue_date' => $inv->issue_date ? $inv->issue_date->format('Y-m-d') : ($inv->created_at ? $inv->created_at->format('Y-m-d') : ''),
                'due_date' => $inv->due_date ? $inv->due_date->format('Y-m-d') : '',
                'total' => (float) $inv->total_amount,
                'amount_paid' => $inv->status === 'paid' ? (float) $inv->total_amount : 0.0,
                'currency' => $inv->currency ?? $client->currency ?? 'AED',
                'status' => $inv->status,
            ];
        });

        // 2. Financial Aggregations
        $totalInvoiced = (float) $invoices->sum('total_amount');
        $totalPaid = (float) $invoices->where('status', 'paid')->sum('total_amount');
        $totalPending = (float) $invoices->whereIn('status', ['draft', 'sent', 'overdue'])->sum('total_amount');

        $financials = [
            'total_invoiced' => $totalInvoiced,
            'total_paid' => $totalPaid,
            'total_pending' => $totalPending,
            'total_invoices_count' => $invoices->count(),
            'paid_invoices_count' => $invoices->where('status', 'paid')->count(),
            'pending_invoices_count' => $invoices->whereIn('status', ['draft', 'sent', 'overdue'])->count(),
        ];

        // 3. Projects Report
        $websiteProjects = WebsiteProject::where('client_id', $clientId)
            ->with(['category', 'payments', 'tasks'])
            ->latest()
            ->get();

        $projects = $websiteProjects->map(function ($proj) {
            $totalCost = (float) $proj->total_budget;
            $paid = (float) $proj->payments->where('status', 'paid')->sum('amount');
            $remaining = max(0, $totalCost - $paid);
            $totalTasks = $proj->tasks->count();
            $completedTasks = $proj->tasks->where('status', 'completed')->count();

            return [
                'id' => $proj->id,
                'project_name' => $proj->project_name,
                'category_name' => $proj->category ? $proj->category->name : 'Uncategorized',
                'status' => $proj->status,
                'project_cost' => $totalCost,
                'paid_amount' => $paid,
                'remaining_balance' => $remaining,
                'currency' => $proj->currency,
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'progress_percentage' => (int) $proj->progress_percentage,
                'created_at' => $proj->created_at ? $proj->created_at->format('Y-m-d') : null,
            ];
        });

        // 4. Client Services & Subscriptions
        $clientServices = ClientService::where('client_id', $clientId)
            ->with(['category', 'payments'])
            ->latest()
            ->get();

        $services = $clientServices->map(function ($serv) {
            $paidCycles = $serv->payments->where('status', 'paid')->count();
            $pendingCycles = $serv->payments->whereIn('status', ['due_pending', 'overdue'])->count();

            return [
                'id' => $serv->id,
                'service_name' => $serv->service_name,
                'category_name' => $serv->category ? $serv->category->name : 'General Service',
                'monthly_fee' => (float) $serv->monthly_fee,
                'currency' => $serv->currency,
                'billing_day' => (int) $serv->billing_day,
                'status' => $serv->status,
                'paid_cycles' => $paidCycles,
                'pending_cycles' => $pendingCycles,
                'start_date' => $serv->start_date ? $serv->start_date->format('Y-m-d') : '',
            ];
        });

        $serviceStats = [
            'total_services' => $clientServices->count(),
            'active_services' => $clientServices->where('status', 'active')->count(),
            'monthly_recurring_total' => (float) $clientServices->where('status', 'active')->sum('monthly_fee'),
        ];

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Office #402, Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
            'logo' => SystemSetting::get('company_logo', '/app-logo-icon.png'),
        ];

        return Inertia::render('client-portal/reports/index', [
            'client' => $client,
            'financials' => $financials,
            'projects' => $projects,
            'services' => $services,
            'serviceStats' => $serviceStats,
            'invoiceLog' => $invoiceLog,
            'company' => $companySettings,
        ]);
    }
}
