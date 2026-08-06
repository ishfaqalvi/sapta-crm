<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Currency;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\ProjectPayment;
use App\Models\ProjectTask;
use App\Models\SeoPayment;
use App\Models\SeoRetainer;
use App\Models\WebsiteProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the Executive CRM Analytics & Live Dashboard.
     */
    public function index(Request $request)
    {
        // 1. Financial KPIs (Strictly Website Payments + SEO Payments; Invoices are optional)
        $websitePaidPkr = ProjectPayment::where('status', 'paid')->sum('amount_pkr') ?? 0;
        $seoPaidPkr = SeoPayment::where('status', 'paid')->sum('amount_paid_pkr') ?? 0;
        $totalRevenuePkr = (float) ($websitePaidPkr + $seoPaidPkr);

        // Monthly Recurring Revenue (Active SEO Retainers)
        $mrrPkr = SeoRetainer::where('status', 'active')->sum('monthly_fee_pkr') ?? 0;

        // Pending Receivables (Unpaid Website Milestones + Pending SEO Payments)
        $unpaidMilestonesPkr = ProjectPayment::where('status', 'unpaid')->sum('amount_pkr') ?? 0;
        $pendingSeoPkr = SeoPayment::where('status', 'pending')
            ->select(DB::raw('SUM(amount_due * exchange_rate) as total'))
            ->value('total') ?? 0;
        $pendingReceivablesPkr = (float) ($unpaidMilestonesPkr + $pendingSeoPkr);

        // Operational Counts
        $activeProjectsCount = WebsiteProject::where('status', 'in_progress')->count();
        $totalProjectsCount = WebsiteProject::count();
        $totalClientsCount = Client::count();
        $totalEmployeesCount = Employee::where('status', 'active')->count();

        // 2. Revenue Trend (Last 6 Months Website Payments & SEO Payments)
        $monthsTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthKey = $monthDate->format('Y-m');
            $monthLabel = $monthDate->format('M Y');

            $websiteMonthTotal = ProjectPayment::where('status', 'paid')
                ->whereYear('paid_at', $monthDate->year)
                ->whereMonth('paid_at', $monthDate->month)
                ->sum('amount_pkr') ?? 0;

            $seoMonthTotal = SeoPayment::where('status', 'paid')
                ->whereYear('payment_date', $monthDate->year)
                ->whereMonth('payment_date', $monthDate->month)
                ->sum('amount_paid_pkr') ?? 0;

            $monthsTrend[] = [
                'month' => $monthLabel,
                'revenue' => round((float) ($websiteMonthTotal + $seoMonthTotal), 2),
            ];
        }

        // 3. Project Status Distribution
        $projectStatusCounts = [
            'in_progress' => WebsiteProject::where('status', 'in_progress')->count(),
            'planning' => WebsiteProject::where('status', 'planning')->count(),
            'completed' => WebsiteProject::where('status', 'completed')->count(),
            'on_hold' => WebsiteProject::where('status', 'on_hold')->count(),
        ];

        // 4. Task Completion Distribution
        $taskStatusCounts = [
            'completed' => ProjectTask::where('status', 'completed')->count(),
            'in_progress' => ProjectTask::where('status', 'in_progress')->count(),
            'in_review' => ProjectTask::where('status', 'in_review')->count(),
            'pending' => ProjectTask::where('status', 'pending')->count(),
            'urgent' => ProjectTask::where('priority', 'urgent')->where('status', '!=', 'completed')->count(),
        ];

        // 5. Currency Billing Distribution (Projects & SEO Retainers)
        $currencyBreakdown = Currency::where('is_active', true)->get()->map(function ($c) {
            $projectTotal = WebsiteProject::where('currency', $c->code)->sum('total_budget') ?? 0;
            $seoTotal = SeoRetainer::where('currency', $c->code)->sum('monthly_fee') ?? 0;
            $totalInCurrency = (float) ($projectTotal + $seoTotal);
            $pkrEquivalent = (float) ($totalInCurrency * $c->exchange_rate_to_pkr);

            return [
                'code' => $c->code,
                'name' => $c->name,
                'symbol' => $c->symbol,
                'total_amount' => round($totalInCurrency, 2),
                'pkr_equivalent' => round($pkrEquivalent, 2),
                'rate' => (float) $c->exchange_rate_to_pkr,
            ];
        });

        // 6. Recent Activity Feeds
        $recentInvoices = Invoice::with(['client', 'websiteProject'])
            ->latest()
            ->take(5)
            ->get();

        $recentProjects = WebsiteProject::with('client')
            ->latest('updated_at')
            ->take(5)
            ->get();

        $urgentTasks = ProjectTask::with(['websiteProject', 'assignedEmployee'])
            ->where('status', '!=', 'completed')
            ->orderByRaw("CASE WHEN priority = 'urgent' THEN 1 WHEN priority = 'high' THEN 2 ELSE 3 END")
            ->latest('due_date')
            ->take(5)
            ->get();

        return Inertia::render('dashboard', [
            'kpis' => [
                'total_revenue_pkr' => round($totalRevenuePkr, 2),
                'mrr_pkr' => round((float) $mrrPkr, 2),
                'pending_receivables_pkr' => round($pendingReceivablesPkr, 2),
                'active_projects_count' => $activeProjectsCount,
                'total_projects_count' => $totalProjectsCount,
                'total_clients_count' => $totalClientsCount,
                'total_employees_count' => $totalEmployeesCount,
            ],
            'revenueTrend' => $monthsTrend,
            'projectStatus' => $projectStatusCounts,
            'taskStatus' => $taskStatusCounts,
            'currencyBreakdown' => $currencyBreakdown,
            'recentInvoices' => $recentInvoices,
            'recentProjects' => $recentProjects,
            'urgentTasks' => $urgentTasks,
        ]);
    }
}
