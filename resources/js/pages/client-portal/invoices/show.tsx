import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    FolderKanban,
    Pencil,
    Printer,
    Receipt,
    User,
} from 'lucide-react';

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

interface InvoiceDetail {
    id: number;
    invoice_number: string;
    client_id: number;
    currency_code: string;
    exchange_rate_to_pkr?: number;
    subtotal: number;
    tax_rate?: number;
    tax_amount?: number;
    discount?: number;
    total_amount: number;
    total_amount_pkr?: number;
    issue_date: string;
    due_date: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    notes?: string | null;
    terms?: string | null;
    created_at?: string;
    client?: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
    };
    items?: InvoiceItem[];
}

interface CompanySettings {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    logo?: string;
}

interface ClientPortalInvoiceShowProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status?: 'active' | 'inactive';
        currency: string;
    };
    invoice: InvoiceDetail;
    company?: CompanySettings;
}

export default function ClientPortalInvoiceShow({
    client,
    invoice,
    company,
}: ClientPortalInvoiceShowProps) {
    const companyInfo = company || {
        name: 'Sapta Technologies',
        email: 'contact@saptatechnologies.com',
        phone: '+92 300 1234567',
        address: 'Office #402, Software Technology Park, Lahore, Pakistan',
        tax_id: 'NTN-892415-0',
        logo: '/app-logo-icon.png',
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Invoices & Billing', href: '/client-portal/invoices' },
        { title: invoice.invoice_number, href: `/client-portal/invoices/${invoice.id}` },
    ];

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
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

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return (num || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: invoice.currency_code || client.currency || 'USD',
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-black border border-emerald-200 uppercase tracking-wider inline-flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5" />
                        <span>PAID</span>
                    </span>
                );
            case 'overdue':
                return (
                    <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-black border border-rose-200 uppercase tracking-wider inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        <span>OVERDUE</span>
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-black border border-slate-200 uppercase tracking-wider">
                        CANCELLED
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 text-xs font-black border border-slate-200 uppercase tracking-wider">
                        DRAFT
                    </span>
                );
        }
    };

    return (
        <ClientPortalLayout client={client as any} breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${invoice.invoice_number} - Client Portal`} />

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-invoice, #printable-invoice * {
                        visibility: visible;
                    }
                    #printable-invoice {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                        box-shadow: none !important;
                        border: none !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 max-w-4xl mx-auto w-full">
                {/* Actions Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href="/client-portal/invoices"
                            className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all inline-flex items-center gap-2 shadow-2xs"
                        >
                            <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                            <span>Back to Invoices</span>
                        </Link>

                        {invoice.status !== 'paid' && (
                            <Link
                                href={`/client-portal/invoices/${invoice.id}/edit`}
                                className="h-10 px-4 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all inline-flex items-center gap-2 shadow-2xs"
                            >
                                <Pencil className="size-4" />
                                <span>Edit Invoice</span>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                        <a
                            href={`/client-portal/invoices/${invoice.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs cursor-pointer"
                        >
                            <FileText className="size-4 text-purple-600 dark:text-purple-400" />
                            <span>Open PDF</span>
                        </a>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20 hover:opacity-95 transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                            <Printer className="size-4" />
                            <span>Print Invoice</span>
                        </button>
                    </div>
                </div>

                {/* Printable Invoice Container */}
                <div
                    id="printable-invoice"
                    className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-8 text-slate-800 dark:text-slate-200"
                >
                    {/* Top Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <img
                                src={companyInfo.logo || '/app-logo-icon.png'}
                                alt="Company Logo"
                                className="h-12 w-auto object-contain"
                            />
                            <div>
                                <h2 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                                    {companyInfo.name}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{companyInfo.email} {companyInfo.phone ? ` • ${companyInfo.phone}` : ''}</p>
                                {companyInfo.address && (
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        {companyInfo.address} {companyInfo.tax_id ? ` | NTN: ${companyInfo.tax_id}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="text-left sm:text-right space-y-1">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                INVOICE
                            </h1>
                            <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                                #{invoice.invoice_number}
                            </p>
                            <div className="mt-2">{getStatusBadge(invoice.status)}</div>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="space-y-1">
                            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Billed To:</p>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                {client.company_name || client.name}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300">
                                <strong>Attn:</strong> {client.name}
                            </p>
                            <p className="text-slate-500">
                                <strong>Client Code:</strong> {client.client_code}
                            </p>
                        </div>

                        <div className="space-y-1 sm:text-right">
                            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Invoice Summary:</p>
                            <p className="text-slate-600 dark:text-slate-300">
                                <strong>Issue Date:</strong> {formatDate(invoice.issue_date)}
                            </p>
                            <p className="text-slate-600 dark:text-slate-300">
                                <strong>Due Date:</strong> {formatDate(invoice.due_date)}
                            </p>
                            <p className="text-slate-600 dark:text-slate-300">
                                <strong>Currency:</strong> {invoice.currency_code}
                            </p>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px] font-bold text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">#</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 text-center">Qty</th>
                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                    <th className="px-4 py-3 text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {invoice.items && invoice.items.length > 0 ? (
                                    invoice.items.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="px-4 py-3.5 text-slate-400 font-bold">{idx + 1}</td>
                                            <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                                                {item.description}
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-semibold">{item.quantity}</td>
                                            <td className="px-4 py-3.5 text-right font-semibold">
                                                {formatCurrency(item.unit_price)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">
                                            No line items attached.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Summary */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-2 max-w-sm">
                            {invoice.notes && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line mt-0.5">
                                        {invoice.notes}
                                    </p>
                                </div>
                            )}
                            {invoice.terms && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terms & Conditions</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line mt-0.5">
                                        {invoice.terms}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-72 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {formatCurrency(invoice.subtotal)}
                                </span>
                            </div>
                            {Number(invoice.tax_amount || 0) > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>Tax ({invoice.tax_rate}%):</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {formatCurrency(invoice.tax_amount || 0)}
                                    </span>
                                </div>
                            )}
                            {Number(invoice.discount || 0) > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Discount:</span>
                                    <span className="font-bold">
                                        -{formatCurrency(invoice.discount || 0)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-base font-black text-slate-900 dark:text-white">
                                <span>Total Amount:</span>
                                <span className="text-blue-600 dark:text-blue-400">
                                    {formatCurrency(invoice.total_amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notice Footer */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400 font-medium">
                        Thank you for your business! This is an official system-generated billing invoice.
                    </div>
                </div>
            </div>
        </ClientPortalLayout>
    );
}
