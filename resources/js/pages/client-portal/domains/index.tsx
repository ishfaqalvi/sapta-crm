import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Edit2,
    Eye,
    Globe,
    LoaderCircle,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

export interface InvoiceHistoryItem {
    id: number;
    invoice_id: number;
    description: string;
    amount: number;
    invoice?: {
        id: number;
        invoice_number: string;
        issue_date: string;
        due_date: string;
        status: string;
        total_amount_pkr: number;
    };
}

export interface ClientPortalDomainItem {
    id: number;
    client_id: number;
    domain_name: string;
    registrar: string;
    registration_date: string | null;
    expiry_date: string;
    renewal_cost_pkr: number;
    client_price_pkr: number;
    auto_renew: boolean;
    has_hosting_bundle: boolean;
    nameserver_1: string | null;
    nameserver_2: string | null;
    nameserver_3: string | null;
    nameserver_4: string | null;
    status: 'active' | 'pending_renewal' | 'expired' | 'transferred';
    notes: string | null;
    created_at: string;
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
    invoice_items?: InvoiceHistoryItem[];
}

interface ClientPortalDomainsIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    domains: PaginatedData<ClientPortalDomainItem>;
    stats: {
        total: number;
        active: number;
        expiring_soon: number;
    };
    filters?: {
        search?: string;
    };
}

