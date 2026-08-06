import ClientLayout from '@/layouts/client-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeDollarSign,
    Building,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    DollarSign,
    Edit2,
    FolderKanban,
    Globe,
    Layers,
    Mail,
    MapPin,
    Phone,
    Plus,
    Receipt,
    Search,
    User,
} from 'lucide-react';
import { useState } from 'react';

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

interface SeoRetainerItem {
    id: number;
    monthly_amount: number | string;
    currency: string;
    status: 'active' | 'paused' | 'cancelled';
    billing_cycle_day: number;
    start_date?: string;
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
    seo_retainers?: SeoRetainerItem[];
    project_payments?: ProjectPaymentData[];
}

interface ClientShowProps {
    client: ClientDetailItem;
}

export default function ClientShow({ client }: ClientShowProps) {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialTab = (searchParams?.get('tab') as any) || 'overview';
    const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'tasks' | 'payments' | 'seo' | 'settings'>(initialTab);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Clients Directory', href: '/clients' },
        { title: client.name, href: `/clients/${client.id}` },
    ];

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

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'number' ? val : parseFloat(val || '0');
        const symbol = client.currency === 'USD' ? '$' : client.currency === 'EUR' ? '€' : client.currency === 'GBP' ? '£' : 'Rs ';
        return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const websiteProjects = client.website_projects || [];
    const seoRetainers = client.seo_retainers || [];

    // Flatten all tasks under client's projects
    const allTasks: (ProjectTaskData & { projectName: string })[] = [];
    websiteProjects.forEach((proj) => {
        if (proj.tasks) {
            proj.tasks.forEach((t) => {
                allTasks.push({
                    ...t,
                    projectName: proj.project_name,
                });
            });
        }
    });

    // Flatten all payments under client's projects
    const allPayments: (ProjectPaymentData & { projectName: string })[] = [];
    websiteProjects.forEach((proj) => {
        if (proj.payments) {
            proj.payments.forEach((p) => {
                allPayments.push({
                    ...p,
                    projectName: proj.project_name,
                });
            });
        }
    });

    // Financial totals
    const totalProjectsBudget = websiteProjects.reduce((sum, p) => sum + (typeof p.total_budget === 'number' ? p.total_budget : parseFloat(p.total_budget || '0')), 0);
    const totalReceivedPayments = allPayments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : parseFloat(p.amount || '0')), 0);

    const completedTasksCount = allTasks.filter((t) => t.status === 'completed').length;
    const pendingTasksCount = allTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;

    return (
        <ClientLayout
            breadcrumbs={breadcrumbs}
            client={client}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as any)}
        >
            <Head title={`Client Details - ${client.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Standardized Top Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link
                                href="/clients"
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                                title="Back to Clients Directory"
                            >
                                <ArrowLeft className="size-5" />
                            </Link>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                {client.name}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-xs font-extrabold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                {client.client_code}
                            </span>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                                    client.status === 'active'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                }`}
                            >
                                {client.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-9 flex items-center gap-2">
                            <Building className="size-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">{client.company_name || 'Individual Client'}</span>
                            {client.city && <span>• {client.city}{client.country ? `, ${client.country}` : ''}</span>}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pl-9 sm:pl-0">
                        <Link
                            href={`/clients/${client.id}/edit`}
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                        >
                            <Edit2 className="size-4" />
                            <span>Edit Client</span>
                        </Link>
                        <Link
                            href="/clients"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white hover:from-[#002a75] hover:to-[#0040b8] transition-all inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                        >
                            <span>Back to Directory</span>
                        </Link>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Website Projects */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Website Projects</span>
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <FolderKanban className="size-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {websiteProjects.length} <span className="text-xs font-semibold text-slate-400">Projects</span>
                        </p>
                        <p className="text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
                            {websiteProjects.filter((p) => p.status === 'in_progress').length} In Progress
                        </p>
                    </div>

                    {/* Total Budget */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Contract Value</span>
                            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <DollarSign className="size-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(totalProjectsBudget)}
                        </p>
                        <p className="text-xs text-emerald-600 font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                            {formatCurrency(totalReceivedPayments)} Settled
                        </p>
                    </div>

                    {/* Total Tasks */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Project Tasks</span>
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                <CheckSquare className="size-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {allTasks.length} <span className="text-xs font-semibold text-slate-400">Tasks</span>
                        </p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                            <span className="text-emerald-600">{completedTasksCount} Done</span>
                            <span className="text-blue-600">{pendingTasksCount} Pending</span>
                        </div>
                    </div>

                    {/* SEO Retainers */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SEO Retainers</span>
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <BadgeDollarSign className="size-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {seoRetainers.length} <span className="text-xs font-semibold text-slate-400">Active</span>
                        </p>
                        <p className="text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
                            Client Currency: {client.currency}
                        </p>
                    </div>
                </div>

                {/* Header & Tabs Navigation Card */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="relative size-16 rounded-2xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold text-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0 border-2 border-white dark:border-slate-800">
                                {client.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {client.name}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Contact: {client.contact_person || client.name} {client.email ? `• ${client.email}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pt-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`h-11 px-5 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-2 shrink-0 ${
                                activeTab === 'overview'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <User className="size-4" />
                            <span>Overview & Contact</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`h-11 px-5 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-2 shrink-0 ${
                                activeTab === 'projects'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <FolderKanban className="size-4" />
                            <span>Website Projects ({websiteProjects.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`h-11 px-5 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-2 shrink-0 ${
                                activeTab === 'tasks'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <CheckSquare className="size-4" />
                            <span>Project Tasks ({allTasks.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`h-11 px-5 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-2 shrink-0 ${
                                activeTab === 'payments'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <BadgeDollarSign className="size-4" />
                            <span>Milestone Payments ({allPayments.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('seo')}
                            className={`h-11 px-5 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-2 shrink-0 ${
                                activeTab === 'seo'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Globe className="size-4" />
                            <span>SEO Retainers ({seoRetainers.length})</span>
                        </button>
                    </div>
                </div>

                {/* Tab 1: Overview & Contact Info */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Contact Information */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                <User className="size-4 text-blue-600" />
                                <span>Contact Details</span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Client Name</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{client.name}</span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Contact Person</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">{client.contact_person || 'N/A'}</span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Email Address</span>
                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                        <Mail className="size-3.5 text-slate-400" />
                                        <span>{client.email || 'Not provided'}</span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Phone / Mobile</span>
                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                        <Phone className="size-3.5 text-slate-400" />
                                        <span>{client.phone || client.mobile || 'Not provided'}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Company & Region */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                <Building className="size-4 text-purple-600" />
                                <span>Company & Billing Currency</span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Company Name</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                                        {client.company_name || 'Individual / Freelance Client'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">City / Country</span>
                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                        <MapPin className="size-3.5 text-slate-400" />
                                        <span>{client.city || 'N/A'}{client.country ? `, ${client.country}` : ''}</span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Billing Currency</span>
                                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm block mt-0.5">
                                        {client.currency}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                <Calendar className="size-4 text-emerald-600" />
                                <span>Account Info & Notes</span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Account Created</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                                        {formatDateOnly(client.created_at)}
                                    </span>
                                </div>

                                {client.notes && (
                                    <div>
                                        <span className="text-slate-400 font-medium block mb-1">Notes:</span>
                                        <p className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {client.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Website Projects Table */}
                {activeTab === 'projects' && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <FolderKanban className="size-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Client Website Projects
                                    </h3>
                                    <p className="text-xs text-slate-400">All development and design projects for {client.name}.</p>
                                </div>
                            </div>
                            <Link
                                href="/website-projects/create"
                                className="h-8 px-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1.5"
                            >
                                <Plus className="size-3.5" />
                                <span>Create Project</span>
                            </Link>
                        </div>

                        {websiteProjects.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No website projects created for this client yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <th className="py-3 px-4">Project Name</th>
                                            <th className="py-3 px-4">Budget</th>
                                            <th className="py-3 px-4">Deadline</th>
                                            <th className="py-3 px-4">Progress</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {websiteProjects.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                                                    <Link
                                                        href={`/website-projects/${p.id}`}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        {p.project_name}
                                                    </Link>
                                                </td>
                                                <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    {formatCurrency(p.total_budget)}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-semibold">
                                                    {formatDateOnly(p.deadline)}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${p.progress_percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{p.progress_percentage}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                                                            p.status === 'completed'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                : p.status === 'in_progress'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        }`}
                                                    >
                                                        {p.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Project Tasks Table */}
                {activeTab === 'tasks' && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="size-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Client Project Tasks
                                    </h3>
                                    <p className="text-xs text-slate-400">All execution tasks across client projects.</p>
                                </div>
                            </div>
                            <Link
                                href="/project-tasks"
                                className="h-8 px-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1.5"
                            >
                                <Plus className="size-3.5" />
                                <span>Create Task</span>
                            </Link>
                        </div>

                        {allTasks.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No tasks created for this client's projects yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <th className="py-3 px-4">Task Name</th>
                                            <th className="py-3 px-4">Project Name</th>
                                            <th className="py-3 px-4">Assigned Staff</th>
                                            <th className="py-3 px-4">Priority</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {allTasks.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                                                    {t.task_title}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                                                    <Link href={`/website-projects/${t.website_project_id}`}>
                                                        {t.projectName}
                                                    </Link>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {t.assigned_employee ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-6 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold text-[10px] flex items-center justify-center">
                                                                {t.assigned_employee.name.charAt(0)}
                                                            </div>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                {t.assigned_employee.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                            t.priority === 'urgent'
                                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                                : t.priority === 'high'
                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                                : t.priority === 'medium'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        {t.priority}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                                                            t.status === 'completed'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                : t.status === 'in_progress'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    >
                                                        {t.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-semibold">
                                                    {formatDateOnly(t.due_date)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 4: Financial Milestone Payments */}
                {activeTab === 'payments' && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <BadgeDollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Client Financial Payments & Settlements
                                    </h3>
                                    <p className="text-xs text-slate-400">All milestone transaction history.</p>
                                </div>
                            </div>
                            <Link
                                href="/website-payments"
                                className="h-8 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all inline-flex items-center gap-1.5"
                            >
                                <Plus className="size-3.5" />
                                <span>Record Payment</span>
                            </Link>
                        </div>

                        {allPayments.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No financial payments recorded for this client yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <th className="py-3 px-4">Project Name</th>
                                            <th className="py-3 px-4">Milestone Stage</th>
                                            <th className="py-3 px-4">Stage</th>
                                            <th className="py-3 px-4">Amount</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Paid Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {allPayments.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                                                    <Link href={`/website-projects/${p.website_project_id}`}>
                                                        {p.projectName}
                                                    </Link>
                                                </td>
                                                <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                                                    {p.milestone_title}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap capitalize font-bold text-slate-600 dark:text-slate-400">
                                                    {p.payment_stage}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-slate-900 dark:text-white text-sm">
                                                    {formatCurrency(p.amount)}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                            p.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        }`}
                                                    >
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-semibold">
                                                    {formatDateOnly(p.paid_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 5: SEO Retainers */}
                {activeTab === 'seo' && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Globe className="size-5 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        SEO Retainers & Contracts
                                    </h3>
                                    <p className="text-xs text-slate-400">Monthly recurring SEO packages for {client.name}.</p>
                                </div>
                            </div>
                            <Link
                                href="/seo-retainers/create"
                                className="h-8 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all inline-flex items-center gap-1.5"
                            >
                                <Plus className="size-3.5" />
                                <span>Add Retainer</span>
                            </Link>
                        </div>

                        {seoRetainers.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No SEO retainers registered for this client yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <th className="py-3 px-4">Monthly Retainer Amount</th>
                                            <th className="py-3 px-4">Billing Day</th>
                                            <th className="py-3 px-4">Start Date</th>
                                            <th className="py-3 px-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {seoRetainers.map((r) => (
                                            <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                                    {formatCurrency(r.monthly_amount)} / month
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                                                    Day {r.billing_cycle_day} of every month
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-semibold">
                                                    {formatDateOnly(r.start_date)}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                            r.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                        }`}
                                                    >
                                                        {r.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 6: Client Profile & Settings */}
                {activeTab === 'settings' && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Client Profile & Account Settings
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Update contact details, company information, billing currency, and operational preferences.
                                </p>
                            </div>
                            <Link
                                href={`/clients/${client.id}/edit`}
                                className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 inline-flex items-center gap-2"
                            >
                                <Edit2 className="size-4" />
                                <span>Edit Full Client Record</span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 space-y-3">
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs block border-b border-slate-200/40 dark:border-slate-800 pb-2">
                                    General & Business Details
                                </span>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-slate-400">Client Code:</span><span className="font-mono font-bold text-slate-800 dark:text-slate-200">{client.client_code}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Client Name:</span><span className="font-bold text-slate-800 dark:text-slate-200">{client.name}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Company Name:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{client.company_name || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Account Currency:</span><span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{client.currency}</span></div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 space-y-3">
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs block border-b border-slate-200/40 dark:border-slate-800 pb-2">
                                    Primary Contact Information
                                </span>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-slate-400">Contact Person:</span><span className="font-bold text-slate-800 dark:text-slate-200">{client.contact_person || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Email Address:</span><span className="font-semibold text-blue-600 dark:text-blue-400">{client.email || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Phone / Mobile:</span><span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{client.mobile || client.phone || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">City / Country:</span><span className="font-semibold text-slate-800 dark:text-slate-200">{[client.city, client.country].filter(Boolean).join(', ') || '—'}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
}
