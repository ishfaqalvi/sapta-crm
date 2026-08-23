import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect, { type SelectOption } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    Download,
    Edit2,
    Eye,
    FileText,
    Filter,
    ListTodo,
    LoaderCircle,
    Paperclip,
    Plus,
    RotateCcw,
    Search,
    Tag,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Client Operations',
        href: '/tasks',
    },
    {
        title: 'General Tasks',
        href: '/tasks',
    },
];

interface TaskCategorySimple {
    id: number;
    name: string;
}

interface EmployeeSimple {
    id: number;
    name: string;
    employee_code: string;
    department?: {
        name: string;
    };
}

interface UserSimple {
    id: number;
    name: string;
}

interface TaskItem {
    id: number;
    task_code: string;
    task_title: string;
    task_category_id: number;
    assigned_employee_id: number | null;
    created_by_user_id: number | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date: string | null;
    due_date: string | null;
    description: string | null;
    attachment: string | null;
    attachment_name: string | null;
    completed_at: string | null;
    created_at: string;
    task_category: TaskCategorySimple | null;
    assigned_employee: EmployeeSimple | null;
    created_by: UserSimple | null;
}

interface TasksIndexProps {
    tasks: PaginatedData<TaskItem>;
    stats: {
        total: number;
        todo: number;
        in_progress: number;
        completed: number;
        urgent: number;
    };
    categories: TaskCategorySimple[];
    employees: EmployeeSimple[];
    filters: {
        search?: string;
        task_category_id?: string;
        status?: string;
        priority?: string;
        assigned_employee_id?: string;
    };
}

