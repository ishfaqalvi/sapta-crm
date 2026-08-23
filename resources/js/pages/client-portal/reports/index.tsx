import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
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
    Printer,
    Receipt,
    RefreshCw,
    Search,
    Server,
    ShieldAlert,
    TrendingUp,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export interface TransactionItem {
    id: string;
    raw_id: number;
    category: 'project' | 'service' | 'domain' | 'hosting';
    category_label: string;
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

export interface ClientPortalReportsProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
        email?: string;
        phone?: string;
        city?: string;
        country?: string;
    };
    transactions: TransactionItem[];
    kpi: KpiData;
    categoryBreakdown: CategoryBreakdown;
    options: {
        projects: { id: number; project_name: string }[];
        services: { id: number; service_name: string }[];
        domains: { id: number; domain_name: string }[];
        hostings: { id: number; hosting_title: string }[];
    };
    filters: {
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

export default function ClientPortalReportsIndex({
    client,
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
}: ClientPortalReportsProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Reports & Statements', href: '/client-portal/reports' },
    ];

    // Local State for Immediate Input Responsiveness
    const [category, setCategory] = useState<string>(filters.category || 'all');
    const [status, setStatus] = useState<string>(filters.status || 'all');
    const [projectId, setProjectId] = useState<string>(String(filters.project_id || ''));
    const [serviceId, setServiceId] = useState<string>(String(filters.service_id || ''));
    const [domainId, setDomainId] = useState<string>(String(filters.domain_id || ''));
    const [hostingId, setHostingId] = useState<string>(String(filters.hosting_id || ''));
    const [fromDate, setFromDate] = useState<string>(filters.from_date || '');
    const [toDate, setToDate] = useState<string>(filters.to_date || '');
    const [search, setSearch] = useState<string>(filters.search || '');

    // Sync from server props
    useEffect(() => {
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

    // Apply Filter updates via Inertia
    const applyFilters = useCallback(
        (overrides: Partial<typeof filters> = {}) => {
            const queryParams: Record<string, string> = {};

            const cat = overrides.category !== undefined ? overrides.category : category;
            const st = overrides.status !== undefined ? overrides.status : status;
            const pId = overrides.project_id !== undefined ? overrides.project_id : projectId;
            const sId = overrides.service_id !== undefined ? overrides.service_id : serviceId;
            const dId = overrides.domain_id !== undefined ? overrides.domain_id : domainId;
            const hId = overrides.hosting_id !== undefined ? overrides.hosting_id : hostingId;
            const fDate = overrides.from_date !== undefined ? overrides.from_date : fromDate;
            const tDate = overrides.to_date !== undefined ? overrides.to_date : toDate;
            const srch = overrides.search !== undefined ? overrides.search : search;

            if (cat && cat !== 'all') queryParams.category = String(cat);
            if (st && st !== 'all') queryParams.status = String(st);
            if (pId) queryParams.project_id = String(pId);
            if (sId) queryParams.service_id = String(sId);
            if (dId) queryParams.domain_id = String(dId);
            if (hId) queryParams.hosting_id = String(hId);
            if (fDate) queryParams.from_date = String(fDate);
            if (tDate) queryParams.to_date = String(tDate);
            if (srch) queryParams.search = String(srch);

            router.get('/client-portal/reports', queryParams, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [category, status, projectId, serviceId, domainId, hostingId, fromDate, toDate, search],
    );

    // Category Change Handler
    const handleCategoryChange = (newCat: string) => {
        setCategory(newCat);
        // Clear specific entity filters when switching category
        setProjectId('');
        setServiceId('');
        setDomainId('');
        setHostingId('');

        applyFilters({
            category: newCat,
            project_id: '',
            service_id: '',
            domain_id: '',
            hosting_id: '',
        });
    };

    // Quick Date Presets
    const setDatePreset = (preset: 'all' | 'this_month' | 'last_month' | 'this_year' | 'last_30_days') => {
        const now = new Date();
        let start = '';
        let end = '';

        if (preset === 'this_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            start = firstDay.toISOString().split('T')[0];
            end = lastDay.toISOString().split('T')[0];
        } else if (preset === 'last_month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            start = firstDay.toISOString().split('T')[0];
            end = lastDay.toISOString().split('T')[0];
        } else if (preset === 'this_year') {
            const firstDay = new Date(now.getFullYear(), 0, 1);
            const lastDay = new Date(now.getFullYear(), 11, 31);
            start = firstDay.toISOString().split('T')[0];
            end = lastDay.toISOString().split('T')[0];
        } else if (preset === 'last_30_days') {
            const prior = new Date();
            prior.setDate(prior.getDate() - 30);
            start = prior.toISOString().split('T')[0];
            end = now.toISOString().split('T')[0];
        }

        setFromDate(start);
        setToDate(end);
        applyFilters({ from_date: start, to_date: end });
    };

    // Reset All Filters
    const handleResetFilters = () => {
        setCategory('all');
        setStatus('all');
        setProjectId('');
        setServiceId('');
        setDomainId('');
        setHostingId('');
        setFromDate('');
        setToDate('');
        setSearch('');

        router.get(
            '/client-portal/reports',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const hasActiveFilters =
        category !== 'all' ||
        status !== 'all' ||
        Boolean(projectId) ||
        Boolean(serviceId) ||
        Boolean(domainId) ||
        Boolean(hostingId) ||
        Boolean(fromDate) ||
        Boolean(toDate) ||
        Boolean(search);

    // Build PDF Query String
    const buildPdfUrl = () => {
        const queryParams = new URLSearchParams();
        if (category && category !== 'all') queryParams.set('category', category);
        if (status && status !== 'all') queryParams.set('status', status);
        if (projectId) queryParams.set('project_id', projectId);
        if (serviceId) queryParams.set('service_id', serviceId);
        if (domainId) queryParams.set('domain_id', domainId);
        if (hostingId) queryParams.set('hosting_id', hostingId);
        if (fromDate) queryParams.set('from_date', fromDate);
        if (toDate) queryParams.set('to_date', toDate);
        if (search) queryParams.set('search', search);

        const qs = queryParams.toString();
        return `/client-portal/reports/pdf${qs ? `?${qs}` : ''}`;
    };

    // Helpers for Badges
    const getCategoryBadge = (cat: TransactionItem['category']) => {
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
                        <Layers className="size-3" /> Service Subscription
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

    const getStatusBadge = (st: string) => {
        const normalized = String(st || '').toLowerCase();
        if (normalized === 'paid' || normalized === 'completed' || normalized === 'settled') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                    <CheckCircle2 className="size-3" /> Paid
                </span>
            );
        }
        if (normalized === 'overdue') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60">
                    <AlertCircle className="size-3" /> Overdue
                </span>
            );
        }
        if (normalized === 'cancelled' || normalized === 'void') {
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
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title="Financial Reports & Statements" />

            <div className="flex h-full flex-1 flex-col gap-6 p-2 md:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Financial Reports & Statements
                            </h1>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {client.client_code}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                            Comprehensive financial breakdown of projects, subscriptions, domain registrations, and web hosting renewals.
                        </p>
                    </div>

                    {/* PDF Download & Print Action Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <a
                            href={buildPdfUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer"
                        >
                            <Download className="size-4" />
                            <span>Download PDF Report</span>
                        </a>

                        <button
                            type="button"
                            onClick={() => window.open(buildPdfUrl(), '_blank')}
                            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                        >
                            <Printer className="size-4" />
                            <span>Print</span>
                        </button>
                    </div>
                </div>

                {/* KPI Financial Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Billed */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed Volume</p>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                                <span className="text-xs font-bold text-slate-400 mr-1">{client.currency}</span>
                                {kpi.total_billed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Paid Amount</p>
                            <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                <span className="text-xs font-bold opacity-70 mr-1">{client.currency}</span>
                                {kpi.total_paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                                {kpi.count_paid} settled payments
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    {/* Total Pending / Due */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending / Due</p>
                            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                                <span className="text-xs font-bold opacity-70 mr-1">{client.currency}</span>
                                {kpi.total_pending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                                {kpi.count_pending} items awaiting payment
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    {/* Total Overdue */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Overdue Invoices</p>
                            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                                <span className="text-xs font-bold opacity-70 mr-1">{client.currency}</span>
                                {kpi.total_overdue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold mt-1">
                                {kpi.count_overdue} overdue items
                            </p>
                        </div>
                        <div className="size-11 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-2xs">
                            <AlertCircle className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Lifetime Category Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Projects */}
                    <div
                        onClick={() => handleCategoryChange('project')}
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
                                {client.currency} {categoryBreakdown.project.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                            <span className="text-emerald-600 font-bold">Paid: {client.currency} {categoryBreakdown.project.paid.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                            <span className="text-amber-600 font-bold">Due: {client.currency} {categoryBreakdown.project.pending.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    {/* Services */}
                    <div
                        onClick={() => handleCategoryChange('service')}
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
                                {client.currency} {categoryBreakdown.service.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                            <span className="text-emerald-600 font-bold">Paid: {client.currency} {categoryBreakdown.service.paid.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                            <span className="text-amber-600 font-bold">Due: {client.currency} {categoryBreakdown.service.pending.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    {/* Domains */}
                    <div
                        onClick={() => handleCategoryChange('domain')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                            category === 'domain'
                                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-200'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Globe className="size-4 text-blue-600" />
                                Domains
                            </span>
                            <span className="text-[11px] font-extrabold text-slate-400">
                                {categoryBreakdown.domain.count} records
                            </span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <span className="text-xs text-slate-500">Total:</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {client.currency} {categoryBreakdown.domain.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                            <span className="text-emerald-600 font-bold">Paid: {client.currency} {categoryBreakdown.domain.paid.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                            <span className="text-amber-600 font-bold">Due: {client.currency} {categoryBreakdown.domain.pending.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    {/* Hostings */}
                    <div
                        onClick={() => handleCategoryChange('hosting')}
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
                                {client.currency} {categoryBreakdown.hosting.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                            <span className="text-emerald-600 font-bold">Paid: {client.currency} {categoryBreakdown.hosting.paid.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                            <span className="text-amber-600 font-bold">Due: {client.currency} {categoryBreakdown.hosting.pending.toLocaleString('en-US', { minimumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* Filter Control Box */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-5 shadow-xs space-y-4">
                    {/* Category Selection Tabs */}
                    <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                            <Filter className="size-3.5" /> Category:
                        </span>

                        <button
                            type="button"
                            onClick={() => handleCategoryChange('all')}
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
                            onClick={() => handleCategoryChange('project')}
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
                            onClick={() => handleCategoryChange('service')}
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
                            onClick={() => handleCategoryChange('domain')}
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
                            onClick={() => handleCategoryChange('hosting')}
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

                    {/* Detailed Inputs Filter Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                        {/* Search Input */}
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
                                    placeholder="Search title, item, invoice #..."
                                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
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

                        {/* Dynamic Item Filter (Project / Service / Domain / Hosting) */}
                        <div className="lg:col-span-3">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                {category === 'project'
                                    ? 'Filter by Project'
                                    : category === 'service'
                                    ? 'Filter by Service'
                                    : category === 'domain'
                                    ? 'Filter by Domain'
                                    : category === 'hosting'
                                    ? 'Filter by Hosting'
                                    : 'Specific Item Filter'}
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
                                    <option>Select a category first</option>
                                </select>
                            )}
                        </div>

                        {/* From Date */}
                        <div className="lg:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                    applyFilters({ from_date: e.target.value });
                                }}
                                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                            />
                        </div>

                        {/* To Date */}
                        <div className="lg:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                    applyFilters({ to_date: e.target.value });
                                }}
                                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                            />
                        </div>
                    </div>

                    {/* Quick Date Presets & Reset Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                                <Calendar className="size-3" /> Quick Period:
                            </span>

                            <button
                                type="button"
                                onClick={() => setDatePreset('all')}
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
                                onClick={() => setDatePreset('this_month')}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                This Month
                            </button>

                            <button
                                type="button"
                                onClick={() => setDatePreset('last_month')}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                Last Month
                            </button>

                            <button
                                type="button"
                                onClick={() => setDatePreset('last_30_days')}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                Last 30 Days
                            </button>

                            <button
                                type="button"
                                onClick={() => setDatePreset('this_year')}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                                This Year
                            </button>
                        </div>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="h-8 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-rose-200/60 dark:border-rose-800/80"
                            >
                                <X className="size-3" />
                                <span>Reset Filters</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Detailed Transactions Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                Payment Records & Ledger
                            </h3>
                            <p className="text-xs text-slate-400">
                                Showing {transactions.length} transactions based on current filters
                            </p>
                        </div>

                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Total: <strong className="text-slate-900 dark:text-white">{client.currency} {kpi.total_billed.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="py-3.5 px-4">Date</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Description & Item</th>
                                    <th className="py-3.5 px-4">Invoice #</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                    <th className="py-3.5 px-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                {transactions.length > 0 ? (
                                    transactions.map((tx) => (
                                        <tr
                                            key={tx.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                                                {tx.date || 'N/A'}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {getCategoryBadge(tx.category)}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {tx.title}
                                                </div>
                                                {tx.parent_name && (
                                                    <div className="text-[11px] text-slate-400">
                                                        Item: {tx.parent_name}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {tx.invoice ? (
                                                    <a
                                                        href={`/client-portal/invoices/${tx.invoice.id}`}
                                                        className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        <FileText className="size-3" />
                                                        #{tx.invoice.invoice_number}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">Uninvoiced</span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-center">
                                                {getStatusBadge(tx.status)}
                                            </td>

                                            <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                                                <span className="text-[10px] font-bold text-slate-400 mr-1">
                                                    {tx.currency}
                                                </span>
                                                {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
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

                            {/* Summary Totals Footer */}
                            {transactions.length > 0 && (
                                <tfoot>
                                    <tr className="bg-slate-50/90 dark:bg-slate-950/80 border-t-2 border-slate-200 dark:border-slate-800 font-bold text-xs">
                                        <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Filtered Summary:
                                        </td>
                                        <td className="py-3.5 px-4 text-center text-[11px] text-slate-600 dark:text-slate-300">
                                            Settled: <strong className="text-emerald-600">{kpi.count_paid}</strong> / Due: <strong className="text-amber-600">{kpi.count_pending}</strong>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-black text-sm text-blue-600 dark:text-blue-400">
                                            <span className="text-xs mr-1">{client.currency}</span>
                                            {kpi.total_billed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </ClientPortalLayout>
    );
}
