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

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0">
                {/* Primary Executive KPI Cards (4 Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Revenue (Vibrant Emerald Gradient) */}
                    <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-500/20 border border-emerald-400/30 space-y-3 relative overflow-hidden group hover:scale-[1.02] transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                                Total Agency Revenue
                            </span>
                            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-xs">
                                <TrendingUp className="size-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                                PKR {Number(kpis.total_revenue_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-emerald-100 mt-1 flex items-center gap-1 font-medium">
                                <span className="text-white font-extrabold flex items-center">
                                    <ArrowUpRight className="size-3.5" /> +100%
                                </span>
                                <span>Total Collected Income</span>
                            </p>
                        </div>
                    </div>

                    {/* Card 2: MRR (Vibrant Electric Blue Gradient) */}
                    <div className="p-5 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl shadow-blue-500/20 border border-blue-400/30 space-y-3 relative overflow-hidden hover:scale-[1.02] transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100">
                                Monthly Recurring (MRR)
                            </span>
                            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-xs">
                                <LineChart className="size-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                                PKR {Number(kpis.mrr_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-blue-100 mt-1 font-medium">
                                Active retainers monthly yield
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Receivables (Vibrant Coral / Amber Gradient) */}
                    <div className="p-5 rounded-xl bg-gradient-to-br from-rose-500 via-pink-600 to-amber-600 text-white shadow-xl shadow-rose-500/20 border border-rose-400/30 space-y-3 relative overflow-hidden hover:scale-[1.02] transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-100">
                                Pending Receivables
                            </span>
                            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-xs">
                                <Clock className="size-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                                PKR {Number(kpis.pending_receivables_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-rose-100 mt-1 font-medium">
                                Pending milestones & invoices
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Operations (Vibrant Deep Purple Gradient) */}
                    <div className="p-5 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-700 to-violet-800 text-white shadow-xl shadow-purple-500/20 border border-purple-400/30 space-y-3 relative overflow-hidden hover:scale-[1.02] transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-100">
                                Active Operations
                            </span>
                            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-xs">
                                <Briefcase className="size-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                {kpis.active_projects_count} Active Projects
                            </h3>
                            <p className="text-[11px] text-purple-100 mt-1 flex items-center gap-2 font-medium">
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
                    <div className="lg:col-span-8 p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Revenue Growth & Collection Trend (PKR)
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">Monthly breakdown of project milestones and invoice collections.</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[11px] font-extrabold text-blue-600 dark:text-blue-400 border border-blue-200/60">
                                Last 6 Months
                            </span>
                        </div>

                        <div className="h-72 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevAdmin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        formatter={(val: any) => [`PKR ${Number(val).toLocaleString()}`, 'Revenue']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', background: 'rgba(15, 23, 42, 0.9)', color: '#ffffff' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3.5} fillOpacity={1} fill="url(#colorRevAdmin)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Task Status Distribution Chart */}
                    <div className="lg:col-span-4 p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                        <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                Task Status Distribution
                            </h3>
                            <p className="text-xs text-slate-400 font-medium">Team task completion and pending workload.</p>
                        </div>

                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={taskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(val: any) => [`${val} Tasks`, 'Count']} />
                                    <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                                        {taskData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : index === 2 ? '#ff7a65' : '#8b5cf6'} />
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
                    <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <FileText className="size-4" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Recent Invoices</h3>
                            </div>
                            <Link href="/invoices" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
                        </div>

                        <div className="space-y-3">
                            {recentInvoices.length > 0 ? (
                                recentInvoices.map((inv) => (
                                    <div key={inv.id} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <Link href={`/invoices/${inv.id}`} className="font-extrabold text-xs text-slate-900 dark:text-white hover:text-blue-600 block">
                                                {inv.invoice_number}
                                            </Link>
                                            <span className="text-[11px] text-slate-400 block truncate max-w-[150px] font-medium">
                                                {inv.client?.company_name || inv.client?.name}
                                            </span>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-extrabold text-xs text-slate-900 dark:text-white font-mono block">
                                                {inv.currency_code} {inv.total_amount.toFixed(2)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${inv.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
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
                    <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                    <FolderKanban className="size-4" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Active Projects Progress</h3>
                            </div>
                            <Link href="/website-projects" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
                        </div>

                        <div className="space-y-3">
                            {recentProjects.length > 0 ? (
                                recentProjects.map((p) => (
                                    <div key={p.id} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/60 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <Link href={`/website-projects/${p.id}`} className="font-extrabold text-slate-900 dark:text-white hover:text-blue-600 truncate max-w-[170px]">
                                                {p.project_name}
                                            </Link>
                                            <span className="font-extrabold text-blue-600 font-mono">{p.progress_percentage}%</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
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
                    <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                    <Zap className="size-4" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Pending Team Tasks</h3>
                            </div>
                            <Link href="/project-tasks" className="text-xs font-bold text-blue-600 hover:underline">View Tasks</Link>
                        </div>

                        <div className="space-y-3">
                            {urgentTasks.length > 0 ? (
                                urgentTasks.map((t) => (
                                    <div key={t.id} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800/60 space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[170px]">
                                                {t.task_title}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${t.priority === 'urgent' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                }`}>
                                                {t.priority}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
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
