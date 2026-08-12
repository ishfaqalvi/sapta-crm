import Pagination, { type PaginatedData } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Client } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    BadgeDollarSign,
    Building,
    Calendar,
    CheckCircle2,
    Edit2,
    Eye,
    LineChart,
    LoaderCircle,
    PauseCircle,
    Plus,
    Search,
    StopCircle,
    Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Services',
        href: '/services',
    },
];

export interface ClientServiceItem {
    id: number;
    client_id: number;
    category_id?: number | null;
    category?: {
        id: number;
        name: string;
    } | null;
    service_name: string;
    monthly_fee: number;
    contract_months: number;
    currency: string;
    start_date: string | null;
    billing_day: number;
    status: 'active' | 'paused' | 'stopped';
    notes: string | null;
    client: Client | null;
}

interface ClientServicesIndexProps {
    services: PaginatedData<ClientServiceItem>;
    stats: {
        total: number;
        active: number;
        paused: number;
        stopped: number;
    };
    categories?: Array<{ id: number; name: string }>;
    filters?: {
        search?: string;
        status?: string;
        currency?: string;
        category_id?: string;
    };
}

export default function ClientServicesIndex({ services, stats, categories = [], filters }: ClientServicesIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(filters?.status || '');
    const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState(filters?.currency || '');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(filters?.category_id || '');

    const [deletingService, setDeletingService] = useState<ClientServiceItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/services',
                {
                    search: searchQuery,
                    status: selectedStatusFilter,
                    currency: selectedCurrencyFilter,
                    category_id: selectedCategoryFilter,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatusFilter, selectedCurrencyFilter, selectedCategoryFilter]);

    const handleConfirmDelete = () => {
        if (!deletingService || isDeleting) return;
        setIsDeleting(true);
        router.delete(`/services/${deletingService.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingService(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Services Hub" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Client Services Directory
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Overview of monthly client services, retainers, billing cycles, and payment histories.
                        </p>
                    </div>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Services</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <LineChart className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Services</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paused</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{stats.paused}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <PauseCircle className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stopped</p>
                            <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{stats.stopped}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <StopCircle className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search service name, client name or code..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {categories.length > 0 && (
                            <select
                                value={selectedCategoryFilter}
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                            >
                                <option value="">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="stopped">Stopped</option>
                        </select>
                    </div>
                </div>

                {/* Main Table */}
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Service & Category</th>
                                    <th className="px-6 py-4">Monthly Fee & Duration</th>
                                    <th className="px-6 py-4">Billing Day & Start</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {services.data.length > 0 ? (
                                    services.data.map((srv) => (
                                        <tr key={srv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                {srv.client ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                                                            <Building className="size-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                                                {srv.client.name}
                                                            </span>
                                                            <span className="text-slate-400 font-mono text-[10px] block">
                                                                {srv.client.client_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned Client</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {srv.category && (
                                                    <span className="inline-block px-2 py-0.5 mb-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                        {srv.category.name}
                                                    </span>
                                                )}
                                                <Link
                                                    href={`/services/${srv.id}`}
                                                    className="font-extrabold text-slate-900 dark:text-white text-xs hover:text-blue-600 dark:hover:text-blue-400 block"
                                                >
                                                    {srv.service_name}
                                                </Link>
                                                {srv.notes && (
                                                    <span className="text-slate-400 text-[11px] truncate max-w-xs block mt-0.5">
                                                        {srv.notes}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                                    <BadgeDollarSign className="size-4" />
                                                    <span>{srv.currency} {Number(srv.monthly_fee).toLocaleString()}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400">/mo</span>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-400 block">
                                                    Duration: {srv.contract_months || 12} Months
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-100 dark:border-blue-900/40 inline-flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        <span>Due on {srv.billing_day}th of month</span>
                                                    </span>
                                                    {srv.start_date && (
                                                        <span className="text-[10px] text-slate-400 block font-medium">
                                                            Started: {srv.start_date}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                                    srv.status === 'active'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : srv.status === 'paused'
                                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                }`}>
                                                    {srv.status === 'active' ? (
                                                        <>
                                                            <CheckCircle2 className="size-3" />
                                                            <span>Active</span>
                                                        </>
                                                    ) : srv.status === 'paused' ? (
                                                        <>
                                                            <PauseCircle className="size-3" />
                                                            <span>Paused</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <StopCircle className="size-3" />
                                                            <span>Stopped</span>
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={`/services/${srv.id}`}
                                                        className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                        title="View Details & Invoices"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No services found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={services} />
                </div>
            </div>
        </AppLayout>
    );
}
