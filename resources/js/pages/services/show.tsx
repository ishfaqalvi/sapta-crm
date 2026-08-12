import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building,
    Calendar,
    CheckCircle2,
    DollarSign,
    FileText,
    Package,
    PauseCircle,
    Printer,
    Receipt,
    RefreshCw,
    StopCircle,
    User,
} from 'lucide-react';
import React, { useState } from 'react';

export interface ServicePaymentItem {
    id: number;
    client_service_id: number;
    client_id: number;
    billing_month: string;
    amount_due: number | string;
    amount_paid: number | string;
    payment_date: string | null;
    status: 'paid' | 'due_pending' | 'overdue';
    payment_method: string | null;
    notes: string | null;
}

export interface ClientServiceDetailItem {
    id: number;
    client_id: number;
    category_id?: number | null;
    category?: {
        id: number;
        name: string;
    } | null;
    service_name: string;
    monthly_fee: number | string;
    contract_months: number;
    currency: string;
    start_date: string | null;
    billing_day: number;
    status: 'active' | 'paused' | 'stopped';
    notes: string | null;
    created_at?: string;
    client?: {
        id: number;
        name: string;
        client_code: string;
        company_name?: string;
        currency: string;
    } | null;
    payments?: ServicePaymentItem[];
}

interface ServiceShowProps {
    service: ClientServiceDetailItem;
    company?: {
        name: string;
        email: string;
        phone?: string;
        address?: string;
        tax_id?: string;
        logo?: string;
    };
}

