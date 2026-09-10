import FilePreviewModal from '@/components/file-preview-modal';
import Pagination, { type PaginatedData } from '@/components/pagination';
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
    CheckSquare,
    Clock,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    FolderKanban,
    Globe,
    Layers,
    LayoutGrid,
    ListTodo,
    Loader2,
    MessageSquare,
    Paperclip,
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
    total_budget?: number | string | null;
    currency?: string | null;
    total_budget_pkr?: number | string | null;
    monthly_fee?: number | string | null;
    monthly_fee_pkr?: number | string | null;
    contract_months?: number | null;
    billing_day?: number | null;
    start_date?: string | null;
    deadline?: string | null;
    progress_percentage?: number | null;
    status?: string | null;
    notes?: string | null;
    client?: {
        id: number;
        name: string;
        company_name?: string;
        client_code: string;
        currency: string;
    } | null;
    category?: {
        id: number;
        name: string;
    } | null;
}

export interface MyTaskItem {
    id: number;
    source_type?: 'project' | 'service' | 'general';
    task_code?: string;
    website_project_id?: number;
    client_service_id?: number;
    assigned_employee_id?: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string | null;
    due_date?: string | null;
    description?: string | null;
    attachment?: string | null;
    attachment_name?: string | null;
    completed_at?: string | null;
    created_at: string;
    messages_count?: number;
    website_project?: AssignedTaskSource | null;
    service?: AssignedTaskSource | null;
    task_category?: { id: number; name: string } | null;
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

    // Detail Popups / Modals State
    const [viewingTask, setViewingTask] = useState<MyTaskItem | null>(null);
    const [viewingGeneralTask, setViewingGeneralTask] = useState<MyTaskItem | null>(null);
    const [viewingProjectTask, setViewingProjectTask] = useState<MyTaskItem | null>(null);
    const [viewingServiceTask, setViewingServiceTask] = useState<MyTaskItem | null>(null);
    const [previewFile, setPreviewFile] = useState<{
        url: string;
        name?: string;
        type?: string;
        size?: number;
    } | null>(null);

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

    const getTaskDetailUrl = (sourceType: string, taskId: number) => {
        const params = new URLSearchParams();
        if (selectedSourceType) params.set('source_type', selectedSourceType);
        if (selectedProject) params.set('project_id', selectedProject);
        if (selectedService) params.set('service_id', selectedService);
        const queryStr = params.toString() ? `?${params.toString()}` : '';
        const fromParam = `/my-tasks${queryStr}`;
        return `/my-tasks/task/${sourceType}/${taskId}/conversation?from=${encodeURIComponent(fromParam)}`;
    };

    const hasActiveFilters = Boolean(
        searchQuery || selectedStatus || selectedPriority || selectedSourceType || selectedProject || selectedService
    );

