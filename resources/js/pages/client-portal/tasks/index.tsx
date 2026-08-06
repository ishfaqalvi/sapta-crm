import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    Edit2,
    Eye,
    FolderKanban,
    Globe,
    Layers,
    ListTodo,
    LoaderCircle,
    Lock,
    Plus,
    Search,
    Trash2,
    User,
    X,
    Zap,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

interface SimpleProject {
    id: number;
    project_name: string;
}

interface SimpleEmployee {
    id: number;
    name: string;
    employee_code: string;
    avatar: string | null;
}

export interface ProjectTaskItem {
    id: number;
    website_project_id: number;
    assigned_employee_id: number | null;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date: string | null;
    due_date: string | null;
    description: string | null;
    completed_at: string | null;
    created_at: string;
    website_project?: {
        id: number;
        project_name: string;
        client_id: number;
        status?: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
        progress_percentage?: number;
        start_date?: string | null;
        deadline?: string | null;
        notes?: string | null;
        total_budget?: number | string;
        currency?: string;
        exchange_rate?: number | string;
        total_budget_pkr?: number | string;
    };
    assigned_employee?: {
        id: number;
        name: string;
        employee_code: string;
        avatar: string | null;
    };
}

interface ClientPortalTasksIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    tasks: PaginatedData<ProjectTaskItem>;
    projects: SimpleProject[];
    employees: SimpleEmployee[];
    stats: {
        total: number;
        todo: number;
        in_progress: number;
        in_review: number;
        completed: number;
    };
    filters?: {
        search?: string;
        status?: string;
        priority?: string;
        project_id?: string;
    };
}