export default function TasksIndex({ tasks, stats, categories = [], employees = [], filters }: TasksIndexProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [categoryId, setCategoryId] = useState(filters?.task_category_id || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [priorityFilter, setPriorityFilter] = useState(filters?.priority || '');
    const [assignedId, setAssignedId] = useState(filters?.assigned_employee_id || '');

    // Modal States
    const [viewingTask, setViewingTask] = useState<TaskItem | null>(null);
    const [deletingTask, setDeletingTask] = useState<TaskItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/tasks',
                {
                    search: searchQuery || undefined,
                    task_category_id: categoryId || undefined,
                    status: statusFilter || undefined,
                    priority: priorityFilter || undefined,
                    assigned_employee_id: assignedId || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, categoryId, statusFilter, priorityFilter, assignedId]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setCategoryId('');
        setStatusFilter('');
        setPriorityFilter('');
        setAssignedId('');
        router.get('/tasks', {}, { preserveState: true, replace: true });
    };

    const handleQuickStatusChange = (task: TaskItem, newStatus: string) => {
        router.patch(
            route('tasks.status', task.id),
            { status: newStatus },
            { preserveScroll: true }
        );
    };

    const handleDeleteSubmit = () => {
        if (!deletingTask) return;
        setIsDeleting(true);
        router.delete(route('tasks.destroy', deletingTask.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingTask(null);
            },
        });
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const categorySelectOptions: SelectOption[] = [
        { value: '', label: 'All Categories', subLabel: 'Show tasks for all categories' },
        ...categories.map((cat) => ({
            value: String(cat.id),
            label: cat.name,
        })),
    ];

    const employeeSelectOptions: SelectOption[] = [
        { value: '', label: 'All Employees', subLabel: 'Show tasks for all staff' },
        ...employees.map((emp) => ({
            value: String(emp.id),
            label: emp.name,
            subLabel: emp.employee_code,
        })),
    ];

    const getPriorityBadgeClass = (p: string) => {
        switch (p) {
            case 'urgent':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
            case 'high':
                return 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            case 'medium':
                return 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    const getStatusBadgeClass = (st: string) => {
        switch (st) {
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'in_review':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'cancelled':
                return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 line-through';
            default:
                return 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        }
    };

    const hasActiveFilters = Boolean(searchQuery || categoryId || statusFilter || priorityFilter || assignedId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="General Tasks Directory" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <CheckSquare className="size-6 text-indigo-600 dark:text-indigo-400" />
                            <span>General Tasks Directory</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Create, assign, attach documents, and track operational tasks across team members.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                        {hasPermission(user, 'view-task-categories') && (
                            <Link
                                href={route('task-categories.index')}
                                className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
                            >
                                <Tag className="size-4" />
                                <span>Manage Categories</span>
                            </Link>
                        )}

                        {hasPermission(user, 'create-tasks') && (
                            <Link
                                href={route('tasks.create')}
                                className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                            >
                                <Plus className="size-4" />
                                <span>Add New Task</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tasks</p>
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <CheckSquare className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">To Do</p>
                            <h3 className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{stats.todo}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</p>
                            <h3 className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.in_progress}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            <ListTodo className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
                            <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.completed}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Urgent Pending</p>
                            <h3 className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{stats.urgent}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
                        {/* Search Input */}
                        <div className="relative w-full lg:col-span-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 z-10" />
                            <input
                                type="text"
                                placeholder="Search task title or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                            />
                        </div>

                        {/* Category Searchable Filter */}
                        <div className="w-full">
                            <SearchableSelect
                                options={categorySelectOptions}
                                value={categoryId}
                                onChange={(val) => setCategoryId(val)}
                                placeholder="Filter Category"
                                searchPlaceholder="Type category name..."
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white px-3 focus:outline-none focus:border-blue-600 transition-all"
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
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white px-3 focus:outline-none focus:border-blue-600 transition-all"
                        >
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>

                        {/* Employee Searchable Filter */}
                        <div className="w-full">
                            <SearchableSelect
                                options={employeeSelectOptions}
                                value={assignedId}
                                onChange={(val) => setAssignedId(val)}
                                placeholder="Filter Employee"
                                searchPlaceholder="Type employee name..."
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all inline-flex items-center gap-1.5 shrink-0"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Reset Filters</span>
                        </button>
                    )}
                </div>

                {/* Tasks Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Task</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Assigned Staff</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {tasks.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No tasks found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.data.map((task) => (
                                        <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Task Title & Code */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[10px] font-mono font-extrabold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                            {task.task_code}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingTask(task)}
                                                            className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                                                        >
                                                            {task.task_title}
                                                        </button>
                                                    </div>

                                                    {task.description && (
                                                        <p className="text-[11px] text-slate-400 line-clamp-1">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Category - Simple Text */}
                                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                                {task.task_category ? task.task_category.name : '-'}
                                            </td>

                                            {/* Assigned Employee */}
                                            <td className="px-6 py-4">
                                                {task.assigned_employee ? (
                                                    <div>
                                                        <span className="font-extrabold text-slate-900 dark:text-white block">
                                                            {task.assigned_employee.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                                                            {task.assigned_employee.employee_code}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned</span>
                                                )}
                                            </td>

                                            {/* Priority */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getPriorityBadgeClass(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </td>

                                            {/* Due Date - Formatted */}
                                            <td className="px-6 py-4 whitespace-nowrap font-bold">
                                                {task.due_date ? (
                                                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                        <Calendar className="size-3.5 text-slate-400" />
                                                        <span>{formatDate(task.due_date)}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">No Due Date</span>
                                                )}
                                            </td>

                                            {/* Interactive Status Selector */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {hasPermission(user, 'edit-tasks') ? (
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                                                        className={`h-8 px-2.5 rounded-xl text-xs font-extrabold border focus:outline-none cursor-pointer ${getStatusBadgeClass(task.status)}`}
                                                    >
                                                        <option value="todo">To Do</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="in_review">In Review</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border ${getStatusBadgeClass(task.status)}`}>
                                                        {task.status.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingTask(task)}
                                                        className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                        title="View Task Details"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </button>

                                                    {hasPermission(user, 'edit-tasks') && (
                                                        <Link
                                                            href={route('tasks.edit', task.id)}
                                                            className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Edit Task"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </Link>
                                                    )}

                                                    {hasPermission(user, 'delete-tasks') && (
                                                        <button
                                                            onClick={() => setDeletingTask(task)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Delete Task"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={tasks} />
                </div>

                {/* VIEW TASK DETAILS MODAL POPUP (COMPACT & REDUCED SPACING) */}
                {viewingTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 my-4 animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[10px] font-mono font-extrabold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                            {viewingTask.task_code}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getPriorityBadgeClass(viewingTask.priority)}`}>
                                            {viewingTask.priority}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadgeClass(viewingTask.status)}`}>
                                            {viewingTask.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white pt-0.5">
                                        {viewingTask.task_title}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setViewingTask(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Details Compact Grid */}
                            <div className="grid grid-cols-2 gap-2.5">
                                {/* Category */}
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {viewingTask.task_category ? viewingTask.task_category.name : '-'}
                                    </p>
                                </div>

                                {/* Assigned Staff */}
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Staff</span>
                                    {viewingTask.assigned_employee ? (
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                            {viewingTask.assigned_employee.name} <span className="text-[10px] text-slate-400 font-mono">({viewingTask.assigned_employee.employee_code})</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Unassigned</p>
                                    )}
                                </div>

                                {/* Start Date */}
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {viewingTask.start_date ? formatDate(viewingTask.start_date) : '-'}
                                    </p>
                                </div>

                                {/* Due Date */}
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</span>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                        {viewingTask.due_date ? formatDate(viewingTask.due_date) : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    Description & Instructions
                                </span>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {viewingTask.description || <span className="text-slate-400 italic">No description provided for this task.</span>}
                                </div>
                            </div>

                            {/* Attachment Section */}
                            {viewingTask.attachment && (
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
                                            <Paperclip className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                                {viewingTask.attachment_name || 'Task Attachment Document'}
                                            </p>
                                            <span className="text-[10px] font-bold text-slate-400">Attached Document</span>
                                        </div>
                                    </div>

                                    <a
                                        href={route('tasks.download-attachment', viewingTask.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
                                    >
                                        <Download className="size-3.5" />
                                        <span>Download File</span>
                                    </a>
                                </div>
                            )}

                            {/* Modal Actions Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    {hasPermission(user, 'edit-tasks') && (
                                        <Link
                                            href={route('tasks.edit', viewingTask.id)}
                                            className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 cursor-pointer"
                                        >
                                            <Edit2 className="size-3.5" />
                                            <span>Edit Task</span>
                                        </Link>
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setViewingTask(null)}
                                    className="h-9 px-4 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {deletingTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingTask(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Task?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete task <strong className="text-slate-900 dark:text-white">"{deletingTask.task_title}"</strong> ({deletingTask.task_code})? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingTask(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteSubmit}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
        </AppLayout>
    );
}