export default function ClientPortalDomainsIndex({
    client,
    domains,
    stats,
    filters,
}: ClientPortalDomainsIndexProps) {
    const user = (usePage().props.auth as any)?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Domains & DNS', href: '/client-portal/domains' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [editingDomain, setEditingDomain] = useState<ClientPortalDomainItem | null>(null);
    const [deletingDomain, setDeletingDomain] = useState<ClientPortalDomainItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm({
        domain_name: '',
        registrar: 'Namecheap',
        registration_date: '',
        expiry_date: '',
        client_price_pkr: '',
        auto_renew: false as boolean,
        nameserver_1: '',
        nameserver_2: '',
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
        setEditingDomain(null);
        form.reset();
        form.clearErrors();
        setIsAddModalOpen(true);
    };

    const openEditModal = (domain: ClientPortalDomainItem) => {
        setEditingDomain(domain);
        form.setData({
            domain_name: domain.domain_name,
            registrar: domain.registrar || 'Namecheap',
            registration_date: domain.registration_date ? domain.registration_date.split('T')[0] : '',
            expiry_date: domain.expiry_date ? domain.expiry_date.split('T')[0] : '',
            client_price_pkr: String(domain.client_price_pkr || ''),
            auto_renew: Boolean(domain.auto_renew),
            nameserver_1: domain.nameserver_1 || '',
            nameserver_2: domain.nameserver_2 || '',
            notes: domain.notes || '',
        });
        form.clearErrors();
        setIsAddModalOpen(true);
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingDomain) {
            form.put(`/client-portal/domains/update/${editingDomain.id}`, {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    setEditingDomain(null);
                    form.reset();
                },
            });
        } else {
            form.post('/client-portal/domains/store', {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    form.reset();
                },
            });
        }
    };

    const handleDeleteSubmit = () => {
        if (!deletingDomain || isDeleting) return;
        setIsDeleting(true);
        router.delete(`/client-portal/domains/destroy/${deletingDomain.id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                setDeletingDomain(null);
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

    const isExpiringSoon = (expiryDateStr: string) => {
        const expiry = new Date(expiryDateStr);
        const today = new Date();
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 30;
    };

    const isExpiredDate = (expiryDateStr: string) => {
        const expiry = new Date(expiryDateStr);
        const today = new Date();
        return expiry < today;
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title="Domains & DNS Registrations" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Globe className="size-5 text-blue-600 dark:text-blue-400" />
                            Registered Domains & DNS
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Manage registration dates, renewal dates, DNS records, and domain details.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-domains') && (
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="h-10 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
                        >
                            <Plus className="size-4" />
                            <span>Register Domain Record</span>
                        </button>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Domains</p>
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <Globe className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Domains</p>
                            <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-5" />
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
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search domain name or registrar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                    />
                </div>

                {/* Domains Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Domain Name</th>
                                    <th className="px-6 py-4">Registrar</th>
                                    <th className="px-6 py-4">Reg. Date</th>
                                    <th className="px-6 py-4">Next Renewal</th>
                                    <th className="px-6 py-4">Renewal Price</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {domains.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No domain registrations found.
                                        </td>
                                    </tr>
                                ) : (
                                    domains.data.map((domain) => {
                                        const expiringSoon = isExpiringSoon(domain.expiry_date);
                                        const expired = isExpiredDate(domain.expiry_date);

                                        return (
                                            <tr key={domain.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    {hasPermission(user, 'view-client-portal-domains') ? (
                                                        <Link
                                                            href={`/client-portal/domains/${domain.id}`}
                                                            className="font-extrabold text-blue-600 dark:text-blue-400 text-sm hover:underline text-left block cursor-pointer"
                                                        >
                                                            {domain.domain_name}
                                                        </Link>
                                                    ) : (
                                                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                            {domain.domain_name}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                                                        {domain.registrar}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-500 dark:text-slate-400">
                                                    {formatDate(domain.registration_date)}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap font-bold">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="size-3.5 text-slate-400" />
                                                        <span className={expired ? 'text-rose-600 dark:text-rose-400 font-black' : expiringSoon ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-slate-700 dark:text-slate-300'}>
                                                            {formatDate(domain.expiry_date)}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 font-black text-slate-900 dark:text-white whitespace-nowrap">
                                                    {formatCurrency(domain.client_price_pkr)}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap font-bold capitalize text-slate-800 dark:text-slate-200">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${domain.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : domain.status === 'expired'
                                                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        }`}>
                                                        {domain.status.replace('_', ' ')}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* VIEW DETAILS BUTTON */}
                                                        {hasPermission(user, 'view-client-portal-domains') && (
                                                            <Link
                                                                href={`/client-portal/domains/${domain.id}`}
                                                                className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white transition-all flex items-center justify-center cursor-pointer border border-blue-200/50 hover:border-transparent"
                                                                title="View Domain Details"
                                                            >
                                                                <Eye className="size-3.5" />
                                                            </Link>
                                                        )}

                                                        {/* EDIT BUTTON */}
                                                        {hasPermission(user, 'edit-client-portal-domains') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(domain)}
                                                                className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-indigo-200/50"
                                                                title="Edit Domain"
                                                            >
                                                                <Edit2 className="size-3.5" />
                                                            </button>
                                                        )}

                                                        {/* DELETE BUTTON */}
                                                        {hasPermission(user, 'delete-client-portal-domains') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingDomain(domain)}
                                                                className="size-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-rose-200/50"
                                                                title="Delete Domain"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={domains} />
                </div>

                {/* ADD / EDIT DOMAIN MODAL */}
                {/* ADD / EDIT DOMAIN MODAL */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="w-full max-w-lg max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <Globe className="size-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            {editingDomain ? 'Edit Domain Record' : 'Register Domain Record'}
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            {editingDomain ? 'Update domain registration and renewal dates.' : 'Enter domain registration and renewal dates.'}
                                        </p>
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

                            <form noValidate onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Domain Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.data.domain_name}
                                        onChange={(e) => form.setData('domain_name', e.target.value.toLowerCase().trim())}
                                        placeholder="e.g. mycompany.com"
                                        className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.domain_name
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {form.errors.domain_name && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.domain_name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Registrar Vendor <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.registrar}
                                            onChange={(e) => form.setData('registrar', e.target.value)}
                                            placeholder="e.g. Namecheap, GoDaddy"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.registrar
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.registrar && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.registrar}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Registration Date
                                        </label>
                                        <input
                                            type="date"
                                            value={form.data.registration_date}
                                            onChange={(e) => form.setData('registration_date', e.target.value)}
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${form.errors.registration_date
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.registration_date && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.registration_date}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
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

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Annual Renewal Price ({client.currency || 'USD'}) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.data.client_price_pkr}
                                            onChange={(e) => form.setData('client_price_pkr', e.target.value)}
                                            placeholder="e.g. 4500"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.client_price_pkr
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.client_price_pkr && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.client_price_pkr}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Primary Nameserver (NS1)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.nameserver_1}
                                            onChange={(e) => form.setData('nameserver_1', e.target.value)}
                                            placeholder="e.g. ns1.cloudflare.com"
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.nameserver_1
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.nameserver_1 && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.nameserver_1}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Secondary Nameserver (NS2)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.data.nameserver_2}
                                            onChange={(e) => form.setData('nameserver_2', e.target.value)}
                                            placeholder="e.g. ns2.cloudflare.com"
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.nameserver_2
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {form.errors.nameserver_2 && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.nameserver_2}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Notes / Account Reference
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                        placeholder="Add any specific registrar account details, email or contact info..."
                                        className={`w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${form.errors.notes
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {form.errors.notes && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{form.errors.notes}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {form.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>{editingDomain ? 'Update Domain' : 'Save Domain Record'}</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {deletingDomain && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingDomain(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Domain?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete domain <strong className="text-slate-900 dark:text-white">"{deletingDomain.domain_name}"</strong>?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingDomain(null)}
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
                                        <span>Delete Domain</span>
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
