import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Client } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    BadgeDollarSign,
    Building,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    Edit2,
    LoaderCircle,
    Search,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { type SeoRetainerItem } from '../retainers/index';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'SEO Payments',
        href: '/seo-payments',
    },
];

export interface SeoPaymentItem {
    id: number;
    seo_retainer_id: number;
    client_id: number;
    billing_month: string;
    amount_due: number;
    amount_paid: number;
    exchange_rate?: number;
    amount_paid_pkr?: number;
    payment_date: string | null;
    status: 'cleared' | 'due_pending' | 'overdue';
    payment_method: string | null;
    notes: string | null;
    client: Client | null;
    seo_retainer: SeoRetainerItem | null;
}

interface SeoPaymentsIndexProps {
    payments: PaginatedData<SeoPaymentItem>;
    stats: {
        total: number;
        cleared: number;
        pending: number;
        overdue: number;
        total_cleared_pkr?: number;
    };
    exchange_rates?: Record<string, number>;
    filters?: {
        search?: string;
        status?: string;
        month?: string;
    };
}

export default function SeoPaymentsIndex({ payments, stats, filters }: SeoPaymentsIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(filters?.status || '');
    const [selectedMonthFilter, setSelectedMonthFilter] = useState(filters?.month || '');

    // Modal state for settling / updating payment
    const [updatingPayment, setUpdatingPayment] = useState<SeoPaymentItem | null>(null);

    const form = useForm({
        amount_paid: 0 as number | string,
        payment_date: new Date().toISOString().split('T')[0],
        status: 'cleared' as 'cleared' | 'due_pending' | 'overdue',
        payment_method: 'Bank Transfer',
        notes: '',
    });

    // Filter debounce
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/seo-payments',
                {
                    search: searchQuery,
                    status: selectedStatusFilter,
                    month: selectedMonthFilter,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatusFilter, selectedMonthFilter]);

    const openUpdateModal = (payment: SeoPaymentItem) => {
        setUpdatingPayment(payment);
        form.setData({
            amount_paid: payment.amount_paid > 0 ? payment.amount_paid : payment.amount_due,
            payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
            status: payment.status,
            payment_method: payment.payment_method || 'Bank Transfer',
            notes: payment.notes || '',
        });
    };

    const handleFormSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!updatingPayment) return;
        form.put(`/seo-payments/${updatingPayment.id}`, {
            onSuccess: () => {
                setUpdatingPayment(null);
            },
        });
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const handleGenerateMonthly = () => {
        setIsGenerating(true);
        router.post('/seo-payments/generate', {}, {
            preserveScroll: true,
            onFinish: () => setIsGenerating(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SEO Payments Log" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            SEO Monthly Payments & Dues Log
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Track monthly SEO retainer billings, cleared payments, pending dues, and payment methods.
                        </p>
                    </div>

                    <button
                        onClick={handleGenerateMonthly}
                        disabled={isGenerating}
                        className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0 disabled:opacity-60"
                    >
                        {isGenerating ? <LoaderCircle className="size-4 animate-spin" /> : <Clock className="size-4" />}
                        <span>Generate Monthly Billing Logs</span>
                    </button>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billing Logs</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <CreditCard className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cleared Revenue (PKR)</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                PKR {Number(stats.total_cleared_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">{stats.cleared} Cleared Logs</span>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Dues</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{stats.pending}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue Dues</p>
                            <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{stats.overdue}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                            <AlertCircle className="size-5" />
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
                            placeholder="Search by client name, code, package, or billing month..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Payment Statuses</option>
                            <option value="cleared">Cleared Only</option>
                            <option value="due_pending">Pending Dues</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">SEO Package</th>
                                    <th className="px-6 py-4">Billing Month</th>
                                    <th className="px-6 py-4">Amount Due / Paid</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payments.data.length > 0 ? (
                                    payments.data.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Client Info */}
                                            <td className="px-6 py-4">
                                                {payment.client ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                                                            <Building className="size-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                                                {payment.client.name}
                                                            </span>
                                                            <span className="text-slate-400 font-mono text-[10px] block">
                                                                {payment.client.client_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned Client</span>
                                                )}
                                            </td>

                                            {/* Package Title */}
                                            <td className="px-6 py-4">
                                                <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                                                    {payment.seo_retainer?.package_name || 'SEO Retainer'}
                                                </span>
                                                {payment.payment_method && (
                                                    <span className="text-slate-400 text-[10px] font-semibold block mt-0.5">
                                                        Method: {payment.payment_method}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Billing Month */}
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                                                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 inline-flex items-center gap-1">
                                                    <Calendar className="size-3 text-slate-400" />
                                                    <span>{payment.billing_month}</span>
                                                </span>
                                            </td>

                                            {/* Amount Due vs Paid */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5 font-mono">
                                                    <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                                                        Due: {payment.seo_retainer?.currency || 'USD'} {Number(payment.amount_due).toLocaleString()}
                                                    </div>
                                                    <div className={`text-[11px] font-bold ${payment.amount_paid >= payment.amount_due ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                                        Paid: {payment.seo_retainer?.currency || 'USD'} {Number(payment.amount_paid).toLocaleString()}
                                                    </div>
                                                    {payment.amount_paid_pkr && payment.seo_retainer?.currency !== 'PKR' && (
                                                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-sans">
                                                            ≈ PKR {Number(payment.amount_paid_pkr).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                                    payment.status === 'cleared'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : payment.status === 'due_pending'
                                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                }`}>
                                                    {payment.status === 'cleared' ? (
                                                        <>
                                                            <CheckCircle2 className="size-3" />
                                                            <span>Cleared</span>
                                                        </>
                                                    ) : payment.status === 'due_pending' ? (
                                                        <>
                                                            <Clock className="size-3" />
                                                            <span>Pending</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="size-3" />
                                                            <span>Overdue</span>
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openUpdateModal(payment)}
                                                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                    <span>Update Status</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No SEO payment records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={payments} />
                </div>

                {/* UPDATE PAYMENT MODAL */}
                {updatingPayment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <CreditCard className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Update Payment Status
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Client: <strong>{updatingPayment.client?.name}</strong> ({updatingPayment.billing_month})
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setUpdatingPayment(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="amount_due_disp" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Amount Due
                                        </Label>
                                        <Input
                                            id="amount_due_disp"
                                            value={`${updatingPayment.seo_retainer?.currency || 'AED'} ${updatingPayment.amount_due}`}
                                            disabled
                                            className="h-11 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-500 font-bold"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="amount_paid" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Amount Paid *
                                        </Label>
                                        <Input
                                            id="amount_paid"
                                            type="number"
                                            step="0.01"
                                            value={form.data.amount_paid}
                                            onChange={(e) => form.setData('amount_paid', e.target.value)}
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-extrabold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Payment Status *
                                        </Label>
                                        <select
                                            id="status"
                                            value={form.data.status}
                                            onChange={(e) => form.setData('status', e.target.value as any)}
                                            className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                        >
                                            <option value="cleared">Cleared / Paid</option>
                                            <option value="due_pending">Due / Pending</option>
                                            <option value="overdue">Overdue</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="payment_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Settlement Date
                                        </Label>
                                        <Input
                                            id="payment_date"
                                            type="date"
                                            value={form.data.payment_date}
                                            onChange={(e) => form.setData('payment_date', e.target.value)}
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="payment_method" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Payment Method
                                    </Label>
                                    <select
                                        id="payment_method"
                                        value={form.data.payment_method}
                                        onChange={(e) => form.setData('payment_method', e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                    >
                                        <option value="Bank Transfer">Bank Transfer / Wire</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Credit Card / Online">Credit Card / Online</option>
                                        <option value="Crypto / Other">Crypto / Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Transaction Notes (Optional)
                                    </Label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                        placeholder="Reference number, bank transaction ID, or notes..."
                                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-sm font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setUpdatingPayment(null)}
                                        className="rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2"
                                    >
                                        {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                                        <span>Update Payment</span>
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
