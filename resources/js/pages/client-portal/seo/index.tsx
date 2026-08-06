import Pagination, { type PaginatedData } from '@/components/pagination';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeCheck,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Edit2,
    Layers,
    LineChart,
    LoaderCircle,
    Lock,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

export interface SeoRetainerItem {
    id: number;
    client_id: number;
    package_name: string;
    monthly_fee: number | string;
    currency: string;
    exchange_rate?: number | string;
    monthly_fee_pkr?: number | string;
    start_date: string;
    billing_day: number;
    status: 'active' | 'paused' | 'stopped';
    notes: string | null;
    created_at: string;
    paid_payments_count?: number;
}

interface ClientPortalSeoIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    retainers: PaginatedData<SeoRetainerItem>;
    stats: {
        total: number;
        active: number;
        paused: number;
        stopped: number;
        monthly_recurring_total: number;
    };
    currencies?: { code: string; name: string; symbol: string }[];
    filters?: {
        search?: string;
        status?: string;
        currency?: string;
    };
}

export default function ClientPortalSeoIndex({
    client,
    retainers,
    stats,
    currencies = [],
    filters,
}: ClientPortalSeoIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'SEO Retainers', href: '/client-portal/seo' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [selectedCurrency, setSelectedCurrency] = useState(filters?.currency || '');

    // Modal state for Create / Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRetainer, setEditingRetainer] = useState<SeoRetainerItem | null>(null);

    // Delete modal state
    const [deletingRetainer, setDeletingRetainer] = useState<SeoRetainerItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isFirstRender = useRef(true);

    const formatForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0].split(' ')[0];
    };

    const formatDateOnly = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
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

    const formatCurrency = (val: number | string, currencySymbol: string = client.currency || '$') => {
        const num = Number(val) || 0;
        return `${currencySymbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60';
            case 'paused':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60';
            case 'stopped':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    // Form Hook
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        package_name: '',
        monthly_fee: '',
        currency: client.currency || 'USD',
        start_date: new Date().toISOString().split('T')[0],
        billing_day: 1,
        status: 'active',
        notes: '',
    });

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/client-portal/seo',
                {
                    search: searchQuery,
                    status: selectedStatus,
                    currency: selectedCurrency,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatus, selectedCurrency]);

    const openCreateModal = () => {
        setEditingRetainer(null);
        clearErrors();
        reset();
        setData({
            package_name: '',
            monthly_fee: '',
            currency: client.currency || 'USD',
            start_date: new Date().toISOString().split('T')[0],
            billing_day: 1,
            status: 'active',
            notes: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: SeoRetainerItem) => {
        setEditingRetainer(item);
        clearErrors();
        setData({
            package_name: item.package_name || '',
            monthly_fee: item.monthly_fee ? item.monthly_fee.toString() : '',
            currency: item.currency || client.currency || 'USD',
            start_date: formatForInput(item.start_date),
            billing_day: item.billing_day || 1,
            status: item.status || 'active',
            notes: item.notes || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRetainer(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingRetainer) {
            put(`/client-portal/seo/update/${editingRetainer.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/client-portal/seo/store', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!deletingRetainer) return;
        setIsDeleting(true);
        router.delete(`/client-portal/seo/destroy/${deletingRetainer.id}`, {
            onSuccess: () => {
                setDeletingRetainer(null);
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
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="seo">
            <Head title={`SEO Retainers | ${client.name}`} />

            <div className="p-6 w-full space-y-6">
                {/* Header Title & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            SEO Retainers & Subscriptions
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Manage monthly SEO retainer packages, recurring billing cycle days, and subscription status.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-seo') && (
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add SEO Retainer</span>
                        </button>
                    )}
                </div>

                {/* KPI Stat Cards (Admin Standard) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Subscriptions</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Recurring (MRR)</p>
                            <h3 className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                                {formatCurrency(stats.monthly_recurring_total)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <RefreshCw className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paused / Stopped</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                {stats.paused + stats.stopped}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="size-5" />
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
                            placeholder="Search package name or notes..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="stopped">Stopped</option>
                        </select>

                        {/* Currency Filter */}
                        {currencies.length > 0 && (
                            <select
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                            >
                                <option value="">All Currencies</option>
                                {currencies.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} ({c.symbol})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Table View (Full width layout) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                                    <th className="px-6 py-4">Package Name</th>
                                    <th className="px-6 py-4">Monthly Fee</th>
                                    <th className="px-6 py-4">Billing Day</th>
                                    <th className="px-6 py-4">Start Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {retainers.data.length > 0 ? (
                                    retainers.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 shrink-0">
                                                            <LineChart className="size-4" />
                                                        </div>
                                                        <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                                            {item.package_name}
                                                        </span>
                                                    </div>
                                                    {item.notes && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 pl-7">
                                                            {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                    {formatCurrency(item.monthly_fee, item.currency || client.currency || '$')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium block">per month</span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                    Day {item.billing_day} of month
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Calendar className="size-3.5 text-indigo-500" />
                                                    {formatDateOnly(item.start_date)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border ${getStatusBadgeClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {hasPermission(user, 'edit-client-portal-seo') && (
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Edit SEO Retainer"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                    {hasPermission(user, 'delete-client-portal-seo') && (
                                                        item.paid_payments_count && item.paid_payments_count > 0 ? (
                                                            <button
                                                                disabled
                                                                className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed flex items-center justify-center shadow-2xs opacity-60"
                                                                title="SEO Retainer with paid billing records cannot be deleted"
                                                            >
                                                                <Lock className="size-3.5" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeletingRetainer(item)}
                                                                className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                title="Delete SEO Retainer"
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
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No SEO retainer subscriptions found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {retainers.data.length > 0 && <Pagination meta={retainers} />}

                {/* Create / Edit SEO Retainer Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                        <LineChart className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            {editingRetainer ? 'Edit SEO Retainer' : 'Add New SEO Retainer'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Define monthly fee, billing cycle day, and package scope.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Row 1: Package Name (Full Width) */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            SEO Package Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.package_name}
                                            onChange={(e) => setData('package_name', e.target.value)}
                                            placeholder="e.g. Enterprise Monthly Organic Growth Retainer"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${errors.package_name
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {errors.package_name && <p className="text-rose-500 text-xs font-medium mt-1">{errors.package_name}</p>}
                                    </div>

                                    {/* Row 2: Monthly Fee (Left) & Currency (Right) */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Monthly Fee <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.monthly_fee}
                                            onChange={(e) => setData('monthly_fee', e.target.value)}
                                            placeholder="0.00"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${errors.monthly_fee
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {errors.monthly_fee && <p className="text-rose-500 text-xs font-medium mt-1">{errors.monthly_fee}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Billing Currency <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={data.currency}
                                            onChange={(e) => setData('currency', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 font-mono"
                                        >
                                            {currencies.length > 0 ? (
                                                currencies.map((c) => (
                                                    <option key={c.code} value={c.code}>
                                                        {c.code} ({c.name})
                                                    </option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="USD">USD ($)</option>
                                                    <option value="PKR">PKR (Rs)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="AED">AED</option>
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    {/* Row 3: Start Date (Left) & Billing Day + Status (Right side-by-side) */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Start Date <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                            className="w-full h-10 px-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                                Billing Day <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={31}
                                                value={data.billing_day}
                                                onChange={(e) => setData('billing_day', parseInt(e.target.value, 10) || 1)}
                                                className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                                Status <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value as any)}
                                                className="w-full h-10 px-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                                            >
                                                <option value="active">Active</option>
                                                <option value="paused">Paused</option>
                                                <option value="stopped">Stopped</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Row 4: Notes (Full Width) */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Package Scope & Notes
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Add target keywords, monthly backlink goals, or contract terms..."
                                            className="w-full p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Form Action Buttons */}
                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>{editingRetainer ? 'Update Retainer' : 'Save Retainer'}</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingRetainer && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Delete SEO Retainer?</h3>
                                    <p className="text-xs text-slate-400 font-medium">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingRetainer.package_name}</strong>?
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setDeletingRetainer(null)}
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
                                        <span>Delete Retainer</span>
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