    const handleStatusChange = (task: MyTaskItem, newStatus: string) => {
        if (task.status === newStatus || updatingTaskId === task.id) return;

        setUpdatingTaskId(task.id);
        let endpoint = `/my-tasks/${task.id}/status`;
        if (task.source_type === 'general' || task.task_category) {
            endpoint = `/my-tasks/general-task/${task.id}/status`;
        } else if (task.source_type === 'service' || task.client_service_id) {
            endpoint = `/my-tasks/service-task/${task.id}/status`;
        }

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
                                        if (e.target.value === 'general') {
                                            setSelectedProject('');
                                            setSelectedService('');
                                        }
                                    }}
                                    aria-label="Filter by Source"
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
                                >
                                    <option value="">All Sources</option>
                                    <option value="project">Projects Only</option>
                                    <option value="service">Services Only</option>
                                    <option value="general">General Tasks Only</option>
                                </select>
                            </div>

                            {/* Project Filter */}
                            {selectedSourceType !== 'service' && selectedSourceType !== 'general' && projects.length > 0 && (
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
                            {selectedSourceType !== 'project' && selectedSourceType !== 'general' && services.length > 0 && (
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
                                        const isGeneral = task.source_type === 'general' || Boolean(task.task_category);
                                        const isService = !isGeneral && (task.source_type === 'service' || Boolean(task.client_service_id));
                                        const sourceTitle = isGeneral
                                            ? task.task_category?.name || 'General Task'
                                            : isService
                                                ? task.service?.service_name || 'Client Service'
                                                : task.website_project?.project_name || 'Website Project';
                                        const sourceClient = isGeneral
                                            ? null
                                            : isService
                                                ? task.service?.client
                                                : task.website_project?.client;

                                        const handleOpenModal = () => {
                                            if (isGeneral) {
                                                setViewingGeneralTask(task);
                                            } else if (isService) {
                                                setViewingServiceTask(task);
                                            } else {
                                                setViewingProjectTask(task);
                                            }
                                        };

                                        return (
                                            <tr
                                                key={`${task.source_type || 'task'}-${task.id}`}
                                                className={`hover:bg-blue-50/20 dark:hover:bg-slate-800/40 transition-colors ${task.status === 'completed' ? 'opacity-75' : ''
                                                    }`}
                                            >
                                                {/* Task Title & Details */}
                                                <td className="py-4 px-4 align-top max-w-[320px]">
                                                    <div className="space-y-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingTask(task)}
                                                            className="text-left font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs block leading-snug cursor-pointer"
                                                            title="Click to view full task details"
                                                        >
                                                            {task.task_title}
                                                        </button>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {task.task_code && (
                                                                <span className="inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                                    #{task.task_code}
                                                                </span>
                                                            )}
                                                            {task.attachment && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPreviewFile({
                                                                        url: task.attachment!,
                                                                        name: task.attachment_name || task.task_title,
                                                                    })}
                                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:underline text-[10px] font-bold border border-blue-200/60 cursor-pointer"
                                                                    title="Preview Attached Document"
                                                                >
                                                                    <Paperclip className="size-2.5" />
                                                                    <span>Doc</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                        {/* Task Description / Instructions Snippet */}
                                                        {task.description ? (
                                                            <p
                                                                onClick={() => setViewingTask(task)}
                                                                className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                                                title="Click to view full description in popup"
                                                            >
                                                                {task.description}
                                                            </p>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 italic">
                                                                No description
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Source & Client */}
                                                <td className="py-4 px-4 align-top">
                                                    <div className="space-y-1">
                                                        <button
                                                            type="button"
                                                            onClick={handleOpenModal}
                                                            className="flex items-center gap-1.5 flex-wrap text-left hover:opacity-85 transition-opacity cursor-pointer"
                                                            title="Click to view details in popup"
                                                        >
                                                            {isGeneral ? (
                                                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50">
                                                                    General
                                                                </span>
                                                            ) : isService ? (
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
                                                        </button>
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
                                                    <div className="inline-flex items-center gap-1.5">
                                                        {/* CONVERSATION / QUERY BUTTON (DIRECT LINK TO DEDICATED PAGE) */}
                                                        <Link
                                                            href={getTaskDetailUrl(isGeneral ? 'general' : isService ? 'service' : 'project', task.id)}
                                                            className="h-8 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border border-blue-200/50 hover:border-transparent"
                                                            title="Open Task Discussion & Details Page"
                                                        >
                                                            <MessageSquare className="size-3.5" />
                                                            <span>{task.messages_count || 0}</span>
                                                        </Link>

                                                        {/* TASK DETAILS POPUP BUTTON */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingTask(task)}
                                                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition-all inline-flex items-center gap-1 text-xs font-bold cursor-pointer shadow-2xs"
                                                            title="View Full Task Details & Instructions"
                                                        >
                                                            <FileText className="size-3.5" />
                                                            <span>Task Detail</span>
                                                        </button>

                                                        {/* PROJECT / SERVICE POPUP BUTTON */}
                                                        {!isGeneral && (
                                                            <button
                                                                type="button"
                                                                onClick={handleOpenModal}
                                                                className="px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
                                                                title={isService ? 'View Service Scope Popup' : 'View Project Scope Popup'}
                                                            >
                                                                <Eye className="size-3" />
                                                                <span>{isService ? 'Service' : 'Project'}</span>
                                                            </button>
                                                        )}
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
                                                        : 'You currently have no project, service, or general deliverables assigned to you.'}
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

                {/* 5. DEDICATED TASK DETAILS POPUP MODAL */}
                {viewingTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
                        <div className="w-full max-w-2xl max-h-[92vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 text-left">
                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {viewingTask.source_type === 'general' || viewingTask.task_category ? (
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                                                General Task
                                            </span>
                                        ) : viewingTask.source_type === 'service' || viewingTask.client_service_id ? (
                                            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 border border-purple-200/60">
                                                Client Service
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 border border-blue-200/60">
                                                Website Project
                                            </span>
                                        )}
                                        {viewingTask.task_code && (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                #{viewingTask.task_code}
                                            </span>
                                        )}
                                        {getPriorityBadge(viewingTask.priority)}
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusOptionClass(viewingTask.status)}`}>
                                            {viewingTask.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                                        {viewingTask.task_title}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewingTask(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Source Information & Client Context Card */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/60 flex items-center justify-center shrink-0">
                                        {viewingTask.source_type === 'general' ? <Briefcase className="size-5" /> : <Globe className="size-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {viewingTask.source_type === 'general' ? 'Task Category' : viewingTask.source_type === 'service' ? 'Associated Service' : 'Associated Project'}
                                        </div>
                                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                                            {viewingTask.source_type === 'general'
                                                ? viewingTask.task_category?.name || 'General Operations'
                                                : viewingTask.source_type === 'service'
                                                    ? viewingTask.service?.service_name || 'Client Service'
                                                    : viewingTask.website_project?.project_name || 'Website Project'}
                                        </div>
                                        {((viewingTask.website_project?.client) || (viewingTask.service?.client)) && (
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                                Client: {(viewingTask.website_project?.client?.company_name || viewingTask.website_project?.client?.name || viewingTask.service?.client?.company_name || viewingTask.service?.client?.name)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Link to Project/Service Modal */}
                                {viewingTask.source_type === 'project' && viewingTask.website_project && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const p = viewingTask;
                                            setViewingTask(null);
                                            setViewingProjectTask(p);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all inline-flex items-center gap-1.5 shrink-0 border border-blue-200/60 cursor-pointer"
                                    >
                                        <Eye className="size-3.5" />
                                        <span>View Project Details</span>
                                    </button>
                                )}
                                {viewingTask.source_type === 'service' && viewingTask.service && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const s = viewingTask;
                                            setViewingTask(null);
                                            setViewingServiceTask(s);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all inline-flex items-center gap-1.5 shrink-0 border border-purple-200/60 cursor-pointer"
                                    >
                                        <Eye className="size-3.5" />
                                        <span>View Service Details</span>
                                    </button>
                                )}
                            </div>

                            {/* Quick Metrics Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                        {viewingTask.assigned_employee?.name || employee?.name || 'Assigned Staff'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {viewingTask.start_date ? formatDate(viewingTask.start_date) : 'Not specified'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date (Deadline)</span>
                                    <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                                        {viewingTask.due_date ? formatDate(viewingTask.due_date) : 'No deadline'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority Level</span>
                                    <p className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                                        {viewingTask.priority}
                                    </p>
                                </div>
                            </div>

                            {/* Description & Detailed Instructions */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <FileText className="size-3.5 text-blue-600" />
                                    Task Description & Instructions
                                </span>
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                                    {viewingTask.description || (
                                        <span className="text-slate-400 italic">No description or instructions provided for this task.</span>
                                    )}
                                </div>
                            </div>

                            {/* Attachment Box */}
                            {viewingTask.attachment && (
                                <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                            <Paperclip className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                                {viewingTask.attachment_name || 'Task Attachment Document'}
                                            </p>
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                                Attached Deliverable Document
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFile({
                                                url: viewingTask.attachment!,
                                                name: viewingTask.attachment_name || viewingTask.task_title,
                                            })}
                                            className="h-8 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <Eye className="size-3.5" />
                                            <span>Preview</span>
                                        </button>
                                        <a
                                            href={viewingTask.attachment}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                                            title="Download File"
                                        >
                                            <Download className="size-3.5" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Status:</span>
                                    <select
                                        value={viewingTask.status}
                                        onChange={(e) => {
                                            const newSt = e.target.value;
                                            handleStatusChange(viewingTask, newSt);
                                            setViewingTask({ ...viewingTask, status: newSt as any });
                                        }}
                                        className={`h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider border focus:outline-none cursor-pointer ${getStatusOptionClass(viewingTask.status)}`}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="in_review">In Review</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    <Link
                                        href={getTaskDetailUrl(viewingTask.source_type || 'project', viewingTask.id)}
                                        className="h-9 px-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
                                    >
                                        <MessageSquare className="size-3.5" />
                                        <span>Discussion ({viewingTask.messages_count || 0})</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setViewingTask(null)}
                                        className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. GENERAL TASK DETAILS MODAL */}
                {viewingGeneralTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
                        <div className="w-full max-w-xl max-h-[92vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 text-left">
                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                                            General Task
                                        </span>
                                        {viewingGeneralTask.task_code && (
                                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[10px] font-mono font-extrabold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                #{viewingGeneralTask.task_code}
                                            </span>
                                        )}
                                        {getPriorityBadge(viewingGeneralTask.priority)}
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusOptionClass(viewingGeneralTask.status)}`}>
                                            {viewingGeneralTask.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white pt-1 leading-snug">
                                        {viewingGeneralTask.task_title}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewingGeneralTask(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Quick Details Grid */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                        {viewingGeneralTask.task_category?.name || 'General Operations'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                        {viewingGeneralTask.assigned_employee?.name || employee?.name || 'Assigned Staff'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {viewingGeneralTask.start_date ? formatDate(viewingGeneralTask.start_date) : 'Not specified'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date (Deadline)</span>
                                    <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                                        {viewingGeneralTask.due_date ? formatDate(viewingGeneralTask.due_date) : 'No deadline'}
                                    </p>
                                </div>
                            </div>

                            {/* Description & Scope */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                                    Description & Instructions
                                </span>
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
                                    {viewingGeneralTask.description || (
                                        <span className="text-slate-400 italic">No description provided for this task.</span>
                                    )}
                                </div>
                            </div>

                            {/* Attachment Box */}
                            {viewingGeneralTask.attachment && (
                                <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                            <Paperclip className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                                {viewingGeneralTask.attachment_name || 'Task Attachment Document'}
                                            </p>
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                                Attached Deliverable Document
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFile({
                                                url: viewingGeneralTask.attachment!,
                                                name: viewingGeneralTask.attachment_name || viewingGeneralTask.task_title,
                                            })}
                                            className="h-8 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <Eye className="size-3.5" />
                                            <span>Preview</span>
                                        </button>
                                        <a
                                            href={viewingGeneralTask.attachment}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                                            title="Download File"
                                        >
                                            <Download className="size-3.5" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Status:</span>
                                    <select
                                        value={viewingGeneralTask.status}
                                        onChange={(e) => {
                                            const newSt = e.target.value;
                                            handleStatusChange(viewingGeneralTask, newSt);
                                            setViewingGeneralTask({ ...viewingGeneralTask, status: newSt as any });
                                        }}
                                        className={`h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider border focus:outline-none cursor-pointer ${getStatusOptionClass(viewingGeneralTask.status)}`}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="in_review">In Review</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    <Link
                                        href={getTaskDetailUrl('general', viewingGeneralTask.id)}
                                        className="h-9 px-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
                                    >
                                        <MessageSquare className="size-3.5" />
                                        <span>Discussion ({viewingGeneralTask.messages_count || 0})</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setViewingGeneralTask(null)}
                                        className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. PROJECT DETAILS MODAL */}
                {viewingProjectTask && viewingProjectTask.website_project && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
                        <div className="w-full max-w-2xl max-h-[92vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 text-left">
                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 border border-blue-200/60">
                                            Website Project
                                        </span>
                                        {viewingProjectTask.website_project.category && (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                {viewingProjectTask.website_project.category.name}
                                            </span>
                                        )}
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60">
                                            {viewingProjectTask.website_project.status || 'Active'}
                                        </span>
                                    </div>
                                    <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white pt-1 leading-snug">
                                        {viewingProjectTask.website_project.project_name}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewingProjectTask(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Client Info Card */}
                            {viewingProjectTask.website_project.client && (
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/60 flex items-center justify-center shrink-0">
                                            <Globe className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client / Company</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                                                {viewingProjectTask.website_project.client.company_name || viewingProjectTask.website_project.client.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 block">
                                            {viewingProjectTask.website_project.client.client_code}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Project Metrics Grid (Operational info only - no budget) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {viewingProjectTask.website_project.start_date ? formatDate(viewingProjectTask.website_project.start_date) : '-'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Deadline</span>
                                    <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                                        {viewingProjectTask.website_project.deadline ? formatDate(viewingProjectTask.website_project.deadline) : 'Ongoing'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</span>
                                    <p className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                                        {viewingProjectTask.website_project.progress_percentage ?? 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Current Deliverable Section */}
                            <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                                        <CheckSquare className="size-3.5" />
                                        Your Assigned Deliverable
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {getPriorityBadge(viewingProjectTask.priority)}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusOptionClass(viewingProjectTask.status)}`}>
                                            {viewingProjectTask.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {viewingProjectTask.task_title}
                                </h4>
                                {viewingProjectTask.description && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                                        {viewingProjectTask.description}
                                    </p>
                                )}
                            </div>

                            {/* Project Notes (if any) */}
                            {viewingProjectTask.website_project.notes && (
                                <div className="space-y-1">
                                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Project Notes & Brief</span>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                        {viewingProjectTask.website_project.notes}
                                    </div>
                                </div>
                            )}

                            {/* Task Attachment if any */}
                            {viewingProjectTask.attachment && (
                                <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="size-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                            <Paperclip className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                                {viewingProjectTask.attachment_name || 'Deliverable Attachment'}
                                            </p>
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                                Attached Deliverable Document
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFile({
                                                url: viewingProjectTask.attachment!,
                                                name: viewingProjectTask.attachment_name || viewingProjectTask.task_title,
                                            })}
                                            className="h-8 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <Eye className="size-3.5" />
                                            <span>Preview</span>
                                        </button>
                                        <a
                                            href={viewingProjectTask.attachment}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                                            title="Download File"
                                        >
                                            <Download className="size-3.5" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Status:</span>
                                    <select
                                        value={viewingProjectTask.status}
                                        onChange={(e) => {
                                            const newSt = e.target.value;
                                            handleStatusChange(viewingProjectTask, newSt);
                                            setViewingProjectTask({ ...viewingProjectTask, status: newSt as any });
                                        }}
                                        className={`h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider border focus:outline-none cursor-pointer ${getStatusOptionClass(viewingProjectTask.status)}`}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="in_review">In Review</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    <Link
                                        href={getTaskDetailUrl('project', viewingProjectTask.id)}
                                        className="h-9 px-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
                                    >
                                        <MessageSquare className="size-3.5" />
                                        <span>Discussion ({viewingProjectTask.messages_count || 0})</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setViewingProjectTask(null)}
                                        className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 7. SERVICE DETAILS MODAL */}
                {viewingServiceTask && viewingServiceTask.service && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
                        <div className="w-full max-w-2xl max-h-[92vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 text-left">
                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 border border-purple-200/60">
                                            Client Service
                                        </span>
                                        {viewingServiceTask.service.category && (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                {viewingServiceTask.service.category.name}
                                            </span>
                                        )}
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60">
                                            {viewingServiceTask.service.status || 'Active'}
                                        </span>
                                    </div>
                                    <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white pt-1 leading-snug">
                                        {viewingServiceTask.service.service_name}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setViewingServiceTask(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Client Info Card */}
                            {viewingServiceTask.service.client && (
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200/60 flex items-center justify-center shrink-0">
                                            <Globe className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client / Company</div>
                                            <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                                                {viewingServiceTask.service.client.company_name || viewingServiceTask.service.client.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 block">
                                            {viewingServiceTask.service.client.client_code}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Service Metrics Grid (Operational info only - no fee) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billing Day</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {viewingServiceTask.service.billing_day ? `Day ${viewingServiceTask.service.billing_day}` : 'Monthly'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contract</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {viewingServiceTask.service.contract_months ? `${viewingServiceTask.service.contract_months} Months` : 'Recurring'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {viewingServiceTask.service.start_date ? formatDate(viewingServiceTask.service.start_date) : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Current Deliverable Section */}
                            <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                                        <CheckSquare className="size-3.5" />
                                        Your Assigned Deliverable
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {getPriorityBadge(viewingServiceTask.priority)}
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusOptionClass(viewingServiceTask.status)}`}>
                                            {viewingServiceTask.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {viewingServiceTask.task_title}
                                </h4>
                                {viewingServiceTask.description && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                                        {viewingServiceTask.description}
                                    </p>
                                )}
                            </div>

                            {/* Service Notes & Scope (if any) */}
                            {viewingServiceTask.service.notes && (
                                <div className="space-y-1">
                                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Service Notes & Scope</span>
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                        {viewingServiceTask.service.notes}
                                    </div>
                                </div>
                            )}

                            {/* Task Attachment if any */}
                            {viewingServiceTask.attachment && (
                                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="size-9 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                            <Paperclip className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                                {viewingServiceTask.attachment_name || 'Deliverable Attachment'}
                                            </p>
                                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                                                Attached Deliverable Document
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewFile({
                                                url: viewingServiceTask.attachment!,
                                                name: viewingServiceTask.attachment_name || viewingServiceTask.task_title,
                                            })}
                                            className="h-8 px-3 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <Eye className="size-3.5" />
                                            <span>Preview</span>
                                        </button>
                                        <a
                                            href={viewingServiceTask.attachment}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                                            title="Download File"
                                        >
                                            <Download className="size-3.5" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-slate-500">Status:</span>
                                    <select
                                        value={viewingServiceTask.status}
                                        onChange={(e) => {
                                            const newSt = e.target.value;
                                            handleStatusChange(viewingServiceTask, newSt);
                                            setViewingServiceTask({ ...viewingServiceTask, status: newSt as any });
                                        }}
                                        className={`h-8 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider border focus:outline-none cursor-pointer ${getStatusOptionClass(viewingServiceTask.status)}`}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="in_review">In Review</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 justify-end">
                                    <Link
                                        href={getTaskDetailUrl('service', viewingServiceTask.id)}
                                        className="h-9 px-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border border-purple-200/60 dark:border-purple-800/60"
                                    >
                                        <MessageSquare className="size-3.5" />
                                        <span>Discussion ({viewingServiceTask.messages_count || 0})</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setViewingServiceTask(null)}
                                        className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 8. FILE PREVIEW MODAL */}
                <FilePreviewModal
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    fileUrl={previewFile?.url || null}
                    fileName={previewFile?.name || null}
                    fileType={previewFile?.type || null}
                    fileSize={previewFile?.size || null}
                />
            </div>
        </AppLayout>
    );
}
