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
    Edit2,
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
        title: 'SEO Retainers',
        href: '/seo-retainers',
    },
];

export interface SeoRetainerItem {
    id: number;
    client_id: number;
    package_name: string;
    monthly_fee: number;
    currency: string;
    start_date: string | null;
    billing_day: number;
    status: 'active' | 'paused' | 'stopped';
    notes: string | null;
    client: Client | null;
}

interface SeoRetainersIndexProps {
    retainers: PaginatedData<SeoRetainerItem>;
    stats: {
        total: number;
        active: number;
        paused: number;
        stopped: number;
    };
    filters?: {
        search?: string;
        status?: string;
        currency?: string;
    };
}

export default function SeoRetainersIndex({ retainers, stats, filters }: SeoRetainersIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(filters?.status || '');
    const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState(filters?.currency || '');

    const [deletingRetainer, setDeletingRetainer] = useState<SeoRetainerItem | null>(null);
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
                '/seo-retainers',
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
        if (!deletingRetainer || isDeleting) return;
        setIsDeleting(true);
        router.delete(`/seo-retainers/${deletingRetainer.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingRetainer(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SEO Retainers" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            SEO Retainers & Active Packages
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage monthly client SEO contracts, package fees, billing dates, and retainer statuses.
                        </p>
                    </div>

                    <Link
                        href="/seo-retainers/create"
                        className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0"
                    >
                        <Plus className="size-4" />
                        <span>Add New SEO Retainer</span>
                    </Link>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Retainers</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <LineChart className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active SEO</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paused SEO</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{stats.paused}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <PauseCircle className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stopped</p>
                            <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{stats.stopped}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <StopCircle className="size-5" />
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
                            placeholder="Search by client name, code, or package title..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="paused">Paused Only</option>
                            <option value="stopped">Stopped Only</option>
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
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">SEO Package</th>
                                    <th className="px-6 py-4">Monthly Fee</th>
                                    <th className="px-6 py-4">Billing Day & Start</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {retainers.data.length > 0 ? (
                                    retainers.data.map((retainer) => (
                                        <tr key={retainer.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Client Info */}
                                            <td className="px-6 py-4">
                                                {retainer.client ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                                                            <Building className="size-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                                                {retainer.client.name}
                                                            </span>
                                                            <span className="text-slate-400 font-mono text-[10px] block">
                                                                {retainer.client.client_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned Client</span>
                                                )}
                                            </td>

                                            {/* Package Name */}
                                            <td className="px-6 py-4">
                                                <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                                                    {retainer.package_name}
                                                </span>
                                                {retainer.notes && (
                                                    <span className="text-slate-400 text-[11px] truncate max-w-xs block mt-0.5">
                                                        {retainer.notes}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Monthly Fee */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                                    <BadgeDollarSign className="size-4" />
                                                    <span>{retainer.currency} {Number(retainer.monthly_fee).toLocaleString()}</span>
                                                    <span className="text-[10px] font-semibold text-slate-400">/mo</span>
                                                </div>
                                            </td>

                                            {/* Billing Day & Start Date */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-100 dark:border-blue-900/40 inline-flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        <span>Due on {retainer.billing_day}th of month</span>
                                                    </span>
                                                    {retainer.start_date && (
                                                        <span className="text-[10px] text-slate-400 block font-medium">
                                                            Started: {retainer.start_date}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                                    retainer.status === 'active'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : retainer.status === 'paused'
                                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                }`}>
                                                    {retainer.status === 'active' ? (
                                                        <>
                                                            <CheckCircle2 className="size-3" />
                                                            <span>Active</span>
                                                        </>
                                                    ) : retainer.status === 'paused' ? (
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

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={`/seo-retainers/${retainer.id}/edit`}
                                                        className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="Edit SEO Retainer"
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeletingRetainer(retainer)}
                                                        className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="Delete SEO Retainer"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No SEO retainers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={retainers} />
                </div>

                {/* Delete Confirmation Modal */}
                {deletingRetainer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                                        Delete SEO Retainer?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Are you sure you want to delete retainer <span className="font-bold text-slate-800 dark:text-slate-200">"{deletingRetainer.package_name}"</span> for client {deletingRetainer.client?.name}?
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingRetainer(null)}
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
