import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    BadgeCheck,
    BadgeDollarSign,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    DollarSign,
    Edit2,
    FileText,
    FolderKanban,
    Globe,
    Layers,
    ListTodo,
    Receipt,
    ShieldCheck,
    Sparkles,
    User,
} from 'lucide-react';

interface TaskEmployee {
    id: number;
    name: string;
    employee_code: string;
    avatar?: string;
}

interface ProjectTaskItem {
    id: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    due_date?: string;
    description?: string;
    assigned_employee?: TaskEmployee;
}

interface ProjectPaymentItem {
    id: number;
    milestone_title: string;
    amount: number | string;
    payment_stage: 'advance' | 'partial' | 'full';
    status: 'pending' | 'paid';
    paid_at?: string;
    payment_method?: string;
}

interface WebsiteProjectDetail {
    id: number;
    project_name: string;
    total_budget: number | string;
    currency: string;
    exchange_rate?: number | string;
    total_budget_pkr?: number | string;
    start_date?: string;
    deadline?: string;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    notes?: string;
    created_at: string;
    payments?: ProjectPaymentItem[];
    tasks?: ProjectTaskItem[];
}

interface ClientPortalProjectsShowProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    project: WebsiteProjectDetail;
}

export default function ClientPortalProjectsShow({
    client,
    project,
}: ClientPortalProjectsShowProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Website Projects', href: '/client-portal/projects' },
        { title: project.project_name, href: `/client-portal/projects/${project.id}` },
    ];

    const formatDateOnly = (dateStr?: string | null) => {
        if (!dateStr) return 'Flexible';
        const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 0 && month < 12) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const formattedDay = day < 10 ? `0${day}` : `${day}`;
                return `${formattedDay} ${months[month]} ${year}`;
            }
        }
        return cleanDate;
    };

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return (num || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: project.currency || client.currency || 'USD',
            maximumFractionDigits: 0,
        });
    };

    // Calculate Financial & Milestone Totals
    const totalBudget = typeof project.total_budget === 'string' ? parseFloat(project.total_budget) : project.total_budget || 0;
    const paidPayments = project.payments?.filter((p) => p.status === 'paid') || [];
    const totalPaid = paidPayments.reduce((acc, p) => acc + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0);
    const pendingBalance = Math.max(0, totalBudget - totalPaid);

    const completedTasksCount = project.tasks?.filter((t) => t.status === 'completed').length || 0;
    const totalTasksCount = project.tasks?.length || 0;

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="projects">
            <Head title={`${project.project_name} | ${client.name}`} />

            <div className="p-6 w-full space-y-6">
                {/* 1. Header Hero Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="flex items-start md:items-center gap-4">
                        <div className="size-12 rounded-xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 border border-white/20">
                            <Globe className="size-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {project.project_name}
                                </h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${project.status === 'in_progress'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60'
                                        : project.status === 'completed'
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                    }`}>
                                    {project.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Calendar className="size-3.5 text-slate-400" />
                                    Started: <strong>{formatDateOnly(project.start_date)}</strong>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                                    <Clock className="size-3.5 text-amber-500" />
                                    Target Deadline: <strong>{formatDateOnly(project.deadline)}</strong>
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start md:self-auto">
                        {hasPermission(user, 'edit-client-portal-projects') && (
                            <Link
                                href={`/client-portal/projects/${project.id}/edit`}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
                            >
                                <Edit2 className="size-4" />
                                <span>Edit Project</span>
                            </Link>
                        )}
                        <Link
                            href="/client-portal/projects"
                            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Back to Projects</span>
                        </Link>
                    </div>
                </div>

                {/* 2. Top 4 KPI Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Contract Budget</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                                {formatCurrency(project.total_budget)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <DollarSign className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cleared Payments</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {formatCurrency(totalPaid)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <BadgeDollarSign className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Due Balance</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                {formatCurrency(pendingBalance)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Receipt className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tasks Completed</p>
                            <h3 className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                                {completedTasksCount} / {totalTasksCount}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <CheckSquare className="size-5" />
                        </div>
                    </div>
                </div>

                {/* 3. Development Progress Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-2">
                            <Layers className="size-4 text-blue-600" />
                            Development Completion Progress
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-black text-sm">{project.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                        <div
                            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${project.progress_percentage}%` }}
                        />
                    </div>
                </div>

                {/* 4. Main Two Column Grid (Scope + Deliverable Tasks | Financial Receipts + Specs) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3 width): Scope & Tasks */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Scope & Specifications Card */}
                        {project.notes && (
                            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <FileText className="size-4" />
                                    </div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                        Project Scope & Specifications
                                    </h3>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                    {project.notes}
                                </div>
                            </div>
                        )}

                        {/* Deliverable Tasks List */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                        <ListTodo className="size-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                            Project Tasks & Deliverables ({totalTasksCount})
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium">Sprint backlog & milestone task statuses</p>
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {project.tasks && project.tasks.length > 0 ? (
                                    project.tasks.map((task) => (
                                        <div key={task.id} className="py-4 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors rounded-xl px-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`p-1.5 rounded-lg shrink-0 ${task.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                                                        }`}>
                                                        <CheckCircle2 className="size-4" />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {task.task_title}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${task.priority === 'urgent' || task.priority === 'high'
                                                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                        }`}>
                                                        {task.priority}
                                                    </span>

                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${task.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                        }`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>

                                            {task.description && (
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-8 font-medium">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 pl-8 pt-1 text-[11px] text-slate-400 font-medium">
                                                {task.assigned_employee && (
                                                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                                                        <User className="size-3 text-slate-400" />
                                                        Assigned: {task.assigned_employee.name}
                                                    </span>
                                                )}
                                                {task.due_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="size-3 text-amber-500" />
                                                        Due: {formatDateOnly(task.due_date)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-slate-400 italic text-xs">
                                        No tasks assigned to this website project.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1/3 width): Milestone Receipts & Project Metadata */}
                    <div className="space-y-6">
                        {/* Milestone Payments & Financial Receipts */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                        <BadgeDollarSign className="size-4" />
                                    </div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                        Milestone Receipts ({project.payments?.length || 0})
                                    </h3>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {project.payments && project.payments.length > 0 ? (
                                    project.payments.map((pay) => (
                                        <div key={pay.id} className="py-3 flex items-center justify-between gap-3">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                    {pay.milestone_title}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 font-medium">
                                                    Amount: <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(pay.amount)}</strong>
                                                </p>
                                                {pay.paid_at && (
                                                    <span className="text-[10px] text-slate-400 font-medium block">
                                                        Paid on {formatDateOnly(pay.paid_at)}
                                                    </span>
                                                )}
                                            </div>

                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${pay.status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                }`}>
                                                {pay.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-6 text-center text-slate-400 italic text-xs">
                                        No milestone payment records found.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Project Attributes & System Details Card */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    <FolderKanban className="size-4" />
                                </div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                    Project Parameters
                                </h3>
                            </div>

                            <div className="space-y-3 text-xs font-medium">
                                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                    <span className="text-slate-400">Project Reference ID</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">#PROJ-{project.id}</span>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                    <span className="text-slate-400">Currency Code</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white uppercase">{project.currency}</span>
                                </div>

                                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                    <span className="text-slate-400">Creation Date</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{formatDateOnly(project.created_at)}</span>
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <span className="text-slate-400">Active Account</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{client.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ClientPortalLayout>
    );
}
