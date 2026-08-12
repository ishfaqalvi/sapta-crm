import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeDollarSign,
    Building2,
    Edit2,
    Eye,
    LoaderCircle,
    Mail,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'HR & Operations',
        href: '/employees',
    },
    {
        title: 'Employee Directory',
        href: '/employees',
    },
];

interface SubDepartmentSimple {
    id: number;
    name: string;
}

interface DepartmentSimple {
    id: number;
    name: string;
    sub_departments: SubDepartmentSimple[];
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
}

interface EmployeesIndexProps {
    employees: PaginatedData<EmployeeItem>;
    departments: DepartmentSimple[];
    filters?: {
        search?: string;
        department_id?: string;
        status?: string;
    };
}

export default function EmployeesIndex({
    employees,
    departments,
    filters,
}: EmployeesIndexProps) {
    const user = (usePage().props.auth as any)?.user;
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedDeptFilter, setSelectedDeptFilter] = useState(filters?.department_id || '');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(filters?.status || '');

    const [deletingEmployee, setDeletingEmployee] = useState<EmployeeItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter debounce
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                route('employees.index'),
                {
                    search: searchQuery,
                    department_id: selectedDeptFilter,
                    status: selectedStatusFilter,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedDeptFilter, selectedStatusFilter]);

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingEmployee || isDeleting) return;
        setIsDeleting(true);
        router.delete(route('employees.destroy', deletingEmployee.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingEmployee(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Directory" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Employee Directory & Setup
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Manage staff profiles, department assignments, PKR base salaries, and employment details.
                        </p>
                    </div>

                    {hasPermission(user, 'create-employees') && (
                        <Link
                            href={route('employees.create')}
                            className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0"
                        >
                            <Plus className="size-4" />
                            <span>Add New Employee</span>
                        </Link>
                    )}
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by code, name, email, or phone..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedDeptFilter}
                            onChange={(e) => setSelectedDeptFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Departments</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive</option>
                            <option value="resigned">Resigned</option>
                        </select>

                        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">
                            <Users className="size-4 text-blue-600 dark:text-blue-400" />
                            <span>Total Staff: <strong className="text-slate-900 dark:text-white">{employees.total}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Dept / Designation</th>
                                    <th className="px-6 py-4">Base Salary (PKR)</th>
                                    <th className="px-6 py-4">Employment Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {employees.data.length > 0 ? (
                                    employees.data.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Employee Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative size-10 rounded-xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-white/20">
                                                        {emp.avatar ? (
                                                            <img src={emp.avatar} alt={emp.name} className="size-full object-cover" />
                                                        ) : (
                                                            emp.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={route('employees.show', emp.id)}
                                                                className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                            >
                                                                {emp.name}
                                                            </Link>
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
                                                                {emp.employee_code}
                                                            </span>
                                                        </div>
                                                        <span className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                                                            <Mail className="size-3" />
                                                            <span>{emp.email}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Dept & Designation */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-100 dark:border-blue-900/40">
                                                        <Building2 className="size-3" />
                                                        <span>{emp.department?.name || 'Unassigned'}</span>
                                                        {emp.sub_department && (
                                                            <span className="text-blue-500 font-normal"> / {emp.sub_department.name}</span>
                                                        )}
                                                    </span>

                                                    {emp.designation && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">
                                                            {emp.designation.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Base Salary PKR */}
                                            <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white text-sm">
                                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                    <BadgeDollarSign className="size-4" />
                                                    <span>PKR {Number(emp.base_salary_pkr).toLocaleString()}</span>
                                                </div>
                                                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                                                    {emp.allowed_paid_leaves} paid leaves/mo
                                                </span>
                                            </td>

                                            {/* Employment Type */}
                                            <td className="px-6 py-4">
                                                <span className="capitalize px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
                                                    {emp.employment_type.replace('_', ' ')}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${emp.status === 'active'
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : emp.status === 'inactive'
                                                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                    }`}>
                                                    {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                                                </span>
                                            </td>

                                            {/* Actions (Icon-Only Buttons linked to edit page) */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={route('employees.show', emp.id)}
                                                        className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="View Profile & Payroll History"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>
                                                    {hasPermission(user, 'edit-employees') && (
                                                        <Link
                                                            href={route('employees.edit', emp.id)}
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Edit Employee Profile"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </Link>
                                                    )}
                                                    {hasPermission(user, 'delete-employees') && (
                                                        <button
                                                            onClick={() => setDeletingEmployee(emp)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Delete Employee Profile"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No employee records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={employees} />
                </div>

                {/* Delete Confirmation Modal */}
                {deletingEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                                        Delete Staff Profile?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">"{deletingEmployee.name}"</span> ({deletingEmployee.employee_code})? This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingEmployee(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <div className="flex items-center gap-2">
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </div>
                                    ) : (
                                        <span>Delete</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
