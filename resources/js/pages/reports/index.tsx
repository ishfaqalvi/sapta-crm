import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    FolderKanban,
    Globe,
    Layers,
    LineChart,
    Printer,
    Receipt,
    RefreshCw,
    Search,
    Server,
    ShieldAlert,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export interface ClientItem {
    id: number;
    name: string;
    company_name?: string;
    client_code: string;
    currency: string;
}

export interface TransactionItem {
    id: string;
    raw_id: number;
    category: 'project' | 'service' | 'domain' | 'hosting';
    category_label: string;
    client_id: number;
    client?: ClientItem | null;
    parent_id: number;
    parent_name: string;
    title: string;
    date: string;
    due_date: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'overdue' | 'cancelled';
    invoice?: {
        id: number;
        invoice_number: string;
        status: string;
    } | null;
}

export interface KpiData {
    total_billed: number;
    total_paid: number;
    total_pending: number;
    total_overdue: number;
    total_cancelled: number;
    count_all: number;
    count_paid: number;
    count_pending: number;
    count_overdue: number;
    count_cancelled: number;
}

export interface CategoryBreakdownItem {
    total: number;
    paid: number;
    pending: number;
    count: number;
}

export interface CategoryBreakdown {
    project: CategoryBreakdownItem;
    service: CategoryBreakdownItem;
    domain: CategoryBreakdownItem;
    hosting: CategoryBreakdownItem;
}

export interface AdminReportsProps {
    selectedClient?: ClientItem | null;
    clients: ClientItem[];
    transactions: TransactionItem[];
    kpi: KpiData;
    categoryBreakdown: CategoryBreakdown;
    options: {
        projects: { id: number; project_name: string; client_id: number }[];
        services: { id: number; service_name: string; client_id: number }[];
        domains: { id: number; domain_name: string; client_id: number }[];
        hostings: { id: number; hosting_title: string; client_id: number }[];
    };
    filters: {
        client_id?: string | number;
        category: string;
        status: string;
        project_id?: string | number;
        service_id?: string | number;
        domain_id?: string | number;
        hosting_id?: string | number;
        from_date?: string;
        to_date?: string;
        search?: string;
    };
    company: {
        name: string;
        email: string;
        phone: string;
        address: string;
        tax_id: string;
        logo: string;
    };
}

