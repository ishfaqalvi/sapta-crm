import AppLayout from '@/layouts/app-layout';
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
    FileText,
    FolderKanban,
    Layers,
    Plus,
    User,
} from 'lucide-react';

interface ClientData {
    id: number;
    client_code: string;
    name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    currency?: string;
}

interface PaymentData {
    id: number;
    milestone_title: string;
    amount: number | string;
    payment_stage: 'advance' | 'partial' | 'full';
    status: 'pending' | 'paid';
    paid_at?: string;
    payment_method?: string;
}

interface EmployeeData {
    id: number;
    name: string;
    employee_code: string;
    avatar?: string;
}

interface TaskData {
    id: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    due_date?: string;
    description?: string;
    assigned_employee?: EmployeeData;
}

interface WebsiteProjectDetail {
    id: number;
    project_name: string;
    total_budget: number | string;
    currency: string;
    start_date?: string;
    deadline?: string;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    notes?: string;
    created_at: string;
    client?: ClientData;
    payments?: PaymentData[];
    tasks?: TaskData[];
}

interface ShowProps {
    project: WebsiteProjectDetail;
}

export default function WebsiteProjectShow({ project }: ShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Website Projects', href: '/website-projects' },
        { title: project.project_name, href: `/website-projects/${project.id}` },
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
        const symbol = project.currency === 'USD' ? '$' : project.currency === 'EUR' ? '€' : project.currency === 'GBP' ? '£' : 'Rs ';
        return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Financial calculations
    const payments = project.payments || [];
    const tasks = project.tasks || [];

    const totalPaidAmount = payments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (typeof p.amount === 'number' ? p.amount : parseFloat(p.amount || '0')), 0);

    const totalBudget = typeof project.total_budget === 'number' ? project.total_budget : parseFloat(project.total_budget || '0');
    const remainingBalance = Math.max(0, totalBudget - totalPaidAmount);
    const financialPaidPercentage = totalBudget > 0 ? Math.min(100, Math.round((totalPaidAmount / totalBudget) * 100)) : 0;

    // Task calculations
    const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
    const inProgressTasksCount = tasks.filter((t) => t.status === 'in_progress').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Project: ${project.project_name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Link
                                href="/website-projects"
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                                title="Back to Projects"
                            >
                                <ArrowLeft className="size-5" />
                            </Link>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                {project.project_name}
                            </h1>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                                    project.status === 'completed'
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        : project.status === 'in_progress'
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                        : project.status === 'on_hold'
                                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                }`}
                            >
                                {project.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-9 flex items-center gap-2">
                            <Building className="size-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">{project.client?.name}</span>
                            {project.client?.company_name && <span>({project.client.company_name})</span>}
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pl-9 sm:pl-0">
                        <Link
                            href={`/website-projects/${project.id}/edit`}
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                        >
                            <Edit2 className="size-4" />
                            <span>Edit Project</span>
                        </Link>
                        <Link
                            href="/website-projects"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white hover:from-[#002a75] hover:to-[#0040b8] transition-all inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                        >
                            <span>Back to List</span>
                        </Link>
                    </div>
                </div>

                {/* Top Executive KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Budget & Collections */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Budget</span>
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <DollarSign className="size-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(project.total_budget)}
                        </p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-emerald-600 font-bold">{formatCurrency(totalPaidAmount)} Paid</span>
                            <span className="text-slate-400 font-semibold">{financialPaidPercentage}% settled</span>
                        </div>
                    </div>

                    {/* Progress Percentage */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion Progress</span>
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                <Layers className="size-4" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                                {project.progress_percentage}%
                            </p>
                            <span className="text-xs font-bold text-slate-400">Overall</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${project.progress_percentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Timeline & Due Date */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Completion</span>
                            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <Calendar className="size-4" />
                            </div>
                        </div>
                        <p className="text-base font-extrabold text-slate-900 dark:text-white">
                            {formatDateOnly(project.deadline)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                            Started: {formatDateOnly(project.start_date)}
                        </p>
                    </div>

                    {/* Project Tasks Summary */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Project Tasks</span>
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                <CheckSquare className="size-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {tasks.length} <span className="text-xs font-semibold text-slate-400">Total Tasks</span>
                        </p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                            <span className="text-emerald-600">{completedTasksCount} Done</span>
                            <span className="text-blue-600">{inProgressTasksCount} In Progress</span>
                        </div>
                    </div>
                </div>

                {/* Section 1: Overview & Client Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Client & Contract Metadata Card */}
                    <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <User className="size-4 text-blue-600" />
                                Client Information
                            </h3>
                            {project.client && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                    {project.client.client_code}
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-medium">Client Name:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{project.client?.name || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-medium">Company:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{project.client?.company_name || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-medium">Email:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{project.client?.email || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-medium">Phone:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{project.client?.phone || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 font-medium">Contract Currency:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{project.currency}</span>
                            </div>

                            <div className="flex justify-between py-1">
                                <span className="text-slate-400 font-medium">Remaining Balance:</span>
                                <span className="font-extrabold text-amber-600 dark:text-amber-400">{formatCurrency(remainingBalance)}</span>
                            </div>
                        </div>

                        {/* Project Description Notes */}
                        {project.notes && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Execution Notes:</span>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                                    {project.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Tasks & Team Assignments Section */}
                    <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="size-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Project Tasks & Team Assignments
                                    </h3>
                                    <p className="text-xs text-slate-400">Execution task breakdown and assigned staff.</p>
                                </div>
                            </div>
                            <Link
                                href="/project-tasks"
                                className="h-8 px-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1.5"
                            >
                                <Plus className="size-3.5" />
                                <span>Manage Tasks</span>
                            </Link>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No tasks created for this project yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <th className="py-2.5 px-3">Task Name</th>
                                            <th className="py-2.5 px-3">Assigned Employee</th>
                                            <th className="py-2.5 px-3">Priority</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {tasks.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                                    {t.task_title}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    {t.assigned_employee ? (
                                                        <div className="flex items-center gap-2">
                                                            {t.assigned_employee.avatar ? (
                                                                <img
                                                                    src={t.assigned_employee.avatar}
                                                                    alt={t.assigned_employee.name}
                                                                    className="size-6 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                                                                />
                                                            ) : (
                                                                <div className="size-6 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[10px] flex items-center justify-center border border-blue-200 dark:border-blue-800">
                                                                    {t.assigned_employee.name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                                                {t.assigned_employee.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                            t.priority === 'urgent'
                                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                                                : t.priority === 'high'
                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                                                : t.priority === 'medium'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}
                                                    >
                                                        {t.priority}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                                                            t.status === 'completed'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                                : t.status === 'in_progress'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                                                : t.status === 'in_review'
                                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {t.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-semibold">
                                                    {formatDateOnly(t.due_date)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 2: Milestone Payment Settlements History */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <BadgeDollarSign className="size-5 text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Milestone Payments Settlement History
                                </h3>
                                <p className="text-xs text-slate-400">Financial milestone stages and settlement transactions.</p>
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

                    {payments.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 italic bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            No milestone payments recorded for this project yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                        <th className="py-3 px-4">Milestone Stage Title</th>
                                        <th className="py-3 px-4">Payment Stage</th>
                                        <th className="py-3 px-4">Amount</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Paid Date</th>
                                        <th className="py-3 px-4">Payment Method</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                    {payments.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
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
                                            <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium">
                                                {p.payment_method || 'Bank Transfer'}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap text-right">
                                                <Link
                                                    href={`/invoices/create?project_payment_id=${p.id}`}
                                                    className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-extrabold inline-flex items-center gap-1 shadow-2xs"
                                                    title="Generate Invoice for Milestone"
                                                >
                                                    <FileText className="size-3" />
                                                    <span>Invoice</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
