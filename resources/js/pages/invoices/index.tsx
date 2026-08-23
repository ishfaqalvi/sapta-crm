import Pagination, { type PaginatedData } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    Printer,
    Receipt,
    Search,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface InvoiceItemData {
    id: number;
    invoice_id: number;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    invoiceable_type?: string | null;
    invoiceable_id?: number | null;
}

export interface InvoiceData {
    id: number;
    invoice_number: string;
    client_id: number;
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
    notes?: string | null;
    terms?: string | null;
    created_at: string;
    client?: {
        id: number;
        name: string;
        company_name?: string;
        client_code: string;
    };
    items?: InvoiceItemData[];
}

interface InvoicesIndexProps {
    invoices: PaginatedData<InvoiceData>;
    stats: {
        total_invoiced: number;
        total_paid: number;
        total_unpaid: number;
        overdue_count: number;
    };
    clients: Array<{ id: number; name: string; company_name?: string; client_code: string }>;
    filters?: {
        search?: string;
        status?: string;
        client_id?: string;
    };
}

export default function InvoicesIndex({
    invoices,
    stats,
    clients = [],
    filters,
}: InvoicesIndexProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Invoices & Billing', href: '/invoices' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || 'all');
    const [selectedClient, setSelectedClient] = useState(filters?.client_id || '');

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

            if (selectedStatus && selectedStatus !== 'all') url.searchParams.set('status', selectedStatus);
            else url.searchParams.delete('status');

            if (selectedClient) url.searchParams.set('client_id', selectedClient);
            else url.searchParams.delete('client_id');

            router.visit(url.toString(), { preserveState: true, replace: true });
        }, 350);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatus, selectedClient]);

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 uppercase tracking-wider">
                        PAID
                    </span>
                );
            case 'due':
            case 'sent':
                return (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 uppercase tracking-wider">
                        DUE
                    </span>
                );
            case 'overdue':
                return (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-extrabold border border-rose-200 uppercase tracking-wider">
                        OVERDUE
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-extrabold border border-slate-200 uppercase tracking-wider">
                        CANCELLED
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 uppercase tracking-wider">
                        DUE
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices & Billing Directory" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 max-w-7xl mx-auto w-full">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <Receipt className="size-6 text-blue-600 dark:text-blue-400" />
                            <span>Invoices & Billing</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Directory of generated invoices for client projects, services, domains, and hosting accounts.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</p>
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                                PKR {Number(stats.total_invoiced).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <Receipt className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Collected</p>
                            <h3 className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                PKR {Number(stats.total_paid).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unpaid Balance</p>
                            <h3 className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                PKR {Number(stats.total_unpaid).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue Invoices</p>
                            <h3 className="text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                                {stats.overdue_count} Invoices
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                            <FileText className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search invoice # or client name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                        >
                            <option value="all">All Statuses</option>
                            <option value="due">Due</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                        >
                            <option value="">All Clients</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.company_name ? `${c.name} (${c.company_name})` : c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Issue Date</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4">Total Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {invoices.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No invoices found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.data.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={route('invoices.show', invoice.id)}
                                                    className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-xs hover:underline block"
                                                >
                                                    {invoice.invoice_number}
                                                </Link>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <span className="font-extrabold text-slate-900 dark:text-white block">
                                                        {invoice.client?.name || 'Unassigned Client'}
                                                    </span>
                                                    {invoice.client?.company_name && (
                                                        <span className="text-[10px] text-slate-400 block font-medium">
                                                            {invoice.client.company_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">
                                                {formatDate(invoice.issue_date)}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="size-3.5 text-slate-400" />
                                                    <span>{formatDate(invoice.due_date)}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-black font-mono text-slate-900 dark:text-white whitespace-nowrap">
                                                {invoice.currency_code || 'USD'} {Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(invoice.status)}
                                            </td>

                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={route('invoices.show', invoice.id)}
                                                        className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                                        title="View Invoice Details"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>

                                                    <a
                                                        href={route('invoices.pdf', invoice.id)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white transition-all flex items-center justify-center cursor-pointer border border-blue-200/50 hover:border-transparent"
                                                        title="Download / Print PDF"
                                                    >
                                                        <Printer className="size-3.5" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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
