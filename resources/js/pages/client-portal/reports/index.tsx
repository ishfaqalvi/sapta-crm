import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    FileText,
    Globe,
    LineChart,
    Printer,
    Receipt,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

export interface ProjectReportItem {
    id: number;
    project_name: string;
    category_name: string;
    status: string;
    project_cost: number;
    paid_amount: number;
    remaining_balance: number;
    currency: string;
    total_tasks: number;
    completed_tasks: number;
    progress_percentage: number;
    created_at: string | null;
}

export interface ServiceReportItem {
    id: number;
    service_name: string;
    category_name: string;
    monthly_fee: number;
    currency: string;
    billing_day: number;
    status: string;
    paid_cycles: number;
    pending_cycles: number;
    start_date: string;
}

export interface InvoiceLogItem {
    id: string | number;
    invoice_number: string;
    type?: string;
    description?: string;
    issue_date: string;
    due_date: string;
    total: number;
    amount_paid: number;
    currency: string;
    status: string;
}

interface ClientPortalReportsProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    financials: {
        total_invoiced: number;
        total_paid: number;
        total_pending: number;
        total_invoices_count: number;
        paid_invoices_count: number;
        pending_invoices_count: number;
    };
    projects: ProjectReportItem[];
    services: ServiceReportItem[];
    serviceStats: {
        total_services: number;
        active_services: number;
        monthly_recurring_total: number;
    };
    invoiceLog: InvoiceLogItem[];
    company: {
        name: string;
        email: string;
        phone: string;
        address: string;
        tax_id: string;
        logo: string;
    };
}

