<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientDomain;
use App\Models\ClientHosting;
use App\Models\ClientService;
use App\Models\Currency;
use App\Models\DomainPayment;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\HostingPayment;
use App\Models\Income;
use App\Models\Invoice;
use App\Models\MonthlyPayroll;
use App\Models\ProjectPayment;
use App\Models\ProjectTask;
use App\Models\ServicePayment;
use App\Models\Task;
use App\Models\WebsiteProject;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the Executive CRM Analytics & Live Dashboard.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $isSuperAdmin = $user->type === 'admin'
            || $user->hasRole('Super Admin')
            || $user->hasRole('admin');

        $canViewDashboard = $isSuperAdmin
            || ($user->hasPermissionTo('view-dashboard') || $user->can('view-dashboard'));

        $canViewBudget = $isSuperAdmin
            || ($user->hasPermissionTo('view-dashboard-budget') || $user->can('view-dashboard-budget'));

        if (!$canViewDashboard) {
            return Inertia::render('dashboard', [
                'canViewDashboard' => false,
                'canViewBudget' => false,
                'kpis' => [
                    'total_revenue_pkr' => 0,
                    'mrr_pkr' => 0,
                    'total_expenses_pkr' => 0,
                    'net_profit_pkr' => 0,
                    'pending_receivables_pkr' => 0,
                    'active_projects_count' => 0,
                    'total_projects_count' => 0,
                    'total_clients_count' => 0,
                    'active_clients_count' => 0,
                    'total_domains_count' => 0,
                    'total_hostings_count' => 0,
                    'total_employees_count' => 0,
                    'pending_tasks_count' => 0,
                    'urgent_tasks_count' => 0,
                ],
                'revenueTrend' => [],
                'revenueStreams' => [],
                'projectStatus' => ['in_progress' => 0, 'planning' => 0, 'completed' => 0, 'on_hold' => 0],
                'taskStatus' => ['completed' => 0, 'in_progress' => 0, 'in_review' => 0, 'pending' => 0, 'urgent' => 0],
                'currencyBreakdown' => [],
                'recentInvoices' => [],
                'recentProjects' => [],
                'urgentTasks' => [],
                'expiringAssets' => [],
                'recentCashflow' => [],
            ]);
        }

        // 1. Financial KPIs (Calculated conditionally if user has budget permission)
        $websitePaidPkr = 0;
        $servicePaidPkr = 0;
        $domainPaidPkr = 0;
        $hostingPaidPkr = 0;
        $directIncomePkr = 0;
        $totalRevenuePkr = 0;
        $directExpensePkr = 0;
        $payrollExpensePkr = 0;
        $totalExpensesPkr = 0;
        $netProfitPkr = 0;
        $mrrPkr = 0;
        $pendingReceivablesPkr = 0;

        if ($canViewBudget) {
            $websitePaidPkr = (float) (ProjectPayment::where('status', 'paid')->sum('amount_pkr') ?? 0);
            $servicePaidPkr = (float) (ServicePayment::where('status', 'paid')->sum('amount_paid_pkr') ?? 0);
            $domainPaidPkr = (float) (DomainPayment::where('status', 'paid')->sum('amount') ?? 0);
            $hostingPaidPkr = (float) (HostingPayment::where('status', 'paid')->sum('amount') ?? 0);
            $directIncomePkr = (float) (Income::sum('amount') ?? 0);

            $totalRevenuePkr = $websitePaidPkr + $servicePaidPkr + $domainPaidPkr + $hostingPaidPkr + $directIncomePkr;

            // Expenses & Net Cashflow
            $directExpensePkr = (float) (Expense::sum('amount') ?? 0);
            $payrollExpensePkr = (float) (MonthlyPayroll::where('payment_status', 'paid')->sum('net_salary_pkr') ?? 0);
            $totalExpensesPkr = $directExpensePkr + $payrollExpensePkr;
            $netProfitPkr = $totalRevenuePkr - $totalExpensesPkr;

            // Monthly Recurring Revenue (Active Retainer Services)
            $mrrPkr = (float) (ClientService::where('status', 'active')->sum('monthly_fee_pkr') ?? 0);

            // Pending Receivables (Unpaid Website Milestones + Pending Service Payments + Domain + Hosting)
            $unpaidMilestonesPkr = (float) (ProjectPayment::whereIn('status', ['unpaid', 'pending'])->sum('amount_pkr') ?? 0);
            $pendingServicePkr = (float) (ServicePayment::whereIn('status', ['due_pending', 'overdue', 'pending'])
                ->select(DB::raw('SUM(amount_due * COALESCE(exchange_rate, 1)) as total'))
                ->value('total') ?? 0);
            $pendingDomainPkr = (float) (DomainPayment::whereIn('status', ['pending', 'overdue'])->sum('amount') ?? 0);
            $pendingHostingPkr = (float) (HostingPayment::whereIn('status', ['pending', 'overdue'])->sum('amount') ?? 0);
            $pendingReceivablesPkr = $unpaidMilestonesPkr + $pendingServicePkr + $pendingDomainPkr + $pendingHostingPkr;
        }

        // Operational Counts
        $activeProjectsCount = WebsiteProject::where('status', 'in_progress')->count();
        $totalProjectsCount = WebsiteProject::count();
        $totalClientsCount = Client::count();
        $activeClientsCount = Client::where('status', 'active')->count();
        $totalDomainsCount = ClientDomain::count();
        $totalHostingsCount = ClientHosting::count();
        $totalEmployeesCount = Employee::where('status', 'active')->count();

        $pendingTasksCount = Task::where('status', '!=', 'completed')->count() + ProjectTask::where('status', '!=', 'completed')->count();
        $urgentTasksCount = Task::where('priority', 'urgent')->where('status', '!=', 'completed')->count() + ProjectTask::where('priority', 'urgent')->where('status', '!=', 'completed')->count();

        // 2. Revenue & Cash Flow Trend (Last 6 Months) - Budget permission gated
        $monthsTrend = [];
        if ($canViewBudget) {
            for ($i = 5; $i >= 0; $i--) {
                $monthDate = now()->subMonths($i);
                $monthLabel = $monthDate->format('M Y');

                $websiteMonth = (float) (ProjectPayment::where('status', 'paid')
                    ->whereYear('paid_at', $monthDate->year)
                    ->whereMonth('paid_at', $monthDate->month)
                    ->sum('amount_pkr') ?? 0);

                $serviceMonth = (float) (ServicePayment::where('status', 'paid')
                    ->whereYear('payment_date', $monthDate->year)
                    ->whereMonth('payment_date', $monthDate->month)
                    ->sum('amount_paid_pkr') ?? 0);

                $incomeMonth = (float) (Income::whereYear('income_date', $monthDate->year)
                    ->whereMonth('income_date', $monthDate->month)
                    ->sum('amount') ?? 0);

                $expenseMonth = (float) (Expense::whereYear('expense_date', $monthDate->year)
                    ->whereMonth('expense_date', $monthDate->month)
                    ->sum('amount') ?? 0);

                $payrollMonth = (float) (MonthlyPayroll::where('payment_status', 'paid')
                    ->whereYear('payment_date', $monthDate->year)
                    ->whereMonth('payment_date', $monthDate->month)
                    ->sum('net_salary_pkr') ?? 0);

                $monthIncome = $websiteMonth + $serviceMonth + $incomeMonth;
                $monthExpense = $expenseMonth + $payrollMonth;

                $monthsTrend[] = [
                    'month' => $monthLabel,
                    'revenue' => round($monthIncome, 2),
                    'expenses' => round($monthExpense, 2),
                    'net' => round($monthIncome - $monthExpense, 2),
                ];
            }
        }

        // 3. Revenue Stream Breakdown Donut / Pie - Budget permission gated
        $revenueStreams = [];
        if ($canViewBudget) {
            $revenueStreams = [
                ['name' => 'Project Milestones', 'value' => round($websitePaidPkr, 2), 'color' => '#8b5cf6'],
                ['name' => 'Service Subscriptions', 'value' => round($servicePaidPkr, 2), 'color' => '#10b981'],
                ['name' => 'Domain Registrations', 'value' => round($domainPaidPkr, 2), 'color' => '#3b82f6'],
                ['name' => 'Web Hostings', 'value' => round($hostingPaidPkr, 2), 'color' => '#f59e0b'],
                ['name' => 'Other Incomes', 'value' => round($directIncomePkr, 2), 'color' => '#ec4899'],
            ];
        }

        // 4. Project & Task Status Distribution
        $projectStatusCounts = [
            'in_progress' => WebsiteProject::where('status', 'in_progress')->count(),
            'planning' => WebsiteProject::where('status', 'planning')->count(),
            'completed' => WebsiteProject::where('status', 'completed')->count(),
            'on_hold' => WebsiteProject::where('status', 'on_hold')->count(),
        ];

        $taskStatusCounts = [
            'completed' => Task::where('status', 'completed')->count() + ProjectTask::where('status', 'completed')->count(),
            'in_progress' => Task::where('status', 'in_progress')->count() + ProjectTask::where('status', 'in_progress')->count(),
            'in_review' => Task::where('status', 'in_review')->count() + ProjectTask::where('status', 'in_review')->count(),
            'pending' => Task::where('status', 'pending')->count() + ProjectTask::where('status', 'pending')->count(),
            'urgent' => $urgentTasksCount,
        ];

        // 5. Currency Breakdown - Budget permission gated
        $currencyBreakdown = [];
        if ($canViewBudget) {
            $currencyBreakdown = Currency::where('is_active', true)->get()->map(function ($c) {
                $projectTotal = WebsiteProject::where('currency', $c->code)->sum('total_budget') ?? 0;
                $serviceTotal = ClientService::where('currency', $c->code)->sum('monthly_fee') ?? 0;
                $totalInCurrency = (float) ($projectTotal + $serviceTotal);
                $pkrEquivalent = (float) ($totalInCurrency * ($c->exchange_rate_to_pkr ?: 1));

                return [
                    'code' => $c->code,
                    'name' => $c->name,
                    'symbol' => $c->symbol ?: $c->code,
                    'total_amount' => round($totalInCurrency, 2),
                    'pkr_equivalent' => round($pkrEquivalent, 2),
                    'rate' => (float) ($c->exchange_rate_to_pkr ?: 1),
                ];
            });
        }

        // 6. Expiring Assets / Attention Required (Domains, Hostings & Overdue Invoices in next 30 days)
        $expiringDomains = ClientDomain::whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays(45))
            ->where('expiry_date', '>=', now()->subDays(15))
            ->with('client:id,name,client_code')
            ->orderBy('expiry_date')
            ->take(3)
            ->get()
            ->map(fn($d) => [
                'type' => 'domain',
                'title' => $d->domain_name,
                'client_name' => $d->client ? $d->client->name : 'N/A',
                'client_code' => $d->client ? $d->client->client_code : '',
                'date' => $d->expiry_date ? Carbon::parse($d->expiry_date)->format('Y-m-d') : '',
                'status' => $d->expiry_date && Carbon::parse($d->expiry_date)->isPast() ? 'expired' : 'expiring_soon',
            ]);

        $expiringHostings = ClientHosting::whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays(45))
            ->where('expiry_date', '>=', now()->subDays(15))
            ->with('client:id,name,client_code')
            ->orderBy('expiry_date')
            ->take(3)
            ->get()
            ->map(fn($h) => [
                'type' => 'hosting',
                'title' => $h->hosting_title,
                'client_name' => $h->client ? $h->client->name : 'N/A',
                'client_code' => $h->client ? $h->client->client_code : '',
                'date' => $h->expiry_date ? Carbon::parse($h->expiry_date)->format('Y-m-d') : '',
                'status' => $h->expiry_date && Carbon::parse($h->expiry_date)->isPast() ? 'overdue' : 'due_soon',
            ]);

        $expiringAssets = collect()->concat($expiringDomains)->concat($expiringHostings)->take(5);

        // 7. Recent Invoices & Payment Ledger
        $canViewInvoices = $isSuperAdmin || $user->hasPermissionTo('view-invoices') || $user->can('view-invoices');
        $recentInvoices = [];
        if ($canViewInvoices) {
            $recentInvoices = Invoice::with(['client:id,name,company_name,client_code'])
                ->latest()
                ->take(5)
                ->get();
        }

        // 8. Recent Projects Pipeline
        $recentProjects = WebsiteProject::with('client:id,name,company_name,client_code')
            ->latest('updated_at')
            ->take(5)
            ->get()
            ->map(function ($p) use ($canViewBudget) {
                return [
                    'id' => $p->id,
                    'project_name' => $p->project_name,
                    'progress_percentage' => $p->progress_percentage,
                    'deadline' => $p->deadline,
                    'total_budget' => $canViewBudget ? $p->total_budget : null,
                    'currency' => $p->currency,
                    'status' => $p->status,
                    'client' => $p->client ? [
                        'id' => $p->client->id,
                        'name' => $p->client->name,
                        'company_name' => $p->client->company_name,
                        'client_code' => $p->client->client_code,
                    ] : null,
                ];
            });

        // 9. Urgent / Priority Tasks
        $urgentTasks = Task::with(['taskCategory:id,name', 'assignedEmployee:id,name'])
            ->where('status', '!=', 'completed')
            ->orderByRaw("CASE WHEN priority = 'urgent' THEN 1 WHEN priority = 'high' THEN 2 ELSE 3 END")
            ->latest('due_date')
            ->take(5)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'task_title' => $t->task_title,
                'priority' => $t->priority,
                'status' => $t->status,
                'due_date' => $t->due_date ? Carbon::parse($t->due_date)->format('Y-m-d') : '',
                'category_name' => $t->taskCategory ? $t->taskCategory->name : 'General',
                'assigned_employee' => $t->assignedEmployee ? [
                    'name' => $t->assignedEmployee->name,
                ] : null,
            ]);

        // 10. Recent Incomes & Expenses Feed - Budget permission gated
        $recentCashflow = [];
        if ($canViewBudget) {
            $recentIncomes = Income::with('category:id,name')
                ->latest('income_date')
                ->take(3)
                ->get()
                ->map(fn($inc) => [
                    'type' => 'income',
                    'title' => $inc->title,
                    'category' => $inc->category ? $inc->category->name : 'Income',
                    'amount' => (float) $inc->amount,
                    'currency' => $inc->currency ?: 'PKR',
                    'date' => $inc->income_date ? Carbon::parse($inc->income_date)->format('Y-m-d') : '',
                ]);

            $recentExpenses = Expense::with('category:id,name')
                ->latest('expense_date')
                ->take(3)
                ->get()
                ->map(fn($exp) => [
                    'type' => 'expense',
                    'title' => $exp->title,
                    'category' => $exp->category ? $exp->category->name : 'Expense',
                    'amount' => (float) $exp->amount,
                    'currency' => $exp->currency ?: 'PKR',
                    'date' => $exp->expense_date ? Carbon::parse($exp->expense_date)->format('Y-m-d') : '',
                ]);

            $recentCashflow = collect()->concat($recentIncomes)->concat($recentExpenses)->sortByDesc('date')->values()->take(5);
        }

        return Inertia::render('dashboard', [
            'canViewDashboard' => true,
            'canViewBudget' => $canViewBudget,
            'kpis' => [
                'total_revenue_pkr' => round($totalRevenuePkr, 2),
                'mrr_pkr' => round($mrrPkr, 2),
                'total_expenses_pkr' => round($totalExpensesPkr, 2),
                'net_profit_pkr' => round($netProfitPkr, 2),
                'pending_receivables_pkr' => round($pendingReceivablesPkr, 2),
                'active_projects_count' => $activeProjectsCount,
                'total_projects_count' => $totalProjectsCount,
                'total_clients_count' => $totalClientsCount,
                'active_clients_count' => $activeClientsCount,
                'total_domains_count' => $totalDomainsCount,
                'total_hostings_count' => $totalHostingsCount,
                'total_employees_count' => $totalEmployeesCount,
                'pending_tasks_count' => $pendingTasksCount,
                'urgent_tasks_count' => $urgentTasksCount,
            ],
            'revenueTrend' => $monthsTrend,
            'revenueStreams' => $revenueStreams,
            'projectStatus' => $projectStatusCounts,
            'taskStatus' => $taskStatusCounts,
            'currencyBreakdown' => $currencyBreakdown,
            'recentInvoices' => $recentInvoices,
            'recentProjects' => $recentProjects,
            'urgentTasks' => $urgentTasks,
            'expiringAssets' => $expiringAssets,
            'recentCashflow' => $recentCashflow,
        ]);
    }
}
