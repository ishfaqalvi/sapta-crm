import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building,
    CheckCircle2,
    Download,
    FileText,
    Printer,
} from 'lucide-react';

export interface InvoiceDetailProps {
    invoice: {
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
        notes?: string;
        terms?: string;
        client?: {
            id: number;
            name: string;
            company_name?: string;
            email: string;
            phone?: string;
            address?: string;
        };
        website_project?: {
            id: number;
            project_name: string;
        };
        items: Array<{
            id: number;
            description: string;
            quantity: number;
            unit_price: number;
            amount: number;
        }>;
    };
    company: {
        name: string;
        email: string;
        phone?: string;
        address?: string;
        tax_id?: string;
    };
}

export default function InvoicesShow({ invoice, company }: InvoiceDetailProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Invoices', href: '/invoices' },
        { title: invoice.invoice_number, href: `/invoices/${invoice.id}` },
    ];

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Top Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/invoices"
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {invoice.invoice_number}
                                </h1>
                                <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                        invoice.status === 'paid'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                            : invoice.status === 'sent'
                                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                            : invoice.status === 'overdue'
                                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    {invoice.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Billed to {invoice.client?.company_name || invoice.client?.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs cursor-pointer"
                        >
                            <Printer className="size-4" />
                            <span>Print</span>
                        </button>

                        <a
                            href={`/invoices/${invoice.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                            <Download className="size-4" />
                            <span>Download PDF</span>
                        </a>
                    </div>
                </div>

                {/* Printable Invoice Container */}
                <div className="p-6 sm:p-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm max-w-4xl space-y-8 print:border-none print:shadow-none">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-tight uppercase">
                                {company.name}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{company.email}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{company.phone}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{company.address}</p>
                            {company.tax_id && <p className="text-xs text-slate-400">NTN: {company.tax_id}</p>}
                        </div>

                        <div className="text-left sm:text-right space-y-1">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                INVOICE
                            </h3>
                            <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                                {invoice.invoice_number}
                            </p>
                        </div>
                    </div>

                    {/* Meta info columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-1">
                            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                                Billed To:
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                {invoice.client?.company_name || invoice.client?.name}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-300">Attn: {invoice.client?.name}</p>
                            <p className="text-slate-600 dark:text-slate-300">{invoice.client?.email}</p>
                            {invoice.client?.phone && <p className="text-slate-500">{invoice.client?.phone}</p>}
                        </div>

                        <div className="space-y-1 text-left sm:text-right">
                            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                                Invoice Details:
                            </span>
                            <p className="text-slate-700 dark:text-slate-300">
                                <strong>Issue Date:</strong>{' '}
                                {new Date(invoice.issue_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                                <strong>Due Date:</strong>{' '}
                                {new Date(invoice.due_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                                <strong>Billing Currency:</strong> {invoice.currency_code}
                            </p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[10px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-5 py-3">Description</th>
                                    <th className="px-5 py-3 text-center">Qty</th>
                                    <th className="px-5 py-3 text-right">Unit Price</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-5 py-3.5 text-slate-900 dark:text-white font-semibold">
                                            {item.description}
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-slate-600 dark:text-slate-400 font-mono">
                                            {item.quantity}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                                            {invoice.currency_code} {Number(item.unit_price).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                            {invoice.currency_code} {Number(item.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Breakdown */}
                    <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4">
                        <div className="space-y-4 max-w-sm">
                            {invoice.notes && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                        Notes:
                                    </span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {invoice.notes}
                                    </p>
                                </div>
                            )}

                            {invoice.terms && (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                        Terms & Conditions:
                                    </span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {invoice.terms}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-72 space-y-2 text-xs">
                            <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                                <span>Subtotal:</span>
                                <span className="font-mono font-semibold">
                                    {invoice.currency_code} {Number(invoice.subtotal).toFixed(2)}
                                </span>
                            </div>

                            {Number(invoice.tax_amount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                                    <span>Tax ({invoice.tax_rate}%):</span>
                                    <span className="font-mono font-semibold">
                                        + {invoice.currency_code} {Number(invoice.tax_amount).toFixed(2)}
                                    </span>
                                </div>
                            )}

                            {Number(invoice.discount) > 0 && (
                                <div className="flex justify-between py-1 text-emerald-600 dark:text-emerald-400">
                                    <span>Discount:</span>
                                    <span className="font-mono font-semibold">
                                        - {invoice.currency_code} {Number(invoice.discount).toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between py-2 border-t-2 border-slate-200 dark:border-slate-800 text-sm font-extrabold text-slate-900 dark:text-white">
                                <span>Total Amount:</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400">
                                    {invoice.currency_code} {Number(invoice.total_amount).toFixed(2)}
                                </span>
                            </div>

                            {invoice.currency_code !== 'PKR' && (
                                <div className="flex justify-between py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span>Equivalent in PKR:</span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                        PKR {Number(invoice.total_amount_pkr).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
