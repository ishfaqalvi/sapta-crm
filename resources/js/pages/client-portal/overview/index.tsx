import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    BadgeCheck,
    BadgeDollarSign,
    Building2,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    CreditCard,
    DollarSign,
    Edit3,
    FileText,
    FolderKanban,
    Globe,
    Hash,
    Layers,
    LineChart,
    Mail,
    MapPin,
    Phone,
    Receipt,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    User,
    Users,
} from 'lucide-react';

interface TaskEmployee {
    id: number;
    name: string;
    employee_code: string;
    avatar?: string;
}

interface ProjectTaskData {
    id: number;
    website_project_id: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string;
    due_date?: string;
    description?: string;
    assigned_employee?: TaskEmployee;
}

interface ProjectPaymentData {
    id: number;
    website_project_id: number;
    milestone_title: string;
    amount: number | string;
    payment_stage: 'advance' | 'partial' | 'full';
    status: 'pending' | 'paid';
    paid_at?: string;
    payment_method?: string;
    website_project?: {
        id: number;
        project_name: string;
    };
}

interface WebsiteProjectItem {
    id: number;
    project_name: string;
    total_budget: number | string;
    currency: string;
    start_date?: string;
    deadline?: string;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    notes?: string;
    payments?: ProjectPaymentData[];
    tasks?: ProjectTaskData[];
}

interface SeoRetainerItem {
    id: number;
    monthly_amount: number | string;
    currency: string;
    status: 'active' | 'paused' | 'cancelled';
    billing_cycle_day: number;
    start_date?: string;
}

interface ClientDetailItem {
    id: number;
    client_code: string;
    name: string;
    company_name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    city?: string;
    country?: string;
    currency: string;
    status: 'active' | 'inactive';
    notes?: string;
    created_at: string;
    website_projects?: WebsiteProjectItem[];
    seo_retainers?: SeoRetainerItem[];
    project_payments?: ProjectPaymentData[];
}

interface ClientPortalOverviewProps {
    client: ClientDetailItem;
}

