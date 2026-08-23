import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    Banknote,
    BarChart3,
    Briefcase,
    Building2,
    CheckCircle2,
    Clock,
    Coins,
    DollarSign,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    FolderKanban,
    Globe,
    Layers,
    LineChart,
    Mail,
    PieChart as PieIcon,
    Plus,
    Receipt,
    Server,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Executive Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    canViewDashboard?: boolean;
    kpis: {
        total_revenue_pkr: number;
        mrr_pkr: number;
        total_expenses_pkr: number;
        net_profit_pkr: number;
        pending_receivables_pkr: number;
        active_projects_count: number;
        total_projects_count: number;
        total_clients_count: number;
        active_clients_count: number;
        total_domains_count: number;
        total_hostings_count: number;
        total_employees_count: number;
        pending_tasks_count: number;
        urgent_tasks_count: number;
    };
    revenueTrend: Array<{
        month: string;
        revenue: number;
        expenses: number;
        net: number;
    }>;
    revenueStreams: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    projectStatus: {
        in_progress: number;
        planning: number;
        completed: number;
        on_hold: number;
    };
    taskStatus: {
        completed: number;
        in_progress: number;
        in_review: number;
        pending: number;
        urgent: number;
    };
    currencyBreakdown: Array<{
        code: string;
        name: string;
        symbol: string;
        total_amount: number;
        pkr_equivalent: number;
        rate: number;
    }>;
    recentInvoices: Array<{
        id: number;
        invoice_number: string;
        currency_code: string;
        total_amount: number;
        total_amount_pkr: number;
        issue_date: string;
        status: string;
        client?: { id: number; name: string; company_name?: string; client_code: string };
    }>;
    recentProjects: Array<{
        id: number;
        project_name: string;
        progress_percentage: number;
        deadline: string;
        total_budget: number;
        currency: string;
        status: string;
        client?: { id: number; name: string; company_name?: string; client_code: string };
    }>;
    urgentTasks: Array<{
        id: number;
        task_title: string;
        priority: string;
        status: string;
        due_date: string;
        category_name: string;
        assigned_employee?: { name: string };
    }>;
    expiringAssets: Array<{
        type: 'domain' | 'hosting';
        title: string;
        client_name: string;
        client_code: string;
        date: string;
        status: string;
    }>;
    recentCashflow: Array<{
        type: 'income' | 'expense';
        title: string;
        category: string;
        amount: number;
        currency: string;
        date: string;
    }>;
}

