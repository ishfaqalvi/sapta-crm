import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Banknote,
    Briefcase,
    Building,
    Building2,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    ExternalLink,
    FolderKanban,
    Key,
    Layers,
    LineChart,
    ListTodo,
    Loader2,
    MessageSquare,
    Sparkles,
    Tag,
    User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Dashboard',
        href: '/dashboard',
    },
];

export interface EmployeeProfile {
    id: number;
    name: string;
    employee_code: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    joining_date?: string | null;
    allowed_paid_leaves?: number | null;
    department_name?: string;
    designation_name?: string;
    status?: string;
}

export interface EmployeeDashboardKPIs {
    total_tasks: number;
    todo_tasks: number;
    in_progress_tasks: number;
    in_review_tasks: number;
    completed_tasks: number;
    urgent_tasks: number;
    overdue_tasks: number;
    due_soon_tasks: number;
    completion_rate: number;
}

export interface EmployeeTaskItem {
    id: number;
    source_type: 'project' | 'service' | 'general';
    task_code?: string;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string | null;
    due_date?: string | null;
    is_overdue?: boolean;
    messages_count?: number;
    website_project?: {
        id: number;
        project_name: string;
        client?: {
            name: string;
            company_name?: string;
        } | null;
    } | null;
    service?: {
        id: number;
        service_name: string;
        client?: {
            name: string;
            company_name?: string;
        } | null;
    } | null;
    task_category?: {
        name: string;
    } | null;
    created_at: string;
}

export interface PermittedWorkspaceItem {
    id: string;
    title: string;
    description: string;
    url: string;
    icon: string;
    badge: string;
    badge_color: 'blue' | 'indigo' | 'purple' | 'amber' | 'slate' | 'emerald' | 'cyan' | 'rose';
}

export interface AssignedProjectItem {
    id: number;
    project_name: string;
    client_name: string;
    category_name: string;
    status: string;
    deadline?: string | null;
    progress_percentage: number;
    my_tasks_total: number;
    my_tasks_completed: number;
}

export interface RecentTaskMessageItem {
    id: number;
    task_id: number;
    task_type: string;
    task_title: string;
    user_name: string;
    user_avatar?: string | null;
    message: string;
    created_at: string;
}

interface EmployeeDashboardProps {
    employee: EmployeeProfile;
    kpis: EmployeeDashboardKPIs;
    urgentTasks: EmployeeTaskItem[];
    activeTasks: EmployeeTaskItem[];
    recentCompletedTasks: EmployeeTaskItem[];
    permittedWorkspace: PermittedWorkspaceItem[];
    assignedProjects: AssignedProjectItem[];
    recentTaskMessages: RecentTaskMessageItem[];
}

