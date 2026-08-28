import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    BadgeCheck,
    BadgeDollarSign,
    BarChart2,
    Building2,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Edit3,
    ExternalLink,
    FileText,
    FolderKanban,
    Globe,
    HardDrive,
    Hash,
    Key,
    Layers,
    LineChart,
    Lock,
    Mail,
    MapPin,
    MessageSquare,
    Package,
    Phone,
    PieChart as PieIcon,
    Printer,
    Receipt,
    Server,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    User,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface TaskEmployee {
    id: number;
    name: string;
    employee_code: string;
    avatar?: string;
}

interface ProjectTaskData {
    id: number;
    website_project_id: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string;
    due_date?: string;
    description?: string;
    assigned_employee?: TaskEmployee;
}

interface ProjectPaymentData {
    id: number;
    website_project_id: number;
    milestone_title: string;
    amount: number | string;
    payment_stage: 'advance' | 'partial' | 'full';
    status: 'pending' | 'paid';
    paid_at?: string;
    payment_method?: string;
    website_project?: {
        id: number;
        project_name: string;
    };
}

interface WebsiteProjectItem {
    id: number;
    project_name: string;
    total_budget: number | string;
    currency: string;
    start_date?: string;
    deadline?: string;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    notes?: string;
    payments?: ProjectPaymentData[];
    tasks?: ProjectTaskData[];
}

interface ClientServiceItem {
    id: number;
    service_name: string;
    monthly_fee: number | string;
    currency: string;
    status: 'active' | 'paused' | 'stopped';
    billing_day: number;
    start_date?: string;
    contract_months?: number;
    category?: {
        id: number;
        name: string;
    };
    payments?: any[];
}

interface ClientDomainItem {
    id: number;
    domain_name: string;
    registrar: string;
    expiry_date: string;
    status: 'active' | 'pending_renewal' | 'expired' | 'transferred';
    client_price_pkr?: number;
    auto_renew?: boolean;
    payments?: any[];
}

interface ClientHostingItem {
    id: number;
    hosting_title: string;
    provider: string;
    server_ip?: string;
    server_type?: string;
    billing_cycle: string;
    expiry_date: string;
    status: 'active' | 'suspended' | 'cancelled' | 'expired';
    disk_space?: string;
    bandwidth?: string;
    client_price_pkr?: number;
    payments?: any[];
}

interface ClientCredentialItem {
    id: number;
    title: string;
    type?: string;
    username?: string;
    created_at?: string;
}

interface InvoiceItemData {
    id: number;
    invoice_number: string;
    issue_date: string;
    due_date: string;
    status: 'paid' | 'unpaid' | 'overdue' | 'cancelled';
    total_amount: number | string;
    total_amount_pkr?: number;
    currency_code?: string;
    items?: any[];
}

interface ClientDetailItem {
    id: number;
    client_code: string;
    name: string;
    company_name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    city?: string;
    country?: string;
    currency: string;
    status: 'active' | 'inactive';
    notes?: string;
    created_at: string;
    website_projects?: WebsiteProjectItem[];
    client_services?: ClientServiceItem[];
    services?: ClientServiceItem[];
    project_payments?: ProjectPaymentData[];
    domains?: ClientDomainItem[];
    hostings?: ClientHostingItem[];
    credentials?: ClientCredentialItem[];
}

interface ClientPortalOverviewProps {
    client: ClientDetailItem;
    invoices?: InvoiceItemData[];
    canViewOverview?: boolean;
}

