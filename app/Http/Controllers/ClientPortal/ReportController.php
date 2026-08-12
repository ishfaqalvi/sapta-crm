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

        // 1. Fetch all formal Invoices for this client
        $invoices = Invoice::where('client_id', $clientId)
            ->with('websiteProject:id,project_name,currency')
            ->latest()
            ->get();

        // 2. Fetch all Project Payment Milestones for this client
        $projectPayments = ProjectPayment::where('client_id', $clientId)
            ->with('websiteProject:id,project_name,currency')
            ->latest()
            ->get();

        // 3. Fetch all Service Payments (Recurring Subscriptions) for this client
        $servicePayments = ServicePayment::where('client_id', $clientId)
            ->with('service:id,service_name,currency')
            ->latest()
            ->get();

        // 4. Fetch Active Projects & Services for Context
        $websiteProjects = WebsiteProject::where('client_id', $clientId)->get();
        $clientServices = ClientService::where('client_id', $clientId)->get();

        // Financial Summary Aggregations
        $totalInvoiced = $invoices->sum('total_amount');
        $totalInvoicePaid = $invoices->where('status', 'paid')->sum('total_amount');
        $totalInvoicePending = $invoices->whereIn('status', ['draft', 'sent', 'overdue'])->sum('total_amount');

        $totalProjectMilestones = $projectPayments->sum('amount');
        $totalProjectPaid = $projectPayments->where('status', 'paid')->sum('amount');
        $totalProjectPending = $projectPayments->where('status', 'pending')->sum('amount');

        $totalServicePayments = $servicePayments->sum('amount_due');
        $totalServicePaid = $servicePayments->where('status', 'paid')->sum('amount_paid');
        $totalServicePending = $servicePayments->whereIn('status', ['due_pending', 'overdue'])->sum('amount_due');

        $overallPaid = $totalInvoicePaid + $totalProjectPaid + $totalServicePaid;
        $overallPending = $totalInvoicePending + $totalProjectPending + $totalServicePending;

        $stats = [
            'total_invoiced' => $totalInvoiced,
            'total_paid' => $overallPaid,
            'total_pending' => $overallPending,
            'invoices_count' => $invoices->count(),
            'paid_invoices_count' => $invoices->where('status', 'paid')->count(),
            'projects_count' => $websiteProjects->count(),
            'services_count' => $clientServices->count(),
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
            'invoices' => $invoices,
            'projectPayments' => $projectPayments,
            'servicePayments' => $servicePayments,
            'stats' => $stats,
            'company' => $companySettings,
        ]);
    }
}
