import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
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
    Eye,
    FileText,
    FolderKanban,
    Globe,
    Layers,
    LineChart,
    Plus,
    Receipt,
    ShieldCheck,
    TrendingUp,
    User,
    Users,
    Zap,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    kpis: {
        total_revenue_pkr: number;
        mrr_pkr: number;
        pending_receivables_pkr: number;
        active_projects_count: number;
        total_projects_count: number;
        total_clients_count: number;
        total_employees_count: number;
    };
    revenueTrend: Array<{ month: string; revenue: number }>;
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
        client?: { id: number; name: string; company_name?: string };
    }>;
    recentProjects: Array<{
        id: number;
        project_name: string;
        progress_percentage: number;
        deadline: string;
        total_budget: number;
        currency: string;
        client?: { id: number; name: string; company_name?: string };
    }>;
    urgentTasks: Array<{
        id: number;
        task_title: string;
        priority: string;
        status: string;
        due_date: string;
        website_project?: { id: number; project_name: string };
        assigned_employee?: { id: number; first_name: string; last_name: string };
    }>;
}

export default function Dashboard({
    kpis,
    revenueTrend,
    projectStatus,
    taskStatus,
    currencyBreakdown,
    recentInvoices,
    recentProjects,
    urgentTasks,
}: DashboardProps) {
    const { auth } = usePage().props as any;

    const projectStatusData = [
        { name: 'In Progress', value: projectStatus.in_progress, color: '#0052D4 font' },
        { name: 'Planning', value: projectStatus.planning, color: '#8b5cf6' },
        { name: 'Completed', value: projectStatus.completed, color: '#10b981' },
        { name: 'On Hold', value: projectStatus.on_hold, color: '#f59e0b' },
    ];

    const taskData = [
        { name: 'Completed', value: taskStatus.completed, fill: '#10b981' },
        { name: 'In Progress', value: taskStatus.in_progress, fill: '#0052D4' },
        { name: 'In Review', value: taskStatus.in_review, fill: '#8b5cf6' },
        { name: 'Pending', value: taskStatus.pending, fill: '#94a3b8' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Executive Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Executive Operations Dashboard
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                Live Agency CRM
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Welcome back, <strong className="text-slate-900 dark:text-white">{auth?.user?.name || 'Administrator'}</strong>. Real-time revenue tracking, project health, and multi-currency billing analytics.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Link
                            href="/invoices/create"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-1.5"
                        >
                            <Plus className="size-4" />
                            <span>Create Invoice</span>
                        </Link>

                        <Link
                            href="/clients/create"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-1.5 shadow-2xs"
                        >
                            <Users className="size-4 text-indigo-500" />
                            <span>Add Client</span>
                        </Link>

                        <Link
                            href="/website-projects/create"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-1.5 shadow-2xs"
                        >
                            <FolderKanban className="size-4 text-emerald-500" />
                            <span>New Project</span>
                        </Link>
                    </div>
                </div>

                {/* Primary Executive KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Revenue */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden group">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Total Collected Revenue
                            </span>
                            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="size-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                PKR {Number(kpis.total_revenue_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <span className="text-emerald-600 font-extrabold flex items-center">
                                    <ArrowUpRight className="size-3.5" /> +100%
                                </span>
                                <span>Total Agency Income</span>
                            </p>
                        </div>
                    </div>

                    {/* Card 2: MRR */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Monthly Recurring (MRR)
                            </span>
                            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <LineChart className="size-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                                PKR {Number(kpis.mrr_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                Active SEO Retainers monthly value
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Receivables */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Pending Receivables
                            </span>
                            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                <Clock className="size-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                                PKR {Number(kpis.pending_receivables_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                Unpaid milestones & pending invoices
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Operations */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Active Operations
                            </span>
                            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <Briefcase className="size-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {kpis.active_projects_count} Active Projects
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                <span>{kpis.total_clients_count} Clients</span>
                                <span>•</span>
                                <span>{kpis.total_employees_count} Team Members</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Revenue Growth Trend Chart */}
                    <div className="lg:col-span-8 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Revenue Growth & Collection Trend (PKR)
                                </h3>
                                <p className="text-xs text-slate-400">Monthly breakdown of project milestones and invoice collections.</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                Last 6 Months
                            </span>
                        </div>

                        <div className="h-72 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0052D4" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#0052D4" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, 'Revenue']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#0052D4" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Task & Project Health Bar Chart */}
                    <div className="lg:col-span-4 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                Task Status Distribution
                            </h3>
                            <p className="text-xs text-slate-400">Team task completion and pending load.</p>
                        </div>

                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={taskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(val: any) => [`${val} Tasks`, 'Count']} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {taskData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {taskStatus.urgent > 0 && (
                            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="size-4 text-rose-600 shrink-0" />
                                    <span>{taskStatus.urgent} Urgent Priority Tasks Pending</span>
                                </div>
                                <Link href="/project-tasks" className="underline hover:text-rose-900">View</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3 Columns Activity Widgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Widget 1: Recent Invoices Activity */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <FileText className="size-4 text-blue-600" />
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Recent Invoices</h3>
                            </div>
                            <Link href="/invoices" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
                        </div>

                        <div className="space-y-3">
                            {recentInvoices.length > 0 ? (
                                recentInvoices.map((inv) => (
                                    <div key={inv.id} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <Link href={`/invoices/${inv.id}`} className="font-extrabold text-xs text-slate-900 dark:text-white hover:text-blue-600 block">
                                                {inv.invoice_number}
                                            </Link>
                                            <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                                                {inv.client?.company_name || inv.client?.name}
                                            </span>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-extrabold text-xs text-slate-900 dark:text-white font-mono block">
                                                {inv.currency_code} {inv.total_amount.toFixed(2)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center py-4">No recent invoices recorded.</p>
                            )}
                        </div>
                    </div>

                    {/* Widget 2: Active Projects Progress */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <FolderKanban className="size-4 text-emerald-600" />
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Active Projects Progress</h3>
                            </div>
                            <Link href="/website-projects" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
                        </div>

                        <div className="space-y-3">
                            {recentProjects.length > 0 ? (
                                recentProjects.map((p) => (
                                    <div key={p.id} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <Link href={`/website-projects/${p.id}`} className="font-extrabold text-slate-900 dark:text-white hover:text-blue-600 truncate max-w-[170px]">
                                                {p.project_name}
                                            </Link>
                                            <span className="font-extrabold text-blue-600 font-mono">{p.progress_percentage}%</span>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                                                style={{ width: `${p.progress_percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center py-4">No active projects.</p>
                            )}
                        </div>
                    </div>

                    {/* Widget 3: Urgent Tasks Alert */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Zap className="size-4 text-purple-600" />
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Pending Team Tasks</h3>
                            </div>
                            <Link href="/project-tasks" className="text-xs font-bold text-blue-600 hover:underline">View Tasks</Link>
                        </div>

                        <div className="space-y-3">
                            {urgentTasks.length > 0 ? (
                                urgentTasks.map((t) => (
                                    <div key={t.id} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[170px]">
                                                {t.task_title}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${t.priority === 'urgent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                {t.priority}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                                            <span>Assigned: {t.assigned_employee ? `${t.assigned_employee.first_name} ${t.assigned_employee.last_name}` : 'Unassigned'}</span>
                                            <span>Due: {t.due_date}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center py-4">No urgent tasks pending.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
