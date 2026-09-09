import Pagination, { type PaginatedData } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    FolderKanban,
    Layers,
    ListTodo,
    PauseCircle,
    Search,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface ProjectListItem {
    id: number;
    client_id: number;
    project_name: string;
    category?: {
        id: number;
        name: string;
    } | null;
    client?: {
        id: number;
        name: string;
        company_name?: string;
        client_code: string;
    } | null;
    start_date: string | null;
    deadline: string | null;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    tasks_count: number;
    created_at: string | null;
}

interface ProjectsIndexProps {
    projects: PaginatedData<ProjectListItem>;
    stats: {
        total: number;
        in_progress: number;
        on_hold: number;
        completed: number;
        cancelled: number;
    };
    clients: Array<{
        id: number;
        name: string;
        client_code: string;
        company_name?: string;
    }>;
    categories: Array<{
        id: number;
        name: string;
    }>;
    filters: {
        search?: string;
        status?: string;
        client_id?: string;
        category_id?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Projects Directory', href: '/projects' },
];

export default function ProjectsIndex({ projects, stats, clients, categories, filters }: ProjectsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [clientId, setClientId] = useState(filters.client_id || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                route('projects.index'),
                {
                    search: search || undefined,
                    status: status || undefined,
                    client_id: clientId || undefined,
                    category_id: categoryId || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search, status, clientId, categoryId]);

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Completed</span>
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
                        <span>In Progress</span>
                    </span>
                );
            case 'on_hold':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <PauseCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
                        <span>On Hold</span>
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <XCircle className="size-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Cancelled</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {st}
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects Directory" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Title & Operational Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400">
                                <FolderKanban className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Projects Directory
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    Operational overview of client projects, milestones, task timelines, and technical assets.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Cards (Strictly Non-Financial) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
                        <div className="size-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <FolderKanban className="size-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Projects</span>
                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.total}</span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
                        <div className="size-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Clock className="size-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">In Progress</span>
                            <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{stats.in_progress}</span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
                        <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <PauseCircle className="size-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">On Hold</span>
                            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{stats.on_hold}</span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
                        <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="size-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search projects or clients..."
                                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                            />
                        </div>

                        {/* Client Filter */}
                        <div>
                            <select
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-medium"
                            >
                                <option value="">All Clients</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.client_code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-medium"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-medium"
                            >
                                <option value="">All Statuses</option>
                                <option value="in_progress">In Progress</option>
                                <option value="on_hold">On Hold</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Project & Category</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Progress</th>
                                    <th className="px-6 py-4">Timeline</th>
                                    <th className="px-6 py-4 text-center">Tasks</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {projects.data.length > 0 ? (
                                    projects.data.map((proj) => (
                                        <tr key={proj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Project Name & Category */}
                                            <td className="px-6 py-4">
                                                <div>
                                                    <Link
                                                        href={route('projects.show', proj.id)}
                                                        className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                                                    >
                                                        <span>{proj.project_name}</span>
                                                    </Link>
                                                    {proj.category && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-0.5">
                                                            <Layers className="size-3" />
                                                            <span>{proj.category.name}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Client Info */}
                                            <td className="px-6 py-4">
                                                {proj.client ? (
                                                    <div>
                                                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                                            {proj.client.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                                                            {proj.client.client_code}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned</span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(proj.status)}
                                            </td>

                                            {/* Progress */}
                                            <td className="px-6 py-4">
                                                <div className="w-28 space-y-1">
                                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                                        <span className="text-slate-700 dark:text-slate-300">{proj.progress_percentage}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                proj.progress_percentage >= 100
                                                                    ? 'bg-emerald-500'
                                                                    : proj.progress_percentage >= 50
                                                                    ? 'bg-blue-500'
                                                                    : 'bg-amber-500'
                                                            }`}
                                                            style={{ width: `${Math.min(100, Math.max(0, proj.progress_percentage))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Timeline */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-0.5 text-xs">
                                                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                        <Calendar className="size-3 text-slate-400" />
                                                        <span>{proj.start_date || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                                                        <Clock className="size-3 text-rose-500" />
                                                        <span>{proj.deadline || 'No deadline'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Tasks Count */}
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    <ListTodo className="size-3.5 text-slate-500" />
                                                    <span>{proj.tasks_count}</span>
                                                </span>
                                            </td>

                                            {/* Action Button: View Details */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={route('projects.show', proj.id)}
                                                        className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white dark:hover:text-white hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center shadow-2xs"
                                                        title="View Project Details"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                            No projects found matching the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination meta={projects} />
                </div>
            </div>
        </AppLayout>
    );
}
