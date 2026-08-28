import Pagination, { type PaginatedData } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    Filter,
    FolderKanban,
    Globe,
    LayoutGrid,
    ListTodo,
    Loader2,
    RotateCcw,
    Search,
    Sparkles,
    User,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface AssignedTaskProject {
    id: number;
    project_name: string;
    client?: {
        id: number;
        name: string;
        company_name?: string;
        client_code: string;
        currency: string;
    };
    category?: {
        id: number;
        name: string;
    };
}

export interface MyProjectTaskItem {
    id: number;
    website_project_id: number;
    assigned_employee_id: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string | null;
    due_date?: string | null;
    description?: string | null;
    completed_at?: string | null;
    created_at: string;
    website_project?: AssignedTaskProject;
    assigned_employee?: {
        id: number;
        name: string;
        employee_code: string;
        avatar?: string | null;
    };
}

interface MyTasksProps {
    tasks: PaginatedData<MyProjectTaskItem>;
    stats: {
        total: number;
        todo: number;
        in_progress: number;
        in_review: number;
        completed: number;
        urgent: number;
    };
    projects: { id: number; project_name: string }[];
    employee?: {
        id: number;
        name: string;
        employee_code: string;
    } | null;
    filters: {
        search?: string;
        status?: string;
        priority?: string;
        project_id?: string;
    };
}