export default function ClientPortalOverview({ client }: ClientPortalOverviewProps) {
    const page = usePage();
    const authUser = (page.props.auth as any)?.user;
    const isAdmin = authUser?.type === 'admin';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: `${client.name} Overview`, href: '/client-portal/overview' },
    ];

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return (num || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: client.currency || 'USD',
            maximumFractionDigits: 0,
        });
    };

    // Calculate Financial & Metrics Summary
    const activeProjects = client.website_projects?.filter((p) => p.status === 'in_progress') || [];
    const completedProjects = client.website_projects?.filter((p) => p.status === 'completed') || [];
    const activeSeoRetainers = client.seo_retainers?.filter((r) => r.status === 'active') || [];

    const totalProjectBudget = client.website_projects?.reduce((acc, p) => acc + (parseFloat(p.total_budget as string) || 0), 0) || 0;

    let totalPaid = 0;
    let allPayments: ProjectPaymentData[] = [];
    let allTasks: ProjectTaskData[] = [];

    client.website_projects?.forEach((p) => {
        if (p.payments) {
            allPayments = [...allPayments, ...p.payments];
            p.payments.forEach((pay) => {
                if (pay.status === 'paid') {
                    totalPaid += parseFloat(pay.amount as string) || 0;
                }
            });
        }
        if (p.tasks) {
            allTasks = [...allTasks, ...p.tasks];
        }
    });

    const pendingBalance = Math.max(0, totalProjectBudget - totalPaid);
    const paymentProgress = totalProjectBudget > 0 ? Math.min(100, Math.round((totalPaid / totalProjectBudget) * 100)) : 0;
    const completedTasksCount = allTasks.filter((t) => t.status === 'completed').length;

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="overview">
            <Head title={`${client.name} | Overview & Portal Dashboard`} />

            <div className="p-6 w-full mx-auto space-y-8">
                {/* 1. State-of-the-Art Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 size-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 size-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start md:items-center gap-4 md:gap-6">
                            <div className="relative size-16 md:size-20 rounded-2xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-black text-2xl md:text-3xl flex items-center justify-center shadow-xl shadow-blue-500/25 shrink-0 border-2 border-white/20">
                                {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">{client.name}</h1>
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700">
                                        {client.client_code}
                                    </span>
                                    <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${client.status === 'active'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        }`}>
                                        {client.status} Account
                                    </span>
                                </div>
                                <p className="text-slate-300 text-xs md:text-sm font-medium flex items-center gap-2">
                                    <Building2 className="size-4 text-blue-400 shrink-0" />
                                    <span>{client.company_name || client.name}</span>
                                    {client.city && (
                                        <>
                                            <span className="text-slate-500">•</span>
                                            <span className="flex items-center gap-1 text-slate-400">
                                                <MapPin className="size-3.5" />
                                                {[client.city, client.country].filter(Boolean).join(', ')}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Top Banner Quick Actions */}
                        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto pt-2 lg:pt-0 border-t border-white/10 lg:border-0 w-full lg:w-auto">
                            {isAdmin ? (
                                <>
                                    <Link
                                        href={`/clients/edit/${client.id}`}
                                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/15 backdrop-blur-md"
                                    >
                                        <Edit3 className="size-4 text-blue-300" />
                                        <span>Edit Client</span>
                                    </Link>
                                    <Link
                                        href="/clients"
                                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
                                    >
                                        <span>Back to Directory</span>
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href="/client-portal/profile"
                                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/15 backdrop-blur-md"
                                >
                                    <User className="size-4 text-blue-300" />
                                    <span>Manage Profile</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Key KPI Metric Cards Grid (4 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Contract Budget Value */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Contract Value</span>
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <DollarSign className="size-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">
                                {formatCurrency(totalProjectBudget)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1">
                                <FolderKanban className="size-3.5 text-blue-500" />
                                <span>{client.website_projects?.length || 0} projects total</span>
                            </div>
                        </div>
                    </div>

                    {/* Paid Receipts */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Cleared Receipts</span>
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <BadgeDollarSign className="size-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(totalPaid)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{paymentProgress}%</span> of total budget cleared
                            </div>
                        </div>
                    </div>

                    {/* Pending Balance */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pending Balance</span>
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <Receipt className="size-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                {formatCurrency(pendingBalance)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                Milestone payments due
                            </div>
                        </div>
                    </div>

                    {/* Active Services */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Subscriptions</span>
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                <LineChart className="size-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">
                                {activeProjects.length + activeSeoRetainers.length} Active
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                {activeProjects.length} Projects • {activeSeoRetainers.length} SEO Retainers
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Main Dashboard Layout (2 Columns: Left 2/3, Right 1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Website Projects & Task Deliverables */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Website Projects Showcase */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                                        <Globe className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Website Projects</h2>
                                        <p className="text-xs text-slate-400 font-medium">Real-time status & development milestones</p>
                                    </div>
                                </div>
                                <Link
                                    href="/client-portal/projects"
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <span>View Projects</span>
                                    <ArrowUpRight className="size-3.5" />
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {client.website_projects && client.website_projects.length > 0 ? (
                                    client.website_projects.map((project) => (
                                        <div key={project.id} className="p-6 space-y-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            {project.project_name}
                                                        </h3>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-400 font-medium">
                                                        <span>Budget: <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(project.total_budget)}</strong></span>
                                                        {project.start_date && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="size-3.5" />
                                                                Started: {project.start_date}
                                                            </span>
                                                        )}
                                                        {project.deadline && (
                                                            <span className="flex items-center gap-1 text-slate-500 font-bold">
                                                                <Clock className="size-3.5 text-amber-500" />
                                                                Deadline: {project.deadline}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto shrink-0 ${project.status === 'in_progress'
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                    : project.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                    }`}>
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Progress Bar Component */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    <span>Completion Status</span>
                                                    <span className="text-blue-600 dark:text-blue-400">{project.progress_percentage}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 h-full rounded-full transition-all duration-500 shadow-xs"
                                                        style={{ width: `${project.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 italic text-sm">
                                        No website development projects recorded for this account.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Deliverable Tasks Tracker */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                                        <CheckSquare className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Project Tasks & Deliverables</h2>
                                        <p className="text-xs text-slate-400 font-medium">Sprint progress & milestone tasks</p>
                                    </div>
                                </div>
                                <Link
                                    href="/client-portal/tasks"
                                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                >
                                    <span>View Tasks ({allTasks.length})</span>
                                    <ArrowUpRight className="size-3.5" />
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {allTasks.length > 0 ? (
                                    allTasks.slice(0, 5).map((task) => (
                                        <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2 rounded-xl shrink-0 ${task.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                                                    }`}>
                                                    <CheckCircle2 className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {task.task_title}
                                                    </h4>
                                                    {task.assigned_employee && (
                                                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                                                            Assigned: {task.assigned_employee.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${task.priority === 'urgent' || task.priority === 'high'
                                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${task.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                    }`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 italic text-sm">
                                        No active tasks linked to current projects.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Account Profile & SEO Retainers */}
                    <div className="space-y-8">
                        {/* Comprehensive Account Information Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-2xs">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                    <Building2 className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Account Profile</h2>
                                    <p className="text-xs text-slate-400 font-medium">Contact & Account Details</p>
                                </div>
                            </div>

                            <div className="space-y-4 text-xs font-medium">
                                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <Hash className="size-3.5 text-slate-400" />
                                        Client Code
                                    </span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                        {client.client_code}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <User className="size-3.5 text-slate-400" />
                                        Primary Contact
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {client.contact_person || client.name}
                                    </span>
                                </div>

                                {client.email && (
                                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                        <span className="text-slate-400 flex items-center gap-2">
                                            <Mail className="size-3.5 text-slate-400" />
                                            Email Address
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                                            {client.email}
                                        </span>
                                    </div>
                                )}

                                {(client.phone || client.mobile) && (
                                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                        <span className="text-slate-400 flex items-center gap-2">
                                            <Phone className="size-3.5 text-slate-400" />
                                            Phone Number
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {client.phone || client.mobile}
                                        </span>
                                    </div>
                                )}

                                {(client.city || client.country) && (
                                    <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                        <span className="text-slate-400 flex items-center gap-2">
                                            <MapPin className="size-3.5 text-slate-400" />
                                            Location
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {[client.city, client.country].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <CreditCard className="size-3.5 text-slate-400" />
                                        Default Currency
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white uppercase font-mono">
                                        {client.currency}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Active SEO Retainers Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                                        <LineChart className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-slate-900 dark:text-white text-base">SEO Retainers</h2>
                                        <p className="text-xs text-slate-400 font-medium">Monthly SEO Subscriptions</p>
                                    </div>
                                </div>
                                <Link
                                    href="/client-portal/seo"
                                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    View
                                </Link>
                            </div>

                            {client.seo_retainers && client.seo_retainers.length > 0 ? (
                                client.seo_retainers.map((retainer) => (
                                    <div key={retainer.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">Monthly Package</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${retainer.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                }`}>
                                                {retainer.status}
                                            </span>
                                        </div>
                                        <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                                            {formatCurrency(retainer.monthly_amount)} <span className="text-xs text-slate-400 font-normal">/ month</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium">
                                            Billing cycle day: {retainer.billing_cycle_day} of every month
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-slate-400 italic text-xs">
                                    No active SEO retainers.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ClientPortalLayout>
    );
}