export default function ClientPortalOverview({
    client,
    invoices = [],
    canViewOverview,
}: ClientPortalOverviewProps) {
    const page = usePage();
    const authUser = (page.props.auth as any)?.user;
    const isAdmin = authUser?.type === 'admin';
    const canViewProjectBudget = hasPermission(authUser, 'view-client-portal-project-budget');
    const canViewServiceBudget = hasPermission(authUser, 'view-client-portal-service-budget');

    const [activeTabSection, setActiveTabSection] = useState<'projects' | 'services' | 'infrastructure' | 'invoices'>('projects');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: `${client.name} Overview`, href: '/client-portal/overview' },
    ];

    const isPermitted = canViewOverview !== undefined
        ? Boolean(canViewOverview)
        : hasPermission(authUser, 'view-client-portal-overview');

    // -------------------------------------------------------------
    // RESTRICTED VIEW: If User does not have view-client-portal-overview
    // -------------------------------------------------------------
    if (!isPermitted) {
        return (
            <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="overview">
                <Head title={`${client.name} | Overview`} />

                <div className="flex items-center justify-center min-h-[60vh] p-4">
                    <div className="max-w-md w-full text-center p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
                        {/* Icon */}
                        <div className="size-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                            <Lock className="size-8" />
                        </div>

                        {/* Title & Message */}
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                Access Restricted
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                You do not have permission to view this dashboard overview. If you need access, please contact your administrator.
                            </p>
                        </div>

                        {/* Contact Action */}
                        <div className="pt-2">
                            <a
                                href={client.email ? `mailto:${client.email}?subject=Request for Dashboard Access` : 'mailto:admin@sapta.com'}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                            >
                                <Mail className="size-4" />
                                <span>Contact Administrator</span>
                            </a>
                        </div>
                    </div>
                </div>
            </ClientPortalLayout>
        );
    }

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return (num || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: client.currency || 'USD',
            maximumFractionDigits: 0,
        });
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Calculate Financial & Metrics Summary
    const projectsList = client.website_projects || [];
    const activeProjects = projectsList.filter((p) => p.status === 'in_progress');
    const completedProjects = projectsList.filter((p) => p.status === 'completed');

    const clientServicesList = client.client_services || client.services || [];
    const activeServicesList = clientServicesList.filter((r) => r.status === 'active');
    const totalServicesMonthly = activeServicesList.reduce((acc, s) => acc + (parseFloat(s.monthly_fee as string) || 0), 0);

    const domainsList = client.domains || [];
    const activeDomains = domainsList.filter((d) => d.status === 'active');
    const hostingsList = client.hostings || [];
    const activeHostings = hostingsList.filter((h) => h.status === 'active');
    const credentialsList = client.credentials || [];
    const invoicesList = invoices || [];

    const totalProjectBudget = projectsList.reduce((acc, p) => acc + (parseFloat(p.total_budget as string) || 0), 0);

    let totalProjectPaid = 0;
    let allPayments: ProjectPaymentData[] = [];
    let allTasks: ProjectTaskData[] = [];

    projectsList.forEach((p) => {
        if (p.payments) {
            allPayments = [...allPayments, ...p.payments];
            p.payments.forEach((pay) => {
                if (pay.status === 'paid') {
                    totalProjectPaid += parseFloat(pay.amount as string) || 0;
                }
            });
        }
        if (p.tasks) {
            allTasks = [...allTasks, ...p.tasks];
        }
    });

    const pendingProjectBalance = Math.max(0, totalProjectBudget - totalProjectPaid);
    const paymentProgress = totalProjectBudget > 0 ? Math.min(100, Math.round((totalProjectPaid / totalProjectBudget) * 100)) : 0;
    const completedTasksCount = allTasks.filter((t) => t.status === 'completed').length;
    const taskCompletionRate = allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 100;

    // Invoices Aggregation
    const totalInvoiced = invoicesList.reduce((sum, inv) => sum + (parseFloat(inv.total_amount as string) || 0), 0);
    const totalInvoicesPaid = invoicesList
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (parseFloat(inv.total_amount as string) || 0), 0);
    const totalInvoicesPending = invoicesList
        .filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + (parseFloat(inv.total_amount as string) || 0), 0);

    // Chart Data 1: Project Budget vs Paid Breakdown
    const projectInvestmentData = projectsList.map((proj) => {
        const projPaid = (proj.payments || [])
            .filter((p) => p.status === 'paid')
            .reduce((sum, p) => sum + (parseFloat(p.amount as string) || 0), 0);
        const budget = parseFloat(proj.total_budget as string) || 0;
        return {
            name: proj.project_name.length > 16 ? proj.project_name.substring(0, 14) + '...' : proj.project_name,
            Budget: budget,
            Cleared: projPaid,
            Pending: Math.max(0, budget - projPaid),
        };
    });

    // Chart Data 2: Task Deliverables Distribution (Donut Chart)
    const taskStatusCounts = {
        completed: allTasks.filter((t) => t.status === 'completed').length,
        in_progress: allTasks.filter((t) => t.status === 'in_progress').length,
        in_review: allTasks.filter((t) => t.status === 'in_review').length,
        todo: allTasks.filter((t) => t.status === 'todo' || t.status === 'cancelled').length,
    };

    const taskPieData = [
        { name: 'Completed', value: taskStatusCounts.completed, color: '#10b981' },
        { name: 'In Progress', value: taskStatusCounts.in_progress, color: '#3b82f6' },
        { name: 'In Review', value: taskStatusCounts.in_review, color: '#8b5cf6' },
        { name: 'To Do / Pending', value: taskStatusCounts.todo, color: '#f59e0b' },
    ].filter((d) => d.value > 0);

    // Chart Data 3: Asset Portfolio Distribution
    const portfolioPieData = [
        { name: 'Website Projects', value: projectsList.length || 1, color: '#3b82f6' },
        { name: 'Active Retainers', value: activeServicesList.length || 0, color: '#10b981' },
        { name: 'Domains & DNS', value: domainsList.length || 0, color: '#06b6d4' },
        { name: 'Web Hostings', value: hostingsList.length || 0, color: '#8b5cf6' },
        { name: 'Credentials', value: credentialsList.length || 0, color: '#f43f5e' },
    ].filter((d) => d.value > 0);

    // Chart Data 4: Services Breakdown by Category
    const servicesCategoryMap: { [key: string]: number } = {};
    clientServicesList.forEach((s) => {
        const cat = s.category?.name || 'General';
        const fee = parseFloat(s.monthly_fee as string) || 0;
        servicesCategoryMap[cat] = (servicesCategoryMap[cat] || 0) + fee;
    });

    const servicesCategoryData = Object.keys(servicesCategoryMap).map((cat) => ({
        category: cat.length > 14 ? cat.substring(0, 12) + '...' : cat,
        MonthlyInvestment: servicesCategoryMap[cat],
    }));

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="overview">
            <Head title={`${client.name} | Overview & Portal Dashboard`} />
            <div className="p-4 sm:p-6 w-full mx-auto space-y-6 min-h-screen">

                {/* 1. Main High-Impact KPI Metric Cards Grid (4 Sleek & Compact Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Project Budget or Total Projects */}
                    {canViewProjectBudget ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Project Budget</span>
                                <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                    <DollarSign className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                    {formatCurrency(totalProjectBudget)}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                    <FolderKanban className="size-3 text-blue-500 shrink-0" />
                                    <span>{projectsList.length} Projects ({activeProjects.length} Active)</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Projects</span>
                                <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                    <Globe className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                    {projectsList.length}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                    <FolderKanban className="size-3 text-blue-500 shrink-0" />
                                    <span>All Client Workspaces</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card 2: Cleared Receipts or Active Projects */}
                    {canViewProjectBudget ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cleared Funds</span>
                                <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                    <BadgeDollarSign className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                                    {formatCurrency(totalProjectPaid)}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        {paymentProgress}%
                                    </span>
                                    <span>Budget Received</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</span>
                                <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                    <Clock className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
                                    {activeProjects.length}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3 text-purple-500 shrink-0" />
                                    <span>Active Project Deliveries</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card 3: Pending Balance or Completed Projects */}
                    {canViewProjectBudget ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-orange-500" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Balance</span>
                                <div className="size-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                    <Receipt className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                                    {formatCurrency(pendingProjectBalance)}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                    <Clock className="size-3 text-amber-500 shrink-0" />
                                    <span>Upcoming Milestones</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
                                <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                    <CheckCircle2 className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                                    {completedProjects.length}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                    <CheckSquare className="size-3 text-emerald-500 shrink-0" />
                                    <span>Finished Projects</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Card 4: Monthly Retainers or Total Services */}
                    {canViewServiceBudget ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-500 to-blue-500" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Run-Rate</span>
                                <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                    <LineChart className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-lg sm:text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">
                                    {formatCurrency(totalServicesMonthly)} <span className="text-[11px] text-slate-400 font-normal">/ mo</span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                    <Zap className="size-3 text-cyan-500 shrink-0" />
                                    <span>{activeServicesList.length} Active Services</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 space-y-2 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-500 to-blue-500" />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Services</span>
                                <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                    <Package className="size-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-lg sm:text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">
                                    {clientServicesList.length}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                    <Zap className="size-3 text-cyan-500 shrink-0" />
                                    <span>{activeServicesList.length} Active Services</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Secondary Quick Summary Pills Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Activity className="size-4 text-blue-500" /> Asset Overview:
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 font-bold text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5">
                            <Globe className="size-3.5 text-cyan-500" />
                            <span>{domainsList.length} Domains</span>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 font-bold text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5">
                            <Server className="size-3.5 text-purple-500" />
                            <span>{hostingsList.length} Cloud Servers</span>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 font-bold text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5">
                            <CheckSquare className="size-3.5 text-pink-500" />
                            <span>{completedTasksCount}/{allTasks.length} Tasks Done</span>
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 font-bold text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5">
                            <Key className="size-3.5 text-rose-500" />
                            <span>{credentialsList.length} Vault Credentials</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/client-portal/invoices"
                            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"
                        >
                            <Receipt className="size-3.5" />
                            <span>{invoicesList.length} Invoices & Statements</span>
                            <ArrowRight className="size-3" />
                        </Link>
                    </div>
                </div>

                {/* 3. Colorful Interactive Recharts Visualizations Grid (4 Rich Charts) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual 1: Project Investment & Clearance Breakdown (Bar Chart - Left 2 Columns) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20">
                                    <BarChart2 className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Project Financial Allocations</h2>
                                    <p className="text-xs text-slate-400 font-medium">Budget vs Cleared Payment Comparison</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                    <span className="size-2.5 rounded-full bg-indigo-600 inline-block shadow-xs" /> Total Budget
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <span className="size-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" /> Cleared Paid
                                </span>
                            </div>
                        </div>

                        {projectInvestmentData.length > 0 ? (
                            <div className="h-64 sm:h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={projectInvestmentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                                            </linearGradient>
                                            <linearGradient id="clearedGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3341551a" />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#1e293b',
                                                borderRadius: '12px',
                                                color: '#fff',
                                                fontSize: '12px',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                            }}
                                            formatter={(val: any) => [formatCurrency(val), 'Amount']}
                                        />
                                        <Bar dataKey="Budget" fill="url(#budgetGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                        <Bar dataKey="Cleared" fill="url(#clearedGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm italic">
                                <BarChart2 className="size-10 mb-2 opacity-30 text-indigo-500" />
                                No project investment data available yet.
                            </div>
                        )}
                    </div>

                    {/* Visual 2: Deliverable Tasks Breakdown (Donut Pie Chart - Right 1 Column) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/20">
                                <PieIcon className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Sprint Deliverables</h2>
                                <p className="text-xs text-slate-400 font-medium">Task Progress Status</p>
                            </div>
                        </div>

                        {allTasks.length > 0 ? (
                            <div className="space-y-4">
                                <div className="h-48 w-full relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={taskPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={75}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {taskPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#0f172a',
                                                    borderColor: '#1e293b',
                                                    borderRadius: '10px',
                                                    color: '#fff',
                                                    fontSize: '11px',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Central Metric Indicator */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xl font-black text-slate-900 dark:text-white">{completedTasksCount}/{allTasks.length}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                                    </div>
                                </div>

                                {/* Custom Color Legend Grid */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                                    {taskPieData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="size-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm italic">
                                <CheckSquare className="size-10 mb-2 opacity-30 text-blue-500" />
                                No sprint tasks recorded yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional 2 Visuals Grid (Portfolio Distribution + Services Categories) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual 3: Asset Portfolio Distribution (Donut Chart) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md shadow-purple-600/20">
                                <Layers className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Asset Distribution</h2>
                                <p className="text-xs text-slate-400 font-medium">Resources in Client Account</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="h-48 w-full relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={portfolioPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={72}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {portfolioPieData.map((entry, index) => (
                                                <Cell key={`port-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#1e293b',
                                                borderRadius: '10px',
                                                color: '#fff',
                                                fontSize: '11px',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xl font-black text-slate-900 dark:text-white">
                                        {projectsList.length + activeServicesList.length + domainsList.length + hostingsList.length}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Assets</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                                {portfolioPieData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="size-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                                        </div>
                                        <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Visual 4: Services Investment by Category (Bar Chart) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-600/20">
                                    <TrendingUp className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Monthly Services by Category</h2>
                                    <p className="text-xs text-slate-400 font-medium">Subscription Spend by Service Domain</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono bg-cyan-50 dark:bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-200 dark:border-cyan-800">
                                {formatCurrency(totalServicesMonthly)} / mo
                            </span>
                        </div>

                        {servicesCategoryData.length > 0 ? (
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={servicesCategoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="serviceGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3341551a" />
                                        <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#1e293b',
                                                borderRadius: '12px',
                                                color: '#fff',
                                                fontSize: '12px',
                                            }}
                                            formatter={(val: any) => [formatCurrency(val), 'Monthly Fee']}
                                        />
                                        <Bar dataKey="MonthlyInvestment" fill="url(#serviceGrad)" radius={[8, 8, 0, 0]} maxBarSize={44} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm italic">
                                <LineChart className="size-10 mb-2 opacity-30 text-cyan-500" />
                                No active monthly services configured yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Interactive Tabbed Resource Explorer */}
                <div className="space-y-4">
                    {/* Section Switcher Tabs */}
                    <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 self-start">
                        <button
                            type="button"
                            onClick={() => setActiveTabSection('projects')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTabSection === 'projects'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                                }`}
                        >
                            <Globe className="size-4" />
                            <span>1. Website Projects ({projectsList.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTabSection('services')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTabSection === 'services'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                                }`}
                        >
                            <LineChart className="size-4" />
                            <span>2. Active Services ({clientServicesList.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTabSection('infrastructure')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTabSection === 'infrastructure'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                                }`}
                        >
                            <Server className="size-4" />
                            <span>3. Domains & Hosting ({domainsList.length + hostingsList.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTabSection('invoices')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTabSection === 'invoices'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
                                }`}
                        >
                            <Receipt className="size-4" />
                            <span>4. Invoices & Billing ({invoicesList.length})</span>
                        </button>
                    </div>

                    {/* TAB 1: Projects Showcase */}
                    {activeTabSection === 'projects' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Projects Development Roadmap</h3>
                                    <p className="text-xs text-slate-400 font-medium">Sprint progress, milestone deliverables, and budget tracking</p>
                                </div>
                                <Link
                                    href="/client-portal/projects"
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <span>Open Projects Directory</span>
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {projectsList.length > 0 ? (
                                    projectsList.map((project) => (
                                        <div key={project.id} className="p-6 space-y-4 hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                                        {project.project_name}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-400 font-medium">
                                                        {canViewProjectBudget && (
                                                            <span>Budget: <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(project.total_budget)}</strong></span>
                                                        )}
                                                        {project.start_date && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="size-3.5 text-blue-500" />
                                                                Started: {formatDate(project.start_date)}
                                                            </span>
                                                        )}
                                                        {project.deadline && (
                                                            <span className="flex items-center gap-1 text-slate-500 font-bold">
                                                                <Clock className="size-3.5 text-amber-500" />
                                                                Deadline: {formatDate(project.deadline)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${project.status === 'in_progress'
                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                        : project.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        }`}>
                                                        {project.status.replace('_', ' ')}
                                                    </span>

                                                    <Link
                                                        href={`/client-portal/projects/${project.id}`}
                                                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white dark:hover:text-white hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-1 text-xs font-bold"
                                                    >
                                                        <span>Details</span>
                                                        <ArrowRight className="size-3.5" />
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <Activity className="size-3.5 text-blue-500" /> Completion Progress
                                                    </span>
                                                    <span className="text-blue-600 dark:text-blue-400 font-mono">{project.progress_percentage}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${project.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 italic text-sm">
                                        No website development projects recorded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Active Services */}
                    {activeTabSection === 'services' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Recurring Services & Retainers</h3>
                                    <p className="text-xs text-slate-400 font-medium">Monthly subscriptions, SEO retainers, and SLA contracts</p>
                                </div>
                                <Link
                                    href="/client-portal/services"
                                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                                >
                                    <span>All Services</span>
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {clientServicesList.length > 0 ? (
                                    clientServicesList.map((service) => (
                                        <div
                                            key={service.id}
                                            className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3 flex flex-col justify-between hover:border-purple-500/40 transition-colors"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                        {service.category?.name || 'General'}
                                                    </span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${service.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                        }`}>
                                                        {service.status}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                                    {service.service_name}
                                                </h4>
                                            </div>

                                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                                                {canViewServiceBudget ? (
                                                    <div>
                                                        <span className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">
                                                            {formatCurrency(service.monthly_fee)}
                                                        </span>
                                                        <span className="text-xs text-slate-400"> / month</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 capitalize">
                                                            Status: <strong className="text-slate-700 dark:text-slate-300">{service.status}</strong>
                                                        </span>
                                                    </div>
                                                )}
                                                <Link
                                                    href={`/client-portal/services/${service.id}`}
                                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                                >
                                                    <span>Details</span>
                                                    <ArrowRight className="size-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full p-8 text-center text-slate-400 italic text-sm">
                                        No active services or subscriptions recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: Domains & Hosting */}
                    {activeTabSection === 'infrastructure' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Domains Showcase */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                                            <Globe className="size-4" />
                                        </div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Domain Registrations</h3>
                                    </div>
                                    <Link href="/client-portal/domains" className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
                                        View All ({domainsList.length})
                                    </Link>
                                </div>

                                <div className="space-y-2.5">
                                    {domainsList.length > 0 ? (
                                        domainsList.slice(0, 4).map((domain) => (
                                            <div key={domain.id} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                                        {domain.domain_name}
                                                    </h4>
                                                    <span className="text-[11px] text-slate-400 block mt-0.5">
                                                        Registrar: {domain.registrar} &bull; Expires: {formatDate(domain.expiry_date)}
                                                    </span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${domain.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                    }`}>
                                                    {domain.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center text-slate-400 italic text-xs">
                                            No domain registrations found.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Hosting Showcase */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                            <Server className="size-4" />
                                        </div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Cloud Web Hosting</h3>
                                    </div>
                                    <Link href="/client-portal/hostings" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                                        View All ({hostingsList.length})
                                    </Link>
                                </div>

                                <div className="space-y-2.5">
                                    {hostingsList.length > 0 ? (
                                        hostingsList.slice(0, 4).map((hosting) => (
                                            <div key={hosting.id} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                                        {hosting.hosting_title}
                                                    </h4>
                                                    <span className="text-[11px] text-slate-400 block mt-0.5">
                                                        {hosting.provider} &bull; IP: {hosting.server_ip || 'Managed'} &bull; Cycle: {hosting.billing_cycle}
                                                    </span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${hosting.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                    }`}>
                                                    {hosting.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center text-slate-400 italic text-xs">
                                            No web hosting packages configured.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: Invoices & Statements */}
                    {activeTabSection === 'invoices' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Invoices & Payment Records</h3>
                                    <p className="text-xs text-slate-400 font-medium">Official billing statements, payment receipts, and tax records</p>
                                </div>
                                <Link
                                    href="/client-portal/invoices"
                                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                                >
                                    <span>All Statements</span>
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/40 dark:bg-slate-800/40">
                                            <th className="py-3.5 px-4">Invoice #</th>
                                            <th className="py-3.5 px-4">Issue Date</th>
                                            <th className="py-3.5 px-4">Due Date</th>
                                            <th className="py-3.5 px-4">Total Amount</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                                        {invoicesList.length > 0 ? (
                                            invoicesList.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                        {inv.invoice_number}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                                                        {formatDate(inv.issue_date)}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                                                        {formatDate(inv.due_date)}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(inv.total_amount)}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${inv.status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                            : inv.status === 'overdue'
                                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                            }`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <a
                                                            href={`/client-portal/invoices/${inv.id}/pdf`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="h-8 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer border border-blue-200/50 hover:border-transparent"
                                                            title="Open & Print Invoice PDF"
                                                        >
                                                            <Printer className="size-3.5" />
                                                            <span>Print</span>
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                                    No official tax invoices generated yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ClientPortalLayout>
    );
}
