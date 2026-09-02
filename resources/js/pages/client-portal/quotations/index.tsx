import Pagination, { type PaginatedData } from '@/components/pagination';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    LoaderCircle,
    Pencil,
    Plus,
    Printer,
    Search,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface QuotationLineItem {
    id?: number;
    quotation_id?: number;
    description: string;
    quantity: number;
    unit_price: number | string;
    amount: number | string;
}

export interface QuotationRecord {
    id: number;
    quotation_number: string;
    client_id: number;
    currency_code: string;
    exchange_rate_to_pkr: number;
    subject?: string | null;
    customer_prefix?: string | null;
    customer_name: string;
    customer_email?: string | null;
    customer_phone?: string | null;
    customer_address?: string | null;
    company_name?: string | null;
    company_phone?: string | null;
    company_address?: string | null;
    company_email?: string | null;
    company_whatsapp?: string | null;
    company_logo?: string | null;
    greeting?: string | null;
    opening_text?: string | null;
    closing_text?: string | null;
    subtotal: number | string;
    tax_rate: number | string;
    tax_amount: number | string;
    discount: number | string;
    total_amount: number | string;
    total_amount_pkr: number | string;
    date: string;
    expiry_date?: string | null;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    notes?: string | null;
    terms?: string | null;
    authorized_by_text?: string | null;
    created_at: string;
    items?: QuotationLineItem[];
}

interface ClientPortalQuotationsIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    quotations: PaginatedData<QuotationRecord>;
    stats: {
        total: number;
        accepted_total: number;
        pending_total: number;
        accepted_count: number;
        sent_count: number;
        draft_count: number;
    };
    filters?: {
        search?: string;
        status?: string;
    };
}

