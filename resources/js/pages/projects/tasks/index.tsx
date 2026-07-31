import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Building,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    Edit2,
    FolderKanban,
    LoaderCircle,
    Plus,
    Search,
    Trash2,
    User,
    X,
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
        client?: {
            id: number;
            name: string;
        };
    };
    assigned_employee?: {
        id: number;
        name: string;
        employee_code: string;
        avatar: string | null;
    };
}

interface ProjectTasksIndexProps {
    tasks: PaginatedData<ProjectTaskItem>;
    projects: SimpleProject[];
    employees: SimpleEmployee[];
    filters?: {
        search?: string;
        status?: string;
        priority?: string;
        project_id?: string;
        employee_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Website Projects', href: '/website-projects' },
    { title: 'Project Tasks', href: '/project-tasks' },
];

export default function ProjectTasksIndex({ tasks, projects, employees, filters }: ProjectTasksIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(filters?.status || '');
    const [selectedPriorityFilter, setSelectedPriorityFilter] = useState(filters?.priority || '');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState(filters?.project_id || '');
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState(filters?.employee_id || '');

    // Create / Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTaskItem | null>(null);

    // Delete Confirmation Modal State
    const [deletingTask, setDeletingTask] = useState<ProjectTaskItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        website_project_id: '',
        assigned_employee_id: '',
        task_title: '',
        priority: 'medium',
        status: 'todo',
        start_date: '',
        due_date: '',
        description: '',
    });

    const formatDateOnly = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const cleanDate = dateString.includes('T') ? dateString.split('T')[0] : dateString.split(' ')[0];
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

    const formatForInput = (dateString: string | null) => {
        if (!dateString) return '';
        return dateString.includes('T') ? dateString.split('T')[0] : dateString.split(' ')[0];
    };

    // Debounced Filter Effect (matches CRM standard across pages)
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/project-tasks',
                {
                    search: searchQuery,
                    status: selectedStatusFilter,
                    priority: selectedPriorityFilter,
                    project_id: selectedProjectFilter,
                    employee_id: selectedEmployeeFilter,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatusFilter, selectedPriorityFilter, selectedProjectFilter, selectedEmployeeFilter]);

    const openCreateModal = () => {
        setEditingTask(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (task: ProjectTaskItem) => {
        setEditingTask(task);
        setData({
            website_project_id: String(task.website_project_id),
            assigned_employee_id: task.assigned_employee_id ? String(task.assigned_employee_id) : '',
            task_title: task.task_title,
            priority: task.priority,
            status: task.status,
            start_date: formatForInput(task.start_date),
            due_date: formatForInput(task.due_date),
            description: task.description || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingTask) {
            put(`/project-tasks/${editingTask.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/project-tasks', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleQuickStatusChange = (task: ProjectTaskItem, newStatus: string) => {
        router.patch(
            `/project-tasks/${task.id}/status`,
            { status: newStatus },
            { preserveScroll: true }
        );
    };

    const handleConfirmDelete = () => {
        if (!deletingTask || isDeleting) return;
        setIsDeleting(true);
        destroy(`/project-tasks/${deletingTask.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingTask(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    // Calculate quick KPI counts
    const totalTasksCount = tasks.total;
    const inProgressCount = tasks.data.filter((t) => t.status === 'in_progress').length;
    const inReviewCount = tasks.data.filter((t) => t.status === 'in_review').length;
    const completedCount = tasks.data.filter((t) => t.status === 'completed').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Project Tasks & Assignments" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <CheckSquare className="size-6 text-indigo-600 dark:text-indigo-400" />
                            Project Tasks Hub
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage website project execution tasks, assign team members, and monitor live progress.
                        </p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0"
                    >
                        <Plus className="size-4" />
                        <span>Create Project Task</span>
                    </button>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Tasks</span>
                            <FolderKanban className="size-4 text-slate-500" />
                        </div>
                        <p className="font-extrabold text-slate-900 dark:text-white text-xl sm:text-2xl">{totalTasksCount}</p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">In Progress</span>
                            <Clock className="size-4" />
                        </div>
                        <p className="font-extrabold text-blue-700 dark:text-blue-300 text-xl sm:text-2xl">{inProgressCount}</p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">In Review</span>
                            <AlertCircle className="size-4" />
                        </div>
                        <p className="font-extrabold text-amber-700 dark:text-amber-300 text-xl sm:text-2xl">{inReviewCount}</p>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Completed</span>
                            <CheckCircle2 className="size-4" />
                        </div>
                        <p className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xl sm:text-2xl">{completedCount}</p>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search task title..."
                                className="w-full pl-9 pr-3.5 h-10 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3.5 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        >
                            <option value="">All Statuses</option>
                            <option value="todo">To-Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={selectedPriorityFilter}
                            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                            className="h-10 px-3.5 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        >
                            <option value="">All Priorities</option>
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        {/* Project Filter */}
                        <SearchableSelect
                            options={[
                                { value: '', label: 'All Website Projects' },
                                ...projects.map((p) => ({
                                    value: p.id,
                                    label: p.project_name,
                                })),
                            ]}
                            value={selectedProjectFilter}
                            onChange={(val) => setSelectedProjectFilter(val)}
                            placeholder="All Website Projects"
                            searchPlaceholder="Search project..."
                        />

                        {/* Employee Filter */}
                        <SearchableSelect
                            options={[
                                { value: '', label: 'All Assigned Employees' },
                                ...employees.map((emp) => ({
                                    value: emp.id,
                                    label: emp.name,
                                    subLabel: emp.employee_code,
                                })),
                            ]}
                            value={selectedEmployeeFilter}
                            onChange={(val) => setSelectedEmployeeFilter(val)}
                            placeholder="All Assigned Employees"
                            searchPlaceholder="Search employee..."
                        />
                    </div>
                </div>

                {/* Tasks Table View */}
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                    <th className="px-6 py-4">Task & Project</th>
                                    <th className="px-6 py-4">Assigned To</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {tasks.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <CheckSquare className="size-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No project tasks found</p>
                                            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or create a new task</p>
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.data.map((t) => (
                                        <tr
                                            key={t.id}
                                            className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                                        >
                                            {/* Task & Project */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5 max-w-xs sm:max-w-md">
                                                    <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1">
                                                        {t.task_title}
                                                    </span>
                                                    {t.website_project && (
                                                        <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                            <Building className="size-3 shrink-0" />
                                                            <span className="truncate">{t.website_project.project_name}</span>
                                                        </p>
                                                    )}
                                                    {t.description && (
                                                        <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">
                                                            {t.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Assigned Employee */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {t.assigned_employee ? (
                                                    <div className="flex items-center gap-2">
                                                        {t.assigned_employee.avatar ? (
                                                            <img
                                                                src={t.assigned_employee.avatar}
                                                                alt={t.assigned_employee.name}
                                                                className="size-6 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                                                            />
                                                        ) : (
                                                            <div className="size-6 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center border border-blue-200 dark:border-blue-800">
                                                                {t.assigned_employee.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                                                {t.assigned_employee.name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                {t.assigned_employee.employee_code}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 inline-flex items-center gap-1">
                                                        <User className="size-3" /> Unassigned
                                                    </span>
                                                )}
                                            </td>

                                            {/* Priority */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${t.priority === 'urgent'
                                                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                        : t.priority === 'high'
                                                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                            : t.priority === 'medium'
                                                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                >
                                                    {t.priority}
                                                </span>
                                            </td>

                                            {/* Status (Quick Selector) */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={t.status}
                                                    onChange={(e) => handleQuickStatusChange(t, e.target.value)}
                                                    className={`h-7 px-2.5 text-[11px] font-extrabold rounded-xl border focus:outline-hidden cursor-pointer transition-colors ${t.status === 'completed'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                        : t.status === 'in_progress'
                                                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                                            : t.status === 'in_review'
                                                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                                                : t.status === 'cancelled'
                                                                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                        }`}
                                                >
                                                    <option value="todo">To-Do</option>
                                                    <option value="in_progress">In Progress</option>
                                                    <option value="in_review">In Review</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>

                                            {/* Due Date */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                                                    <Calendar className="size-3.5 text-slate-400 shrink-0" />
                                                    <span>{formatDateOnly(t.due_date)}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(t)}
                                                        className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="Edit Task"
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingTask(t)}
                                                        className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="Delete Task"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <Pagination meta={tasks} />

                {/* CREATE / EDIT TASK MODAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header with Icon */}
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <CheckSquare className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            {editingTask ? 'Edit Project Task' : 'Create Project Task'}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Assign task execution details, project, and team members.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Website Project (Full Width at Top) */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Website Project *
                                    </label>
                                    <SearchableSelect
                                        id="website_project_id"
                                        options={projects.map((p) => ({
                                            value: p.id,
                                            label: p.project_name,
                                        }))}
                                        value={data.website_project_id}
                                        onChange={(val) => setData('website_project_id', val)}
                                        placeholder="Search and select project..."
                                        searchPlaceholder="Search project name..."
                                    />
                                    {errors.website_project_id && (
                                        <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.website_project_id}</p>
                                    )}
                                </div>

                                {/* Task Title (Full Width) */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Task Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={data.task_title}
                                        onChange={(e) => setData('task_title', e.target.value)}
                                        placeholder="e.g. Develop Homepage UI Mockups"
                                        className="w-full h-10 px-3.5 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    />
                                    {errors.task_title && (
                                        <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.task_title}</p>
                                    )}
                                </div>

                                {/* Assigned Employee (Full Width) */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Assigned Employee
                                    </label>
                                    <SearchableSelect
                                        id="assigned_employee_id"
                                        options={[
                                            { value: '', label: 'Unassigned' },
                                            ...employees.map((emp) => ({
                                                value: emp.id,
                                                label: emp.name,
                                                subLabel: emp.employee_code,
                                            })),
                                        ]}
                                        value={data.assigned_employee_id}
                                        onChange={(val) => setData('assigned_employee_id', val)}
                                        placeholder="Unassigned"
                                        searchPlaceholder="Search staff..."
                                    />
                                </div>

                                {/* Priority & Status Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Priority *
                                        </label>
                                        <select
                                            value={data.priority}
                                            onChange={(e) => setData('priority', e.target.value as any)}
                                            className="w-full h-10 px-3.5 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Status *
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value as any)}
                                            className="w-full h-10 px-3.5 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                                        >
                                            <option value="todo">To-Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="in_review">In Review</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Start Date & Due Date Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            className="w-full h-10 px-3.5 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-blue-500 transition-all"
                                        />
                                        {errors.start_date && (
                                            <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.start_date}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.due_date}
                                            onChange={(e) => setData('due_date', e.target.value)}
                                            className="w-full h-10 px-3.5 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-blue-500 transition-all"
                                        />
                                        {errors.due_date && (
                                            <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.due_date}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Description & Action Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Execution details or technical requirements..."
                                        className="w-full p-2.5 rounded-xl text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:border-blue-500 resize-none transition-all"
                                    />
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="h-10 px-4 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="h-10 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                                    >
                                        {processing && <LoaderCircle className="size-4 animate-spin" />}
                                        <span>{editingTask ? 'Update Task' : 'Create Task'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL (CRM Standard Dialog) */}
                {deletingTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Delete Project Task</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                Are you sure you want to delete task <strong className="text-slate-900 dark:text-white">"{deletingTask.task_title}"</strong>?
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingTask(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="h-10 px-5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all inline-flex items-center gap-2"
                                >
                                    {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                    <span>Delete Task</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