export default function ServiceShow({ service, company }: ServiceShowProps) {
    const companyInfo = company || {
        name: 'Sapta Technologies',
        email: 'contact@saptatechnologies.com',
        phone: '+92 300 1234567',
        address: 'Office #402, Software Technology Park, Lahore, Pakistan',
        tax_id: 'NTN-892415-0',
        logo: '/app-logo-icon.png',
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Services', href: '/services' },
        { title: service.service_name, href: `/services/${service.id}` },
    ];

    const client = service.client || {
        id: service.client_id,
        name: 'Client',
        client_code: 'CL-000',
        company_name: '',
        currency: service.currency || '$',
    };

    // Active Tab state ('details' | 'payments')
    const getInitialTab = (): 'details' | 'payments' => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'payments' || tab === 'details') {
                return tab;
            }
        }
        return 'details';
    };

    const [activeTab, setActiveTabState] = useState<'details' | 'payments'>(getInitialTab);

    const setActiveTab = (tab: 'details' | 'payments') => {
        setActiveTabState(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const formatDateOnly = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        const cleanDate = dateString.includes('T') ? dateString.split('T')[0] : dateString.split(' ')[0];
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

    const formatCurrency = (val: number | string, currencySymbol: string = service.currency || '$') => {
        const num = typeof val === 'number' ? val : parseFloat(val || '0');
        return `${currencySymbol} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const totalContractMonths = service.contract_months || 12;
    const totalContractValue = Number(service.monthly_fee) * totalContractMonths;
    const paymentsList = service.payments || [];
    const totalPaid = paymentsList
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);

    const paidPercentage = totalContractValue > 0 ? Math.min(100, Math.round((totalPaid / totalContractValue) * 100)) : 0;

    // Dedicated Professional Print Window Invoice Receipt
    const handlePrintInvoice = (pay: ServicePaymentItem) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const invoiceHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Service Invoice Statement - #${pay.id}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;800&display=swap');
                    
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        background: #ffffff;
                        color: #0f172a;
                        padding: 40px;
                        -webkit-print-color-adjust: exact;
                    }

                    .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                        border: 1px solid #e2e8f0;
                        border-radius: 24px;
                        padding: 40px;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding-bottom: 24px;
                        border-bottom: 2px solid #f1f5f9;
                        margin-bottom: 32px;
                    }

                    .brand-name {
                        font-size: 22px;
                        font-weight: 900;
                        color: #003796;
                        letter-spacing: -0.5px;
                    }

                    .brand-sub {
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 500;
                        margin-top: 2px;
                    }

                    .invoice-title {
                        font-size: 24px;
                        font-weight: 900;
                        color: #0f172a;
                        text-align: right;
                        letter-spacing: -0.5px;
                    }

                    .invoice-num {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 13px;
                        color: #0052D4;
                        font-weight: 800;
                        text-align: right;
                        margin-top: 4px;
                    }

                    .meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 24px;
                        margin-bottom: 32px;
                    }

                    .meta-label {
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #94a3b8;
                        margin-bottom: 6px;
                    }

                    .meta-title {
                        font-size: 15px;
                        font-weight: 800;
                        color: #0f172a;
                    }

                    .meta-text {
                        font-size: 12px;
                        color: #475569;
                        margin-top: 2px;
                        font-weight: 500;
                    }

                    .table-container {
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        overflow: hidden;
                        margin-bottom: 32px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                    }

                    th {
                        background: #f8fafc;
                        padding: 14px 18px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #64748b;
                        border-bottom: 1px solid #e2e8f0;
                    }

                    td {
                        padding: 16px 18px;
                        font-size: 12px;
                        font-weight: 600;
                        color: #1e293b;
                        border-bottom: 1px solid #f1f5f9;
                    }

                    tr:last-child td {
                        border-bottom: none;
                    }

                    .mono-val {
                        font-family: 'JetBrains Mono', monospace;
                        font-weight: 800;
                    }

                    .status-pill {
                        display: inline-block;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .status-paid {
                        background: #dcfce7;
                        color: #15803d;
                        border: 1px solid #bbf7d0;
                    }

                    .status-pending {
                        background: #fef3c7;
                        color: #b45309;
                        border: 1px solid #fde68a;
                    }

                    .totals-section {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 40px;
                    }

                    .totals-box {
                        width: 320px;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 20px;
                    }

                    .totals-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 600;
                    }

                    .totals-row.final {
                        margin-top: 12px;
                        padding-top: 12px;
                        border-top: 2px solid #e2e8f0;
                        font-size: 14px;
                        font-weight: 800;
                        color: #0f172a;
                    }

                    .final-amount {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 20px;
                        font-weight: 900;
                        color: #0052D4;
                    }

                    .footer {
                        padding-top: 24px;
                        border-top: 1px solid #f1f5f9;
                        font-size: 11px;
                        color: #94a3b8;
                        text-align: center;
                        font-weight: 500;
                    }

                    @media print {
                        body { padding: 0; background: white; }
                        .invoice-container { max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="header">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <img src="${companyInfo.logo || '/app-logo-icon.png'}" alt="Company Logo" style="height: 48px; width: auto; object-fit: contain;" />
                            <div>
                                <div class="brand-name">${companyInfo.name}</div>
                                <div class="brand-sub">${companyInfo.email} ${companyInfo.phone ? ' • ' + companyInfo.phone : ''}</div>
                                ${companyInfo.address ? `<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${companyInfo.address}${companyInfo.tax_id ? ' • NTN: ' + companyInfo.tax_id : ''}</div>` : ''}
                            </div>
                        </div>
                        <div>
                            <div class="invoice-title">SERVICE INVOICE</div>
                            <div class="invoice-num">#INV-SRV-${pay.id}</div>
                        </div>
                    </div>

                    <div class="meta-grid">
                        <div>
                            <div class="meta-label">Billed To:</div>
                            <div class="meta-title">${client.company_name || client.name}</div>
                            <div class="meta-text"><strong>Attn:</strong> ${client.name}</div>
                            <div class="meta-text"><strong>Client Code:</strong> ${client.client_code}</div>
                        </div>

                        <div style="text-align: right;">
                            <div class="meta-label">Invoice & Service Details:</div>
                            <div class="meta-text"><strong>Service:</strong> ${service.service_name}</div>
                            <div class="meta-text"><strong>Category:</strong> ${service.category?.name || 'General'}</div>
                            <div class="meta-text"><strong>Billing Month:</strong> ${pay.billing_month}</div>
                            <div class="meta-text"><strong>Date:</strong> ${pay.payment_date ? formatDateOnly(pay.payment_date) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                    </div>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Description / Billing Month</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Amount Due</th>
                                    <th style="text-align: right;">Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div style="font-weight: 800; color: #0f172a;">${service.service_name} (${pay.billing_month})</div>
                                        ${pay.notes ? `<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${pay.notes}</div>` : ''}
                                    </td>
                                    <td>
                                        <span class="status-pill ${pay.status === 'paid' ? 'status-paid' : 'status-pending'}">
                                            ${pay.status === 'paid' ? 'Paid' : pay.status === 'overdue' ? 'Overdue' : 'Pending'}
                                        </span>
                                    </td>
                                    <td style="text-align: right;" class="mono-val">${formatCurrency(pay.amount_due)}</td>
                                    <td style="text-align: right;" class="mono-val" style="color: #16a34a;">${formatCurrency(pay.amount_paid)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="totals-section">
                        <div class="totals-box">
                            <div class="totals-row">
                                <span>Amount Due:</span>
                                <span class="mono-val" style="color: #0f172a;">${formatCurrency(pay.amount_due)}</span>
                            </div>
                            <div class="totals-row">
                                <span>Amount Paid:</span>
                                <span class="mono-val" style="color: #16a34a;">${formatCurrency(pay.amount_paid)}</span>
                            </div>
                            <div class="totals-row final">
                                <span>Total Paid:</span>
                                <span class="final-amount">${formatCurrency(pay.amount_paid)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        Thank you for your business! This is an official system-generated service invoice statement.
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Service Details: ${service.service_name}`} />

            <div className="p-4 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950">
                {/* 1. TOP HEADER CARD: TABS ON LEFT, BACK BUTTON ON RIGHT */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                    {/* Left: Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {/* TAB 1: Details */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'details'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <FileText className="size-4" />
                            <span>1. Details</span>
                        </button>

                        {/* TAB 2: Payments */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('payments')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'payments'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Receipt className="size-4" />
                            <span>2. Payments ({paymentsList.length})</span>
                        </button>
                    </div>

                    {/* Right: Back Button */}
                    <Link
                        href="/services"
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to Services</span>
                    </Link>
                </div>

                {/* 2. TAB 1 CONTENT: DETAILS */}
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Service Title & Status Banner */}
                        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                        {service.service_name}
                                    </h1>

                                    {service.category && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                            {service.category.name}
                                        </span>
                                    )}

                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize inline-flex items-center gap-1 ${
                                            service.status === 'active'
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                : service.status === 'paused'
                                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                        }`}
                                    >
                                        {service.status === 'active' ? (
                                            <>
                                                <CheckCircle2 className="size-3.5" />
                                                <span>Active</span>
                                            </>
                                        ) : service.status === 'paused' ? (
                                            <>
                                                <PauseCircle className="size-3.5" />
                                                <span>Paused</span>
                                            </>
                                        ) : (
                                            <>
                                                <StopCircle className="size-3.5" />
                                                <span>Stopped</span>
                                            </>
                                        )}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Building className="size-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{client.name}</span>
                                    <span className="font-mono text-blue-600 text-[11px] font-bold">({client.client_code})</span>
                                    {client.company_name && <span>• {client.company_name}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Top Executive KPI Cards Grid (4 Cards) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Monthly Fee */}
                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Fee</span>
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <DollarSign className="size-4" />
                                    </div>
                                </div>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {formatCurrency(service.monthly_fee)} <span className="text-xs text-slate-400 font-semibold">/ mo</span>
                                </p>
                                <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                    Billing Currency: <strong className="text-slate-700 dark:text-slate-300 font-mono">{service.currency || client.currency}</strong>
                                </p>
                            </div>

                            {/* Contract Value & Duration */}
                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contract Value</span>
                                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                        <Package className="size-4" />
                                    </div>
                                </div>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {formatCurrency(totalContractValue)}
                                </p>
                                <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                    Duration: <strong className="text-slate-700 dark:text-slate-300">{totalContractMonths} Months</strong>
                                </p>
                            </div>

                            {/* Billing Cycle & Start Date */}
                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing Cycle</span>
                                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                        <Calendar className="size-4" />
                                    </div>
                                </div>
                                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Day {service.billing_day} of month
                                </p>
                                <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                    Started: {formatDateOnly(service.start_date)}
                                </p>
                            </div>

                            {/* Total Paid & Settle % */}
                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Paid</span>
                                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                        <RefreshCw className="size-4" />
                                    </div>
                                </div>
                                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(totalPaid)}
                                </p>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${paidPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Detail Cards: Scope Notes & Account Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Scope Notes Card */}
                            <div className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText className="size-4 text-blue-600" />
                                    <span>Service Scope & Deliverables</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Category</span>
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            {service.category?.name || 'General Service'}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Monthly Due Day</span>
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            Day {service.billing_day} of month
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Contract Duration</span>
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            {totalContractMonths} Months
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {service.notes || 'No custom scope notes logged for this service subscription.'}
                                </div>
                            </div>

                            {/* Account Info Card */}
                            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <User className="size-4 text-blue-600" />
                                    <span>Client Profile</span>
                                </h3>

                                <div className="space-y-4 text-xs">
                                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                        <div className="size-10 rounded-xl bg-gradient-to-br from-[#003796] to-[#1d4ed8] text-white font-black text-sm flex items-center justify-center shrink-0">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{client.name}</h4>
                                            <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                                {client.client_code}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-slate-600 dark:text-slate-300 font-medium">
                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-400">Company Name</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{client.company_name || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-400">Account Currency</span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{client.currency || 'USD'}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-400">Subscription Status</span>
                                            <span className="font-bold capitalize text-slate-800 dark:text-slate-200">{service.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. TAB 2 CONTENT: PAYMENTS */}
                {activeTab === 'payments' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <Receipt className="size-4 text-emerald-600" />
                                <span>Monthly Billing & Payment History</span>
                            </h3>
                        </div>

                        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4">Billing Month</th>
                                            <th className="px-6 py-4">Amount Due</th>
                                            <th className="px-6 py-4">Amount Paid</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Payment Date</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                                        {paymentsList.length > 0 ? (
                                            paymentsList.map((pay) => (
                                                <tr key={pay.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-mono">
                                                        {pay.billing_month}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-mono">
                                                        {formatCurrency(pay.amount_due)}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                                        {formatCurrency(pay.amount_paid)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                pay.status === 'paid'
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                    : pay.status === 'overdue'
                                                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                            }`}
                                                        >
                                                            {pay.status === 'paid' ? 'Paid / Cleared' : pay.status === 'overdue' ? 'Overdue' : 'Due Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 font-medium">
                                                        {formatDateOnly(pay.payment_date)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Printable Invoice */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePrintInvoice(pay)}
                                                                className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer"
                                                                title="View / Print Dedicated Statement Invoice"
                                                            >
                                                                <Printer className="size-3.5" />
                                                                <span>Print</span>
                                                            </button>

                                                            {/* Status Badge */}
                                                            {pay.status !== 'paid' ? (
                                                                <span className="h-8 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-extrabold text-[11px] inline-flex items-center gap-1 cursor-default border border-amber-200 dark:border-amber-800">
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    <span>Not Paid</span>
                                                                </span>
                                                            ) : (
                                                                <span className="h-8 px-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] inline-flex items-center gap-1 cursor-default border border-emerald-200 dark:border-emerald-800">
                                                                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                                    <span>Paid</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                                                    No billing records logged yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