export default function Dashboard({
    canViewDashboard,
    kpis = {
        total_revenue_pkr: 0,
        mrr_pkr: 0,
        total_expenses_pkr: 0,
        net_profit_pkr: 0,
        pending_receivables_pkr: 0,
        active_projects_count: 0,
        total_projects_count: 0,
        total_clients_count: 0,
        active_clients_count: 0,
        total_domains_count: 0,
        total_hostings_count: 0,
        total_employees_count: 0,
        pending_tasks_count: 0,
        urgent_tasks_count: 0,
    },
    revenueTrend = [],
    revenueStreams = [],
    projectStatus = { in_progress: 0, planning: 0, completed: 0, on_hold: 0 },
    taskStatus = { completed: 0, in_progress: 0, in_review: 0, pending: 0, urgent: 0 },
    currencyBreakdown = [],
    recentInvoices = [],
    recentProjects = [],
    urgentTasks = [],
    expiringAssets = [],
    recentCashflow = [],
}: DashboardProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const [activeChartTab, setActiveChartTab] = useState<'revenue' | 'net'>('revenue');

    const isPermitted =
        canViewDashboard !== undefined
            ? Boolean(canViewDashboard)
            : hasPermission(user, 'view-dashboard');

    if (!isPermitted) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard | Access Restricted" />

                <div className="flex items-center justify-center min-h-[60vh] p-4">
                    <div className="max-w-md w-full text-center p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                        <div className="size-14 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <AlertCircle className="size-7" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                                Access Restricted
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                You do not have permission to view executive analytics. Please contact your system administrator.
                            </p>
                        </div>
                        <div className="pt-2">
                            <a
                                href="mailto:admin@sapta.com?subject=Request for Dashboard Access"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-500/20"
                            >
                                <Mail className="size-4" />
                                <span>Contact Administrator</span>
                            </a>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Pipeline Data for Bar Chart
    const pipelineData = [
        { stage: 'Planning', Projects: projectStatus.planning, Tasks: taskStatus.pending },
        { stage: 'In Progress', Projects: projectStatus.in_progress, Tasks: taskStatus.in_progress },
        { stage: 'In Review', Projects: 0, Tasks: taskStatus.in_review },
        { stage: 'Completed', Projects: projectStatus.completed, Tasks: taskStatus.completed },
        { stage: 'On Hold', Projects: projectStatus.on_hold, Tasks: 0 },
    ];

    // Filter valid revenue stream items
    const validRevenueStreams = revenueStreams.filter((item) => item.value > 0);
    const totalStreamSum = validRevenueStreams.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Executive Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 min-w-0">
                {/* Standard Clean Header & Fast Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="h-6 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-extrabold border border-blue-200/60 dark:border-blue-800/60 inline-flex items-center">
                                EXECUTIVE OVERVIEW
                            </span>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Operations & Financial Control
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Real-time agency revenue, client assets, project pipelines, cash flow & retainers.
                        </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/clients/create"
                            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                            <Plus className="size-3.5 text-blue-600" />
                            <span>New Client</span>
                        </Link>
                        <Link
                            href="/tasks/create"
                            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                            <Plus className="size-3.5 text-purple-600" />
                            <span>New Task</span>
                        </Link>
                        <Link
                            href="/incomes"
                            className="h-9 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <TrendingUp className="size-3.5 text-emerald-600" />
                            <span>Income</span>
                        </Link>
                        <Link
                            href="/expenses"
                            className="h-9 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                            <TrendingDown className="size-3.5 text-rose-600" />
                            <span>Expense</span>
                        </Link>
                        <Link
                            href="/reports"
                            className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                        >
                            <LineChart className="size-3.5" />
                            <span>Reports</span>
                        </Link>
                    </div>
                </div>

                {/* 4 Main Executive KPI Cards (Row of 4 with Vibrant Colors) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Collected Revenue (Vibrant Emerald Card) */}
                    <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-950/20 bg-white dark:bg-slate-900 border border-emerald-200/90 dark:border-emerald-800/80 shadow-xs flex items-center justify-between hover:border-emerald-300 transition-all">
                        <div className="space-y-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Total Revenue
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                PKR {Number(kpis.total_revenue_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </h3>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <ArrowUpRight className="size-3" /> All-time collected inflow
                            </p>
                        </div>
                        <div className="size-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
                            <TrendingUp className="size-5" />
                        </div>
                    </div>

                    {/* Card 2: Monthly Retainers Yield (Vibrant Electric Blue Card) */}
                    <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-950/40 dark:via-blue-950/20 bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-blue-800/80 shadow-xs flex items-center justify-between hover:border-blue-300 transition-all">
                        <div className="space-y-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                Monthly Retainers (MRR)
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                PKR {Number(kpis.mrr_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </h3>
                            <p className="text-[10px] text-blue-700 dark:text-blue-400 font-bold">
                                Active recurring service yield
                            </p>
                        </div>
                        <div className="size-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
                            <Receipt className="size-5" />
                        </div>
                    </div>

                    {/* Card 3: Net Cash Flow / Profit (Vibrant Teal / Violet Card) */}
                    <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent dark:from-teal-950/40 dark:via-teal-950/20 bg-white dark:bg-slate-900 border border-teal-200/90 dark:border-teal-800/80 shadow-xs flex items-center justify-between hover:border-teal-300 transition-all">
                        <div className="space-y-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                                Net Cash Flow
                            </span>
                            <h3 className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${kpis.net_profit_pkr >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                PKR {Number(kpis.net_profit_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                Revenue vs (Expenses + Payroll)
                            </p>
                        </div>
                        <div className="size-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 shrink-0">
                            <Coins className="size-5" />
                        </div>
                    </div>

                    {/* Card 4: Receivables Due & Overdue (Vibrant Amber / Rose Card) */}
                    <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-800/80 shadow-xs flex items-center justify-between hover:border-amber-300 transition-all">
                        <div className="space-y-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Receivables Due
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                                PKR {Number(kpis.pending_receivables_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </h3>
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                                Pending milestones & invoices
                            </p>
                        </div>
                        <div className="size-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
                            <Clock className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Secondary Operational Summary Strip (4 Compact Metric Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Item 1: Projects */}
                    <Link
                        href="/clients"
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:border-purple-300 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                                <Briefcase className="size-4" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Projects Pipeline</span>
                                <div className="text-xs font-black text-slate-900 dark:text-white">
                                    {kpis.active_projects_count} Active / {kpis.total_projects_count} Total
                                </div>
                            </div>
                        </div>
                        <ArrowUpRight className="size-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
                    </Link>

                    {/* Item 2: Tasks Workload */}
                    <Link
                        href="/tasks"
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:border-blue-300 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                                <CheckCircle2 className="size-4" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Workload Tasks</span>
                                <div className="text-xs font-black text-slate-900 dark:text-white">
                                    {kpis.pending_tasks_count} Active ({kpis.urgent_tasks_count} Urgent)
                                </div>
                            </div>
                        </div>
                        <ArrowUpRight className="size-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </Link>

                    {/* Item 3: Managed Domains & Hostings */}
                    <Link
                        href="/reports"
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:border-amber-300 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                                <Globe className="size-4" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Web Infrastructure</span>
                                <div className="text-xs font-black text-slate-900 dark:text-white">
                                    {kpis.total_domains_count} Domains • {kpis.total_hostings_count} Hostings
                                </div>
                            </div>
                        </div>
                        <ArrowUpRight className="size-4 text-slate-300 group-hover:text-amber-600 transition-colors" />
                    </Link>

                    {/* Item 4: Clients & Workforce */}
                    <Link
                        href="/employees"
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:border-indigo-300 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                                <Users className="size-4" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Clients & Team</span>
                                <div className="text-xs font-black text-slate-900 dark:text-white">
                                    {kpis.total_clients_count} Clients • {kpis.total_employees_count} Employees
                                </div>
                            </div>
                        </div>
                        <ArrowUpRight className="size-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </Link>
                </div>

                {/* Primary Analytics Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Cash Flow & Revenue Inflow Trajectory (8 cols) */}
                    <div className="lg:col-span-8 p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Cash Flow & Revenue Inflow Trajectory
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Monthly comparison of collections, agency expenditures & net yield (PKR).
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setActiveChartTab('revenue')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeChartTab === 'revenue'
                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    Inflow vs Outflow
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveChartTab('net')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeChartTab === 'net'
                                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    Net Margin
                                </button>
                            </div>
                        </div>

                        <div className="h-72 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                {activeChartTab === 'revenue' ? (
                                    <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                            </linearGradient>
                                            <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            formatter={(val: any, name?: any) => [
                                                `PKR ${Number(val).toLocaleString()}`,
                                                String(name) === 'revenue' ? 'Inflow' : 'Expenditure',
                                            ]}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                                                background: '#0f172a',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                            }}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" />
                                        <Area type="monotone" dataKey="revenue" name="Inflow Revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#gradRevenue)" />
                                        <Area type="monotone" dataKey="expenses" name="Expenditures" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#gradExpense)" />
                                    </AreaChart>
                                ) : (
                                    <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, 'Net Margin']}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                                                background: '#0f172a',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                            }}
                                        />
                                        <Bar dataKey="net" name="Net Profit Margin" fill="#0d9488" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue Stream Breakdown Donut (4 cols) */}
                    <div className="lg:col-span-4 p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                Revenue Stream Breakdown
                            </h3>
                            <p className="text-xs text-slate-400">
                                Distribution of earnings across agency services.
                            </p>
                        </div>

                        <div className="h-52 w-full relative flex items-center justify-center">
                            {validRevenueStreams.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={validRevenueStreams}
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {validRevenueStreams.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, 'Yield']}
                                            contentStyle={{
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: '#0f172a',
                                                color: '#fff',
                                                fontSize: '11px',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-slate-400 text-xs">
                                    <PieIcon className="size-8 mx-auto mb-1 opacity-50" />
                                    No transaction distribution yet
                                </div>
                            )}

                            {totalStreamSum > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Total</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                        {(totalStreamSum / 1000).toFixed(0)}k
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Stream Legends */}
                        <div className="space-y-1.5 pt-1">
                            {revenueStreams.map((stream) => {
                                const percentage = totalStreamSum > 0 ? ((stream.value / totalStreamSum) * 100).toFixed(1) : '0';
                                return (
                                    <div key={stream.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2.5 rounded-full" style={{ backgroundColor: stream.color }}></span>
                                            <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]">
                                                {stream.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 font-bold font-mono text-slate-900 dark:text-white">
                                            <span>PKR {stream.value.toLocaleString()}</span>
                                            <span className="text-[10px] text-slate-400 font-normal">({percentage}%)</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Secondary Analytics: Pipeline Health & Multi-Currency Treasury */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Pipeline Health (7 cols) */}
                    <div className="lg:col-span-7 p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Pipeline Workload & Progress
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Active website projects and task milestone statuses.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                                Total: {kpis.pending_tasks_count + taskStatus.completed} Tasks
                            </span>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: '#0f172a',
                                            color: '#fff',
                                            fontSize: '11px',
                                        }}
                                    />
                                    <Legend verticalAlign="top" height={36} iconType="circle" />
                                    <Bar dataKey="Projects" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="Tasks" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Multi-Currency Treasury Exposure (5 cols) */}
                    <div className="lg:col-span-5 p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Multi-Currency Treasury
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Client billing weights & forex exchange benchmarks.
                                </p>
                            </div>
                            <Link href="/currencies" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                Manage Rates
                            </Link>
                        </div>

                        <div className="space-y-2.5">
                            {currencyBreakdown.map((curr) => (
                                <div
                                    key={curr.code}
                                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shadow-2xs font-mono">
                                            {curr.symbol || curr.code}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                <span>{curr.code}</span>
                                                <span className="text-[10px] text-slate-400 font-normal">({curr.name})</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium">
                                                Rate: 1 {curr.code} = PKR {Number(curr.rate).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                                            {curr.symbol} {curr.total_amount.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold">
                                            ≈ PKR {curr.pkr_equivalent.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Operational Activity Grid: 4 Actionable Intelligence Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Widget 1: Attention Required & Expiring Assets */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <AlertTriangle className="size-4 text-amber-500" />
                                    Expiring Renewals
                                </h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200/60">
                                    Next 45 Days
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                                {expiringAssets.length > 0 ? (
                                    expiringAssets.map((asset, idx) => (
                                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                    {asset.type === 'domain' ? (
                                                        <Globe className="size-3 text-blue-500" />
                                                    ) : (
                                                        <Server className="size-3 text-amber-500" />
                                                    )}
                                                    <span className="truncate max-w-[130px]">{asset.title}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {asset.client_code} • {asset.client_name}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 block">
                                                    {asset.date}
                                                </span>
                                                <span className="text-[9px] font-extrabold text-amber-600 uppercase">
                                                    {asset.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-xs text-slate-400">
                                        <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-1" />
                                        All domains & hostings are active
                                    </div>
                                )}
                            </div>
                        </div>

                        <Link
                            href="/reports"
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-1"
                        >
                            <span>View All Asset Renewals</span>
                            <ExternalLink className="size-3" />
                        </Link>
                    </div>

                    {/* Widget 2: Recent Invoices */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <FileText className="size-4 text-blue-500" />
                                    Recent Invoices
                                </h4>
                                <Link href="/invoices" className="text-[10px] font-bold text-blue-600 hover:underline">
                                    View All
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                                {recentInvoices.length > 0 ? (
                                    recentInvoices.map((inv) => (
                                        <div key={inv.id} className="py-2 flex items-center justify-between text-xs">
                                            <div>
                                                <Link href={`/invoices/${inv.id}`} className="font-bold text-slate-900 dark:text-white hover:text-blue-600 flex items-center gap-1">
                                                    #{inv.invoice_number}
                                                </Link>
                                                <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                                    {inv.client?.name || 'Client'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-extrabold text-slate-900 dark:text-white font-mono text-[11px]">
                                                    {inv.currency_code} {Number(inv.total_amount).toLocaleString()}
                                                </div>
                                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${inv.status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : inv.status === 'overdue'
                                                        ? 'bg-rose-50 text-rose-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-xs text-slate-400">
                                        No invoices recorded yet
                                    </div>
                                )}
                            </div>
                        </div>

                        <Link
                            href="/invoices"
                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 pt-1"
                        >
                            <span>Open Invoicing Hub</span>
                            <ExternalLink className="size-3" />
                        </Link>
                    </div>

                    {/* Widget 3: Active Projects Progress */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <FolderKanban className="size-4 text-purple-500" />
                                    Active Projects
                                </h4>
                                <span className="text-[10px] font-bold text-purple-600">
                                    {kpis.active_projects_count} Active
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                                {recentProjects.length > 0 ? (
                                    recentProjects.map((p) => (
                                        <div key={p.id} className="py-2.5 space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                                                    {p.project_name}
                                                </span>
                                                <span className="text-[10px] font-bold font-mono text-purple-600">
                                                    {p.progress_percentage || 0}%
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                                                    style={{ width: `${p.progress_percentage || 0}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                <span>{p.client?.name || 'Client'}</span>
                                                <span className="font-mono">
                                                    {p.currency} {Number(p.total_budget || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-xs text-slate-400">
                                        No active projects
                                    </div>
                                )}
                            </div>
                        </div>

                        <Link
                            href="/clients"
                            className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 pt-1"
                        >
                            <span>Manage Projects in Client Hub</span>
                            <ExternalLink className="size-3" />
                        </Link>
                    </div>

                    {/* Widget 4: Real-time Cashflow Feed */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <Activity className="size-4 text-teal-500" />
                                    Recent Cashflow
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400">
                                    Real-time
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
                                {recentCashflow.length > 0 ? (
                                    recentCashflow.map((flow, idx) => (
                                        <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                                                    {flow.title}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {flow.category} • {flow.date}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-mono font-extrabold text-xs ${flow.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}>
                                                    {flow.type === 'income' ? '+' : '-'} {flow.currency} {Number(flow.amount).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-xs text-slate-400">
                                        No recent cash movements
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <Link href="/incomes" className="text-[11px] font-bold text-emerald-600 hover:underline">
                                Incomes
                            </Link>
                            <span className="text-slate-300">•</span>
                            <Link href="/expenses" className="text-[11px] font-bold text-rose-600 hover:underline">
                                Expenses
                            </Link>
                            <span className="text-slate-300">•</span>
                            <Link href="/payroll" className="text-[11px] font-bold text-indigo-600 hover:underline">
                                Payroll
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
