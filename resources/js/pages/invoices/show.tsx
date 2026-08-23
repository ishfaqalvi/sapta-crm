import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Printer,
} from 'lucide-react';
import { InvoiceData } from './index';

interface InvoicesShowProps {
    invoice: InvoiceData;
    companyInfo: {
        company_name: string;
        company_phone: string;
        company_email: string;
        company_address: string;
    };
}

export default function InvoicesShow({ invoice, companyInfo }: InvoicesShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Invoices & Billing', href: '/invoices' },
        { title: invoice.invoice_number, href: `/invoices/${invoice.id}` },
    ];

    const currencyCode = invoice.currency_code || invoice.client?.currency || 'USD';

    const formatCurrency = (amount: number | string) => {
        const num = Number(amount) || 0;
        return `${currencyCode} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 uppercase tracking-wider inline-flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5" />
                        <span>PAID</span>
                    </span>
                );
            case 'sent':
                return (
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-extrabold border border-blue-200 uppercase tracking-wider inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        <span>SENT</span>
                    </span>
                );
            case 'overdue':
                return (
                    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-extrabold border border-rose-200 uppercase tracking-wider inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        <span>OVERDUE</span>
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-extrabold border border-slate-200 uppercase tracking-wider">
                        CANCELLED
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 text-xs font-extrabold border border-slate-200 uppercase tracking-wider">
                        DRAFT
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 max-w-4xl mx-auto w-full">
                {/* Actions Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Link
                        href={route('invoices.index')}
                        className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Invoices</span>
                    </Link>

                    <div className="flex items-center gap-2 flex-wrap">
                        <a
                            href={route('invoices.pdf', invoice.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all inline-flex items-center gap-2 shadow-2xs cursor-pointer"
                        >
                            <Printer className="size-4 text-purple-600 dark:text-purple-400" />
                            <span>Print / Download PDF</span>
                        </a>
                    </div>
                </div>

                {/* Main Printable Invoice Card */}
                <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-8">
                    {/* Invoice Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <h2 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                                {companyInfo.company_name}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{companyInfo.company_address}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Phone: {companyInfo.company_phone} | {companyInfo.company_email}</p>
                        </div>

                        <div className="text-left sm:text-right space-y-1">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                INVOICE
                            </h1>
                            <p className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                                {invoice.invoice_number}
                            </p>
                            <div className="pt-1">{getStatusBadge(invoice.status)}</div>
                        </div>
                    </div>

                    {/* Billed To & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Billed Client</span>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {invoice.client?.name || 'Unassigned Client'}
                            </h3>
                            {invoice.client?.company_name && (
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{invoice.client.company_name}</p>
                            )}
                            <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 pt-0.5">
                                Client Code: {invoice.client?.client_code}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Issue Date</span>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{formatDate(invoice.issue_date)}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Payment Due Date</span>
                                <p className="text-xs font-black text-rose-600 dark:text-rose-400">{formatDate(invoice.due_date)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3.5">#</th>
                                    <th className="px-6 py-3.5">Item Description</th>
                                    <th className="px-6 py-3.5 text-center">Qty</th>
                                    <th className="px-6 py-3.5 text-right">Unit Price</th>
                                    <th className="px-6 py-3.5 text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoice.items?.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                                                {item.description}
                                            </span>
                                            {item.invoiceable_type && (
                                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 text-[9px] font-extrabold border border-blue-200 mt-1 inline-block">
                                                    LINKED SERVICE RECORD
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Totals */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-3 w-full sm:w-1/2">
                            {invoice.notes && (
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</span>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{invoice.notes}</p>
                                </div>
                            )}

                            {invoice.terms && (
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terms & Conditions</span>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{invoice.terms}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-72 space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(invoice.subtotal)}</span>
                            </div>

                            {Number(invoice.tax_amount) > 0 && (
                                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                    <span>Tax ({invoice.tax_rate}%)</span>
                                    <span>{formatCurrency(invoice.tax_amount || 0)}</span>
                                </div>
                            )}

                            {Number(invoice.discount) > 0 && (
                                <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                                    <span>Discount</span>
                                    <span>- {formatCurrency(invoice.discount || 0)}</span>
                                </div>
                            )}

                            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-sm font-black text-slate-900 dark:text-white">Total Amount</span>
                                <span className="text-base font-black text-blue-600 dark:text-blue-400">
                                    {formatCurrency(invoice.total_amount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
