import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    Download,
    Eye,
    FileSpreadsheet,
    LoaderCircle,
    Mail,
    Pencil,
    Phone,
    Printer,
    Share2,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { QuotationRecord } from './index';

interface QuotationShowProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    quotation: QuotationRecord;
}

export default function QuotationShow({ client, quotation }: QuotationShowProps) {
    const { auth } = usePage<SharedData>().props;
    const authUser = auth.user;

    const canEdit = hasPermission(authUser, 'edit-client-portal-quotations');
    const canDelete = hasPermission(authUser, 'delete-client-portal-quotations');
    const canPrint = hasPermission(authUser, 'print-client-portal-quotations');

    const [statusUpdating, setStatusUpdating] = useState(false);

    const isInvoice = quotation.status === 'accepted' || quotation.status === 'paid';
    const documentTypeLabel = isInvoice ? 'Invoice' : 'Quotation';
    const hasRecipient = Boolean(
        quotation.customer_name?.trim() ||
        quotation.customer_phone?.trim() ||
        quotation.customer_email?.trim() ||
        quotation.customer_address?.trim() ||
        quotation.customer_prefix?.trim()
    );

    const handleStatusChange = (newStatus: string) => {
        setStatusUpdating(true);
        router.patch(
            `/client-portal/quotations/${quotation.id}/status`,
            { status: newStatus },
            {
                onFinish: () => setStatusUpdating(false),
            }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getCompanyInitials = (name?: string | null) => {
        if (!name) return 'Q';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const getStatusBadge = () => {
        switch (quotation.status) {
            case 'paid':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        <span>Paid (Invoice Settled)</span>
                    </span>
                );
            case 'accepted':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <span>Invoice (Unpaid)</span>
                    </span>
                );
            case 'sent':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                        Sent (Unpaid)
                    </span>
                );
            case 'rejected':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        Rejected
                    </span>
                );
            case 'expired':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Expired
                    </span>
                );
            case 'draft':
            default:
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                        Draft (Unpaid)
                    </span>
                );
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Quotations', href: '/client-portal/quotations' },
        { title: `${documentTypeLabel} ${quotation.quotation_number}`, href: `/client-portal/quotations/${quotation.id}` },
    ];

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="quotations">
            <Head title={`${documentTypeLabel} ${quotation.quotation_number} - ${client.name}`} />

            <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto print:p-0 print:max-w-full">
                {/* Screen-Only Action Header Bar */}
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl shadow-xs">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/client-portal/quotations"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg font-black text-slate-900 dark:text-white">
                                    {quotation.quotation_number}
                                </h1>
                                {getStatusBadge()}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Created on {formatDate(quotation.date)}{quotation.customer_name?.trim() ? ` for ${quotation.customer_name}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Mark as Paid button when quotation is accepted */}
                        {canEdit && quotation.status === 'accepted' && (
                            <button
                                type="button"
                                onClick={() => handleStatusChange('paid')}
                                disabled={statusUpdating}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {statusUpdating ? (
                                    <LoaderCircle className="size-3.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="size-3.5" />
                                )}
                                <span>Mark as Paid</span>
                            </button>
                        )}

                        {/* Status Select */}
                        {canEdit && (
                            <select
                                value={quotation.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={statusUpdating}
                                className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="draft">Draft (Unpaid)</option>
                                <option value="sent">Sent (Unpaid)</option>
                                <option value="accepted">Accepted (Invoice Ready)</option>
                                <option value="paid">Paid (Invoice Settled)</option>
                                <option value="rejected">Rejected</option>
                                <option value="expired">Expired</option>
                            </select>
                        )}

                        {canPrint && (
                            <>
                                <a
                                    href={`/client-portal/quotations/${quotation.id}/print`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    <Printer className="size-4" />
                                    <span>Print</span>
                                </a>

                                <a
                                    href={`/client-portal/quotations/${quotation.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all"
                                >
                                    <Download className="size-4" />
                                    <span>PDF</span>
                                </a>
                            </>
                        )}

                        {canEdit && (
                            <Link
                                href={`/client-portal/quotations/${quotation.id}/edit`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#003796] hover:bg-[#002b75] text-white text-xs font-bold shadow-xs transition-all"
                            >
                                <Pencil className="size-3.5" />
                                <span>Edit</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Printable Document Paper Card (Exact Layout from Sample Screenshot) */}
                <div
                    id="quotation-print-area"
                    className="relative overflow-hidden bg-white text-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 md:p-12 space-y-6 print:border-none print:shadow-none print:p-8 print:rounded-none print:m-0"
                    style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                >
                    {/* Status Ribbon (When converted to Invoice) */}
                    {isInvoice && (
                        <div className="absolute top-0 right-0 w-36 h-36 overflow-hidden pointer-events-none z-20 select-none">
                            {quotation.status === 'paid' ? (
                                <div className="absolute top-7 -right-10 w-44 rotate-45 text-center py-1 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest shadow-md shadow-emerald-950/20 border-y border-emerald-400">
                                    PAID
                                </div>
                            ) : (
                                <div className="absolute top-7 -right-10 w-44 rotate-45 text-center py-1 bg-rose-600 text-white font-black text-[11px] uppercase tracking-widest shadow-md shadow-rose-950/20 border-y border-rose-400">
                                    UNPAID
                                </div>
                            )}
                        </div>
                    )}

                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-2">
                        {/* Left: Client's Company Logo */}
                        <div className="w-full sm:w-1/4 flex justify-start items-center">
                            {quotation.company_logo ? (
                                <img
                                    src={quotation.company_logo}
                                    alt={quotation.company_name || client.company_name || 'Client Company Logo'}
                                    className="max-h-20 max-w-[160px] w-auto object-contain rounded-lg"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="flex items-center gap-2.5">
                                    <div className="size-14 rounded-2xl bg-gradient-to-br from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white dark:border-slate-800">
                                        {getCompanyInitials(quotation.company_name || client.company_name || client.name)}
                                    </div>
                                    <div className="text-left hidden lg:block">
                                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block line-clamp-1 max-w-[120px]">
                                            {quotation.company_name || client.company_name || client.name}
                                        </span>
                                        <span className="text-[9px] font-bold text-blue-700 uppercase tracking-widest block">
                                            {isInvoice ? 'Official Invoice' : 'Official Quote'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Center: Company Details */}
                        <div className="w-full sm:w-2/4 text-center space-y-1">
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#002b66] uppercase">
                                {quotation.company_name || client.company_name || client.name || 'AL MUSTAFA FURNITURE MOVERS'}
                            </h2>
                            <div className="text-xs sm:text-sm font-medium text-slate-800 space-y-0.5">
                                {quotation.company_phone && <div>{quotation.company_phone}</div>}
                                {quotation.company_address && <div>{quotation.company_address}</div>}
                                <div className="flex items-center justify-center gap-3 text-xs pt-0.5">
                                    {quotation.company_whatsapp && (
                                        <span className="flex items-center gap-1">
                                            <span>📱</span>
                                            <span>{quotation.company_whatsapp}</span>
                                        </span>
                                    )}
                                    {quotation.company_email && (
                                        <span className="flex items-center gap-1">
                                            <span>✉️</span>
                                            <span>{quotation.company_email}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Quotation / Invoice Title */}
                        <div className="w-full sm:w-1/4 text-right">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                {documentTypeLabel}
                            </h1>
                            {isInvoice && (
                                <div className="flex justify-end pt-1">
                                    {quotation.status === 'paid' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            <CheckCircle2 className="size-3 text-emerald-600" />
                                            <span>PAID</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                                            <span>UNPAID</span>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Horizontal Divider Line */}
                    <div className="w-full border-t border-slate-400 my-4" />

                    {/* Recipient & Quotation Meta */}
                    <div className="flex flex-row justify-between items-start gap-4">
                        {/* Left: Recipient */}
                        {hasRecipient ? (
                            <div className="space-y-0.5 text-sm sm:text-base font-bold text-slate-900">
                                <div>To,</div>
                                {quotation.customer_name?.trim() && (
                                    <div className="text-base sm:text-lg font-black">
                                        {quotation.customer_prefix ? `${quotation.customer_prefix} ` : ''}{quotation.customer_name}
                                    </div>
                                )}
                                {quotation.customer_phone?.trim() && (
                                    <div className="text-xs font-normal text-slate-500">Phone: {quotation.customer_phone}</div>
                                )}
                                {quotation.customer_email?.trim() && (
                                    <div className="text-xs font-normal text-slate-500">Email: {quotation.customer_email}</div>
                                )}
                                {quotation.customer_address?.trim() && (
                                    <div className="text-xs font-normal text-slate-500">Address: {quotation.customer_address}</div>
                                )}
                            </div>
                        ) : (
                            <div />
                        )}

                        {/* Right: Meta */}
                        <div className="text-right text-sm sm:text-base space-y-1">
                            <div>
                                <span className="font-extrabold">{documentTypeLabel}#</span> &nbsp;{' '}
                                <span className="font-bold">{quotation.quotation_number}</span>
                            </div>
                            <div>
                                <span className="font-extrabold">Date:</span> &nbsp;{' '}
                                <span>{formatDate(quotation.date)}</span>
                            </div>
                            {quotation.expiry_date && (
                                <div className="text-xs text-slate-500">
                                    <span className="font-bold">Valid Until:</span> &nbsp;{' '}
                                    <span>{formatDate(quotation.expiry_date)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Salutation Block */}
                    <div className="space-y-1 text-sm sm:text-base text-slate-900 pt-2">
                        <div className="font-bold">{quotation.greeting || 'Dear Sir/Mam,'}</div>
                        <div>
                            {quotation.opening_text ||
                                "We thank you for providing us with an opportunity to submit our quotation for shifting your home furniture and appliances. Our prices are reasonable; our staff are professional and well trained to handle all your stuff and equipment's with care. Please find the complete details and expenses to cover this operation."}
                        </div>
                    </div>

                    {/* Line Items Table (No Qty column) */}
                    <div className="pt-2 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="border-t-2 border-b-2 border-[#003796] bg-slate-200/80 text-[#003796] font-black uppercase text-xs">
                                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                                    <th className="py-2.5 px-3">DESCRIPTION</th>
                                    <th className="py-2.5 px-3 w-44 text-right">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {quotation.items && quotation.items.length > 0 ? (
                                    quotation.items.map((item, index) => {
                                        const cleanAmount = Number(item.amount || item.unit_price || 0);
                                        return (
                                            <tr key={index} className="text-slate-900 font-bold">
                                                <td className="py-3 px-3 text-center text-slate-700">{index + 1}</td>
                                                <td className="py-3 px-3 font-extrabold leading-snug">
                                                    {item.description}
                                                </td>
                                                <td className="py-3 px-3 text-right font-black">
                                                    {quotation.currency_code}{' '}
                                                    {cleanAmount.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-4 text-center text-slate-400">
                                            No line items listed.
                                        </td>
                                    </tr>
                                )}

                                {/* Subtotal / Tax / Discount rows if applied */}
                                {(Number(quotation.tax_rate) > 0 || Number(quotation.discount) > 0) && (
                                    <>
                                        <tr>
                                            <td colSpan={2} className="py-2 px-3 text-right font-bold text-slate-600">
                                                Subtotal:
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                                                {quotation.currency_code}{' '}
                                                {Number(quotation.subtotal).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                        {Number(quotation.tax_rate) > 0 && (
                                            <tr>
                                                <td colSpan={2} className="py-1.5 px-3 text-right font-bold text-slate-600">
                                                    Tax ({quotation.tax_rate}%):
                                                </td>
                                                <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                                                    {quotation.currency_code}{' '}
                                                    {Number(quotation.tax_amount).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                            </tr>
                                        )}
                                        {Number(quotation.discount) > 0 && (
                                            <tr>
                                                <td colSpan={2} className="py-1.5 px-3 text-right font-bold text-emerald-700">
                                                    Discount:
                                                </td>
                                                <td className="py-1.5 px-3 text-right font-bold text-emerald-700">
                                                    - {quotation.currency_code}{' '}
                                                    {Number(quotation.discount).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}

                                {/* Grand Total Shaded Row */}
                                <tr className="border-t-2 border-b-2 border-slate-400 bg-slate-200/90 text-slate-900">
                                    <td colSpan={2} className="py-3 px-3 text-right font-black text-sm uppercase tracking-wider">
                                        GRAND TOTAL
                                    </td>
                                    <td className="py-3 px-3 text-right font-black text-sm sm:text-base text-slate-900">
                                        {quotation.currency_code}{' '}
                                        {Number(quotation.total_amount).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Closing Note */}
                    <div className="text-sm font-semibold text-slate-900 pt-2">
                        {quotation.closing_text ||
                            'In case of any queries, kindly get in touch with us. Thank you and I look forward to hearing from you.'}
                    </div>

                    {/* Notes & Terms if any */}
                    {(quotation.notes || quotation.terms) && (
                        <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-[#003796] space-y-2 text-xs text-slate-700">
                            {quotation.notes && (
                                <div>
                                    <span className="font-bold">NOTES:</span> {quotation.notes}
                                </div>
                            )}
                            {quotation.terms && (
                                <div>
                                    <span className="font-bold">TERMS:</span> {quotation.terms}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Signature Block */}
                    <div className="pt-8 flex justify-end">
                        <div className="w-64 sm:w-72 text-center space-y-2">
                            <div className="font-black text-xs sm:text-sm text-slate-900 uppercase">
                                {quotation.authorized_by_text || `For, ${quotation.company_name || 'AL MUSTAFA FURNITURE MOVERS'}`}
                            </div>

                            {/* Signature image or blank space for signing */}
                            {quotation.signature_image ? (
                                <div className="h-16 sm:h-20 flex items-center justify-center">
                                    <img
                                        src={quotation.signature_image}
                                        alt="Signature"
                                        className="max-h-16 max-w-[200px] object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="h-16 sm:h-20" />
                            )}

                            <div className="border-t border-slate-700 pt-1.5 text-[11px] sm:text-xs font-black tracking-wider text-slate-800 uppercase">
                                AUTHORIZED SIGNATURE
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ClientPortalLayout>
    );
}
