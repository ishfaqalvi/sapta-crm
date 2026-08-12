import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
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
    Eye,
    Layers,
    LineChart,
    LoaderCircle,
    Lock,
    Package,
    PauseCircle,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    Sparkles,
    StopCircle,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

export interface ClientServiceItem {
    id: number;
    client_id: number;
    category_id?: number | null;
    category?: {
        id: number;
        name: string;
    } | null;
    service_name: string;
    monthly_fee: number | string;
    contract_months: number;
    currency: string;
    start_date: string | null;
    billing_day: number;
    status: 'active' | 'paused' | 'stopped';
    notes: string | null;
    paid_payments_count?: number;
}

interface ClientPortalServicesIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    services: PaginatedData<ClientServiceItem>;
    stats: {
        total: number;
        active: number;
        paused: number;
        stopped: number;
        monthly_recurring_total: number;
    };
    currencies?: { code: string; name: string; symbol: string }[];
    categories?: { id: number; name: string }[];
    filters?: {
        search?: string;
        status?: string;
        currency?: string;
    };
}

export default function ClientPortalServicesIndex({
    client,
    services,
    stats,
    currencies = [],
    categories = [],
    filters,
}: ClientPortalServicesIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Services', href: '/client-portal/services' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [selectedCurrency, setSelectedCurrency] = useState(filters?.currency || '');

    // Modal state for Create / Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<ClientServiceItem | null>(null);

    // Delete modal state
    const [deletingService, setDeletingService] = useState<ClientServiceItem | null>(null);
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
        service_name: '',
        category_id: '' as string | number,
        monthly_fee: '',
        contract_months: 12 as string | number,
        currency: client.currency || 'AED',
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
                '/client-portal/services',
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
        setEditingService(null);
        clearErrors();
        reset();
        setData({
            service_name: '',
            category_id: '',
            monthly_fee: '',
            contract_months: 12,
            currency: client.currency || 'AED',
            start_date: new Date().toISOString().split('T')[0],
            billing_day: 1,
            status: 'active',
            notes: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: ClientServiceItem) => {
        setEditingService(item);
        clearErrors();
        setData({
            service_name: item.service_name || '',
            category_id: item.category_id || '',
            monthly_fee: item.monthly_fee ? item.monthly_fee.toString() : '',
            contract_months: item.contract_months || 12,
            currency: item.currency || client.currency || 'AED',
            start_date: formatForInput(item.start_date),
            billing_day: item.billing_day || 1,
            status: item.status || 'active',
            notes: item.notes || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingService) {
            put(`/client-portal/services/update/${editingService.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/client-portal/services/store', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!deletingService) return;
        setIsDeleting(true);
        router.delete(`/client-portal/services/destroy/${deletingService.id}`, {
            onSuccess: () => {
                setDeletingService(null);
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
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title="Services & Subscriptions" />

            <div className="p-2 md:p-6 w-full space-y-4">
                {/* Header Title & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Services & Subscriptions
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Overview of your subscribed monthly services, contract durations, and billing due dates.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-services') && (
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add New Service</span>
                        </button>
                    )}
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Services</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Package className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Subscriptions</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Dues Total</p>
                            <h3 className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                                {formatCurrency(stats.monthly_recurring_total, client.currency || 'AED')}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <RefreshCw className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
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
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full lg:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by service name or scope notes..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="stopped">Stopped</option>
                        </select>
                    </div>
                </div>

                {/* Services Table */}
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs w-full min-w-0">
                    <div className="w-full overflow-x-auto scrollbar-thin">
                        <table className="w-full min-w-[850px] text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-4 whitespace-nowrap">Service & Category</th>
                                    <th className="px-4 py-4 whitespace-nowrap">Monthly Fee & Duration</th>
                                    <th className="px-4 py-4 whitespace-nowrap">Due Day</th>
                                    <th className="px-4 py-4 whitespace-nowrap">Start Date</th>
                                    <th className="px-4 py-4 whitespace-nowrap">Status</th>
                                    <th className="px-4 py-4 text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {services.data.length > 0 ? (
                                    services.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="space-y-0.5">
                                                    {item.category && (
                                                        <span className="inline-block px-2 py-0.5 mb-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                            {item.category.name}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 shrink-0">
                                                            <LineChart className="size-4" />
                                                        </div>
                                                        <Link
                                                            href={`/client-portal/services/${item.id}`}
                                                            className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-600 transition-colors truncate"
                                                        >
                                                            {item.service_name}
                                                        </Link>
                                                    </div>
                                                    {item.notes && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 pl-7">
                                                            {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                    {formatCurrency(item.monthly_fee, item.currency || client.currency || '$')}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium block">
                                                    {item.contract_months || 12} Months Duration
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                    Day {item.billing_day} of month
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Calendar className="size-3.5 text-indigo-500" />
                                                    {formatDateOnly(item.start_date)}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border ${getStatusBadgeClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={`/client-portal/services/${item.id}`}
                                                        className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                        title="View Details & Statements"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>

                                                    {hasPermission(user, 'edit-client-portal-services') && (
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Edit Service"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </button>
                                                    )}

                                                    {hasPermission(user, 'delete-client-portal-services') && (
                                                        item.paid_payments_count && item.paid_payments_count > 0 ? (
                                                            <button
                                                                disabled
                                                                className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed flex items-center justify-center shadow-2xs opacity-60"
                                                                title="Service with paid billing records cannot be deleted"
                                                            >
                                                                <Lock className="size-3.5" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeletingService(item)}
                                                                className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                title="Delete Service"
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
                                            No services found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {services.data.length > 0 && <Pagination meta={services} />}

                {/* Create / Edit Service Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                        <LineChart className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            {editingService ? 'Edit Service' : 'Add New Service'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Define monthly fee, contract duration, billing day, and scope.</p>
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
                                    {/* Category SearchableSelect (Required) */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Service Category <span className="text-rose-500">*</span>
                                        </label>
                                        <SearchableSelect
                                            options={categories.map((cat) => ({
                                                value: cat.id,
                                                label: cat.name,
                                            }))}
                                            value={data.category_id}
                                            onChange={(val) => setData('category_id', val)}
                                            placeholder="Select Service Category (Web Maintenance, SEO...)"
                                            searchPlaceholder="Search category..."
                                            required
                                        />
                                        {errors.category_id && <p className="text-rose-500 text-xs font-medium mt-1">{errors.category_id}</p>}
                                    </div>

                                    {/* Service Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Service Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.service_name}
                                            onChange={(e) => setData('service_name', e.target.value)}
                                            placeholder="e.g. Monthly Web Maintenance / SEO Retainer"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${errors.service_name
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {errors.service_name && <p className="text-rose-500 text-xs font-medium mt-1">{errors.service_name}</p>}
                                    </div>

                                    {/* Monthly Fee & Contract Duration */}
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
                                            Contract Duration (Months) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={120}
                                            value={data.contract_months}
                                            onChange={(e) => setData('contract_months', parseInt(e.target.value, 10) || 12)}
                                            placeholder="12"
                                            className="w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                        />
                                    </div>

                                    {/* Currency */}
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
                                                    <option value="AED">AED</option>
                                                    <option value="USD">USD ($)</option>
                                                    <option value="PKR">PKR (Rs)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    {/* Start Date */}
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

                                    {/* Billing Day & Status */}
                                    <div className="grid grid-cols-2 gap-2.5 md:col-span-2">
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                                Billing Day (1 - 31) <span className="text-rose-500">*</span>
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

                                    {/* Notes */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Service Deliverables & Notes
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Add deliverables, scope notes, or terms..."
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
                                            <span>{editingService ? 'Update Service' : 'Save Service'}</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingService && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Delete Service Subscription</h3>
                                    <p className="text-xs text-slate-500 font-medium">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingService.service_name}</strong>?
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingService(null)}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Service</span>
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
