import Pagination, { type PaginatedData } from '@/components/pagination';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Lock,
    Receipt,
    Search,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

export interface SeoPaymentItem {
    id: number;
    seo_retainer_id: number;
    client_id: number;
    billing_month: string;
    amount_due: number | string;
    amount_paid: number | string;
    exchange_rate?: number | string;
    amount_paid_pkr?: number | string;
    payment_date: string | null;
    status: 'due_pending' | 'cleared' | 'paid' | 'overdue';
    payment_method: string | null;
    notes: string | null;
    created_at: string;
    seo_retainer?: {
        id: number;
        package_name: string;
        monthly_fee: number | string;
        currency: string;
    };
}

interface SimpleRetainer {
    id: number;
    package_name: string;
    monthly_fee: number | string;
    currency: string;
}

interface ClientPortalSeoPaymentsIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    payments: PaginatedData<SeoPaymentItem>;
    retainers: SimpleRetainer[];
    stats: {
        total: number;
        cleared: number;
        pending: number;
        overdue: number;
        total_cleared_amount: number;
        total_pending_amount: number;
    };
    currencies?: { code: string; name: string; symbol: string }[];
    filters?: {
        search?: string;
        status?: string;
        month?: string;
    };
}

export default function ClientPortalSeoPaymentsIndex({
    client,
    payments,
    stats,
    filters,
}: ClientPortalSeoPaymentsIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'SEO Retainers', href: '/client-portal/seo' },
        { title: 'Monthly Billing Logs', href: '/client-portal/seo-payments' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [selectedMonth, setSelectedMonth] = useState(filters?.month || '');

    // Modal state for Generate Month Logs
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isGenerating, setIsGenerating] = useState(false);

    // Mark Paid Confirmation Modal State
    const [settlingPayment, setSettlingPayment] = useState<SeoPaymentItem | null>(null);
    const [isSettling, setIsSettling] = useState(false);

    // Delete modal state
    const [deletingPayment, setDeletingPayment] = useState<SeoPaymentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isFirstRender = useRef(true);

    const formatDateOnly = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Pending';
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

    const formatMonthDisplay = (monthStr: string) => {
        if (!monthStr) return 'N/A';
        const parts = monthStr.split('-');
        if (parts.length === 2) {
            const year = parts[0];
            const monthIdx = parseInt(parts[1], 10) - 1;
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            if (monthIdx >= 0 && monthIdx < 12) {
                return `${months[monthIdx]} ${year}`;
            }
        }
        return monthStr;
    };

    const formatCurrency = (val: number | string, currencySymbol: string = client.currency || '$') => {
        const num = Number(val) || 0;
        return `${currencySymbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'cleared':
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60';
            case 'due_pending':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60';
            case 'overdue':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/client-portal/seo-payments',
                {
                    search: searchQuery,
                    status: selectedStatus,
                    month: selectedMonth,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatus, selectedMonth]);

    const handleGenerateBatch = (e: FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        router.post(
            '/client-portal/seo-payments/generate-batch',
            { month: targetMonth },
            {
                onSuccess: () => {
                    setIsGenerateModalOpen(false);
                    setIsGenerating(false);
                },
                onError: () => {
                    setIsGenerating(false);
                },
                onFinish: () => {
                    setIsGenerating(false);
                },
            }
        );
    };

    const handleMarkPaid = () => {
        if (!settlingPayment) return;
        setIsSettling(true);
        router.put(
            `/client-portal/seo-payments/update/${settlingPayment.id}`,
            {
                status: 'cleared',
                amount_paid: settlingPayment.amount_due,
            },
            {
                onSuccess: () => {
                    setSettlingPayment(null);
                    setIsSettling(false);
                },
                onError: () => {
                    setIsSettling(false);
                },
                onFinish: () => {
                    setIsSettling(false);
                },
            }
        );
    };

    const handleDelete = () => {
        if (!deletingPayment) return;
        setIsDeleting(true);
        router.delete(`/client-portal/seo-payments/destroy/${deletingPayment.id}`, {
            onSuccess: () => {
                setDeletingPayment(null);
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
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="seo-payments">
            <Head title={`SEO Retainer Payments | ${client.name}`} />

            <div className="p-6 w-full space-y-6">
                {/* Header Title & Generate Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            SEO Monthly Billing & Payment Settlement
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Generate monthly retainer billing logs and mark payment settlements.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-seo-payments') && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsGenerateModalOpen(true)}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Sparkles className="size-4" />
                                <span>Generate Monthly Payments</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* KPI Stat Cards (Admin Standard) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billing Logs</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Receipt className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Cleared (Paid)</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {formatCurrency(stats.total_cleared_amount)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Settlements</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                {formatCurrency(stats.total_pending_amount)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue Logs</p>
                            <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{stats.overdue}</h3>
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
                            placeholder="Search billing month, package name, or notes..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Month Filter */}
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        />

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="cleared">Cleared / Paid</option>
                            <option value="due_pending">Pending</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                </div>

                {/* Table View (Full width layout) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                                    <th className="px-6 py-4">Billing Month</th>
                                    <th className="px-6 py-4">SEO Retainer Package</th>
                                    <th className="px-6 py-4">Amount Due</th>
                                    <th className="px-6 py-4">Amount Paid</th>
                                    <th className="px-6 py-4">Settlement Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {payments.data.length > 0 ? (
                                    payments.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono font-extrabold text-xs">
                                                    {formatMonthDisplay(item.billing_month)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="space-y-0.5">
                                                    <span className="font-bold text-slate-900 dark:text-white text-sm truncate block">
                                                        {item.seo_retainer ? item.seo_retainer.package_name : 'SEO Subscription'}
                                                    </span>
                                                    {item.notes && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                                            {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                    {formatCurrency(item.amount_due, item.seo_retainer?.currency || client.currency || '$')}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                                    {formatCurrency(item.amount_paid, item.seo_retainer?.currency || client.currency || '$')}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Calendar className="size-3.5 text-indigo-500" />
                                                    {formatDateOnly(item.payment_date)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border ${getStatusBadgeClass(item.status)}`}>
                                                    {item.status.replace('_', ' ')}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {item.status === 'cleared' || item.status === 'paid' ? (
                                                        <div
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold border border-slate-200/60 dark:border-slate-800/80 cursor-not-allowed select-none"
                                                            title="Paid / cleared payment records are locked and cannot be edited or deleted"
                                                        >
                                                            <Lock className="size-3.5 text-slate-400" />
                                                            <span>Locked</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {hasPermission(user, 'edit-client-portal-seo-payments') && (
                                                                <button
                                                                    onClick={() => setSettlingPayment(item)}
                                                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200/80 dark:border-emerald-800/80 transition-all flex items-center gap-1.5 text-[11px] font-extrabold shadow-2xs cursor-pointer"
                                                                    title="Mark Payment as Paid"
                                                                >
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    <span>Mark Paid</span>
                                                                </button>
                                                            )}
                                                            {hasPermission(user, 'delete-client-portal-seo-payments') && (
                                                                <button
                                                                    onClick={() => setDeletingPayment(item)}
                                                                    className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                    title="Delete Payment Log"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                            No SEO monthly billing logs found matching criteria. Click &quot;Generate Monthly Payments&quot; above to create billing logs.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {payments.data.length > 0 && <Pagination meta={payments} />}

                {/* Generate Monthly Payments Modal */}
                {isGenerateModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20">
                                        <Sparkles className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            Generate Monthly Payments
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Batch process retainer billing logs.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsGenerateModalOpen(false)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleGenerateBatch} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Select Target Billing Month <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="month"
                                        value={targetMonth}
                                        max={new Date().toISOString().slice(0, 7)}
                                        onChange={(e) => setTargetMonth(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                                    <p className="font-bold text-blue-700 dark:text-blue-300">Generation Logic Rules:</p>
                                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        <li>Active SEO retainers starting on/before this month will be processed.</li>
                                        <li>New billing records will be created with status <strong className="text-slate-700 dark:text-slate-200">Pending</strong>.</li>
                                        <li>Existing <strong className="text-slate-700 dark:text-slate-200">Unpaid</strong> records will be updated with current monthly rates.</li>
                                        <li>Existing <strong className="text-slate-700 dark:text-slate-200">Paid/Cleared</strong> records will be safely skipped.</li>
                                    </ul>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsGenerateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isGenerating}
                                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Sparkles className="size-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="size-4" />
                                                <span>Generate Month Logs</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Mark Paid Confirmation Modal */}
                {settlingPayment && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Mark Payment as Paid?</h3>
                                    <p className="text-xs text-slate-400 font-medium">Settle retainer billing record for this month.</p>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                                Are you sure you want to mark <strong className="text-slate-900 dark:text-white">{formatMonthDisplay(settlingPayment.billing_month)}</strong> billing log for <strong className="text-slate-900 dark:text-white">{settlingPayment.seo_retainer?.package_name || 'SEO Retainer'}</strong> ({formatCurrency(settlingPayment.amount_due, settlingPayment.seo_retainer?.currency || client.currency || '$')}) as paid?
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setSettlingPayment(null)}
                                    disabled={isSettling}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMarkPaid}
                                    disabled={isSettling}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isSettling ? (
                                        <>
                                            <Sparkles className="size-4 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="size-4" />
                                            <span>Confirm & Mark Paid</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingPayment && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Delete Payment Log?</h3>
                                    <p className="text-xs text-slate-400 font-medium">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                                Are you sure you want to delete payment log for <strong className="text-slate-900 dark:text-white">{formatMonthDisplay(deletingPayment.billing_month)}</strong>?
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setDeletingPayment(null)}
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
                                            <Sparkles className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Log</span>
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
