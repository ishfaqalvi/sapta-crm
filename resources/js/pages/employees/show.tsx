import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeDollarSign,
    Building2,
    Calendar,
    CheckSquare,
    Clock,
    Edit2,
    FolderKanban,
    Mail,
    Phone,
    Plus,
    Receipt,
    User,
} from 'lucide-react';
import { useState } from 'react';

interface SubDepartmentSimple {
    id: number;
    name: string;
}

interface DepartmentSimple {
    id: number;
    name: string;
}

interface DesignationSimple {
    id: number;
    name: string;
}

interface UserSimple {
    id: number;
    name: string;
    email: string;
}

interface PayrollHistoryItem {
    id: number;
    month: number;
    year: number;
    base_salary_pkr: number;
    total_working_days: number;
    leaves_taken: number;
    allowed_paid_leaves: number;
    unpaid_leaves: number;
    daily_rate_pkr: number;
    leave_deduction_pkr: number;
    bonuses_pkr: number;
    other_deductions_pkr: number;
    net_salary_pkr: number;
    payment_status: 'unpaid' | 'processing' | 'paid';
    payment_date: string | null;
    notes: string | null;
}

interface AssignedTaskItem {
    id: number;
    website_project_id: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string;
    due_date?: string;
    description?: string;
    website_project?: {
        id: number;
        project_name: string;
    };
}

interface EmployeeItem {
    id: number;
    employee_code: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    joining_date: string | null;
    department_id: number | null;
    sub_department_id: number | null;
    designation_id: number | null;
    user_id: number | null;
    employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
    base_salary_pkr: number;
    allowed_paid_leaves: number;
    bank_name: string | null;
    account_number: string | null;
    iban: string | null;
    emergency_contact: string | null;
    notes: string | null;
    status: 'active' | 'inactive' | 'resigned';
    department: DepartmentSimple | null;
    sub_department: SubDepartmentSimple | null;
    designation: DesignationSimple | null;
    user: UserSimple | null;
    payrolls?: PayrollHistoryItem[];
    assigned_tasks?: AssignedTaskItem[];
}

interface EmployeeShowProps {
    employee: EmployeeItem;
}

