import Pagination, { type PaginatedData } from '@/components/pagination';
import TaskConversationModal, { type ConversationTaskInfo } from '@/components/task-conversation-modal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    Filter,
    FolderKanban,
    Globe,
    Layers,
    LayoutGrid,
    ListTodo,
    Loader2,
    MessageSquare,
    RotateCcw,
    Search,
    Server,
    Sparkles,
    User,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface AssignedTaskSource {
    id: number;
    project_name?: string;
    service_name?: string;
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

export interface MyTaskItem {
    id: number;
    source_type?: 'project' | 'service';
    website_project_id?: number;
    client_service_id?: number;
    assigned_employee_id?: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string | null;
    due_date?: string | null;
    description?: string | null;
    completed_at?: string | null;
    created_at: string;
    messages_count?: number;
    website_project?: AssignedTaskSource | null;
    service?: AssignedTaskSource | null;
    assigned_employee?: {
        id: number;
        name: string;
        employee_code: string;
        avatar?: string | null;
    };
}

interface MyTasksProps {
    tasks: PaginatedData<MyTaskItem>;
    stats: {
        total: number;
        todo: number;
        in_progress: number;
        in_review: number;
        completed: number;
        urgent: number;
    };
    projects: { id: number; project_name: string }[];
    services?: { id: number; service_name: string }[];
    employee?: {
        id: number;
        name: string;
        employee_code: string;
    } | null;
    filters: {
        search?: string;
        status?: string;
        priority?: string;
        source_type?: string;
        project_id?: string;
        service_id?: string;
    };
}

export default function MyTasksIndex({
    tasks,
    stats,
    projects = [],
    services = [],
    employee,
    filters,
}: MyTasksProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'My Assigned Tasks', href: '/my-tasks' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [selectedPriority, setSelectedPriority] = useState(filters?.priority || '');
    const [selectedSourceType, setSelectedSourceType] = useState(filters?.source_type || '');
    const [selectedProject, setSelectedProject] = useState(filters?.project_id || '');
    const [selectedService, setSelectedService] = useState(filters?.service_id || '');
    const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

    // Task Conversation State
    const [conversationTask, setConversationTask] = useState<ConversationTaskInfo | null>(null);
    const [isConversationOpen, setIsConversationOpen] = useState(false);

    const openTaskConversation = (t: MyTaskItem) => {
        const isService = t.source_type === 'service';
        const sourceTitle = isService
            ? t.service?.service_name || 'Client Service'
            : t.website_project?.project_name || 'Website Project';
        const sourceId = isService ? (t.client_service_id || t.service?.id) : (t.website_project_id || t.website_project?.id);
        const sourceClient = isService ? t.service?.client : t.website_project?.client;

        setConversationTask({
            id: t.id,
            task_title: t.task_title,
            priority: t.priority,
            status: t.status,
            start_date: t.start_date,
            due_date: t.due_date,
            completed_at: t.completed_at,
            description: t.description,
            source_type: t.source_type || 'project',
            source_id: sourceId,
            source_title: sourceTitle,
            client: sourceClient ? {
                id: sourceClient.id,
                name: sourceClient.name,
                company_name: sourceClient.company_name,
                client_code: sourceClient.client_code,
            } : null,
            assigned_employee: t.assigned_employee,
        });
        setIsConversationOpen(true);
    };

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
                    source_type: selectedSourceType,
                    project_id: selectedProject,
                    service_id: selectedService,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatus, selectedPriority, selectedSourceType, selectedProject, selectedService]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('');
        setSelectedPriority('');
        setSelectedSourceType('');
        setSelectedProject('');
        setSelectedService('');
        router.get('/my-tasks', {}, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = Boolean(
        searchQuery || selectedStatus || selectedPriority || selectedSourceType || selectedProject || selectedService
    );

    const handleStatusChange = (task: MyTaskItem, newStatus: string) => {
        if (task.status === newStatus || updatingTaskId === task.id) return;

        setUpdatingTaskId(task.id);
        const endpoint =
            task.source_type === 'service' || task.client_service_id
                ? `/my-tasks/service-task/${task.id}/status`
                : `/my-tasks/${task.id}/status`;

        router.post(
            endpoint,
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                        <AlertTriangle className="size-3" />
                        High
                    </span>
                );
            case 'medium':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1">
                        Medium
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Low
                    </span>
                );
        }
    };

    const getStatusOptionClass = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'in_review':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'cancelled':
                return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            default:
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Assigned Tasks | Sapta CRM" />

            <div className="p-3 sm:p-6 mx-auto space-y-6">
                {/* Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003796] via-[#0052D4] to-[#1d4ed8] p-6 sm:p-8 text-white shadow-xl shadow-blue-900/20">
                    <div className="absolute -right-10 -bottom-10 size-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                    <div className="absolute right-20 top-4 size-32 rounded-full bg-cyan-400/20 blur-xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider text-cyan-200 shadow-2xs">
                                <Sparkles className="size-3.5" />
                                Employee Task Workspace
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
                                My Assigned Deliverables
                            </h1>
                            <p className="text-sm text-blue-100/90 max-w-xl font-medium leading-relaxed">
                                Manage and track all your active task deliverables across website projects and client recurring services in real-time.
                            </p>
                        </div>

                        {employee && (
                            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 self-start md:self-auto shrink-0 shadow-lg">
                                <div className="size-11 rounded-xl bg-gradient-to-tr from-white/30 to-white/10 border border-white/30 flex items-center justify-center font-black text-white text-base">
                                    {employee.name.charAt(0)}
                                </div>
                                <div className="text-left">
                                    <div className="font-extrabold text-sm text-white">{employee.name}</div>
                                    <div className="text-[11px] font-mono font-medium text-cyan-200">{employee.employee_code}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 1. KPI Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Total */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Tasks</span>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <ListTodo className="size-3 text-blue-500" /> All Deliverables
                        </div>
                    </div>

                    {/* To Do */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">To Do</span>
                        <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{stats.todo}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="size-3 text-amber-500" /> Pending Start
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
                                placeholder="Search by task title, description, project, or service..."
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
                            {/* Type Filter */}
                            <div className="min-w-[130px]">
                                <select
                                    value={selectedSourceType}
                                    onChange={(e) => {
                                        setSelectedSourceType(e.target.value);
                                        if (e.target.value === 'project') setSelectedService('');
                                        if (e.target.value === 'service') setSelectedProject('');
                                    }}
                                    aria-label="Filter by Source"
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                                >
                                    <option value="">All Sources</option>
                                    <option value="project">Projects Only</option>
                                    <option value="service">Services Only</option>
                                </select>
                            </div>

                            {/* Project Filter */}
                            {selectedSourceType !== 'service' && projects.length > 0 && (
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
                            )}

                            {/* Service Filter */}
                            {selectedSourceType !== 'project' && services.length > 0 && (
                                <div className="min-w-[150px]">
                                    <select
                                        value={selectedService}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                        aria-label="Filter by Service"
                                        className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                                    >
                                        <option value="">All Services</option>
                                        {services.map((srv) => (
                                            <option key={srv.id} value={srv.id}>
                                                {srv.service_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status Filter */}
                            <div className="min-w-[120px]">
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
                            <div className="min-w-[120px]">
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
                                    <th className="py-3.5 px-4">Source & Client</th>
                                    <th className="py-3.5 px-4">Priority</th>
                                    <th className="py-3.5 px-4">Status & Action</th>
                                    <th className="py-3.5 px-4">Due Date</th>
                                    <th className="py-3.5 px-4 text-right">Workspace</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {tasks.data.length > 0 ? (
                                    tasks.data.map((task) => {
                                        const dueInfo = getDueDateStatus(task.due_date, task.status);
                                        const isUpdating = updatingTaskId === task.id;
                                        const isService = task.source_type === 'service' || Boolean(task.client_service_id);
                                        const sourceTitle = isService
                                            ? task.service?.service_name || 'Client Service'
                                            : task.website_project?.project_name || 'Website Project';
                                        const sourceClient = isService
                                            ? task.service?.client
                                            : task.website_project?.client;
                                        const targetUrl = isService
                                            ? `/client-portal/services/${task.client_service_id || task.service?.id}?tab=tasks`
                                            : `/client-portal/projects/${task.website_project_id || task.website_project?.id}?tab=tasks`;

                                        return (
                                            <tr
                                                key={`${task.source_type || 'task'}-${task.id}`}
                                                className={`hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-colors ${task.status === 'completed' ? 'opacity-75' : ''
                                                    }`}
                                            >
                                                {/* Task Title */}
                                                <td className="py-4 px-4 align-top max-w-[280px]">
                                                    <Link
                                                        href={`/tasks/detail/${task.source_type || 'project'}/${task.id}`}
                                                        className="text-left font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs block leading-snug"
                                                        title="View Task Details & Discussion Page"
                                                    >
                                                        {task.task_title}
                                                    </Link>
                                                </td>

                                                {/* Source & Client */}
                                                <td className="py-4 px-4 align-top">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            {isService ? (
                                                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50">
                                                                    Service
                                                                </span>
                                                            ) : (
                                                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50">
                                                                    Project
                                                                </span>
                                                            )}
                                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                                {sourceTitle}
                                                            </span>
                                                        </div>
                                                        {sourceClient && (
                                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                                                <Globe className="size-3 text-cyan-500 shrink-0" />
                                                                <span>
                                                                    {sourceClient.company_name || sourceClient.name}
                                                                </span>
                                                                <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                                    {sourceClient.client_code}
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

                                                {/* Action Link to Workspace & Conversation */}
                                                <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-2">
                                                        {/* CONVERSATION / QUERY BUTTON */}
                                                        <Link
                                                            href={`/tasks/detail/${task.source_type || 'project'}/${task.id}`}
                                                            className="h-8 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border border-blue-200/50 hover:border-transparent"
                                                            title="Open Task Details & Discussion Page"
                                                        >
                                                            <MessageSquare className="size-3.5" />
                                                            <span>{task.messages_count || 0}</span>
                                                        </Link>

                                                        <Link
                                                            href={targetUrl}
                                                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white dark:hover:text-white hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-1.5 text-xs font-bold"
                                                            title={isService ? 'Open Service Workspace' : 'Open Project Workspace'}
                                                        >
                                                            <span>{isService ? 'View Service' : 'View Project'}</span>
                                                            <ArrowRight className="size-3.5" />
                                                        </Link>
                                                    </div>
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
                                                        : 'You currently have no project or service deliverables assigned to you.'}
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

                {/* TASK CONVERSATION & QUERY MODAL */}
                <TaskConversationModal
                    isOpen={isConversationOpen}
                    onClose={() => setIsConversationOpen(false)}
                    task={conversationTask}
                    currentUserId={user?.id}
                    onMessageCountChange={(taskId, newCount) => {
                        if (tasks?.data) {
                            const target = tasks.data.find((t) => t.id === taskId);
                            if (target) {
                                target.messages_count = newCount;
                            }
                        }
                    }}
                />
            </div>
        </AppLayout>
    );
}
