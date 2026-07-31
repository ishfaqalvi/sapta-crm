import Pagination, { type PaginatedData } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Client } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    BadgeDollarSign,
    Building,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    Edit2,
    Eye,
    FileText,
    Globe,
    Layers,
    LayoutGrid,
    List,
    LoaderCircle,
    PauseCircle,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Website Projects',
        href: '/website-projects',
    },
];

export interface ProjectPaymentItem {
    id: number;
    website_project_id: number;
    client_id: number;
    milestone_title: string;
    amount: number;
    payment_stage: 'advance' | 'partial' | 'full';
    status: 'pending' | 'paid';
    paid_at: string | null;
    payment_method: string | null;
    notes: string | null;
}

export interface WebsiteProjectItem {
    id: number;
    client_id: number;
    project_name: string;
    total_budget: number;
    currency: string;
    start_date: string | null;
    deadline: string | null;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    notes: string | null;
    client: Client | null;
    payments: ProjectPaymentItem[];
    tasks?: {
        id: number;
        task_title: string;
        priority: string;
        status: string;
        due_date: string | null;
        assigned_employee?: {
            name: string;
            avatar: string | null;
        };
    }[];
}

interface WebsiteProjectsIndexProps {
    projects: PaginatedData<WebsiteProjectItem>;
    stats: {
        total: number;
        in_progress: number;
        on_hold: number;
        completed: number;
    };
    filters?: {
        search?: string;
        status?: string;
        currency?: string;
    };
}

