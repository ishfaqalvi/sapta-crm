import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileText,
    Receipt,
    Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Invoices',
        href: '/invoices',
    },
];

export interface InvoiceListItem {
    id: number;
    invoice_number: string;
    client_id: number;
    website_project_id?: number;
    currency_code: string;
    exchange_rate_to_pkr: number;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    discount: number;
    total_amount: number;
    total_amount_pkr: number;
    issue_date: string;
    due_date: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    client?: {
        id: number;
        name: string;
        company_name?: string;
        email?: string;
    };
    website_project?: {
        id: number;
        project_name: string;
    };
}

interface InvoicesIndexProps {
    invoices: PaginatedData<InvoiceListItem>;
    stats: {
        total_invoiced_pkr: number;
        total_paid_pkr: number;
        total_pending_pkr: number;
        overdue_count: number;
    };
    filters: {
        search?: string;
        status?: string;
        client_id?: string;
    };
    clients: Array<{ id: number; name: string; company_name?: string }>;
}

export default function InvoicesIndex({ invoices, stats, filters, clients }: InvoicesIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [clientFilter, setClientFilter] = useState(filters.client_id || '');

    const clientFilterOptions = [
        { value: '', label: 'All Clients', subLabel: 'Show invoices for all clients' },
        ...clients.map((c) => ({
            value: String(c.id),
            label: c.name,
            subLabel: c.company_name || 'Individual Client',
        })),
    ];

    // Debounced Filter Effect
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/invoices',
                {
                    search: searchQuery || undefined,
                    status: statusFilter || undefined,
                    client_id: clientFilter || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter, clientFilter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices Directory" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Invoices & Client Receipts Directory
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Browse professional client invoices, multi-currency billing records, and downloadable PDF receipts.
                        </p>
                    </div>
                </div>

                {/* Stat KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced (PKR)</p>
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                                PKR {Number(stats.total_invoiced_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <FileText className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected (PKR)</p>
                            <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                                PKR {Number(stats.total_paid_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Dues (PKR)</p>
                            <h3 className="text-lg font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                                PKR {Number(stats.total_pending_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue Invoices</p>
                            <h3 className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                                {stats.overdue_count} Overdue
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertTriangle className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by invoice number, client name, or project title..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white px-3 focus:outline-none focus:border-blue-600 transition-all"
                        >
                            <option value="">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <div className="w-full md:w-64">
                            <SearchableSelect
                                options={clientFilterOptions}
                                value={clientFilter}
                                onChange={(val) => setClientFilter(val)}
                                placeholder="Filter by Client"
                                searchPlaceholder="Type client name..."
                            />
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Invoice # & Client</th>
                                    <th className="px-6 py-4">Issue & Due Date</th>
                                    <th className="px-6 py-4">Billing Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {invoices.data.length > 0 ? (
                                    invoices.data.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Invoice # & Client */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                                                        <FileText className="size-4" />
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={`/invoices/${inv.id}`}
                                                            className="font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm block font-mono"
                                                        >
                                                            {inv.invoice_number}
                                                        </Link>
                                                        <span className="text-xs text-slate-500 block">
                                                            {inv.client?.company_name || inv.client?.name || 'Unassigned Client'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Dates */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <span className="font-semibold text-slate-900 dark:text-white block">
                                                        Issued: {new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 block">
                                                        Due: {new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Billing Amount */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono block">
                                                        {inv.currency_code} {Number(inv.total_amount).toFixed(2)}
                                                    </span>
                                                    {inv.currency_code !== 'PKR' && (
                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono block">
                                                            PKR {Number(inv.total_amount_pkr).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Pill */}
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                                                        inv.status === 'paid'
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : inv.status === 'sent'
                                                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                            : inv.status === 'overdue'
                                                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                            : inv.status === 'cancelled'
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                    }`}
                                                >
                                                    {inv.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <a
                                                        href={`/invoices/${inv.id}/pdf`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="size-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                        title="Download PDF Invoice"
                                                    >
                                                        <Download className="size-3.5" />
                                                    </a>

                                                    <Link
                                                        href={`/invoices/${inv.id}`}
                                                        className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                                        title="View Details"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            No invoices found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={invoices} />
                </div>
            </div>
        </AppLayout>
    );
}
