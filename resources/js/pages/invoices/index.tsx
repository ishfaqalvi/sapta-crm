import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    Edit2,
    Eye,
    FileText,
    Plus,
    Receipt,
    Search,
    Trash2,
    X,
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
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

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

    // Delete Confirmation State
    const [deletingInvoice, setDeletingInvoice] = useState<InvoiceListItem | null>(null);

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

    const handleMarkPaid = (inv: InvoiceListItem) => {
        router.patch(`/invoices/${inv.id}/mark-paid`, {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deletingInvoice) return;
        router.delete(`/invoices/${deletingInvoice.id}`, {
            onFinish: () => setDeletingInvoice(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices & Billing" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Invoices & Client Receipts Engine
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage professional client invoices, multi-currency billing, milestone payment links, and downloadable PDF receipts.
                        </p>
                    </div>

                    {hasPermission(user, 'create-invoices') && (
                        <Link
                            href="/invoices/create"
                            className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0 self-start sm:self-auto"
                        >
                            <Plus className="size-4" />
                            <span>Create New Invoice</span>
                        </Link>
                    )}
                </div>

                {/* Stat KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
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

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
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

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
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

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
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
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Invoice # & Client</th>
                                    <th className="px-6 py-4">Linked Project</th>
                                    <th className="px-6 py-4">Issue & Due Date</th>
                                    <th className="px-6 py-4">Billing Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                                                            className="font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm block"
                                                        >
                                                            {inv.invoice_number}
                                                        </Link>
                                                        <span className="text-xs text-slate-500 block">
                                                            {inv.client?.company_name || inv.client?.name || 'Unassigned Client'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Linked Project */}
                                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                                                {inv.website_project ? (
                                                    <Link
                                                        href={`/website-projects/${inv.website_project.id}`}
                                                        className="hover:underline text-blue-600 dark:text-blue-400 font-semibold"
                                                    >
                                                        {inv.website_project.project_name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400 italic">General Invoice</span>
                                                )}
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
                                                    {inv.status !== 'paid' && hasPermission(user, 'edit-invoices') && (
                                                        <button
                                                            onClick={() => handleMarkPaid(inv)}
                                                            className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Mark as Paid"
                                                        >
                                                            <CheckCircle2 className="size-3.5" />
                                                        </button>
                                                    )}

                                                    <a
                                                        href={`/invoices/${inv.id}/pdf`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="size-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="Download PDF Invoice"
                                                    >
                                                        <Download className="size-3.5" />
                                                    </a>

                                                    <Link
                                                        href={`/invoices/${inv.id}`}
                                                        className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="View Digital Invoice"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>

                                                    {hasPermission(user, 'edit-invoices') && (
                                                        <Link
                                                            href={`/invoices/${inv.id}/edit`}
                                                            className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Edit Invoice"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </Link>
                                                    )}

                                                    {hasPermission(user, 'delete-invoices') && (
                                                        <button
                                                            onClick={() => setDeletingInvoice(inv)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
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
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No invoices found. Click <strong>Create New Invoice</strong> to create your first client bill.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={invoices} />
                </div>

                {/* DELETE CONFIRMATION MODAL */}
                {deletingInvoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 shrink-0">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Delete Invoice {deletingInvoice.invoice_number}?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Are you sure you want to permanently delete invoice <strong className="text-slate-900 dark:text-white">{deletingInvoice.invoice_number}</strong>?
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeletingInvoice(null)}
                                    className="h-10 px-4 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="h-10 px-5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all"
                                >
                                    Confirm Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