const formatDateOnly = (dateStr: string | null) => {
    if (!dateStr) return 'Flexible';
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

export default function WebsiteProjectsIndex({ projects, stats, filters }: WebsiteProjectsIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(filters?.status || '');
    const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState(filters?.currency || '');

    // View Mode State (Grid vs Table)
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Viewing Project Milestones Drawer
    const [viewingProject, setViewingProject] = useState<WebsiteProjectItem | null>(null);

    // Delete Confirmation State
    const [deletingProject, setDeletingProject] = useState<WebsiteProjectItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Debounced filter effect (matches Employee Directory standard)
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/website-projects',
                {
                    search: searchQuery,
                    status: selectedStatusFilter,
                    currency: selectedCurrencyFilter,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatusFilter, selectedCurrencyFilter]);

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingProject || isDeleting) return;
        setIsDeleting(true);
        router.delete(`/website-projects/${deletingProject.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingProject(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Website Projects Hub" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Website Projects Hub
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Track client website developments, milestones, budgets, deadlines, and live completion progress.
                        </p>
                    </div>

                    <Link
                        href="/website-projects/create"
                        className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0"
                    >
                        <Plus className="size-4" />
                        <span>Add Website Project</span>
                    </Link>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Projects</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Globe className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</p>
                            <h3 className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">{stats.in_progress}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">On Hold</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{stats.on_hold}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <PauseCircle className="size-5" />
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
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by project title, client name, or code..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="in_progress">In Progress</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={selectedCurrencyFilter}
                            onChange={(e) => setSelectedCurrencyFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Currencies</option>
                            <option value="AED">AED (Dirham)</option>
                            <option value="USD">USD ($)</option>
                            <option value="PKR">PKR (Rs)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="SAR">SAR (Riyal)</option>
                        </select>

                        {/* View Mode Switcher */}
                        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/80">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid className="size-3.5" />
                                <span className="hidden sm:inline">Grid</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                                title="Table View"
                            >
                                <List className="size-3.5" />
                                <span className="hidden sm:inline">Table</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Projects Display Content */}
                {viewMode === 'grid' ? (
                    /* Responsive Grid Card View (No Horizontal Scrollbar) */
                    <div className="space-y-6">
                        {projects.data.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {projects.data.map((proj) => (
                                    <div
                                        key={proj.id}
                                        className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all duration-200"
                                    >
                                        {/* Top: Client & Status */}
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                {proj.client ? (
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/60">
                                                            <Building className="size-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate block">
                                                                {proj.client.name}
                                                            </span>
                                                            <span className="text-slate-400 font-mono text-[10px] block">
                                                                {proj.client.client_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">Unassigned Client</span>
                                                )}

                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 inline-flex items-center gap-1 ${
                                                    proj.status === 'in_progress'
                                                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                                        : proj.status === 'completed'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : proj.status === 'on_hold'
                                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                }`}>
                                                    {proj.status === 'in_progress' ? 'In Progress' : proj.status === 'completed' ? 'Completed' : proj.status === 'on_hold' ? 'On Hold' : 'Cancelled'}
                                                </span>
                                            </div>

                                            {/* Project Name & Notes */}
                                            <div>
                                                <Link
                                                    href={`/website-projects/${proj.id}`}
                                                    className="font-extrabold text-slate-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left line-clamp-1 block"
                                                >
                                                    {proj.project_name}
                                                </Link>
                                                {proj.notes && (
                                                    <p className="text-slate-400 text-xs line-clamp-2 mt-1 font-normal">
                                                        {proj.notes}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Budget & Timeline Box */}
                                            <div className="grid grid-cols-2 gap-2 pt-2">
                                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget</span>
                                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block truncate">
                                                        {proj.currency} {Number(proj.total_budget).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deadline</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs mt-0.5 block truncate">
                                                        {formatDateOnly(proj.deadline)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1.5 pt-1">
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Progress</span>
                                                    <span className="text-slate-900 dark:text-white">{proj.progress_percentage}%</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            proj.progress_percentage >= 100
                                                                ? 'bg-emerald-500'
                                                                : proj.progress_percentage >= 50
                                                                ? 'bg-blue-600'
                                                                : 'bg-indigo-500'
                                                        }`}
                                                        style={{ width: `${proj.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Actions Footer */}
                                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {proj.payments?.length || 0} Milestones
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                <Link
                                                    href={`/website-projects/${proj.id}`}
                                                    className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                    title="View Full Project Details"
                                                >
                                                    <Eye className="size-3.5" />
                                                </Link>
                                                <Link
                                                    href={`/website-projects/${proj.id}/edit`}
                                                    className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                    title="Edit Website Project"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => setDeletingProject(proj)}
                                                    className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                    title="Delete Website Project"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 italic">
                                No website projects found. Click <strong>Add Website Project</strong> to create one.
                            </div>
                        )}

                        <Pagination meta={projects} />
                    </div>
                ) : (
                    /* Table View */
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4">Client & Code</th>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4">Project Name</th>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4">Total Budget</th>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4">Deadline & Timeline</th>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4">Completion Progress</th>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4">Status</th>
                                        <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {projects.data.length > 0 ? (
                                        projects.data.map((proj) => (
                                            <tr key={proj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                {/* Client Info */}
                                                <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                    {proj.client ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                                                                <Building className="size-4" />
                                                            </div>
                                                            <div>
                                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                                                    {proj.client.name}
                                                                </span>
                                                                <span className="text-slate-400 font-mono text-[10px] block">
                                                                    {proj.client.client_code}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unassigned Client</span>
                                                    )}
                                                </td>

                                                {/* Project Title */}
                                                <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                    <Link
                                                        href={`/website-projects/${proj.id}`}
                                                        className="font-extrabold text-slate-900 dark:text-white text-xs hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left block"
                                                    >
                                                        {proj.project_name}
                                                    </Link>
                                                    {proj.notes && (
                                                        <span className="text-slate-400 text-[11px] truncate max-w-xs block mt-0.5">
                                                            {proj.notes}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Budget */}
                                                <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                    <div className="flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                                        <BadgeDollarSign className="size-4" />
                                                        <span>{proj.currency} {Number(proj.total_budget).toLocaleString()}</span>
                                                    </div>
                                                </td>

                                                {/* Deadline */}
                                                <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                    <div className="space-y-1">
                                                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-100 dark:border-blue-900/40 inline-flex items-center gap-1">
                                                            <Calendar className="size-3" />
                                                            <span>Deadline: {formatDateOnly(proj.deadline)}</span>
                                                        </span>
                                                        {proj.start_date && (
                                                            <span className="text-[10px] text-slate-400 block font-medium">
                                                                Started: {formatDateOnly(proj.start_date)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Progress Bar */}
                                                <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                    <div className="space-y-1.5 w-32">
                                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                                            <span className="text-slate-700 dark:text-slate-300">{proj.progress_percentage}%</span>
                                                            <span className="text-slate-400 text-[10px]">Complete</span>
                                                        </div>
                                                        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    proj.progress_percentage >= 100
                                                                        ? 'bg-emerald-500'
                                                                        : proj.progress_percentage >= 50
                                                                        ? 'bg-blue-600'
                                                                        : 'bg-indigo-500'
                                                                }`}
                                                                style={{ width: `${proj.progress_percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3 sm:px-6 sm:py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                                        proj.status === 'in_progress'
                                                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                                            : proj.status === 'completed'
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : proj.status === 'on_hold'
                                                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                    }`}>
                                                        {proj.status === 'in_progress' ? (
                                                            <>
                                                                <Clock className="size-3" />
                                                                <span>In Progress</span>
                                                            </>
                                                        ) : proj.status === 'completed' ? (
                                                            <>
                                                                <CheckCircle2 className="size-3" />
                                                                <span>Completed</span>
                                                            </>
                                                        ) : proj.status === 'on_hold' ? (
                                                            <>
                                                                <PauseCircle className="size-3" />
                                                                <span>On Hold</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="size-3" />
                                                                <span>Cancelled</span>
                                                            </>
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link
                                                            href={`/website-projects/${proj.id}`}
                                                            className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="View Full Project Details"
                                                        >
                                                            <Eye className="size-3.5" />
                                                        </Link>
                                                        <Link
                                                            href={`/website-projects/${proj.id}/edit`}
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Edit Website Project"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeletingProject(proj)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Delete Website Project"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                                No website projects found. Click <strong>Add Website Project</strong> to create one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination meta={projects} />
                    </div>
                )}

                {/* VIEW PROJECT DETAILS & MILESTONES DRAWER / MODAL */}
                {viewingProject && (() => {
                    const totalPaid = viewingProject.payments
                        ? viewingProject.payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
                        : 0;

                    const totalPending = viewingProject.payments
                        ? viewingProject.payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0)
                        : 0;

                    const totalBudget = Number(viewingProject.total_budget || 0);

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
                            <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xl space-y-3 my-auto animate-in fade-in zoom-in-95 duration-200">
                                {/* Header */}
                                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/60">
                                            <Building className="size-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                                                    {viewingProject.project_name}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                                    viewingProject.status === 'in_progress'
                                                        ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                                        : viewingProject.status === 'completed'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : viewingProject.status === 'on_hold'
                                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                }`}>
                                                    {viewingProject.status === 'in_progress' ? 'In Progress' : viewingProject.status === 'completed' ? 'Completed' : viewingProject.status === 'on_hold' ? 'On Hold' : 'Cancelled'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                                <span>Client: <strong className="text-slate-700 dark:text-slate-300">{viewingProject.client?.name || 'Unassigned'}</strong></span>
                                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                    {viewingProject.client?.client_code || 'N/A'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setViewingProject(null)}
                                        className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>

                                {/* Financial & Timeline Key Metrics */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Budget</p>
                                        <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                                            {viewingProject.currency} {totalBudget.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Paid</p>
                                        <p className="font-extrabold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm mt-0.5">
                                            {viewingProject.currency} {totalPaid.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Amount</p>
                                        <p className="font-extrabold text-amber-700 dark:text-amber-400 text-xs sm:text-sm mt-0.5">
                                            {viewingProject.currency} {totalPending.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Target Deadline</p>
                                        <p className="font-extrabold text-blue-700 dark:text-blue-300 text-[11px] mt-0.5">
                                            {formatDateOnly(viewingProject.deadline)}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Bar & Dates */}
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                            <Clock className="size-3 text-blue-600 dark:text-blue-400" />
                                            Progress: {viewingProject.progress_percentage}%
                                        </span>
                                        {viewingProject.start_date && (
                                            <span className="text-[10px] text-slate-400 font-normal">
                                                Started: {formatDateOnly(viewingProject.start_date)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                viewingProject.progress_percentage >= 100
                                                    ? 'bg-emerald-500'
                                                    : viewingProject.progress_percentage >= 50
                                                    ? 'bg-blue-600'
                                                    : 'bg-indigo-500'
                                            }`}
                                            style={{ width: `${viewingProject.progress_percentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Scope Notes */}
                                {viewingProject.notes && (
                                    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1">
                                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <FileText className="size-3 text-indigo-500" /> Project Scope & Specifications
                                        </h4>
                                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-20 overflow-y-auto">
                                            {viewingProject.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Milestone Payment Stages */}
                                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-3.5 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                                        <div>
                                            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                                <Layers className="size-3.5 text-blue-600 dark:text-blue-400" />
                                                Milestone Payments ({viewingProject.payments?.length || 0})
                                            </h4>
                                        </div>
                                        <Link
                                            href="/website-payments"
                                            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0"
                                        >
                                            <span>Manage Milestones →</span>
                                        </Link>
                                    </div>

                                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                        {!viewingProject.payments || viewingProject.payments.length === 0 ? (
                                            <div className="p-3 text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-400 text-[11px] italic">
                                                No milestone payments recorded for this project yet.
                                            </div>
                                        ) : (
                                            viewingProject.payments.map((p) => (
                                                <div
                                                    key={p.id}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs text-xs"
                                                >
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                                                                {p.milestone_title}
                                                            </span>
                                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                                                                {p.payment_stage}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                                                            {p.payment_method && (
                                                                <span>Method: <strong className="text-slate-600 dark:text-slate-300">{p.payment_method}</strong></span>
                                                            )}
                                                            {p.paid_at && (
                                                                <span>Paid on: <strong className="text-slate-600 dark:text-slate-300">{formatDateOnly(p.paid_at)}</strong></span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                                                        <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                                                            {viewingProject.currency} {Number(p.amount).toLocaleString()}
                                                        </span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-flex items-center gap-1 ${
                                                            p.status === 'paid'
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        }`}>
                                                            {p.status === 'paid' ? 'Paid' : 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Project Tasks Summary */}
                                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/20 p-3.5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                            <CheckSquare className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                                            Project Tasks ({viewingProject.tasks?.length || 0})
                                        </h4>
                                        <Link
                                            href={`/project-tasks?project_id=${viewingProject.id}`}
                                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                                        >
                                            <span>Manage Tasks →</span>
                                        </Link>
                                    </div>

                                    {!viewingProject.tasks || viewingProject.tasks.length === 0 ? (
                                        <p className="text-[11px] text-slate-400 italic">No tasks created for this project yet.</p>
                                    ) : (
                                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                                            {viewingProject.tasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{task.task_title}</span>
                                                        {task.assigned_employee && (
                                                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                @{task.assigned_employee.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                                                        task.status === 'completed'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : task.status === 'in_progress'
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-end gap-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                    <Link
                                        href={`/website-projects/${viewingProject.id}/edit`}
                                        className="h-9 px-3.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5"
                                    >
                                        <Edit2 className="size-3.5" />
                                        <span>Edit Project</span>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setViewingProject(null)}
                                        className="h-9 px-4 text-xs font-bold rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity"
                                    >
                                        Close Preview
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Delete Confirmation Modal */}
                {deletingProject && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                                        Delete Website Project?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">"{deletingProject.project_name}"</span> for client {deletingProject.client?.name}?
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingProject(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <div className="flex items-center gap-2">
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </div>
                                    ) : (
                                        <span>Delete</span>
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
