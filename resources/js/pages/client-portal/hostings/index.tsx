import Pagination, { type PaginatedData } from '@/components/pagination';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Clock,
    Edit2,
    Eye,
    Globe,
    LoaderCircle,
    Plus,
    Search,
    Server,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

export interface ClientPortalHostingItem {
    id: number;
    client_id: number;
    hosting_title: string;
    provider: string;
    server_ip: string | null;
    server_type: string | null;
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'biennial';
    setup_date: string | null;
    expiry_date: string;
    cost_pkr: number;
    client_price_pkr: number;
    status: 'active' | 'suspended' | 'cancelled' | 'expired';
    primary_domain_id: number | null;
    disk_space: string | null;
    bandwidth: string | null;
    notes: string | null;
    created_at: string;
    primary_domain?: { id: number; domain_name: string } | null;
    invoice?: {
        id: number;
        invoice_number: string;
        issue_date: string;
        due_date: string;
        status: string;
        total_amount: number;
        total_amount_pkr?: number;
        currency_code?: string;
    } | null;
    payments?: Array<{ id: number; invoice?: { id: number } | null }>;
}

interface ClientPortalHostingsIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    hostings: PaginatedData<ClientPortalHostingItem>;
    domains: Array<{ id: number; domain_name: string }>;
    stats: {
        total: number;
        active: number;
        expiring_soon: number;
    };
    filters?: {
        search?: string;
    };
}