const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EmployeeShow({ employee }: EmployeeShowProps) {
    const user = (usePage().props.auth as any)?.user;
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'payrolls'>('overview');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR & Operations', href: '/employees' },
        { title: 'Employee Directory', href: '/employees' },
        { title: employee.name, href: `/employees/${employee.id}` },
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

    const payrolls = employee.payrolls || [];
    const tasks = employee.assigned_tasks || [];

    const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
    const pendingTasksCount = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Staff Profile - ${employee.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Standardized CRM Detail Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                {employee.name}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
                                {employee.employee_code}
                            </span>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize ${employee.status === 'active'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                    }`}
                            >
                                {employee.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Building2 className="size-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">{employee.department?.name || 'Unassigned'}</span>
                            {employee.sub_department && <span>/ {employee.sub_department.name}</span>}
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-400">{employee.designation?.name || 'Staff Member'}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 pl-9 sm:pl-0">
                        {hasPermission(user, 'edit-employees') && (
                            <Link
                                href={route('employees.edit', employee.id)}
                                className="h-10 px-4 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                            >
                                <Edit2 className="size-4" />
                                <span>Edit Profile</span>
                            </Link>
                        )}
                        <Link
                            href="/employees"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white hover:from-[#002a75] hover:to-[#0040b8] transition-all inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                        >
                            <span>Directory List</span>
                        </Link>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Organization & Role */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Designation</span>
                            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <Building2 className="size-4" />
                            </div>
                        </div>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                            {employee.designation?.name || 'Staff Member'}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold capitalize pt-2 border-t border-slate-100 dark:border-slate-800">
                            {employee.employment_type.replace('_', ' ')}
                        </p>
                    </div>

                    {/* Base Salary */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Base Salary</span>
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <BadgeDollarSign className="size-4" />
                            </div>
                        </div>
                        <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                            PKR {Number(employee.base_salary_pkr).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                            {employee.allowed_paid_leaves} Paid Leaves / Month
                        </p>
                    </div>

                    {/* Assigned Tasks KPI */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Tasks</span>
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <CheckSquare className="size-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {tasks.length} <span className="text-xs font-semibold text-slate-400">Total</span>
                        </p>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                            <span className="text-emerald-600">{completedTasksCount} Completed</span>
                            <span className="text-blue-600">{pendingTasksCount} Pending</span>
                        </div>
                    </div>

                    {/* Payroll Log Count */}
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Payroll Records</span>
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                <Receipt className="size-4" />
                            </div>
                        </div>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {payrolls.length} <span className="text-xs font-semibold text-slate-400">Logs</span>
                        </p>
                        <p className="text-xs text-slate-400 font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
                            Joined: {formatDateOnly(employee.joining_date)}
                        </p>
                    </div>
                </div>

                {/* Hero Header & Tabs Card */}
                <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="relative size-16 rounded-2xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold text-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0 border-2 border-white dark:border-slate-800">
                                {employee.avatar ? (
                                    <img src={employee.avatar} alt={employee.name} className="size-full object-cover" />
                                ) : (
                                    employee.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {employee.name}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {employee.email} {employee.phone ? `• ${employee.phone}` : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pt-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`h-11 px-5 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-2 shrink-0 ${activeTab === 'overview'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            <User className="size-4" />
                            <span>Overview & Contact</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`h-11 px-5 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-2 shrink-0 ${activeTab === 'tasks'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            <CheckSquare className="size-4" />
                            <span>Assigned Project Tasks ({tasks.length})</span>
                        </button>

                        {hasPermission(user, 'view-payroll') && (
                            <button
                                onClick={() => setActiveTab('payrolls')}
                                className={`h-11 px-5 text-xs font-bold border-b-2 transition-all inline-flex items-center gap-2 shrink-0 ${activeTab === 'payrolls'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Receipt className="size-4" />
                                <span>Monthly Payroll History ({payrolls.length})</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab 1: Overview & Profile */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Personal & Contact Card */}
                        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                <User className="size-4 text-blue-600" />
                                <span>Contact Details</span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Email Address</span>
                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                        <Mail className="size-3.5 text-slate-400" />
                                        <span>{employee.email}</span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Phone Number</span>
                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                        <Phone className="size-3.5 text-slate-400" />
                                        <span>{employee.phone || 'Not provided'}</span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Emergency Contact</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                                        {employee.emergency_contact || 'Not provided'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Organizational Card */}
                        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                <Building2 className="size-4 text-purple-600" />
                                <span>Organizational Structure</span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Department / Sub-Unit</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                                        {employee.department?.name || 'Unassigned'}
                                        {employee.sub_department && <span className="text-blue-600 font-normal"> ({employee.sub_department.name})</span>}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Designation / Position</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                                        {employee.designation?.name || 'Staff Member'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Joining Date</span>
                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                        <Calendar className="size-3.5 text-slate-400" />
                                        <span>{formatDateOnly(employee.joining_date)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Financial & Banking Card */}
                        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                                <BadgeDollarSign className="size-4 text-emerald-600" />
                                <span>Compensation & Banking</span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium block">Base Monthly Salary (PKR)</span>
                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base block mt-0.5">
                                        PKR {Number(employee.base_salary_pkr).toLocaleString()}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Bank Name</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                                        {employee.bank_name || 'Not provided'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 font-medium block">Account Number & IBAN</span>
                                    <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                                        {employee.account_number || 'N/A'} {employee.iban ? `(${employee.iban})` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Assigned Project Tasks */}
                {activeTab === 'tasks' && (
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <CheckSquare className="size-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Assigned Project Tasks
                                    </h3>
                                    <p className="text-xs text-slate-400">All website project tasks assigned to {employee.name}.</p>
                                </div>
                            </div>
                            <Link
                                href="/project-tasks"
                                className="h-8 px-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-600 hover:text-white transition-all inline-flex items-center gap-1.5"
                            >
                                <Plus className="size-3.5" />
                                <span>Create New Task</span>
                            </Link>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No project tasks currently assigned to this employee.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <th className="py-3 px-4">Task Name</th>
                                            <th className="py-3 px-4">Website Project</th>
                                            <th className="py-3 px-4">Priority</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Start Date</th>
                                            <th className="py-3 px-4">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {tasks.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                                                    {t.task_title}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {t.website_project ? (
                                                        <Link
                                                            href={`/website-projects/${t.website_project.id}`}
                                                            className="font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                        >
                                                            {t.website_project.project_name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-slate-400 italic">General Task</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${t.priority === 'urgent'
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
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${t.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : t.status === 'in_progress'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                                : t.status === 'in_review'
                                                                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                                            }`}
                                                    >
                                                        {t.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-semibold">
                                                    {formatDateOnly(t.start_date)}
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

                {/* Tab 3: Monthly Payroll History */}
                {activeTab === 'payrolls' && (
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Month-by-Month Payroll Log
                                </h3>
                                <p className="text-xs text-slate-400">Historical salary calculations and disbursement records.</p>
                            </div>
                            <span className="text-xs text-slate-400 font-bold">
                                Total Logs: {payrolls.length}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Month / Year</th>
                                        <th className="px-6 py-4">Base Salary</th>
                                        <th className="px-6 py-4">Days / Leaves</th>
                                        <th className="px-6 py-4">Deductions / Bonus</th>
                                        <th className="px-6 py-4">Net Salary PKR</th>
                                        <th className="px-6 py-4">Payment Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {payrolls.length > 0 ? (
                                        payrolls.map((p) => {
                                            const isPaid = p.payment_status === 'paid';
                                            const monthName = monthsList[p.month - 1] || `Month ${p.month}`;

                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                                                        {monthName} {p.year}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold">
                                                        PKR {Number(p.base_salary_pkr).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>{p.total_working_days} work days</div>
                                                        <div className="text-[11px] text-slate-400">
                                                            {p.leaves_taken} leaves ({p.unpaid_leaves} unpaid)
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {Number(p.leave_deduction_pkr) > 0 && (
                                                            <span className="text-rose-600 font-bold block text-[11px]">
                                                                - PKR {Number(p.leave_deduction_pkr).toLocaleString()} (Leave)
                                                            </span>
                                                        )}
                                                        {Number(p.bonuses_pkr) > 0 && (
                                                            <span className="text-emerald-600 font-bold block text-[11px]">
                                                                + PKR {Number(p.bonuses_pkr).toLocaleString()} (Bonus)
                                                            </span>
                                                        )}
                                                        {Number(p.leave_deduction_pkr) === 0 && Number(p.bonuses_pkr) === 0 && (
                                                            <span className="text-slate-400 text-xs">Standard</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                                        PKR {Number(p.net_salary_pkr).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${isPaid
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                            }`}>
                                                            {isPaid ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                        {p.payment_date && (
                                                            <span className="text-[10px] text-slate-400 block mt-0.5">
                                                                {p.payment_date}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                                No monthly payroll history generated for this employee yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