export default function MyTasksIndex({ tasks, stats, projects = [], employee, filters }: MyTasksProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'My Assigned Tasks', href: '/my-tasks' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [selectedPriority, setSelectedPriority] = useState(filters?.priority || '');
    const [selectedProject, setSelectedProject] = useState(filters?.project_id || '');
    const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/my-tasks',
                {
                    search: searchQuery,
                    status: selectedStatus,
                    priority: selectedPriority,
                    project_id: selectedProject,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatus, selectedPriority, selectedProject]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('');
        setSelectedPriority('');
        setSelectedProject('');
        router.get('/my-tasks', {}, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = Boolean(searchQuery || selectedStatus || selectedPriority || selectedProject);

    const handleStatusChange = (task: MyProjectTaskItem, newStatus: string) => {
        if (task.status === newStatus || updatingTaskId === task.id) return;

        setUpdatingTaskId(task.id);
        router.post(
            `/my-tasks/${task.id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onFinish: () => {
                    setUpdatingTaskId(null);
                },
            }
        );
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 0 && month < 12) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${day < 10 ? `0${day}` : `${day}`} ${months[month]} ${year}`;
            }
        }
        return cleanDate;
    };

    const getDueDateStatus = (dueDate?: string | null, status?: string) => {
        if (!dueDate) return { label: 'No Due Date', isOverdue: false, isUrgent: false };
        if (status === 'completed') return { label: formatDate(dueDate), isOverdue: false, isUrgent: false };

        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: `Overdue (${Math.abs(diffDays)}d ago)`,
                isOverdue: true,
                isUrgent: true,
            };
        }
        if (diffDays === 0) {
            return {
                label: 'Due Today',
                isOverdue: false,
                isUrgent: true,
            };
        }
        if (diffDays === 1) {
            return {
                label: 'Due Tomorrow',
                isOverdue: false,
                isUrgent: true,
            };
        }
        return {
            label: formatDate(dueDate),
            isOverdue: false,
            isUrgent: false,
        };
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 inline-flex items-center gap-1 shadow-2xs">
                        <AlertCircle className="size-3" />
                        Urgent
                    </span>
                );
            case 'high':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1 shadow-2xs">
                        <AlertTriangle className="size-3" />
                        High
                    </span>
                );
            case 'medium':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1 shadow-2xs">
                        Medium
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1 shadow-2xs">
                        Low
                    </span>
                );
        }
    };

    const getStatusOptionClass = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800';
            case 'in_review':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Assigned Tasks | Employee Workspace" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] p-6 sm:p-8 text-white shadow-xl shadow-blue-600/15">
                    <div className="absolute right-0 top-0 -mt-10 -mr-10 size-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 -mb-10 size-48 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-100">
                                <Sparkles className="size-3.5 text-amber-300" />
                                <span>Employee Workspace</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                My Assigned Tasks
                            </h1>
                            <p className="text-xs sm:text-sm text-blue-100/90 font-medium max-w-xl">
                                Track all deliverables, sprints, and project milestones assigned to you. Click on any task to jump straight to the project workspace.
                            </p>
                        </div>

                        {employee && (
                            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3 shrink-0">
                                <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shadow-xs">
                                    <User className="size-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-white">{employee.name}</div>
                                    <div className="text-[11px] font-mono text-blue-200">{employee.employee_code}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 1. High-Impact KPI Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {/* Total Assigned */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Assigned</span>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <ListTodo className="size-3 text-blue-500" /> All Milestones
                        </div>
                    </div>

                    {/* To Do */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">To Do</span>
                        <div className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">{stats.todo}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="size-3 text-slate-400" /> Pending Start
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">In Progress</span>
                        <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{stats.in_progress}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Zap className="size-3 text-blue-500" /> Active Working
                        </div>
                    </div>

                    {/* In Review */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">In Review</span>
                        <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">{stats.in_review}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-purple-500" /> QA / Signoff
                        </div>
                    </div>

                    {/* Completed */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-600" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Completed</span>
                        <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{stats.completed}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-500" /> Done & Shipped
                        </div>
                    </div>

                    {/* Urgent Pending */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Urgent</span>
                        <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{stats.urgent}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <AlertCircle className="size-3 text-rose-500" /> High Priority
                        </div>
                    </div>
                </div>

                {/* 2. Filter & Search Controls Bar */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by task title, description, or project name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Project Filter */}
                            <div className="min-w-[150px]">
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    aria-label="Filter by Project"
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                                >
                                    <option value="">All Projects</option>
                                    {projects.map((proj) => (
                                        <option key={proj.id} value={proj.id}>
                                            {proj.project_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div className="min-w-[130px]">
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    aria-label="Filter by Status"
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="in_review">In Review</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Priority Filter */}
                            <div className="min-w-[130px]">
                                <select
                                    value={selectedPriority}
                                    onChange={(e) => setSelectedPriority(e.target.value)}
                                    aria-label="Filter by Priority"
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="h-10 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Tasks Listing Cards / Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <ListTodo className="size-4 text-blue-600 dark:text-blue-400" />
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                Assigned Tasks ({tasks.total || 0})
                            </h3>
                        </div>

                        <span className="text-[11px] text-slate-400 font-medium">
                            Showing {tasks.data.length} of {tasks.total} tasks
                        </span>
                    </div>

                    <div className="w-full overflow-x-auto scrollbar-thin">
                        <table className="w-full min-w-[850px] text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-4">Task Deliverable</th>
                                    <th className="py-3.5 px-4">Related Project & Client</th>
                                    <th className="py-3.5 px-4">Priority</th>
                                    <th className="py-3.5 px-4">Status & Action</th>
                                    <th className="py-3.5 px-4">Due Date</th>
                                    <th className="py-3.5 px-4 text-right">Go To Project</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {tasks.data.length > 0 ? (
                                    tasks.data.map((task) => {
                                        const dueInfo = getDueDateStatus(task.due_date, task.status);
                                        const isUpdating = updatingTaskId === task.id;

                                        return (
                                            <tr
                                                key={task.id}
                                                className={`hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-colors ${task.status === 'completed' ? 'opacity-75' : ''
                                                    }`}
                                            >
                                                {/* Task Title & Description */}
                                                <td className="py-4 px-4 align-top max-w-[280px]">
                                                    <div className="space-y-1">
                                                        <span className="font-black text-slate-900 dark:text-white text-xs block leading-snug">
                                                            {task.task_title}
                                                        </span>
                                                        {task.description && (
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Related Project & Client */}
                                                <td className="py-4 px-4 align-top">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <FolderKanban className="size-3.5 text-blue-500 shrink-0" />
                                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                                {task.website_project?.project_name || 'Project'}
                                                            </span>
                                                        </div>
                                                        {task.website_project?.client && (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                                                <Globe className="size-3 text-cyan-500 shrink-0" />
                                                                <span>
                                                                    {task.website_project.client.company_name || task.website_project.client.name}
                                                                </span>
                                                                <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                                    {task.website_project.client.client_code}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Priority Badge */}
                                                <td className="py-4 px-4 align-top whitespace-nowrap">
                                                    {getPriorityBadge(task.priority)}
                                                </td>

                                                {/* Status Selector */}
                                                <td className="py-4 px-4 align-top whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-2">
                                                        <div className="relative">
                                                            <select
                                                                disabled={isUpdating}
                                                                value={task.status}
                                                                onChange={(e) => handleStatusChange(task, e.target.value)}
                                                                aria-label={`Update status for ${task.task_title}`}
                                                                className={`h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider border focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer ${getStatusOptionClass(
                                                                    task.status
                                                                )} ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                                                            >
                                                                <option value="todo">To Do</option>
                                                                <option value="in_progress">In Progress</option>
                                                                <option value="in_review">In Review</option>
                                                                <option value="completed">Completed</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                        </div>
                                                        {isUpdating && <Loader2 className="size-3.5 text-blue-600 animate-spin" />}
                                                    </div>
                                                </td>

                                                {/* Due Date */}
                                                <td className="py-4 px-4 align-top whitespace-nowrap">
                                                    <div className="space-y-0.5">
                                                        <span
                                                            className={`inline-flex items-center gap-1 text-[11px] font-bold ${dueInfo.isOverdue
                                                                ? 'text-rose-600 dark:text-rose-400'
                                                                : dueInfo.isUrgent
                                                                    ? 'text-amber-600 dark:text-amber-400'
                                                                    : 'text-slate-600 dark:text-slate-300'
                                                                }`}
                                                        >
                                                            <Calendar className="size-3 shrink-0" />
                                                            <span>{dueInfo.label}</span>
                                                        </span>
                                                        {task.start_date && (
                                                            <div className="text-[10px] text-slate-400">
                                                                Started: {formatDate(task.start_date)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Action Link to Project */}
                                                <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                                                    <Link
                                                        href={`/client-portal/projects/${task.website_project_id}`}
                                                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white dark:hover:text-white hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-1.5 text-xs font-bold"
                                                        title="Open Project Workspace"
                                                    >
                                                        <span>View Project</span>
                                                        <ArrowRight className="size-3.5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center">
                                            <div className="max-w-sm mx-auto space-y-3">
                                                <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-xs">
                                                    <CheckCircle2 className="size-6" />
                                                </div>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                                    {hasActiveFilters ? 'No Matching Tasks Found' : 'No Tasks Assigned'}
                                                </h4>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {hasActiveFilters
                                                        ? 'Try adjusting your search criteria or resetting filters.'
                                                        : 'You currently have no project deliverables or tasks assigned to you.'}
                                                </p>
                                                {hasActiveFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={handleClearFilters}
                                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
                                                    >
                                                        Clear Filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. Pagination */}
                <Pagination meta={tasks} />
            </div>
        </AppLayout>
    );
}
