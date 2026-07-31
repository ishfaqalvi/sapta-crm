import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building,
    CheckCircle2,
    Download,
    Edit2,
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
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
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
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs"
                        >
                            <Printer className="size-4" />
                            <span>Print</span>
                        </button>

                        <a
                            href={`/invoices/${invoice.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2"
                        >
                            <Download className="size-4" />
                            <span>Download PDF</span>
                        </a>

                        <Link
                            href={`/invoices/${invoice.id}/edit`}
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center gap-1.5"
                        >
                            <Edit2 className="size-3.5" />
                            <span>Edit</span>
                        </Link>
                    </div>
                </div>

                {/* Printable Invoice Container */}
                <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm max-w-4xl space-y-8 print:border-none print:shadow-none">
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
                            {invoice.website_project && (
                                <p className="text-slate-500 pt-1">
                                    <strong className="text-slate-700 dark:text-slate-200">Project:</strong>{' '}
                                    {invoice.website_project.project_name}
                                </p>
                            )}
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
                            {invoice.currency_code !== 'PKR' && (
                                <p className="text-slate-500 font-mono text-[11px]">
                                    Rate: 1 {invoice.currency_code} = PKR {Number(invoice.exchange_rate_to_pkr).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950 uppercase tracking-wider text-[10px] font-extrabold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-5 py-3.5">Description</th>
                                    <th className="px-5 py-3.5 text-center">Qty</th>
                                    <th className="px-5 py-3.5 text-right">Unit Price</th>
                                    <th className="px-5 py-3.5 text-right">Amount ({invoice.currency_code})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                                            {item.description}
                                        </td>
                                        <td className="px-5 py-3.5 text-center font-semibold">{item.quantity}</td>
                                        <td className="px-5 py-3.5 text-right font-mono">
                                            {invoice.currency_code} {Number(item.unit_price).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white font-mono">
                                            {invoice.currency_code} {Number(item.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Totals */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-500">
                                <span>Subtotal:</span>
                                <span className="font-bold text-slate-900 dark:text-white font-mono">
                                    {invoice.currency_code} {Number(invoice.subtotal).toFixed(2)}
                                </span>
                            </div>

                            {Number(invoice.tax_rate) > 0 && (
                                <div className="flex items-center justify-between text-slate-500">
                                    <span>Tax ({invoice.tax_rate}%):</span>
                                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                                        + {invoice.currency_code} {Number(invoice.tax_amount).toFixed(2)}
                                    </span>
                                </div>
                            )}

                            {Number(invoice.discount) > 0 && (
                                <div className="flex items-center justify-between text-slate-500">
                                    <span>Discount:</span>
                                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                                        - {invoice.currency_code} {Number(invoice.discount).toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                                <span>Total Amount:</span>
                                <span className="text-blue-600 dark:text-blue-400 font-mono">
                                    {invoice.currency_code} {Number(invoice.total_amount).toFixed(2)}
                                </span>
                            </div>

                            {invoice.currency_code !== 'PKR' && (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800">
                                    <span>PKR Converted Total:</span>
                                    <span className="font-mono">
                                        PKR {Number(invoice.total_amount_pkr).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes & Terms */}
                    {(invoice.notes || invoice.terms) && (
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-500">
                            {invoice.notes && (
                                <div>
                                    <h5 className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1">
                                        Notes
                                    </h5>
                                    <p>{invoice.notes}</p>
                                </div>
                            )}
                            {invoice.terms && (
                                <div>
                                    <h5 className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-1">
                                        Terms & Conditions
                                    </h5>
                                    <p>{invoice.terms}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