export default function ClientPortalTasksIndex({
    client,
    tasks,
    projects,
    employees,
    stats,
    filters,
}: ClientPortalTasksIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Project Tasks', href: '/client-portal/tasks' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [selectedPriority, setSelectedPriority] = useState(filters?.priority || '');
    const [selectedProject, setSelectedProject] = useState(filters?.project_id || '');

    // Modal state for Create / Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTaskItem | null>(null);

    // Modal state for Task Detail Popup
    const [viewingTaskDetail, setViewingTaskDetail] = useState<ProjectTaskItem | null>(null);

    // Delete modal state
    const [deletingTask, setDeletingTask] = useState<ProjectTaskItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isFirstRender = useRef(true);

    const formatForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0].split(' ')[0];
    };

    const formatDateOnly = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Not Set';
        const cleanDate = dateStr.split('T')[0].split(' ')[0];
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

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60';
            case 'high':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60';
            case 'medium':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60';
            case 'in_review':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    // Prepare Options for SearchableSelect
    const projectOptions = projects.map((p) => ({
        value: p.id.toString(),
        label: p.project_name,
    }));

    const employeeOptions = [
        { value: '', label: 'Unassigned' },
        ...employees.map((e) => ({
            value: e.id.toString(),
            label: e.name,
            subLabel: e.employee_code,
        })),
    ];

    // Form Hook
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        website_project_id: '',
        assigned_employee_id: '',
        task_title: '',
        priority: 'medium',
        status: 'todo',
        start_date: '',
        due_date: '',
        description: '',
    });

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/client-portal/tasks',
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

    const openCreateModal = () => {
        setEditingTask(null);
        clearErrors();
        reset();
        if (projects.length > 0) {
            setData('website_project_id', projects[0].id.toString());
        }
        setIsModalOpen(true);
    };

    const openEditModal = (task: ProjectTaskItem) => {
        setViewingTaskDetail(null);
        setEditingTask(task);
        clearErrors();
        setData({
            website_project_id: task.website_project_id ? task.website_project_id.toString() : '',
            assigned_employee_id: task.assigned_employee_id ? task.assigned_employee_id.toString() : '',
            task_title: task.task_title || '',
            priority: task.priority || 'medium',
            status: task.status || 'todo',
            start_date: formatForInput(task.start_date),
            due_date: formatForInput(task.due_date),
            description: task.description || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingTask) {
            put(`/client-portal/tasks/update/${editingTask.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/client-portal/tasks/store', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!deletingTask) return;
        setIsDeleting(true);
        router.delete(`/client-portal/tasks/destroy/${deletingTask.id}`, {
            onSuccess: () => {
                setDeletingTask(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="tasks">
            <Head title={`Project Tasks | ${client.name}`} />

            <div className="p-6 w-full space-y-6">
                {/* Header Title & Add Task Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Deliverable Tasks & Milestones
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Manage and monitor website project deliverable tasks and backlog sprints.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-tasks') && (
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add Project Task</span>
                        </button>
                    )}
                </div>

                {/* KPI Stat Cards (Admin Standard) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tasks</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <ListTodo className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</p>
                            <h3 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{stats.in_progress}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Review</p>
                            <h3 className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">{stats.in_review}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Layers className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.completed}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full lg:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by task title, description, or project name..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Project Filter */}
                        {projects.length > 0 && (
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                            >
                                <option value="">All Projects</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.project_name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={selectedPriority}
                            onChange={(e) => setSelectedPriority(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                </div>

                {/* Table View (Full width layout) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                                    <th className="px-6 py-4">Task Details</th>
                                    <th className="px-6 py-4">Project Name</th>
                                    <th className="px-6 py-4">Assigned Engineer</th>
                                    <th className="px-6 py-4">Start Date</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {tasks.data.length > 0 ? (
                                    tasks.data.map((task) => (
                                        <tr key={task.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 max-w-sm">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className={`p-1 rounded-md shrink-0 ${task.status === 'completed'
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                                                            }`}>
                                                            <CheckCircle2 className="size-3.5" />
                                                        </div>
                                                        <button
                                                            onClick={() => setViewingTaskDetail(task)}
                                                            className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors text-left font-bold cursor-pointer text-sm text-slate-900 dark:text-white"
                                                        >
                                                            {task.task_title}
                                                        </button>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getPriorityBadgeClass(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 pl-5">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {task.website_project ? (
                                                    <Link
                                                        href={`/client-portal/projects/${task.website_project_id}`}
                                                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                                                    >
                                                        <Globe className="size-3.5 text-blue-500" />
                                                        <span>{task.website_project.project_name}</span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400 italic">N/A</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {task.assigned_employee ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] flex items-center justify-center border border-slate-300 dark:border-slate-700">
                                                            {task.assigned_employee.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {task.assigned_employee.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Calendar className="size-3.5 text-indigo-500" />
                                                    {formatDateOnly(task.start_date)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Clock className="size-3.5 text-amber-500" />
                                                    {formatDateOnly(task.due_date)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border ${getStatusBadgeClass(task.status)}`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {hasPermission(user, 'view-client-portal-tasks') && (
                                                        <button
                                                            onClick={() => setViewingTaskDetail(task)}
                                                            className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="View Task & Project Details"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </button>
                                                    )}
                                                    {hasPermission(user, 'edit-client-portal-tasks') && (
                                                        <button
                                                            onClick={() => openEditModal(task)}
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Edit Task"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                    {hasPermission(user, 'delete-client-portal-tasks') && (
                                                        task.status === 'completed' ? (
                                                            <button
                                                                disabled
                                                                className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed flex items-center justify-center shadow-2xs opacity-60"
                                                                title="Completed tasks cannot be deleted to preserve project progress analytics"
                                                            >
                                                                <Lock className="size-3.5" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeletingTask(task)}
                                                                className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                title="Delete Task"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                            No project deliverable tasks found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {tasks.data.length > 0 && <Pagination meta={tasks} />}

                {/* Task & Complete Project Details Popup Modal */}
                {viewingTaskDetail && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20">
                                        <ListTodo className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            Task & Associated Project Details
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Complete deliverable specs and project status overview.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setViewingTaskDetail(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* 2-Column Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-y-auto pr-1 flex-1">
                                {/* LEFT COLUMN: TASK DETAILS */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <ListTodo className="size-3.5 text-blue-500" />
                                            Task Specifications
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPriorityBadgeClass(viewingTaskDetail.priority)}`}>
                                                <Zap className="size-3 inline mr-0.5" />
                                                {viewingTaskDetail.priority}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeClass(viewingTaskDetail.status)}`}>
                                                {viewingTaskDetail.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Task Title Box */}
                                    <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-1">
                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">Task Title</p>
                                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                                            {viewingTaskDetail.task_title}
                                        </h4>
                                    </div>

                                    {/* Task Dates & Engineer Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Assigned Engineer */}
                                        <div className="col-span-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                                            <div className="size-8 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                                {viewingTaskDetail.assigned_employee ? viewingTaskDetail.assigned_employee.name.charAt(0).toUpperCase() : <User className="size-4" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Assigned Engineer</p>
                                                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                                    {viewingTaskDetail.assigned_employee ? viewingTaskDetail.assigned_employee.name : 'Unassigned'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Task Start Date */}
                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Start Date</p>
                                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                <Calendar className="size-3.5 text-indigo-500" />
                                                {formatDateOnly(viewingTaskDetail.start_date)}
                                            </p>
                                        </div>

                                        {/* Task Due Date */}
                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Due Date</p>
                                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                <Clock className="size-3.5 text-amber-500" />
                                                {formatDateOnly(viewingTaskDetail.due_date)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Task Description */}
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Task Notes & Technical Specs</p>
                                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 max-h-32 overflow-y-auto">
                                            {viewingTaskDetail.description ? (
                                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                    {viewingTaskDetail.description}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No description provided for this task.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: PROJECT DETAILS */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <Globe className="size-3.5 text-indigo-500" />
                                            Complete Project Overview
                                        </span>
                                        {viewingTaskDetail.website_project?.status && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${viewingTaskDetail.website_project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    viewingTaskDetail.website_project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                        viewingTaskDetail.website_project.status === 'on_hold' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {viewingTaskDetail.website_project.status.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>

                                    {viewingTaskDetail.website_project ? (
                                        <div className="space-y-3">
                                            {/* Project Name Box with View Link */}
                                            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Project Name</p>
                                                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                        {viewingTaskDetail.website_project.project_name}
                                                    </h4>
                                                </div>
                                                <Link
                                                    href={`/client-portal/projects/${viewingTaskDetail.website_project_id}`}
                                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-[11px] font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1 shrink-0"
                                                >
                                                    <span>View Page</span>
                                                </Link>
                                            </div>

                                            {/* Project Progress Bar */}
                                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Completion Progress</span>
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                                                        {viewingTaskDetail.website_project.progress_percentage ?? 0}%
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(viewingTaskDetail.website_project.progress_percentage || 0, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Project Dates Grid (Start Date & Deadline) */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Project Start Date */}
                                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Project Start Date</p>
                                                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                        <Calendar className="size-3.5 text-indigo-500" />
                                                        {formatDateOnly(viewingTaskDetail.website_project.start_date)}
                                                    </p>
                                                </div>

                                                {/* Project Deadline */}
                                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Project Deadline</p>
                                                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                        <Clock className="size-3.5 text-amber-500" />
                                                        {formatDateOnly(viewingTaskDetail.website_project.deadline)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Project Scope & Notes */}
                                            {viewingTaskDetail.website_project.notes && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Project Scope & Notes</p>
                                                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 max-h-24 overflow-y-auto">
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                                            {viewingTaskDetail.website_project.notes}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 italic text-xs">
                                            No associated project details available.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                <button
                                    onClick={() => setViewingTaskDetail(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => openEditModal(viewingTaskDetail)}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                                >
                                    <Edit2 className="size-3.5" />
                                    <span>Edit Task</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create / Edit Task Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <ListTodo className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            {editingTask ? 'Edit Project Task' : 'Add New Project Task'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Set sprint parameters and deliverable specs.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Row 1 Col 1: Website Project (Searchable) */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Website Project <span className="text-rose-500">*</span>
                                        </label>
                                        <SearchableSelect
                                            options={projectOptions}
                                            value={data.website_project_id}
                                            onChange={(val) => setData('website_project_id', val)}
                                            placeholder="Select Website Project..."
                                            searchPlaceholder="Type to search project..."
                                        />
                                        {errors.website_project_id && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.website_project_id}</p>}
                                    </div>

                                    {/* Row 1 Col 2: Task Title */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Task Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.task_title}
                                            onChange={(e) => setData('task_title', e.target.value)}
                                            placeholder="e.g. Design Payment Gateway Wireframes"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${errors.task_title
                                                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {errors.task_title && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.task_title}</p>}
                                    </div>

                                    {/* Row 2 Col 1: Assigned Engineer (Searchable) */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Assigned Engineer
                                        </label>
                                        <SearchableSelect
                                            options={employeeOptions}
                                            value={data.assigned_employee_id}
                                            onChange={(val) => setData('assigned_employee_id', val)}
                                            placeholder="Unassigned (Select Engineer...)"
                                            searchPlaceholder="Type name or code to search..."
                                            className="w-full"
                                        />
                                        {errors.assigned_employee_id && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.assigned_employee_id}</p>}
                                    </div>

                                    {/* Row 2 Col 2: Status & Priority side-by-side */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                                Status <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value as any)}
                                                className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="in_review">In Review</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                                Priority <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={data.priority}
                                                onChange={(e) => setData('priority', e.target.value as any)}
                                                className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Column 1: Start Date & Due Date */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                                Due Date
                                            </label>
                                            <input
                                                type="date"
                                                value={data.due_date}
                                                onChange={(e) => setData('due_date', e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Column 2: Description & Specs */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Description & Specs
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Add sprint notes or technical task instructions..."
                                            className="w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Form Action Buttons */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>{editingTask ? 'Update Task' : 'Save Task'}</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingTask && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Delete Task?</h3>
                                    <p className="text-xs text-slate-400 font-medium">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingTask.task_title}</strong>?
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setDeletingTask(null)}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Task</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientPortalLayout>
    );
}