export default function AdminReportsIndex({
    selectedClient,
    clients = [],
    transactions = [],
    kpi = {
        total_billed: 0,
        total_paid: 0,
        total_pending: 0,
        total_overdue: 0,
        total_cancelled: 0,
        count_all: 0,
        count_paid: 0,
        count_pending: 0,
        count_overdue: 0,
        count_cancelled: 0,
    },
    categoryBreakdown = {
        project: { total: 0, paid: 0, pending: 0, count: 0 },
        service: { total: 0, paid: 0, pending: 0, count: 0 },
        domain: { total: 0, paid: 0, pending: 0, count: 0 },
        hosting: { total: 0, paid: 0, pending: 0, count: 0 },
    },
    options = {
        projects: [],
        services: [],
        domains: [],
        hostings: [],
    },
    filters = {
        client_id: 'all',
        category: 'all',
        status: 'all',
        project_id: '',
        service_id: '',
        domain_id: '',
        hosting_id: '',
        from_date: '',
        to_date: '',
        search: '',
    },
}: AdminReportsProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Financial Reports & Ledger',
            href: '/reports',
        },
    ];

    // Local State for Reactive Filters
    const [clientId, setClientId] = useState<string>(String(filters.client_id || 'all'));
    const [category, setCategory] = useState<string>(filters.category || 'all');
    const [status, setStatus] = useState<string>(filters.status || 'all');
    const [projectId, setProjectId] = useState<string>(String(filters.project_id || ''));
    const [serviceId, setServiceId] = useState<string>(String(filters.service_id || ''));
    const [domainId, setDomainId] = useState<string>(String(filters.domain_id || ''));
    const [hostingId, setHostingId] = useState<string>(String(filters.hosting_id || ''));
    const [fromDate, setFromDate] = useState<string>(filters.from_date || '');
    const [toDate, setToDate] = useState<string>(filters.to_date || '');
    const [search, setSearch] = useState<string>(filters.search || '');

    // Synchronize local filter state on props change
    useEffect(() => {
        setClientId(String(filters.client_id || 'all'));
        setCategory(filters.category || 'all');
        setStatus(filters.status || 'all');
        setProjectId(String(filters.project_id || ''));
        setServiceId(String(filters.service_id || ''));
        setDomainId(String(filters.domain_id || ''));
        setHostingId(String(filters.hosting_id || ''));
        setFromDate(filters.from_date || '');
        setToDate(filters.to_date || '');
        setSearch(filters.search || '');
    }, [filters]);

    // Apply Filter via Inertia router
    const applyFilters = useCallback(
        (overrides: Record<string, string | number> = {}) => {
            const queryParams: Record<string, string> = {};

            const cId = overrides.client_id !== undefined ? overrides.client_id : clientId;
            const cat = overrides.category !== undefined ? overrides.category : category;
            const st = overrides.status !== undefined ? overrides.status : status;
            const pId = overrides.project_id !== undefined ? overrides.project_id : projectId;
            const sId = overrides.service_id !== undefined ? overrides.service_id : serviceId;
            const dId = overrides.domain_id !== undefined ? overrides.domain_id : domainId;
            const hId = overrides.hosting_id !== undefined ? overrides.hosting_id : hostingId;
            const fDate = overrides.from_date !== undefined ? overrides.from_date : fromDate;
            const tDate = overrides.to_date !== undefined ? overrides.to_date : toDate;
            const srch = overrides.search !== undefined ? overrides.search : search;

            if (cId && cId !== 'all') queryParams.client_id = String(cId);
            if (cat && cat !== 'all') queryParams.category = String(cat);
            if (st && st !== 'all') queryParams.status = String(st);
            if (pId) queryParams.project_id = String(pId);
            if (sId) queryParams.service_id = String(sId);
            if (dId) queryParams.domain_id = String(dId);
            if (hId) queryParams.hosting_id = String(hId);
            if (fDate) queryParams.from_date = String(fDate);
            if (tDate) queryParams.to_date = String(tDate);
            if (srch) queryParams.search = String(srch);

            router.get('/reports', queryParams, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [clientId, category, status, projectId, serviceId, domainId, hostingId, fromDate, toDate, search]
    );

    const handleCategoryTab = (newCategory: string) => {
        setCategory(newCategory);
        setProjectId('');
        setServiceId('');
        setDomainId('');
        setHostingId('');
        applyFilters({
            category: newCategory,
            project_id: '',
            service_id: '',
            domain_id: '',
            hosting_id: '',
        });
    };

    const handleQuickDatePeriod = (period: string) => {
        const today = new Date();
        let from = '';
        let to = '';

        if (period === 'this_month') {
            const first = new Date(today.getFullYear(), today.getMonth(), 1);
            const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            from = first.toISOString().split('T')[0];
            to = last.toISOString().split('T')[0];
        } else if (period === 'last_month') {
            const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const last = new Date(today.getFullYear(), today.getMonth(), 0);
            from = first.toISOString().split('T')[0];
            to = last.toISOString().split('T')[0];
        } else if (period === 'this_year') {
            const first = new Date(today.getFullYear(), 0, 1);
            const last = new Date(today.getFullYear(), 11, 31);
            from = first.toISOString().split('T')[0];
            to = last.toISOString().split('T')[0];
        } else if (period === 'last_30_days') {
            const past = new Date();
            past.setDate(past.getDate() - 30);
            from = past.toISOString().split('T')[0];
            to = today.toISOString().split('T')[0];
        }

        setFromDate(from);
        setToDate(to);
        applyFilters({ from_date: from, to_date: to });
    };

    const handleResetFilters = () => {
        setClientId('all');
        setCategory('all');
        setStatus('all');
        setProjectId('');
        setServiceId('');
        setDomainId('');
        setHostingId('');
        setFromDate('');
        setToDate('');
        setSearch('');
        router.get('/reports', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const isFiltered =
        (clientId && clientId !== 'all') ||
        category !== 'all' ||
        status !== 'all' ||
        !!projectId ||
        !!serviceId ||
        !!domainId ||
        !!hostingId ||
        !!fromDate ||
        !!toDate ||
        !!search;

    // Generate PDF Link with Query Parameters
    const generatePdfUrl = () => {
        const params = new URLSearchParams();
        if (clientId && clientId !== 'all') params.set('client_id', clientId);
        if (category && category !== 'all') params.set('category', category);
        if (status && status !== 'all') params.set('status', status);
        if (projectId) params.set('project_id', projectId);
        if (serviceId) params.set('service_id', serviceId);
        if (domainId) params.set('domain_id', domainId);
        if (hostingId) params.set('hosting_id', hostingId);
        if (fromDate) params.set('from_date', fromDate);
        if (toDate) params.set('to_date', toDate);
        if (search) params.set('search', search);

        const qs = params.toString();
        return `/reports/pdf${qs ? `?${qs}` : ''}`;
    };

    const renderCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'project':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60">
                        <FolderKanban className="size-3" /> Project Milestone
                    </span>
                );
            case 'service':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                        <Layers className="size-3" /> Monthly Subscription
                    </span>
                );
            case 'domain':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                        <Globe className="size-3" /> Domain Renewal
                    </span>
                );
            case 'hosting':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                        <Server className="size-3" /> Web Hosting
                    </span>
                );
        }
    };

    const renderStatusBadge = (st: string) => {
        const s = String(st || '').toLowerCase();
        if (s === 'paid' || s === 'completed' || s === 'settled') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                    <CheckCircle2 className="size-3" /> Paid
                </span>
            );
        }
        if (s === 'overdue') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60">
                    <ShieldAlert className="size-3" /> Overdue
                </span>
            );
        }
        if (s === 'cancelled' || s === 'void') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Cancelled
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                <Clock className="size-3" /> Pending
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Financial Reports & Statement Ledger" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Top Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                {selectedClient ? selectedClient.client_code : 'FINANCIAL LEDGER'}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Financial Reports & Statement Ledger
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Cross-client financial reporting, milestone billings, retainer cycles, domain & hosting renewals.
                        </p>
                    </div>

                    {/* PDF Download & Print Actions */}
                    <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                        <a
                            href={generatePdfUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer"
                        >
                            <Download className="size-4" />
                            <span>Download PDF Report</span>
                        </a>

                        <button
                            type="button"
                            onClick={() => window.open(generatePdfUrl(), '_blank')}
                            className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-2xs cursor-pointer"
                        >
                            <Printer className="size-4" />
                            <span>Print</span>
                        </button>
                    </div>
                </div>

                {/* KPI Overview Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Billed */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Total Billed Volume
                            </p>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                                {kpi.total_billed.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                {kpi.count_all} records recorded
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                            <Receipt className="size-5" />
                        </div>
                    </div>

                    {/* Total Paid */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Total Paid Amount
                            </p>
                            <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {kpi.total_paid.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </h3>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                                {kpi.count_paid} settled payments
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    {/* Pending / Due */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Pending / Due
                            </p>
                            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                                {kpi.total_pending.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </h3>
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                                {kpi.count_pending} items awaiting payment
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    {/* Overdue */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                Overdue Invoices
                            </p>
                            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                                {kpi.total_overdue.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </h3>
                            <p className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold mt-1">
                                {kpi.count_overdue} overdue items
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs">
                            <ShieldAlert className="size-5" />
                        </div>
                    </div>
                </div>

                {/* 4 Category Summary Lifetime Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Projects Breakdown */}
                    <div
                        onClick={() => handleCategoryTab('project')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                            category === 'project'
                                ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-2 ring-purple-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <FolderKanban className="size-4 text-purple-600" />
                                Project Milestones
                            </span>
                            <span className="text-[11px] font-extrabold text-slate-400">
                                {categoryBreakdown.project.count} items
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-xs text-slate-500">Total:</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {categoryBreakdown.project.total.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                            <span className="text-emerald-600 font-bold">
                                Paid: {categoryBreakdown.project.paid.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-amber-600 font-bold">
                                Due: {categoryBreakdown.project.pending.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>

                    {/* Services Breakdown */}
                    <div
                        onClick={() => handleCategoryTab('service')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                            category === 'service'
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Layers className="size-4 text-emerald-600" />
                                Subscriptions & Services
                            </span>
                            <span className="text-[11px] font-extrabold text-slate-400">
                                {categoryBreakdown.service.count} cycles
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-xs text-slate-500">Total:</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {categoryBreakdown.service.total.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                            <span className="text-emerald-600 font-bold">
                                Paid: {categoryBreakdown.service.paid.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-amber-600 font-bold">
                                Due: {categoryBreakdown.service.pending.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>

                    {/* Domains Breakdown */}
                    <div
                        onClick={() => handleCategoryTab('domain')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                            category === 'domain'
                                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Globe className="size-4 text-blue-600" />
                                Domain Registrations
                            </span>
                            <span className="text-[11px] font-extrabold text-slate-400">
                                {categoryBreakdown.domain.count} records
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-xs text-slate-500">Total:</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {categoryBreakdown.domain.total.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                            <span className="text-emerald-600 font-bold">
                                Paid: {categoryBreakdown.domain.paid.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-amber-600 font-bold">
                                Due: {categoryBreakdown.domain.pending.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>

                    {/* Hostings Breakdown */}
                    <div
                        onClick={() => handleCategoryTab('hosting')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                            category === 'hosting'
                                ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Server className="size-4 text-amber-600" />
                                Web Hostings
                            </span>
                            <span className="text-[11px] font-extrabold text-slate-400">
                                {categoryBreakdown.hosting.count} records
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-xs text-slate-500">Total:</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {categoryBreakdown.hosting.total.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                            <span className="text-emerald-600 font-bold">
                                Paid: {categoryBreakdown.hosting.paid.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-amber-600 font-bold">
                                Due: {categoryBreakdown.hosting.pending.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filter Controls Box */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-5 shadow-xs space-y-4">
                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                            <Filter className="size-3.5" /> Category:
                        </span>

                        <button
                            type="button"
                            onClick={() => handleCategoryTab('all')}
                            className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                category === 'all'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span>All Categories</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                                {kpi.count_all}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleCategoryTab('project')}
                            className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                category === 'project'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <FolderKanban className="size-3.5" />
                            <span>Projects</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                                {categoryBreakdown.project.count}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleCategoryTab('service')}
                            className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                category === 'service'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Layers className="size-3.5" />
                            <span>Services</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                                {categoryBreakdown.service.count}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleCategoryTab('domain')}
                            className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                category === 'domain'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Globe className="size-3.5" />
                            <span>Domains</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                                {categoryBreakdown.domain.count}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleCategoryTab('hosting')}
                            className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                category === 'hosting'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Server className="size-3.5" />
                            <span>Hostings</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                                {categoryBreakdown.hosting.count}
                            </span>
                        </button>
                    </div>

                    {/* Filter Inputs Grid (Client, Status, Search, Dates) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                        {/* Client Selector Filter */}
                        <div className="lg:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Client Filter
                            </label>
                            <select
                                value={clientId}
                                onChange={(e) => {
                                    setClientId(e.target.value);
                                    applyFilters({ client_id: e.target.value });
                                }}
                                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                            >
                                <option value="all">All Clients (Consolidated)</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.client_code} - {c.name} {c.company_name ? `(${c.company_name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Record */}
                        <div className="lg:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Search Records
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        applyFilters({ search: e.target.value });
                                    }}
                                    placeholder="Search title, item, invoice #, client..."
                                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                />
                            </div>
                        </div>

                        {/* Payment Status Filter */}
                        <div className="lg:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                Payment Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending / Due</option>
                                <option value="overdue">Overdue</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Specific Item Filter (Conditional) */}
                        <div className="lg:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                {category === 'project'
                                    ? 'Filter Project'
                                    : category === 'service'
                                    ? 'Filter Service'
                                    : category === 'domain'
                                    ? 'Filter Domain'
                                    : category === 'hosting'
                                    ? 'Filter Hosting'
                                    : 'Specific Item'}
                            </label>
                            {category === 'project' ? (
                                <select
                                    value={projectId}
                                    onChange={(e) => {
                                        setProjectId(e.target.value);
                                        applyFilters({ project_id: e.target.value });
                                    }}
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                                >
                                    <option value="">All Projects</option>
                                    {options.projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.project_name}
                                        </option>
                                    ))}
                                </select>
                            ) : category === 'service' ? (
                                <select
                                    value={serviceId}
                                    onChange={(e) => {
                                        setServiceId(e.target.value);
                                        applyFilters({ service_id: e.target.value });
                                    }}
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                                >
                                    <option value="">All Services</option>
                                    {options.services.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.service_name}
                                        </option>
                                    ))}
                                </select>
                            ) : category === 'domain' ? (
                                <select
                                    value={domainId}
                                    onChange={(e) => {
                                        setDomainId(e.target.value);
                                        applyFilters({ domain_id: e.target.value });
                                    }}
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                                >
                                    <option value="">All Domains</option>
                                    {options.domains.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.domain_name}
                                        </option>
                                    ))}
                                </select>
                            ) : category === 'hosting' ? (
                                <select
                                    value={hostingId}
                                    onChange={(e) => {
                                        setHostingId(e.target.value);
                                        applyFilters({ hosting_id: e.target.value });
                                    }}
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 cursor-pointer"
                                >
                                    <option value="">All Hostings</option>
                                    {options.hostings.map((h) => (
                                        <option key={h.id} value={h.id}>
                                            {h.hosting_title}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    disabled
                                    className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-400 cursor-not-allowed"
                                >
                                    <option>Select category first</option>
                                </select>
                            )}
                        </div>

                        {/* From & To Dates */}
                        <div className="lg:col-span-1">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                From
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    applyFilters({ from_date: e.target.value });
                                }}
                                className="w-full h-10 px-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                            />
                        </div>

                        <div className="lg:col-span-1">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                To
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    applyFilters({ to_date: e.target.value });
                                }}
                                className="w-full h-10 px-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                            />
                        </div>
                    </div>

                    {/* Quick Date Chips & Reset Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                                Quick Period:
                            </span>
                            <button
                                type="button"
                                onClick={() => handleQuickDatePeriod('all')}
                                className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    !fromDate && !toDate
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                            >
                                All Time
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickDatePeriod('this_month')}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                This Month
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickDatePeriod('last_month')}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                Last Month
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickDatePeriod('last_30_days')}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                Last 30 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickDatePeriod('this_year')}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                This Year
                            </button>
                        </div>

                        {isFiltered && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-rose-200/60 dark:border-rose-800/80"
                            >
                                <RefreshCw className="size-3" />
                                <span>Reset Filters</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Ledger & Transactions Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                Statement Ledger & Payment Records
                            </h3>
                            <p className="text-xs text-slate-400">
                                Showing {transactions.length} transactions across filtered criteria
                            </p>
                        </div>

                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Filtered Total:{' '}
                            <strong className="text-slate-900 dark:text-white">
                                {kpi.total_billed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </strong>
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4">Client</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Description & Item</th>
                                    <th className="py-3.5 px-4">Invoice #</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {transactions.length > 0 ? (
                                    transactions.map((t) => (
                                        <tr
                                            key={t.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                {t.date || 'N/A'}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {t.client ? (
                                                    <Link
                                                        href={`/clients/${t.client.id}`}
                                                        className="hover:underline"
                                                    >
                                                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                                                {t.client.client_code}
                                                            </span>
                                                            <span className="truncate max-w-[150px]">{t.client.name}</span>
                                                        </div>
                                                        {t.client.company_name && (
                                                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                                                {t.client.company_name}
                                                            </div>
                                                        )}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400">N/A</span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {renderCategoryBadge(t.category)}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {t.title}
                                                </div>
                                                {t.parent_name && (
                                                    <div className="text-[11px] text-slate-400">
                                                        Item: {t.parent_name}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {t.invoice ? (
                                                    <Link
                                                        href={`/invoices/${t.invoice.id}`}
                                                        className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        <FileText className="size-3" />
                                                        <span>#{t.invoice.invoice_number}</span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">
                                                        Uninvoiced
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                {renderStatusBadge(t.status)}
                                            </td>

                                            <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                                                <span className="text-[10px] font-bold text-slate-400 mr-1">
                                                    {t.currency}
                                                </span>
                                                {t.amount.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <FileSpreadsheet className="size-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                            <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                                                No financial records found
                                            </p>
                                            <p className="text-xs mt-0.5">
                                                Try changing or resetting your active filter criteria.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                            {transactions.length > 0 && (
                                <tfoot>
                                    <tr className="bg-slate-50/90 dark:bg-slate-950/80 border-t-2 border-slate-200 dark:border-slate-800 font-bold text-xs">
                                        <td
                                            colSpan={5}
                                            className="py-3.5 px-4 text-right uppercase tracking-wider text-slate-500 dark:text-slate-400"
                                        >
                                            Filtered Summary:
                                        </td>
                                        <td className="py-3.5 px-4 text-center text-[11px] text-slate-600 dark:text-slate-300">
                                            Settled:{' '}
                                            <strong className="text-emerald-600">{kpi.count_paid}</strong> / Due:{' '}
                                            <strong className="text-amber-600">{kpi.count_pending}</strong>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-black text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                            {kpi.total_billed.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