export default function ClientPortalReportsIndex({
    client,
    financials,
    projects,
    services,
    serviceStats,
    invoiceLog,
    company,
}: ClientPortalReportsProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Reports & Statements', href: '/client-portal/reports' },
    ];

    const [activeTab, setActiveTab] = useState<'financials' | 'projects' | 'services'>('financials');

    const handlePrint = () => {
        window.print();
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title="Reports & Financial Statements" />

            <div className="flex h-full flex-1 flex-col gap-6 p-2 md:p-6 bg-slate-50/50 dark:bg-slate-950 print:bg-white print:p-0">
                {/* Header (Hidden during print) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <BarChart3 className="size-5 text-blue-600 dark:text-blue-400" />
                            Reports & Financial Statements
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Comprehensive financial ledger, project completion analytics, and active subscription reports.
                        </p>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer"
                    >
                        <Printer className="size-4" />
                        <span>Print Financial Statement</span>
                    </button>
                </div>

                {/* Printable Invoice-style Header (Visible ONLY during print) */}
                <div className="hidden print:block mb-8 border-b border-slate-200 pb-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-blue-600 tracking-tight uppercase">
                                {company.name}
                            </h2>
                            <p className="text-xs text-slate-500">{company.email}</p>
                            <p className="text-xs text-slate-500">{company.phone}</p>
                            <p className="text-xs text-slate-500">{company.address}</p>
                            {company.tax_id && <p className="text-xs text-slate-400">NTN: {company.tax_id}</p>}
                        </div>

                        <div className="text-right space-y-1">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-wider">
                                STATEMENT OF ACCOUNT
                            </h3>
                            <p className="text-xs font-mono font-bold text-blue-600">
                                DATE: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100 text-xs">
                        <div className="space-y-1">
                            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                                Billed To:
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900">
                                {client.company_name || client.name}
                            </h4>
                            <p className="text-slate-600">Account Code: {client.client_code}</p>
                            <p className="text-slate-600">Client Name: {client.name}</p>
                        </div>

                        <div className="text-right space-y-1">
                            <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
                                Account Summary:
                            </span>
                            <p className="text-slate-700">
                                <strong>Total Invoiced:</strong> {client.currency || 'AED'} {financials.total_invoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-slate-700">
                                <strong>Total Paid:</strong> {client.currency || 'AED'} {financials.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-slate-700">
                                <strong>Outstanding Balance:</strong> {client.currency || 'AED'} {financials.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top Overview Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                                {client.currency || 'AED'} {financials.total_invoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{financials.total_invoices_count} Statements Invoiced</p>
                        </div>
                        <div className="size-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Receipt className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Paid / Cleared</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {client.currency || 'AED'} {financials.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 font-medium">
                                {financials.paid_invoices_count} Paid Invoices
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                {client.currency || 'AED'} {financials.total_pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 font-medium">
                                {financials.pending_invoices_count} Pending Invoices
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Subscriptions</p>
                            <h3 className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                                {client.currency || 'AED'} {serviceStats.monthly_recurring_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5 font-medium">
                                {serviceStats.active_services} Active Subscriptions
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <LineChart className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Tab Controls (Hidden in print) */}
                <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 print:hidden overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('financials')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'financials'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <FileText className="size-4" />
                        <span>Financial Ledger & Invoices</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'projects'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <Globe className="size-4" />
                        <span>Projects & Progress Analytics ({projects.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('services')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'services'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <LineChart className="size-4" />
                        <span>Subscriptions Report ({services.length})</span>
                    </button>
                </div>

                {/* Tab 1: Financial Ledger & Invoices */}
                {(activeTab === 'financials' || typeof window !== 'undefined') && (
                    <div className={`space-y-4 ${activeTab !== 'financials' ? 'print:block hidden' : ''}`}>
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs print:border-none print:shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white print:text-slate-900">
                                    Statement of Account & Invoices Log
                                </h3>
                                <span className="text-xs text-slate-400 font-medium">Total {invoiceLog.length} Records</span>
                            </div>

                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <table className="w-full min-w-[750px] text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                                            <th className="py-3 px-4">Ref #</th>
                                            <th className="py-3 px-4">Type & Details</th>
                                            <th className="py-3 px-4">Issue Date</th>
                                            <th className="py-3 px-4 text-right">Total Amount</th>
                                            <th className="py-3 px-4 text-right">Amount Paid</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {invoiceLog.length > 0 ? (
                                            invoiceLog.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                                        {inv.invoice_number}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="font-bold text-slate-900 dark:text-white block">{inv.description || inv.type || 'Billing Statement'}</span>
                                                        {inv.type && <span className="text-[10px] text-slate-400 font-medium">{inv.type}</span>}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                                                        {inv.issue_date}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {inv.currency || 'AED'} {Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                        {inv.currency || 'AED'} {Number(inv.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span
                                                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : inv.status === 'overdue'
                                                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                                }`}
                                                        >
                                                            {inv.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                                    No invoice records found for this account.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Projects & Progress Analytics */}
                {activeTab === 'projects' && (
                    <div className="space-y-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    Project Completion & Financial Progress Report
                                </h3>
                                <span className="text-xs text-slate-400 font-medium">{projects.length} Active & Past Projects</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {projects.length > 0 ? (
                                    projects.map((proj) => (
                                        <div
                                            key={proj.id}
                                            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                        {proj.project_name}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{proj.category_name}</p>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                    {proj.status}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="text-slate-500">Tasks Completed</span>
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        {proj.completed_tasks} / {proj.total_tasks} ({proj.progress_percentage}%)
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                                                        style={{ width: `${proj.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Financial Metrics */}
                                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Cost</span>
                                                    <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                                                        {proj.currency} {proj.project_cost.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Paid</span>
                                                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                        {proj.currency} {proj.paid_amount.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">Balance</span>
                                                    <p className="font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                                        {proj.currency} {proj.remaining_balance.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-8 text-center text-slate-400 italic">
                                        No project progress records found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 3: Subscriptions Report */}
                {activeTab === 'services' && (
                    <div className="space-y-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    Subscribed Services & Billing Cycles Report
                                </h3>
                                <span className="text-xs text-slate-400 font-medium">{services.length} Total Services</span>
                            </div>

                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <table className="w-full min-w-[750px] text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                                            <th className="py-3 px-4">Service Name</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4">Billing Day</th>
                                            <th className="py-3 px-4 text-right">Monthly Fee</th>
                                            <th className="py-3 px-4 text-center">Paid Cycles</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {services.length > 0 ? (
                                            services.map((srv) => (
                                                <tr key={srv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                                                        {srv.service_name}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                                                        {srv.category_name}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                                                        Day {srv.billing_day} of month
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {srv.currency} {srv.monthly_fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                                        {srv.paid_cycles} months paid
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span
                                                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${srv.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                                }`}
                                                        >
                                                            {srv.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                                    No service subscription records found.
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
        </ClientPortalLayout>
    );
}
