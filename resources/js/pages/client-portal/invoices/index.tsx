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
    Download,
    Eye,
    FileText,
    Globe,
    Pencil,
    Plus,
    Receipt,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface InvoiceLineItem {
    id?: number;
    invoice_id?: number;
    description: string;
    quantity: number;
    unit_price: number | string;
    amount?: number | string;
}

export interface ClientInvoiceItem {
    id: number;
    invoice_number: string;
    client_id: number;
    website_project_id?: number | string | null;
    currency_code: string;
    subtotal: number | string;
    tax_rate?: number | string;
    tax_amount?: number | string;
    discount?: number | string;
    total_amount: number | string;
    issue_date: string;
    due_date: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    notes?: string | null;
    terms?: string | null;
    created_at: string;
    website_project?: {
        id: number;
        project_name: string;
    };
    items?: InvoiceLineItem[];
}

interface ClientPortalInvoicesIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    invoices: PaginatedData<ClientInvoiceItem>;
    stats: {
        total: number;
        paid_total: number;
        pending_total: number;
        overdue_count: number;
    };
    filters?: {
        search?: string;
        status?: string;
    };
}

export default function ClientPortalInvoicesIndex({
    client,
    invoices,
    stats,
    filters,
}: ClientPortalInvoicesIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Invoices & Billing', href: '/client-portal/invoices' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');

    // Modals
    const [viewingInvoice, setViewingInvoice] = useState<ClientInvoiceItem | null>(null);
    const [deletingInvoice, setDeletingInvoice] = useState<ClientInvoiceItem | null>(null);

    const { delete: destroy, processing } = useForm();
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/client-portal/invoices',
                {
                    search: searchQuery,
                    status: selectedStatus,
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
        if (!deletingInvoice) return;
        destroy(`/client-portal/invoices/destroy/${deletingInvoice.id}`, {
            onSuccess: () => setDeletingInvoice(null),
        });
    };

    const formatCurrency = (val: number | string, currencyCode: string = client.currency || 'USD') => {
        const num = Number(val) || 0;
        return `${currencyCode} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDateOnly = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        const cleanDate = dateStr.split('T')[0].split(' ')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = parseInt(parts[1], 10) - 1;
            return `${parts[2]} ${months[month]} ${parts[0]}`;
        }
        return cleanDate;
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60';
            case 'sent':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60';
            case 'overdue':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60';
            case 'draft':
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
            case 'cancelled':
                return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/40';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="payments">
            <Head title={`Invoices & Billing Statements | ${client.name}`} />

            <div className="p-2 md:p-6 w-full space-y-6">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Invoices & Billing Statements
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Manage and view official invoices, line item breakdowns, and download PDF receipts for {client.name}.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-invoices') && (
                        <Link
                            href="/client-portal/invoices/create"
                            className="bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto shrink-0"
                        >
                            <Plus className="size-4" />
                            <span>Create Invoice</span>
                        </Link>
                    )}
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Statements</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <FileText className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cleared / Paid Total</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {formatCurrency(stats.paid_total)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Amount</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                {formatCurrency(stats.pending_total)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue Invoices</p>
                            <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                                {stats.overdue_count}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertTriangle className="size-5" />
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
                            placeholder="Search by invoice number or project..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="sent">Sent / Pending</option>
                            <option value="overdue">Overdue</option>
                            <option value="draft">Draft</option>
                            <option value="cancelled">Cancelled</option>
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

                {/* Invoices Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs w-full min-w-0">
                    <div className="w-full overflow-x-auto scrollbar-thin">
                        <table className="w-full min-w-[750px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                                    <th className="px-6 py-4">Invoice #</th>
                                    <th className="px-6 py-4">Issue Date</th>
                                    <th className="px-6 py-4">Due Date</th>
                                    <th className="px-6 py-4">Total Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {invoices.data.length > 0 ? (
                                    invoices.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                                        {item.invoice_number}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Calendar className="size-3.5 text-indigo-500" />
                                                    {formatDateOnly(item.issue_date)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Clock className="size-3.5 text-amber-500" />
                                                    {formatDateOnly(item.due_date)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                                                    {formatCurrency(item.total_amount, item.currency_code)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border ${getStatusBadgeClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setViewingInvoice(item)}
                                                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-[11px] cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </button>
                                                    {hasPermission(user, 'edit-client-portal-invoices') && (
                                                        <Link
                                                            href={`/client-portal/invoices/${item.id}/edit`}
                                                            className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all font-bold text-[11px] cursor-pointer"
                                                            title="Edit Invoice Page"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Link>
                                                    )}
                                                    {hasPermission(user, 'download-client-portal-invoices') && (
                                                        <a
                                                            href={`/client-portal/invoices/${item.id}/pdf`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white transition-all flex items-center gap-1 font-bold text-[11px] cursor-pointer shadow-md shadow-blue-500/20"
                                                            title="Download PDF"
                                                        >
                                                            <Download className="size-3.5" />
                                                            <span>PDF</span>
                                                        </a>
                                                    )}
                                                    {item.status !== 'paid' && hasPermission(user, 'delete-client-portal-invoices') && (
                                                        <button
                                                            onClick={() => setDeletingInvoice(item)}
                                                            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all font-bold text-[11px] cursor-pointer"
                                                            title="Delete Invoice"
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
                                            No invoice billing statements found for this account.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {invoices.data.length > 0 && <Pagination meta={invoices} />}
            </div>

            {/* View Invoice Details Modal */}
            {viewingInvoice && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 custom-scrollbar">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <Receipt className="size-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            {viewingInvoice.invoice_number}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeClass(viewingInvoice.status)}`}>
                                            {viewingInvoice.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Issued on {formatDateOnly(viewingInvoice.issue_date)} • Due on {formatDateOnly(viewingInvoice.due_date)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingInvoice(null)}
                                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Project / Client Summary */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                            <div>
                                <span className="text-slate-400 text-[10px] uppercase font-extrabold block">Billed To</span>
                                <span className="text-slate-900 dark:text-white font-bold">{client.name}</span>
                                {client.company_name && <span className="text-slate-500 block text-[11px]">{client.company_name}</span>}
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
                                            <th className="p-3 text-right">Unit Price</th>
                                            <th className="p-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                        {viewingInvoice.items && viewingInvoice.items.length > 0 ? (
                                            viewingInvoice.items.map((item, idx) => (
                                                <tr key={item.id || idx}>
                                                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.description}</td>
                                                    <td className="p-3 text-center font-mono">{item.quantity}</td>
                                                    <td className="p-3 text-right font-mono">{formatCurrency(item.unit_price, viewingInvoice.currency_code)}</td>
                                                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(item.amount || Number(item.quantity) * Number(item.unit_price), viewingInvoice.currency_code)}</td>
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
                                <span className="font-mono">{formatCurrency(viewingInvoice.subtotal, viewingInvoice.currency_code)}</span>
                            </div>
                            {Number(viewingInvoice.tax_amount || 0) > 0 && (
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                    <span>Tax ({viewingInvoice.tax_rate}%)</span>
                                    <span className="font-mono">+{formatCurrency(viewingInvoice.tax_amount!, viewingInvoice.currency_code)}</span>
                                </div>
                            )}
                            {Number(viewingInvoice.discount || 0) > 0 && (
                                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                    <span>Discount</span>
                                    <span className="font-mono">-{formatCurrency(viewingInvoice.discount!, viewingInvoice.currency_code)}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                                <span>Total Amount</span>
                                <span className="text-blue-600 dark:text-blue-400 font-black font-mono">{formatCurrency(viewingInvoice.total_amount, viewingInvoice.currency_code)}</span>
                            </div>
                        </div>

                        {/* Notes / Terms */}
                        {(viewingInvoice.notes || viewingInvoice.terms) && (
                            <div className="space-y-2 text-xs">
                                {viewingInvoice.notes && (
                                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-300">
                                        <strong className="block text-[10px] font-extrabold uppercase tracking-wider mb-1">Invoice Notes</strong>
                                        {viewingInvoice.notes}
                                    </div>
                                )}
                                {viewingInvoice.terms && (
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                                        <strong className="block text-[10px] font-extrabold uppercase tracking-wider mb-1">Terms & Conditions</strong>
                                        {viewingInvoice.terms}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer Action */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setViewingInvoice(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                            >
                                Close
                            </button>
                            <a
                                href={`/client-portal/invoices/${viewingInvoice.id}/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                            >
                                <Download className="size-4" />
                                <span>Download PDF</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Invoice Modal */}
            {deletingInvoice && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                            <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950">
                                <AlertTriangle className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Delete Invoice</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                            Are you sure you want to delete invoice statement <strong className="text-slate-900 dark:text-white">{deletingInvoice.invoice_number}</strong>?
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeletingInvoice(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={processing}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer"
                            >
                                {processing ? 'Deleting...' : 'Yes, Delete Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ClientPortalLayout>
    );
}