export default function ClientPortalHostingsIndex({
    client,
    hostings,
    domains = [],
    stats,
    filters,
}: ClientPortalHostingsIndexProps) {
    const user = (usePage().props.auth as any)?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Web Hosting', href: '/client-portal/hostings' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [editingHosting, setEditingHosting] = useState<ClientPortalHostingItem | null>(null);
    const [deletingHosting, setDeletingHosting] = useState<ClientPortalHostingItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm({
        hosting_title: '',
        provider: 'Hetzner',
        server_ip: '',
        server_type: 'cPanel Shared',
        billing_cycle: 'annual',
        expiry_date: '',
        client_price_pkr: '',
        primary_domain_id: '',
        disk_space: '',
        bandwidth: '',
        notes: '',
    });

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            const url = new URL(window.location.href);
            if (searchQuery) url.searchParams.set('search', searchQuery);
            else url.searchParams.delete('search');
            window.location.href = url.toString();
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const openAddModal = () => {
        setEditingHosting(null);
        form.reset();
        form.setData({
            hosting_title: '',
            provider: 'Hetzner',
            server_ip: '',
            server_type: 'cPanel Shared',
            billing_cycle: 'annual',
            expiry_date: '',
            client_price_pkr: '',
            primary_domain_id: '',
            disk_space: '',
            bandwidth: '',
            notes: '',
        });
        form.clearErrors();
        setIsAddModalOpen(true);
    };

    const openEditModal = (hosting: ClientPortalHostingItem) => {
        setEditingHosting(hosting);
        form.setData({
            hosting_title: hosting.hosting_title,
            provider: hosting.provider,
            server_ip: hosting.server_ip || '',
            server_type: hosting.server_type || 'cPanel Shared',
            billing_cycle: hosting.billing_cycle,
            expiry_date: hosting.expiry_date ? hosting.expiry_date.split('T')[0] : '',
            client_price_pkr: String(hosting.client_price_pkr || ''),
            primary_domain_id: hosting.primary_domain_id ? String(hosting.primary_domain_id) : '',
            disk_space: hosting.disk_space || '',
            bandwidth: hosting.bandwidth || '',
            notes: hosting.notes || '',
        });
        form.clearErrors();
        setIsAddModalOpen(true);
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingHosting) {
            form.put(`/client-portal/hostings/update/${editingHosting.id}`, {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    setEditingHosting(null);
                    form.reset();
                },
            });
        } else {
            form.post('/client-portal/hostings/store', {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    form.reset();
                },
            });
        }
    };

    const handleDeleteSubmit = () => {
        if (!deletingHosting || isDeleting) return;
        setIsDeleting(true);
        router.delete(`/client-portal/hostings/destroy/${deletingHosting.id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                setDeletingHosting(null);
            },
            onError: () => setIsDeleting(false),
        });
    };

    const formatCurrency = (amount: number | string | null | undefined) => {
        const num = Number(amount || 0);
        const curr = client.currency || 'USD';
        const symbol =
            curr === 'PKR' ? 'Rs ' : curr === 'USD' ? '$' : curr === 'AED' ? 'AED ' : curr === 'SAR' ? 'SAR ' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr + ' ';
        return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getDaysRemaining = (expiryDateStr: string) => {
        const expiry = new Date(expiryDateStr);
        const today = new Date();
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title={`Web Hosting | ${client.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Server className="size-5 text-blue-600 dark:text-blue-400" />
                            Web Hosting Services & Servers
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Manage cloud servers, shared hosting accounts, billing cycles, and renewal dates.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-hostings') && (
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="h-10 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
                        >
                            <Plus className="size-4" />
                            <span>Add Hosting Service</span>
                        </button>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Hostings</p>
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <Server className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Services</p>
                            <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Expiring in 30 Days</p>
                            <h3 className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{stats.expiring_soon}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                            <Clock className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search hostings by name, server IP, provider..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
                        />
                    </div>
                </div>

                {/* HOSTINGS TABLE */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-5 py-3.5">Hosting Package</th>
                                    <th className="px-5 py-3.5">Provider / IP</th>
                                    <th className="px-5 py-3.5">Linked Domain</th>
                                    <th className="px-5 py-3.5">Billing Cycle</th>
                                    <th className="px-5 py-3.5">Expiry Date</th>
                                    <th className="px-5 py-3.5">Recurring Price</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {hostings.data.length > 0 ? (
                                    hostings.data.map((hosting) => {
                                        const daysRemaining = getDaysRemaining(hosting.expiry_date);
                                        const isExpired = daysRemaining < 0;
                                        const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 30;
                                        const hasInvoice = (hosting.payments && hosting.payments.some(p => Boolean(p.invoice))) || Boolean(hosting.invoice);

                                        return (
                                            <tr
                                                key={hosting.id}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                                            >
                                                <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                                                            <Server className="size-4" />
                                                        </div>
                                                        <div>
                                                            <Link
                                                                href={`/client-portal/hostings/${hosting.id}`}
                                                                className="text-xs font-black text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer block"
                                                            >
                                                                {hosting.hosting_title}
                                                            </Link>
                                                            <span className="text-[10px] text-slate-400 font-normal">
                                                                {hosting.server_type || 'Shared Hosting'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="space-y-0.5">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {hosting.provider}
                                                        </span>
                                                        {hosting.server_ip && (
                                                            <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                                                                {hosting.server_ip}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    {hosting.primary_domain ? (
                                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold inline-flex items-center gap-1.5">
                                                            <Globe className="size-3 text-blue-600" />
                                                            <span>{hosting.primary_domain.domain_name}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">None</span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap uppercase font-bold text-[10px] text-slate-600 dark:text-slate-300">
                                                    {hosting.billing_cycle.replace('_', ' ')}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                                                    <div className="space-y-0.5">
                                                        <p>{formatDate(hosting.expiry_date)}</p>
                                                        <p
                                                            className={`text-[10px] font-bold ${isExpired
                                                                ? 'text-rose-500'
                                                                : isExpiringSoon
                                                                    ? 'text-amber-500'
                                                                    : 'text-emerald-500'
                                                                }`}
                                                        >
                                                            {isExpired
                                                                ? `Expired ${Math.abs(daysRemaining)}d ago`
                                                                : `${daysRemaining} days left`}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap font-black text-slate-900 dark:text-white text-xs">
                                                    {formatCurrency(hosting.client_price_pkr)}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${hosting.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : hosting.status === 'suspended'
                                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                            }`}
                                                    >
                                                        {hosting.status}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* 1. View / Show */}
                                                        {hasPermission(user, 'view-client-portal-hostings') && (
                                                            <Link
                                                                href={`/client-portal/hostings/${hosting.id}`}
                                                                className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white transition-all flex items-center justify-center cursor-pointer border border-blue-200/50 hover:border-transparent"
                                                                title="View Hosting Details & Billing"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Link>
                                                        )}

                                                        {/* 2. Edit */}
                                                        {hasPermission(user, 'edit-client-portal-hostings') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(hosting)}
                                                                className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-indigo-200/50"
                                                                title="Edit Hosting Record"
                                                            >
                                                                <Edit2 className="size-3.5" />
                                                            </button>
                                                        )}

                                                        {/* 3. Delete */}
                                                        {hasPermission(user, 'delete-client-portal-hostings') && (
                                                            hasInvoice ? (
                                                                <span
                                                                    className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center cursor-not-allowed border border-slate-200/50"
                                                                    title="Hosting packages with generated invoices cannot be deleted"
                                                                >
                                                                    <ShieldCheck className="size-3.5 text-emerald-500" />
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeletingHosting(hosting)}
                                                                    className="size-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-rose-200/50"
                                                                    title="Delete Hosting Record"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-slate-400">
                                            <Server className="size-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                                            <p className="font-semibold text-xs">No web hosting services found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={hostings} />
                </div>

                {/* ADD / EDIT HOSTING MODAL */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="w-full max-w-4xl max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <Server className="size-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            {editingHosting ? 'Edit Hosting Package' : 'Add Web Hosting Service'}
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure hosting specifications and server credentials.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleFormSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Row 1 */}
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Package / Server Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.hosting_title}
                                            onChange={(e) => form.setData('hosting_title', e.target.value)}
                                            placeholder="e.g. Premium Business Cloud Node 1"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.hosting_title
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.hosting_title && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.hosting_title}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Provider / Vendor <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.provider}
                                            onChange={(e) => form.setData('provider', e.target.value)}
                                            placeholder="e.g. Hetzner, AWS, DigitalOcean"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.provider
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.provider && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.provider}</p>
                                        )}
                                    </div>

                                    {/* Row 2 */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Server IP Address
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.server_ip}
                                            onChange={(e) => form.setData('server_ip', e.target.value)}
                                            placeholder="e.g. 192.168.1.1"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.server_ip
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.server_ip && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.server_ip}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Server / Panel Type
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.server_type}
                                            onChange={(e) => form.setData('server_type', e.target.value)}
                                            placeholder="e.g. cPanel, Plesk, VPS"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.server_type
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Linked Domain
                                        </label>
                                        <select
                                            value={form.data.primary_domain_id}
                                            onChange={(e) => form.setData('primary_domain_id', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                                        >
                                            <option value="">No Domain Linked</option>
                                            {domains.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.domain_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Row 3 */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Billing Cycle <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.data.billing_cycle}
                                            onChange={(e) => form.setData('billing_cycle', e.target.value as any)}
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly (3 Mo)</option>
                                            <option value="semi_annual">Semi-Annual (6 Mo)</option>
                                            <option value="annual">Annual (1 Year)</option>
                                            <option value="biennial">Biennial (2 Years)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Recurring Price ({client.currency || 'USD'}) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.data.client_price_pkr}
                                            onChange={(e) => form.setData('client_price_pkr', e.target.value)}
                                            placeholder="e.g. 12000"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.client_price_pkr
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.client_price_pkr && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.client_price_pkr}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Next Expiry / Renewal Date <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={form.data.expiry_date}
                                            onChange={(e) => form.setData('expiry_date', e.target.value)}
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${form.errors.expiry_date
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.expiry_date && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.expiry_date}</p>
                                        )}
                                    </div>

                                    {/* Row 4 */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Disk Space Allocation
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.disk_space}
                                            onChange={(e) => form.setData('disk_space', e.target.value)}
                                            placeholder="e.g. 50 GB NVMe"
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.disk_space
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Bandwidth Allocation
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.bandwidth}
                                            onChange={(e) => form.setData('bandwidth', e.target.value)}
                                            placeholder="e.g. Unlimited / 1TB"
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.bandwidth
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Notes / Account Reference
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.notes}
                                            onChange={(e) => form.setData('notes', e.target.value)}
                                            placeholder="e.g. cPanel username, server tag..."
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.notes
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.notes && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.notes}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {form.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>{editingHosting ? 'Update Package' : 'Save Hosting Service'}</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE HOSTING CONFIRMATION MODAL */}
                {deletingHosting && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingHosting(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Hosting Package?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete hosting <strong className="text-slate-900 dark:text-white">"{deletingHosting.hosting_title}"</strong>?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingHosting(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteSubmit}
                                    disabled={isDeleting}
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Package</span>
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
