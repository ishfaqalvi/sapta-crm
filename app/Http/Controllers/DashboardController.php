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
use App\Models\ServiceTask;
use App\Models\Task;
use App\Models\TaskMessage;
use App\Models\User;
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

        // If user is an employee, route directly to dedicated Employee Dashboard
        if ($user->type === 'employee' || ($user->employee_id && !$user->hasRole('admin') && !$user->hasRole('Super Admin') && $user->type !== 'admin')) {
            return $this->employeeDashboard($request, $user);
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
                'kpi' => [
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
                ],
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
                'categoryBreakdown' => [
                    'project' => ['total' => 0, 'paid' => 0, 'pending' => 0, 'count' => 0],
                    'service' => ['total' => 0, 'paid' => 0, 'pending' => 0, 'count' => 0],
                    'domain' => ['total' => 0, 'paid' => 0, 'pending' => 0, 'count' => 0],
                    'hosting' => ['total' => 0, 'paid' => 0, 'pending' => 0, 'count' => 0],
                ],
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

        $financialReportData = $this->calculateReportKpiAndBreakdown($canViewBudget);

        return Inertia::render('dashboard', [
            'canViewDashboard' => true,
            'canViewBudget' => $canViewBudget,
            'kpi' => $financialReportData['kpi'],
            'categoryBreakdown' => $financialReportData['categoryBreakdown'],
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

    /**
     * Normalize status across various database status variations consistent with ReportController.
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
        return 'pending';
    }

    /**
     * Calculate financial KPI data and category breakdown identical to Financial Report (ReportController).
     */
    protected function calculateReportKpiAndBreakdown(bool $includeFinancials = true): array
    {
        if (!$includeFinancials) {
            return [
                'kpi' => [
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
                ],
                'categoryBreakdown' => [
                    'project' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => WebsiteProject::count()],
                    'service' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => ClientService::count()],
                    'domain' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => ClientDomain::count()],
                    'hosting' => ['total' => 0.0, 'paid' => 0.0, 'pending' => 0.0, 'count' => ClientHosting::count()],
                ],
            ];
        }

        // 1. Project Payments
        $projectPayments = ProjectPayment::all()->map(function ($p) {
            $status = $this->normalizeStatus($p->status);
            return [
                'category' => 'project',
                'amount' => (float) ($p->amount_pkr ?? $p->amount ?? 0),
                'status' => $status,
            ];
        });

        // 2. Service Payments
        $servicePayments = ServicePayment::with('service:id,monthly_fee')->get()->map(function ($s) {
            $status = $this->normalizeStatus($s->status);
            $rate = (float) ($s->exchange_rate ?: 1);
            $amount = (float) ($status === 'paid' && (float) $s->amount_paid > 0
                ? ($s->amount_paid_pkr ?: ($s->amount_paid * $rate))
                : ((float) $s->amount_due > 0 ? ($s->amount_due * $rate) : ($s->service ? $s->service->monthly_fee * $rate : 0)));

            return [
                'category' => 'service',
                'amount' => $amount,
                'status' => $status,
            ];
        });

        // 3. Domain Payments
        $domainPayments = DomainPayment::all()->map(function ($d) {
            $status = $this->normalizeStatus($d->status);
            return [
                'category' => 'domain',
                'amount' => (float) ($d->amount ?? 0),
                'status' => $status,
            ];
        });

        // 4. Hosting Payments
        $hostingPayments = HostingPayment::all()->map(function ($h) {
            $status = $this->normalizeStatus($h->status);
            return [
                'category' => 'hosting',
                'amount' => (float) ($h->amount ?? 0),
                'status' => $status,
            ];
        });

        $allTransactions = collect()
            ->concat($projectPayments)
            ->concat($servicePayments)
            ->concat($domainPayments)
            ->concat($hostingPayments);

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

        $totalBilled = (float) $allTransactions->sum('amount');
        $totalPaid = (float) $allTransactions->where('status', 'paid')->sum('amount');
        $totalPending = (float) $allTransactions->where('status', 'pending')->sum('amount');
        $totalOverdue = (float) $allTransactions->where('status', 'overdue')->sum('amount');
        $totalUnpaid = (float) $allTransactions->whereIn('status', ['pending', 'overdue'])->sum('amount');
        $totalCancelled = (float) $allTransactions->where('status', 'cancelled')->sum('amount');

        $kpi = [
            'total_billed' => $totalBilled,
            'total_paid' => $totalPaid,
            'total_pending' => $totalPending,
            'total_overdue' => $totalOverdue,
            'total_unpaid' => $totalUnpaid,
            'total_cancelled' => $totalCancelled,
            'count_all' => $allTransactions->count(),
            'count_paid' => $allTransactions->where('status', 'paid')->count(),
            'count_pending' => $allTransactions->where('status', 'pending')->count(),
            'count_overdue' => $allTransactions->where('status', 'overdue')->count(),
            'count_unpaid' => $allTransactions->whereIn('status', ['pending', 'overdue'])->count(),
            'count_cancelled' => $allTransactions->where('status', 'cancelled')->count(),
        ];

        return [
            'kpi' => $kpi,
            'categoryBreakdown' => $categoryBreakdown,
        ];
    }

    /**
     * Dedicated Employee Dashboard route for previewing or explicit navigation.
     */
    public function employeeDashboardView(Request $request): Response
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $targetUser = $user;
        if ($request->filled('employee_id') && ($user->type === 'admin' || $user->hasRole('admin') || $user->hasRole('Super Admin'))) {
            $employee = Employee::with('user')->find((int) $request->query('employee_id'));
            if ($employee && $employee->user) {
                $targetUser = $employee->user;
            } elseif ($employee) {
                $targetUser = new User([
                    'id' => $employee->user_id ?: 0,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'type' => 'employee',
                    'employee_id' => $employee->id,
                ]);
                $targetUser->setRelation('employee', $employee);
            }
        }

        return $this->employeeDashboard($request, $targetUser);
    }

    /**
     * Display the Personalized Employee Dashboard strictly scoped to the employee's assigned tasks and permitted menus.
     */
    protected function employeeDashboard(Request $request, User $user): Response
    {
        // 1. Resolve Employee Model
        $employee = $user->employee ?: Employee::with(['department', 'designation'])->where('user_id', $user->id)->first();
        if (!$employee && $user->employee_id) {
            $employee = Employee::with(['department', 'designation'])->find($user->employee_id);
        }
        $employeeId = $employee ? $employee->id : 0;

        $today = Carbon::today();
        $in3Days = Carbon::today()->addDays(3);

        // 2. Base Queries for Tasks Assigned to THIS Employee
        $projectTasksQuery = ProjectTask::withCount('messages')->with([
            'websiteProject.client:id,name,company_name,client_code,currency',
            'websiteProject.category:id,name',
        ])->where('assigned_employee_id', $employeeId);

        $serviceTasksQuery = ServiceTask::withCount('messages')->with([
            'service.client:id,name,company_name,client_code,currency',
            'service.category:id,name',
        ])->where('assigned_employee_id', $employeeId);

        $generalTasksQuery = Task::withCount('messages')->with([
            'taskCategory:id,name',
        ])->where('assigned_employee_id', $employeeId);

        // 3. Task Status Counters
        $totalProjectTasks = (clone $projectTasksQuery)->count();
        $totalServiceTasks = (clone $serviceTasksQuery)->count();
        $totalGeneralTasks = (clone $generalTasksQuery)->count();
        $totalTasks = $totalProjectTasks + $totalServiceTasks + $totalGeneralTasks;

        $todoTasks = (clone $projectTasksQuery)->where('status', 'todo')->count()
            + (clone $serviceTasksQuery)->where('status', 'todo')->count()
            + (clone $generalTasksQuery)->where('status', 'todo')->count();

        $inProgressTasks = (clone $projectTasksQuery)->where('status', 'in_progress')->count()
            + (clone $serviceTasksQuery)->where('status', 'in_progress')->count()
            + (clone $generalTasksQuery)->where('status', 'in_progress')->count();

        $inReviewTasks = (clone $projectTasksQuery)->where('status', 'in_review')->count()
            + (clone $serviceTasksQuery)->where('status', 'in_review')->count()
            + (clone $generalTasksQuery)->where('status', 'in_review')->count();

        $completedTasks = (clone $projectTasksQuery)->where('status', 'completed')->count()
            + (clone $serviceTasksQuery)->where('status', 'completed')->count()
            + (clone $generalTasksQuery)->where('status', 'completed')->count();

        $urgentTasks = (clone $projectTasksQuery)->where('priority', 'urgent')->where('status', '!=', 'completed')->count()
            + (clone $serviceTasksQuery)->where('priority', 'urgent')->where('status', '!=', 'completed')->count()
            + (clone $generalTasksQuery)->where('priority', 'urgent')->where('status', '!=', 'completed')->count();

        $overdueTasks = (clone $projectTasksQuery)->where('status', '!=', 'completed')->whereNotNull('due_date')->whereDate('due_date', '<', $today)->count()
            + (clone $serviceTasksQuery)->where('status', '!=', 'completed')->whereNotNull('due_date')->whereDate('due_date', '<', $today)->count()
            + (clone $generalTasksQuery)->where('status', '!=', 'completed')->whereNotNull('due_date')->whereDate('due_date', '<', $today)->count();

        $dueSoonTasks = (clone $projectTasksQuery)->where('status', '!=', 'completed')->whereNotNull('due_date')->whereDate('due_date', '>=', $today)->whereDate('due_date', '<=', $in3Days)->count()
            + (clone $serviceTasksQuery)->where('status', '!=', 'completed')->whereNotNull('due_date')->whereDate('due_date', '>=', $today)->whereDate('due_date', '<=', $in3Days)->count()
            + (clone $generalTasksQuery)->where('status', '!=', 'completed')->whereNotNull('due_date')->whereDate('due_date', '>=', $today)->whereDate('due_date', '<=', $in3Days)->count();

        $completionRate = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        $kpis = [
            'total_tasks' => $totalTasks,
            'todo_tasks' => $todoTasks,
            'in_progress_tasks' => $inProgressTasks,
            'in_review_tasks' => $inReviewTasks,
            'completed_tasks' => $completedTasks,
            'urgent_tasks' => $urgentTasks,
            'overdue_tasks' => $overdueTasks,
            'due_soon_tasks' => $dueSoonTasks,
            'completion_rate' => $completionRate,
        ];

        // 4. Transform and Combine Tasks for Dashboard Feeds
        $pTasks = (clone $projectTasksQuery)->get()->map(function ($t) use ($today) {
            $isOverdue = $t->status !== 'completed' && $t->due_date && Carbon::parse($t->due_date)->lt($today);
            return [
                'id' => $t->id,
                'source_type' => 'project',
                'task_title' => $t->task_title,
                'priority' => $t->priority,
                'status' => $t->status,
                'start_date' => $t->start_date ? Carbon::parse($t->start_date)->format('Y-m-d') : null,
                'due_date' => $t->due_date ? Carbon::parse($t->due_date)->format('Y-m-d') : null,
                'is_overdue' => $isOverdue,
                'messages_count' => $t->messages_count ?? 0,
                'website_project' => $t->websiteProject ? [
                    'id' => $t->websiteProject->id,
                    'project_name' => $t->websiteProject->project_name,
                    'client' => $t->websiteProject->client ? [
                        'name' => $t->websiteProject->client->name,
                        'company_name' => $t->websiteProject->client->company_name,
                    ] : null,
                ] : null,
                'created_at' => $t->created_at->toISOString(),
            ];
        });

        $sTasks = (clone $serviceTasksQuery)->get()->map(function ($t) use ($today) {
            $isOverdue = $t->status !== 'completed' && $t->due_date && Carbon::parse($t->due_date)->lt($today);
            return [
                'id' => $t->id,
                'source_type' => 'service',
                'task_title' => $t->task_title,
                'priority' => $t->priority,
                'status' => $t->status,
                'start_date' => $t->start_date ? Carbon::parse($t->start_date)->format('Y-m-d') : null,
                'due_date' => $t->due_date ? Carbon::parse($t->due_date)->format('Y-m-d') : null,
                'is_overdue' => $isOverdue,
                'messages_count' => $t->messages_count ?? 0,
                'service' => $t->service ? [
                    'id' => $t->service->id,
                    'service_name' => $t->service->service_name,
                    'client' => $t->service->client ? [
                        'name' => $t->service->client->name,
                        'company_name' => $t->service->client->company_name,
                    ] : null,
                ] : null,
                'created_at' => $t->created_at->toISOString(),
            ];
        });

        $gTasks = (clone $generalTasksQuery)->get()->map(function ($t) use ($today) {
            $isOverdue = $t->status !== 'completed' && $t->due_date && Carbon::parse($t->due_date)->lt($today);
            return [
                'id' => $t->id,
                'source_type' => 'general',
                'task_code' => $t->task_code,
                'task_title' => $t->task_title,
                'priority' => $t->priority,
                'status' => $t->status,
                'start_date' => $t->start_date ? Carbon::parse($t->start_date)->format('Y-m-d') : null,
                'due_date' => $t->due_date ? Carbon::parse($t->due_date)->format('Y-m-d') : null,
                'is_overdue' => $isOverdue,
                'messages_count' => $t->messages_count ?? 0,
                'task_category' => $t->taskCategory ? ['name' => $t->taskCategory->name] : null,
                'created_at' => $t->created_at->toISOString(),
            ];
        });

        $allAssignedTasks = $pTasks->concat($sTasks)->concat($gTasks);

        // Filter urgent tasks
        $urgentTaskList = $allAssignedTasks->filter(function ($t) {
            return ($t['priority'] === 'urgent' || $t['priority'] === 'high') && $t['status'] !== 'completed';
        })->values()->take(6);

        // Filter active tasks (todo or in_progress or in_review)
        $activeTaskList = $allAssignedTasks->filter(function ($t) {
            return $t['status'] !== 'completed';
        })->sortBy('due_date')->values()->take(10);

        // Recently completed tasks
        $recentCompletedTaskList = $allAssignedTasks->filter(function ($t) {
            return $t['status'] === 'completed';
        })->sortByDesc('created_at')->values()->take(5);

        // 5. Permitted Menus & Features ("My Workspace")
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        $isSuper = $user->hasRole('Super Admin') || $user->hasRole('admin');

        $hasPerm = function (string $perm) use ($permissions, $isSuper) {
            return $isSuper || in_array($perm, $permissions);
        };

        $permittedWorkspace = [];

        // Always available for employee
        $permittedWorkspace[] = [
            'id' => 'my-tasks',
            'title' => 'My Assigned Tasks',
            'description' => 'View, update status, and track all tasks assigned to you',
            'url' => '/my-tasks',
            'icon' => 'ListTodo',
            'badge' => ($inProgressTasks + $todoTasks > 0) ? ($inProgressTasks + $todoTasks) . ' Active' : '0 Active',
            'badge_color' => 'blue',
        ];

        if ($hasPerm('view-projects')) {
            $assignedProjectIds = ProjectTask::where('assigned_employee_id', $employeeId)->pluck('website_project_id')->unique()->filter()->values();
            $myProjectCount = $assignedProjectIds->count();
            $permittedWorkspace[] = [
                'id' => 'projects',
                'title' => 'Projects Directory',
                'description' => 'Browse and track web and software development projects',
                'url' => '/projects',
                'icon' => 'FolderKanban',
                'badge' => $myProjectCount . ' Assigned',
                'badge_color' => 'indigo',
            ];
        }

        if ($hasPerm('view-services')) {
            $assignedServiceIds = ServiceTask::where('assigned_employee_id', $employeeId)->pluck('client_service_id')->unique()->filter()->values();
            $myServiceCount = $assignedServiceIds->count();
            $permittedWorkspace[] = [
                'id' => 'services',
                'title' => 'Services Directory',
                'description' => 'Monthly retainers, marketing campaigns, and ongoing services',
                'url' => '/services',
                'icon' => 'Layers',
                'badge' => $myServiceCount . ' Assigned',
                'badge_color' => 'purple',
            ];
        }

        if ($hasPerm('view-tasks')) {
            $permittedWorkspace[] = [
                'id' => 'general-tasks',
                'title' => 'General Tasks',
                'description' => 'Internal workspace tasks, todo lists, and team milestones',
                'url' => '/tasks',
                'icon' => 'CheckSquare',
                'badge' => $totalGeneralTasks . ' Tasks',
                'badge_color' => 'amber',
            ];
        }

        if ($hasPerm('view-credentials')) {
            $permittedWorkspace[] = [
                'id' => 'credentials',
                'title' => 'Credentials Vault',
                'description' => 'Authorized access keys, server logins, and secure client credentials',
                'url' => '/credentials',
                'icon' => 'Key',
                'badge' => 'Secure Vault',
                'badge_color' => 'slate',
            ];
        }

        if ($hasPerm('view-payroll')) {
            $permittedWorkspace[] = [
                'id' => 'payroll',
                'title' => 'Monthly Payroll',
                'description' => 'Access your monthly salary history, payslips, and records',
                'url' => '/payroll',
                'icon' => 'Banknote',
                'badge' => 'Salary History',
                'badge_color' => 'emerald',
            ];
        }

        if ($hasPerm('view-clients')) {
            $permittedWorkspace[] = [
                'id' => 'clients',
                'title' => 'Client Hub',
                'description' => 'Directory of enterprise and regional client accounts',
                'url' => '/clients',
                'icon' => 'Building',
                'badge' => 'Directory',
                'badge_color' => 'cyan',
            ];
        }

        if ($hasPerm('view-reports')) {
            $permittedWorkspace[] = [
                'id' => 'reports',
                'title' => 'Reports & Analytics',
                'description' => 'Authorized general reports and operational logs',
                'url' => '/reports',
                'icon' => 'LineChart',
                'badge' => 'Analytics',
                'badge_color' => 'rose',
            ];
        }

        // 6. Assigned Projects (Where employee has tasks)
        $assignedProjects = [];
        if ($hasPerm('view-projects')) {
            $assignedProjectIds = ProjectTask::where('assigned_employee_id', $employeeId)->pluck('website_project_id')->unique()->filter()->values();
            if ($assignedProjectIds->isNotEmpty()) {
                $assignedProjects = WebsiteProject::with(['client:id,name,company_name,currency', 'category:id,name'])
                    ->whereIn('id', $assignedProjectIds)
                    ->get()
                    ->map(function ($p) use ($employeeId) {
                        $myProjectTasks = ProjectTask::where('website_project_id', $p->id)
                            ->where('assigned_employee_id', $employeeId);
                        $total = (clone $myProjectTasks)->count();
                        $completed = (clone $myProjectTasks)->where('status', 'completed')->count();
                        return [
                            'id' => $p->id,
                            'project_name' => $p->project_name,
                            'client_name' => $p->client ? ($p->client->company_name ?: $p->client->name) : 'N/A',
                            'category_name' => $p->category->name ?? 'General',
                            'status' => $p->status,
                            'deadline' => $p->deadline ? Carbon::parse($p->deadline)->format('Y-m-d') : null,
                            'progress_percentage' => $p->progress_percentage ?? 0,
                            'my_tasks_total' => $total,
                            'my_tasks_completed' => $completed,
                        ];
                    })->values();
            }
        }

        // 7. Recent Task Discussions / Messages
        $recentTaskMessages = TaskMessage::with('user:id,name,avatar')
            ->where(function ($q) use ($employeeId) {
                $q->where(function ($sub) use ($employeeId) {
                    $sub->where('taskable_type', ProjectTask::class)
                        ->whereIn('taskable_id', ProjectTask::where('assigned_employee_id', $employeeId)->pluck('id'));
                })->orWhere(function ($sub) use ($employeeId) {
                    $sub->where('taskable_type', ServiceTask::class)
                        ->whereIn('taskable_id', ServiceTask::where('assigned_employee_id', $employeeId)->pluck('id'));
                })->orWhere(function ($sub) use ($employeeId) {
                    $sub->where('taskable_type', Task::class)
                        ->whereIn('taskable_id', Task::where('assigned_employee_id', $employeeId)->pluck('id'));
                });
            })
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($m) {
                $taskTitle = 'Assigned Task';
                $taskType = 'general';
                if ($m->taskable) {
                    $taskTitle = $m->taskable->task_title ?? 'Task';
                    if ($m->taskable_type === ProjectTask::class) {
                        $taskType = 'project';
                    } elseif ($m->taskable_type === ServiceTask::class) {
                        $taskType = 'service';
                    }
                }
                return [
                    'id' => $m->id,
                    'task_id' => $m->taskable_id,
                    'task_type' => $taskType,
                    'task_title' => $taskTitle,
                    'user_name' => $m->user ? $m->user->name : 'Colleague',
                    'user_avatar' => $m->user ? $m->user->avatar : null,
                    'message' => $m->message,
                    'created_at' => $m->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('employee/dashboard', [
            'employee' => $employee ? [
                'id' => $employee->id,
                'name' => $employee->name,
                'employee_code' => $employee->employee_code,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'avatar' => $employee->avatar,
                'joining_date' => $employee->joining_date ? Carbon::parse($employee->joining_date)->format('d M, Y') : null,
                'allowed_paid_leaves' => $employee->allowed_paid_leaves,
                'department_name' => $employee->department->name ?? 'N/A',
                'designation_name' => $employee->designation->name ?? 'N/A',
                'status' => $employee->status,
            ] : [
                'id' => 0,
                'name' => $user->name,
                'employee_code' => 'EMP',
                'email' => $user->email,
                'phone' => null,
                'avatar' => $user->avatar,
                'joining_date' => null,
                'allowed_paid_leaves' => 0,
                'department_name' => 'Operations',
                'designation_name' => 'Team Member',
                'status' => 'active',
            ],
            'kpis' => $kpis,
            'urgentTasks' => $urgentTaskList,
            'activeTasks' => $activeTaskList,
            'recentCompletedTasks' => $recentCompletedTaskList,
            'permittedWorkspace' => $permittedWorkspace,
            'assignedProjects' => $assignedProjects,
            'recentTaskMessages' => $recentTaskMessages,
        ]);
    }
}
