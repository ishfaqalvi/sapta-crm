import Pagination, { type PaginatedData } from '@/components/pagination';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeDollarSign,
    Calendar,
    CheckCircle2,
    Clock,
    Coins,
    Edit2,
    Eye,
    Globe,
    LayoutGrid,
    List,
    LoaderCircle,
    PauseCircle,
    Plus,
    Receipt,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface ProjectTaskItem {
    id: number;
    task_title: string;
    priority: string;
    status: string;
}

export interface WebsiteProjectData {
    id: number;
    client_id: number;
    category_id?: number | null;
    category?: {
        id: number;
        name: string;
    } | null;
    project_name: string;
    total_budget: number | string;
    currency: string;
    exchange_rate: number | string;
    total_budget_pkr: number | string;
    start_date: string | null;
    deadline: string | null;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    notes: string | null;
    created_at: string;
    payments?: any[];
    tasks?: ProjectTaskItem[];
}

interface ClientPortalProjectsIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    projects: PaginatedData<WebsiteProjectData>;
    stats: {
        total: number;
        in_progress: number;
        on_hold: number;
        completed: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function ClientPortalProjectsIndex({
    client,
    projects,
    stats,
    filters,
}: ClientPortalProjectsIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Projects', href: '/client-portal/projects' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [deletingProject, setDeletingProject] = useState<WebsiteProjectData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/client-portal/projects',
                {
                    search: searchQuery,
                    status: selectedStatus,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatus]);

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

    const handleDelete = () => {
        if (!deletingProject || isDeleting) return;
        setIsDeleting(true);
        router.delete(`/client-portal/projects/destroy/${deletingProject.id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                setDeletingProject(null);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    // Calculate budget metrics helper
    const getProjectFinancials = (proj: WebsiteProjectData) => {
        const total = typeof proj.total_budget === 'number' ? proj.total_budget : parseFloat(proj.total_budget || '0');
        const collected = (proj.payments || [])
            .filter((p: any) => p.status === 'paid')
            .reduce((sum: number, p: any) => sum + (typeof p.amount === 'number' ? p.amount : parseFloat(p.amount || '0')), 0);
        const remaining = Math.max(0, total - collected);
        return { total, collected, remaining };
    };

    return (
        <ClientPortalLayout client={client} activeTab="projects">
            <Head title="Projects" />

            <div className="flex h-full flex-1 flex-col gap-6 p-2 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Projects & Deliverables
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Track client projects, total budget, collected payments, remaining balances, tasks, and project credentials.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-projects') && (
                        <Link
                            href="/client-portal/projects/create"
                            className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Create New Project</span>
                        </Link>
                    )}
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Projects</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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

                {/* Filters Toolbar & View Switcher */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by project name..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="in_progress">In Progress</option>
                            <option value="on_hold">On Hold</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/80">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid'
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                <LayoutGrid className="size-3.5" />
                                <span>Grid</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table'
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                <List className="size-3.5" />
                                <span>Table</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* DISPLAY CONTENT: GRID VS TABLE */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {projects.data.length === 0 ? (
                            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 italic">
                                No projects found.
                            </div>
                        ) : (
                            projects.data.map((proj) => {
                                const { total, collected, remaining } = getProjectFinancials(proj);
                                return (
                                    <div
                                        key={proj.id}
                                        className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 p-5 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all duration-200"
                                    >
                                        <div className="space-y-3.5">
                                            {/* Category & Status */}
                                            <div className="flex items-center justify-between gap-2">
                                                {proj.category ? (
                                                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                        {proj.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                        General Project
                                                    </span>
                                                )}

                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${proj.status === 'in_progress'
                                                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60'
                                                        : proj.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                                        }`}
                                                >
                                                    {proj.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <div>
                                                <Link
                                                    href={`/client-portal/projects/${proj.id}`}
                                                    className="font-extrabold text-slate-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1 block"
                                                >
                                                    {proj.project_name}
                                                </Link>
                                                {proj.notes && (
                                                    <p className="text-slate-400 text-xs line-clamp-2 mt-1 font-normal">
                                                        {proj.notes}
                                                    </p>
                                                )}
                                            </div>

                                            {/* FINANCIAL METRICS GRID (Total, Collected, Remaining) */}
                                            <div className="grid grid-cols-3 gap-2 pt-1">
                                                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                                        Total Budget
                                                    </span>
                                                    <span className="font-extrabold text-slate-900 dark:text-white text-xs mt-0.5 block truncate">
                                                        {proj.currency} {total.toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                                                        Collected
                                                    </span>
                                                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xs mt-0.5 block truncate">
                                                        {proj.currency} {collected.toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="p-2.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                                                        Remaining
                                                    </span>
                                                    <span className="font-extrabold text-amber-700 dark:text-amber-300 text-xs mt-0.5 block truncate">
                                                        {proj.currency} {remaining.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1.5 pt-1">
                                                <div className="flex items-center justify-between text-xs font-bold">
                                                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Completion Progress</span>
                                                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{proj.progress_percentage}%</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                                                        style={{ width: `${proj.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer Actions & Timeline */}
                                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                <Clock className="size-3.5 text-amber-500" />
                                                <span>Deadline: {formatDateOnly(proj.deadline)}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <Link
                                                    href={`/client-portal/projects/${proj.id}`}
                                                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white dark:hover:text-white hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.99] transition-all text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Eye className="size-3.5" />
                                                    <span>Open Project</span>
                                                </Link>
                                                {hasPermission(user, 'edit-client-portal-projects') && (
                                                    <Link
                                                        href={`/client-portal/projects/${proj.id}/edit`}
                                                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                                        title="Edit Project"
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </Link>
                                                )}
                                                {hasPermission(user, 'delete-client-portal-projects') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingProject(proj)}
                                                        className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                                        title="Delete Project"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* Table View */
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs w-full min-w-0">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-[950px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                                        <th className="px-6 py-4 whitespace-nowrap">Project Title</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Total Budget</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Collected</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Remaining</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Deadline</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Progress</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                    {projects.data.length > 0 ? (
                                        projects.data.map((proj) => {
                                            const { total, collected, remaining } = getProjectFinancials(proj);
                                            return (
                                                <tr key={proj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap max-w-xs">
                                                        {proj.category && (
                                                            <span className="inline-block px-2 py-0.5 mb-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                                {proj.category.name}
                                                            </span>
                                                        )}
                                                        <Link href={`/client-portal/projects/${proj.id}`} className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors text-sm block truncate">
                                                            {proj.project_name}
                                                        </Link>
                                                    </td>

                                                    <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                                                        {proj.currency} {total.toLocaleString()}
                                                    </td>

                                                    <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                        {proj.currency} {collected.toLocaleString()}
                                                    </td>

                                                    <td className="px-6 py-4 font-extrabold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                        {proj.currency} {remaining.toLocaleString()}
                                                    </td>

                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                                        <span className="flex items-center gap-1.5 font-semibold">
                                                            <Clock className="size-3.5 text-amber-500" />
                                                            {formatDateOnly(proj.deadline)}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="w-28 space-y-1">
                                                            <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                                <span>Progress</span>
                                                                <span className="text-blue-600 dark:text-blue-400 font-black">{proj.progress_percentage}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                                <div
                                                                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                                                    style={{ width: `${proj.progress_percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${proj.status === 'in_progress'
                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60'
                                                            : proj.status === 'completed'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                                            }`}>
                                                            {proj.status.replace('_', ' ')}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Link
                                                                href={`/client-portal/projects/${proj.id}`}
                                                                className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white dark:hover:text-white hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center shadow-2xs"
                                                                title="View Project Hub"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Link>

                                                            {hasPermission(user, 'edit-client-portal-projects') && (
                                                                <Link
                                                                    href={`/client-portal/projects/${proj.id}/edit`}
                                                                    className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                                    title="Edit Project"
                                                                >
                                                                    <Edit2 className="size-3.5" />
                                                                </Link>
                                                            )}

                                                            {hasPermission(user, 'delete-client-portal-projects') && (
                                                                <button
                                                                    onClick={() => setDeletingProject(proj)}
                                                                    className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                    title="Delete Project"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                                                No projects found for this portal account.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                <Pagination meta={projects} />

                {/* DELETE MODAL */}
                {deletingProject && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Project?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete <strong>"{deletingProject.project_name}"</strong>?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingProject(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Project</span>
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