export default function EmployeeDashboard({
    employee,
    kpis,
    urgentTasks,
    activeTasks,
    recentCompletedTasks,
    permittedWorkspace,
    assignedProjects,
    recentTaskMessages,
}: EmployeeDashboardProps) {
    const [taskFilter, setTaskFilter] = useState<'active' | 'urgent' | 'completed'>('active');
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

    const getWorkspaceIcon = (iconName: string) => {
        switch (iconName) {
            case 'ListTodo':
                return ListTodo;
            case 'FolderKanban':
                return FolderKanban;
            case 'Layers':
                return Layers;
            case 'CheckSquare':
                return CheckSquare;
            case 'Key':
                return Key;
            case 'Banknote':
                return Banknote;
            case 'Building':
                return Building;
            case 'LineChart':
                return LineChart;
            default:
                return Briefcase;
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60';
            case 'high':
                return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60';
            case 'medium':
                return 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60';
            case 'low':
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200/80 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60';
            case 'in_review':
                return 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60';
            case 'todo':
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Completed';
            case 'in_review':
                return 'In Review';
            case 'in_progress':
                return 'In Progress';
            case 'todo':
            default:
                return 'To Do';
        }
    };

    const handleQuickStatusChange = (task: EmployeeTaskItem, newStatus: string) => {
        const key = `${task.source_type}-${task.id}`;
        setUpdatingTaskId(key);

        let url = `/my-tasks/${task.id}/status`;
        if (task.source_type === 'service') {
            url = `/my-tasks/service-task/${task.id}/status`;
        } else if (task.source_type === 'general') {
            url = `/my-tasks/general-task/${task.id}/status`;
        }

        router.post(
            url,
            { status: newStatus },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingTaskId(null),
            }
        );
    };

    const displayedTasks =
        taskFilter === 'urgent'
            ? urgentTasks
            : taskFilter === 'completed'
            ? recentCompletedTasks
            : activeTasks;

    const todayDateFormatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Employee Dashboard - ${employee.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 w-full max-w-[1600px] mx-auto space-y-2">
                {/* 1. Header & Welcome Identity Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#002b66] via-[#0041a8] to-[#1d4ed8] text-white p-6 sm:p-8 shadow-xl shadow-blue-900/10 border border-blue-500/20">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-32 -mb-16 w-60 h-60 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 sm:gap-5">
                            {employee.avatar ? (
                                <img
                                    src={employee.avatar}
                                    alt={employee.name}
                                    className="size-16 sm:size-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg bg-white/10 shrink-0"
                                />
                            ) : (
                                <div className="size-16 sm:size-20 rounded-2xl bg-white/15 backdrop-blur-md ring-4 ring-white/20 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shrink-0">
                                    {employee.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                                        {employee.employee_code}
                                    </span>
                                    {employee.designation_name && employee.designation_name !== 'N/A' && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-400/20 text-blue-100 border border-blue-300/30">
                                            {employee.designation_name}
                                        </span>
                                    )}
                                    {employee.department_name && employee.department_name !== 'N/A' && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white/90 border border-white/15">
                                            {employee.department_name}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    Welcome back, {employee.name}!
                                </h1>

                                <p className="text-xs sm:text-sm text-blue-100/90 font-medium flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-blue-300" />
                                    <span>{todayDateFormatted}</span>
                                    <span className="text-blue-300 mx-1">&bull;</span>
                                    <span className="text-emerald-300 font-semibold flex items-center gap-1">
                                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        Personal Workspace Active
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
                            <Link
                                href="/my-tasks"
                                className="h-11 px-5 rounded-2xl bg-white hover:bg-blue-50 text-[#003796] text-xs sm:text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2 group shrink-0"
                            >
                                <ListTodo className="size-4 text-[#003796] group-hover:scale-110 transition-transform" />
                                <span>Go to My Tasks</span>
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 2. Personal Task KPI Cards (5 Stat Cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {/* Total Assigned */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Assigned Tasks
                            </span>
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <ListTodo className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                {kpis.total_tasks}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 block">
                                Across all active scopes
                            </span>
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                In Progress
                            </span>
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <Clock className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                                {kpis.in_progress_tasks}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 block">
                                Currently being worked on
                            </span>
                        </div>
                    </div>

                    {/* Urgent / Priority */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Urgent Tasks
                            </span>
                            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                                {kpis.urgent_tasks}
                            </div>
                            <span className="text-[11px] font-semibold text-rose-500/90 dark:text-rose-400/90 mt-0.5 block">
                                High priority attention
                            </span>
                        </div>
                    </div>

                    {/* Due Soon / Overdue */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Overdue / Due Soon
                            </span>
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <AlertCircle className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                                {kpis.overdue_tasks + kpis.due_soon_tasks}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 block">
                                {kpis.overdue_tasks} overdue &bull; {kpis.due_soon_tasks} due in 3 days
                            </span>
                        </div>
                    </div>

                    {/* Completed & Rate */}
                    <div className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Completed
                            </span>
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                    {kpis.completed_tasks}
                                </span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    {kpis.completion_rate}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, kpis.completion_rate)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Permitted Menus & Features ("My Permitted Workspace") */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
                                <span>My Permitted Workspace & Features</span>
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Authorized tools, directories, and CRM modules tailored for your employee role
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {permittedWorkspace.map((item) => {
                            const IconComponent = getWorkspaceIcon(item.icon);
                            return (
                                <Link
                                    key={item.id}
                                    href={item.url}
                                    className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                                >
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-[#003796] group-hover:text-white transition-all shadow-2xs">
                                                <IconComponent className="size-5" />
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-700 dark:group-hover:bg-blue-950/80 dark:group-hover:text-blue-300 transition-colors">
                                                {item.badge}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                                        <span>Open Module</span>
                                        <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Assigned Tasks Hub (Interactive) & Side Feeds */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                    {/* Left 2 Columns: Assigned Tasks Hub */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                            {/* Filter Tabs Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        <ListTodo className="size-4 text-blue-600 dark:text-blue-400" />
                                        <span>My Assigned Tasks</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Tasks requiring your direct action and updates
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setTaskFilter('active')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                            taskFilter === 'active'
                                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Active ({activeTasks.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTaskFilter('urgent')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                            taskFilter === 'urgent'
                                                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Urgent ({urgentTasks.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTaskFilter('completed')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                            taskFilter === 'completed'
                                                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Completed ({recentCompletedTasks.length})
                                    </button>
                                </div>
                            </div>

                            {/* Task List Feed */}
                            {displayedTasks.length === 0 ? (
                                <div className="py-12 text-center space-y-3">
                                    <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                                        <CheckCircle2 className="size-6 text-emerald-500" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        No tasks found in this view
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                        You are all caught up! When tasks are assigned to you by administrators or team leads, they will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {displayedTasks.map((task) => {
                                        const updateKey = `${task.source_type}-${task.id}`;
                                        const isUpdating = updatingTaskId === updateKey;

                                        return (
                                            <div
                                                key={updateKey}
                                                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 rounded-xl px-2 transition-colors"
                                            >
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {/* Source Tag */}
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                            {task.source_type === 'project'
                                                                ? 'Project Task'
                                                                : task.source_type === 'service'
                                                                ? 'Service Task'
                                                                : 'General Task'}
                                                        </span>

                                                        {/* Priority Badge */}
                                                        <span
                                                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getPriorityBadgeClass(
                                                                task.priority
                                                            )}`}
                                                        >
                                                            {task.priority}
                                                        </span>

                                                        {/* Overdue Warning */}
                                                        {task.is_overdue && (
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                                                                Overdue
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Task Title */}
                                                    <Link
                                                        href={`/my-tasks/task/${task.source_type}/${task.id}/conversation?from=/employee/dashboard`}
                                                        className="text-sm font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                                                    >
                                                        {task.task_title}
                                                    </Link>

                                                    {/* Meta details */}
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                                        {task.website_project && (
                                                            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                                                <FolderKanban className="size-3 text-indigo-500" />
                                                                <span>{task.website_project.project_name}</span>
                                                            </span>
                                                        )}
                                                        {task.service && (
                                                            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                                                <Layers className="size-3 text-purple-500" />
                                                                <span>{task.service.service_name}</span>
                                                            </span>
                                                        )}
                                                        {task.due_date && (
                                                            <span className={`flex items-center gap-1 font-medium ${task.is_overdue ? 'text-rose-600 font-bold' : ''}`}>
                                                                <Clock className="size-3" />
                                                                <span>Due: {task.due_date}</span>
                                                            </span>
                                                        )}
                                                        {Number(task.messages_count || 0) > 0 && (
                                                            <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                                                                <MessageSquare className="size-3" />
                                                                <span>{task.messages_count} discussions</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Status Selector / Quick Update */}
                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                    <div className="relative inline-flex items-center">
                                                        <select
                                                            value={task.status}
                                                            disabled={isUpdating}
                                                            onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                                                            className={`text-[11px] font-bold rounded-xl px-3 py-1.5 border cursor-pointer transition-all outline-none focus:ring-2 ${getStatusBadgeClass(
                                                                task.status
                                                            )} disabled:opacity-50`}
                                                        >
                                                            <option value="todo">To Do</option>
                                                            <option value="in_progress">In Progress</option>
                                                            <option value="in_review">In Review</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                        {isUpdating && (
                                                            <div className="absolute right-2 pointer-events-none">
                                                                <Loader2 className="size-3 animate-spin text-slate-500" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Link
                                                        href={`/my-tasks/task/${task.source_type}/${task.id}/conversation?from=/employee/dashboard`}
                                                        className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all"
                                                        title="Open Task Discussion & Details"
                                                    >
                                                        <ExternalLink className="size-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                                <Link
                                    href="/my-tasks"
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                >
                                    <span>View All Assigned Tasks Directory</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right 1 Column: Assigned Projects & Recent Discussions */}
                    <div className="space-y-6">
                        {/* Assigned Projects Card */}
                        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FolderKanban className="size-4 text-indigo-500" />
                                    <span>My Active Projects</span>
                                </h3>
                                <span className="text-[11px] font-bold text-slate-400">
                                    {assignedProjects.length} Projects
                                </span>
                            </div>

                            {assignedProjects.length === 0 ? (
                                <p className="text-xs text-slate-400 py-4 text-center">
                                    No active development projects currently assigned.
                                </p>
                            ) : (
                                <div className="space-y-3.5">
                                    {assignedProjects.map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/projects/${p.id}`}
                                            className="block p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2 group"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                        {p.project_name}
                                                    </h4>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                                        {p.client_name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                                                    {p.my_tasks_completed}/{p.my_tasks_total} Tasks
                                                </span>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                                                    <span>Overall Progress</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                                        {p.progress_percentage}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-600 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, p.progress_percentage)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Task Discussions Stream */}
                        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <MessageSquare className="size-4 text-blue-500" />
                                    <span>Task Activity & Notes</span>
                                </h3>
                                <span className="text-[11px] font-bold text-slate-400">Recent</span>
                            </div>

                            {recentTaskMessages.length === 0 ? (
                                <p className="text-xs text-slate-400 py-4 text-center">
                                    No recent discussions on your assigned tasks.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {recentTaskMessages.map((m) => (
                                        <Link
                                            key={m.id}
                                            href={`/my-tasks/task/${m.task_type}/${m.task_id}/conversation?from=/employee/dashboard`}
                                            className="block p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 hover:border-blue-400/40 transition-all space-y-1 group"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                    {m.user_name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                    {m.created_at}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                &ldquo;{m.message}&rdquo;
                                            </p>
                                            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 block truncate pt-0.5">
                                                Re: {m.task_title}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