export default function ClientPortalQuotationsIndex({
    client,
    quotations,
    stats,
    filters,
}: ClientPortalQuotationsIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Quotations', href: '/client-portal/quotations' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');

    // Modals & Async States
    const [viewingQuotation, setViewingQuotation] = useState<QuotationRecord | null>(null);
    const [deletingQuotation, setDeletingQuotation] = useState<QuotationRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/client-portal/quotations',
                {
                    search: searchQuery || undefined,
                    status: selectedStatus || undefined,
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

    const handleDelete = () => {
        if (!deletingQuotation) return;
        setIsDeleting(true);
        router.delete(`/client-portal/quotations/destroy/${deletingQuotation.id}`, {
            onSuccess: () => {
                setIsDeleting(false);
                setDeletingQuotation(null);
            },
            onError: () => setIsDeleting(false),
            onFinish: () => setIsDeleting(false),
        });
    };

    const handleStatusChange = (quotationId: number, newStatus: string) => {
        setUpdatingStatusId(quotationId);
        router.patch(
            `/client-portal/quotations/${quotationId}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setUpdatingStatusId(null);
                    if (viewingQuotation && viewingQuotation.id === quotationId) {
                        setViewingQuotation((prev) => (prev ? { ...prev, status: newStatus as any } : null));
                    }
                },
            }
        );
    };

    const formatCurrency = (val: number | string, currencyCode: string = client.currency || 'AED') => {
        const num = Number(val) || 0;
        return `${currencyCode} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDateOnly = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '-';
        const cleanDate = dateStr.split('T')[0].split(' ')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const monthIndex = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            if (!isNaN(year) && !isNaN(monthIndex) && !isNaN(day) && monthIndex >= 0 && monthIndex < 12) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${day < 10 ? `0${day}` : `${day}`} ${months[monthIndex]} ${year}`;
            }
        }
        return cleanDate;
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'accepted':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 focus:ring-emerald-500/20';
            case 'sent':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 focus:ring-blue-500/20';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 focus:ring-rose-500/20';
            case 'expired':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 focus:ring-amber-500/20';
            case 'draft':
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700 focus:ring-slate-500/20';
        }
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="quotations">
            <Head title={`Quotations Directory - ${client.name}`} />

            <div className="p-2 md:p-6 w-full space-y-6">
                {/* Header Title & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Quotations Directory
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Manage and track proposals, formal pricing estimates, and quotes for your workspace.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-quotations') && (
                        <Link
                            href="/client-portal/quotations/create"
                            className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto"
                        >
                            <Plus className="size-4" />
                            <span>Create New Quotation</span>
                        </Link>
                    )}
                </div>

                {/* KPI Stat Cards (4 Cards Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Quotations</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                                {stats.accepted_count} Accepted • {stats.sent_count + stats.draft_count} Pending
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Accepted Quotes</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {formatCurrency(stats.accepted_total)}
                            </h3>
                            <p className="text-[10px] text-emerald-600/80 font-bold mt-1">
                                Approved proposals
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending / Sent</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                {formatCurrency(stats.pending_total)}
                            </h3>
                            <p className="text-[10px] text-amber-600/80 font-bold mt-1">
                                Under client review
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Draft Status</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.draft_count}</h3>
                            <p className="text-[10px] text-slate-500 font-semibold mt-1">In preparation</p>
                        </div>
                        <div className="size-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                            <FileText className="size-5" />
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
                            placeholder="Search by quote number, recipient, or items..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses ({stats.total})</option>
                            <option value="draft">Draft ({stats.draft_count})</option>
                            <option value="sent">Sent ({stats.sent_count})</option>
                            <option value="accepted">Accepted ({stats.accepted_count})</option>
                            <option value="rejected">Rejected</option>
                            <option value="expired">Expired</option>
                        </select>

                        {(searchQuery || selectedStatus) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedStatus('');
                                }}
                                className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Direct Table Format */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs w-full min-w-0">
                    <div className="w-full overflow-x-auto scrollbar-thin">
                        <table className="w-full min-w-[750px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                                    <th className="px-6 py-4">Quotation #</th>
                                    <th className="px-6 py-4">Recipient</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Valid Until</th>
                                    <th className="px-6 py-4">Total Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {quotations.data.length > 0 ? (
                                    quotations.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileSpreadsheet className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                    <Link
                                                        href={`/client-portal/quotations/${item.id}`}
                                                        className="font-mono font-bold text-slate-900 dark:text-white text-xs hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    >
                                                        {item.quotation_number}
                                                    </Link>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {item.customer_prefix} {item.customer_name}
                                                </div>
                                                {item.subject && (
                                                    <span className="text-slate-400 text-[11px] block truncate max-w-[200px]">
                                                        {item.subject}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Calendar className="size-3.5 text-indigo-500" />
                                                    {formatDateOnly(item.date)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Clock className="size-3.5 text-amber-500" />
                                                    {formatDateOnly(item.expiry_date)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                                                    {formatCurrency(item.total_amount, item.currency_code)}
                                                </span>
                                                {item.currency_code !== 'PKR' && Number(item.total_amount_pkr || 0) > 0 && (
                                                    <span className="text-[10px] font-normal text-slate-400 block font-mono">
                                                        ≈ PKR {Number(item.total_amount_pkr).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Interactive Inline Status Dropdown */}
                                            <td className="px-6 py-4">
                                                {hasPermission(user, 'edit-client-portal-quotations') ? (
                                                    <div className="relative inline-flex items-center">
                                                        <select
                                                            value={item.status}
                                                            disabled={updatingStatusId === item.id}
                                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                            className={`text-[10px] font-black uppercase tracking-wider rounded-full px-3 py-1 pr-6 border cursor-pointer appearance-none transition-all outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 disabled:opacity-50 ${getStatusBadgeClass(item.status)}`}
                                                            style={{
                                                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                                backgroundPosition: 'right 0.35rem center',
                                                                backgroundRepeat: 'no-repeat',
                                                                backgroundSize: '1.1em 1.1em',
                                                            }}
                                                        >
                                                            <option value="draft">Draft</option>
                                                            <option value="sent">Sent</option>
                                                            <option value="accepted">Accepted</option>
                                                            <option value="rejected">Rejected</option>
                                                            <option value="expired">Expired</option>
                                                        </select>
                                                        {updatingStatusId === item.id && (
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                <LoaderCircle className="size-3 animate-spin text-slate-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border ${getStatusBadgeClass(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setViewingQuotation(item)}
                                                        className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                                        title="Quick View"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </button>

                                                    {hasPermission(user, 'edit-client-portal-quotations') && (
                                                        <Link
                                                            href={`/client-portal/quotations/${item.id}/edit`}
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                                            title="Edit Quotation"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Link>
                                                    )}

                                                    {hasPermission(user, 'print-client-portal-quotations') && (
                                                        <a
                                                            href={`/client-portal/quotations/${item.id}/pdf`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white transition-all flex items-center justify-center cursor-pointer border border-blue-200/50 hover:border-transparent"
                                                            title="Download / Print PDF"
                                                        >
                                                            <Printer className="size-3.5" />
                                                        </a>
                                                    )}

                                                    {hasPermission(user, 'delete-client-portal-quotations') && (
                                                        <button
                                                            onClick={() => setDeletingQuotation(item)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                                            title="Delete Quotation"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                            No quotations found for this account.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {quotations.data.length > 0 && <Pagination meta={quotations} />}
            </div>

            {/* Quick View Quotation Modal */}
            {viewingQuotation && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 custom-scrollbar">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <FileSpreadsheet className="size-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            {viewingQuotation.quotation_number}
                                        </h3>
                                        {hasPermission(user, 'edit-client-portal-quotations') ? (
                                            <select
                                                value={viewingQuotation.status}
                                                disabled={updatingStatusId === viewingQuotation.id}
                                                onChange={(e) => handleStatusChange(viewingQuotation.id, e.target.value)}
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer ${getStatusBadgeClass(viewingQuotation.status)}`}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="sent">Sent</option>
                                                <option value="accepted">Accepted</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="expired">Expired</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeClass(viewingQuotation.status)}`}>
                                                {viewingQuotation.status}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">
                                        Date: {formatDateOnly(viewingQuotation.date)} • Valid Until: {formatDateOnly(viewingQuotation.expiry_date)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingQuotation(null)}
                                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Recipient & Company Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                                <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Prepared For</span>
                                <div className="font-bold text-slate-900 dark:text-white">
                                    {viewingQuotation.customer_prefix} {viewingQuotation.customer_name}
                                </div>
                                {viewingQuotation.customer_phone && (
                                    <div className="text-slate-500 text-[11px]">Phone: {viewingQuotation.customer_phone}</div>
                                )}
                                {viewingQuotation.customer_email && (
                                    <div className="text-slate-500 text-[11px]">Email: {viewingQuotation.customer_email}</div>
                                )}
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                                <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Provider</span>
                                <div className="font-bold text-slate-900 dark:text-white">
                                    {viewingQuotation.company_name || 'AL MUSTAFA FURNITURE MOVERS'}
                                </div>
                                <div className="text-slate-500 text-[11px]">
                                    {viewingQuotation.company_address}
                                </div>
                            </div>
                        </div>

                        {/* Line Items Table */}
                        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden w-full min-w-0">
                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <table className="w-full min-w-[500px] text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                                            <th className="p-3">Description</th>
                                            <th className="p-3 text-center">Qty</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                        {viewingQuotation.items && viewingQuotation.items.length > 0 ? (
                                            viewingQuotation.items.map((item, idx) => (
                                                <tr key={item.id || idx}>
                                                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.description}</td>
                                                    <td className="p-3 text-center font-mono">{item.quantity}</td>
                                                    <td className="p-3 text-right font-mono">{formatCurrency(item.unit_price, viewingQuotation.currency_code)}</td>
                                                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                                                        {formatCurrency(item.amount, viewingQuotation.currency_code)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-slate-400 italic">No line items.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals Breakdown */}
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs font-semibold">
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatCurrency(viewingQuotation.subtotal, viewingQuotation.currency_code)}</span>
                            </div>
                            {Number(viewingQuotation.tax_amount || 0) > 0 && (
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                    <span>Tax ({viewingQuotation.tax_rate}%)</span>
                                    <span className="font-mono">+{formatCurrency(viewingQuotation.tax_amount, viewingQuotation.currency_code)}</span>
                                </div>
                            )}
                            {Number(viewingQuotation.discount || 0) > 0 && (
                                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                    <span>Discount</span>
                                    <span className="font-mono">-{formatCurrency(viewingQuotation.discount, viewingQuotation.currency_code)}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                                <span>Total Amount</span>
                                <span className="text-blue-600 dark:text-blue-400 font-black font-mono">
                                    {formatCurrency(viewingQuotation.total_amount, viewingQuotation.currency_code)}
                                </span>
                            </div>
                        </div>

                        {/* Notes / Terms */}
                        {(viewingQuotation.notes || viewingQuotation.terms) && (
                            <div className="space-y-2 text-xs">
                                {viewingQuotation.notes && (
                                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300">
                                        <strong className="block text-[10px] font-extrabold uppercase tracking-wider mb-1">Quotation Notes</strong>
                                        {viewingQuotation.notes}
                                    </div>
                                )}
                                {viewingQuotation.terms && (
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                                        <strong className="block text-[10px] font-extrabold uppercase tracking-wider mb-1">Terms & Conditions</strong>
                                        {viewingQuotation.terms}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer Action */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                            <a
                                href={`/client-portal/quotations/${viewingQuotation.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                            >
                                <Download className="size-4" />
                                <span>Download PDF Document</span>
                            </a>

                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/client-portal/quotations/${viewingQuotation.id}`}
                                    className="h-10 px-4 rounded-xl bg-[#003796] hover:bg-[#002b75] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <Eye className="size-4" />
                                    <span>Full Document View</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingQuotation && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950">
                                <Trash2 className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Delete Quotation</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Irreversible action</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            Are you sure you want to delete quotation <strong className="text-slate-900 dark:text-white">{deletingQuotation.quotation_number}</strong>? All line items and proposal details will be permanently removed.
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingQuotation(null)}
                                className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <LoaderCircle className="size-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete Quotation</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ClientPortalLayout>
    );
}
