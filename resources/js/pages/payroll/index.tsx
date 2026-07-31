import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    BadgeCheck,
    BadgeDollarSign,
    Banknote,
    Building2,
    Calculator,
    Calendar,
    CheckCircle2,
    Clock,
    Edit2,
    Filter,
    LoaderCircle,
    Receipt,
    Search,
    UserCheck,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'HR & Operations',
        href: '/payroll',
    },
    {
        title: 'Monthly Payroll',
        href: '/payroll',
    },
];

interface EmployeeSimple {
    id: number;
    employee_code: string;
    name: string;
    department: { name: string } | null;
    designation: { name: string } | null;
}

interface PayrollItem {
    id: number;
    employee_id: number;
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
    employee: EmployeeSimple;
}

interface PayrollIndexProps {
    payrolls: PaginatedData<PayrollItem>;
    summary: {
        total_base: number;
        total_net: number;
        total_paid: number;
        total_unpaid: number;
    };
    filters: {
        month: number;
        year: number;
        search?: string;
    };
}

const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

export default function PayrollIndex({ payrolls, summary, filters }: PayrollIndexProps) {
    const [selectedMonth, setSelectedMonth] = useState<number>(filters.month);
    const [selectedYear, setSelectedYear] = useState<number>(filters.year);
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');

    const [editingPayroll, setEditingPayroll] = useState<PayrollItem | null>(null);

    const form = useForm({
        total_working_days: 26 as number | string,
        leaves_taken: 0 as number | string,
        allowed_paid_leaves: 2 as number | string,
        bonuses_pkr: 0 as number | string,
        other_deductions_pkr: 0 as number | string,
        payment_status: 'unpaid' as 'unpaid' | 'processing' | 'paid',
        notes: '',
    });

    // Handle Month/Year/Search filter changes
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                route('payroll.index'),
                {
                    month: selectedMonth,
                    year: selectedYear,
                    search: searchQuery,
                },
                { preserveState: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [selectedMonth, selectedYear, searchQuery]);

    // Open Edit Payroll Modal
    const handleEditPayroll = (item: PayrollItem) => {
        setEditingPayroll(item);
        form.setData({
            total_working_days: item.total_working_days,
            leaves_taken: item.leaves_taken,
            allowed_paid_leaves: item.allowed_paid_leaves,
            bonuses_pkr: item.bonuses_pkr,
            other_deductions_pkr: item.other_deductions_pkr,
            payment_status: item.payment_status,
            notes: item.notes || '',
        });
        form.clearErrors();
    };

    // Calculate preview values in modal
    const calcWorkingDays = Math.max(1, Number(form.data.total_working_days) || 26);
    const calcAllowedLeaves = Math.max(0, Number(form.data.allowed_paid_leaves) || 0);
    const calcLeavesTaken = Math.max(0, Number(form.data.leaves_taken) || 0);
    const calcUnpaidLeaves = Math.max(0, calcLeavesTaken - calcAllowedLeaves);
    const calcBaseSalary = editingPayroll ? Number(editingPayroll.base_salary_pkr) : 0;
    const calcDailyRate = calcBaseSalary / calcWorkingDays;
    const calcLeaveDeductions = calcUnpaidLeaves * calcDailyRate;
    const calcBonuses = Number(form.data.bonuses_pkr) || 0;
    const calcOtherDeductions = Number(form.data.other_deductions_pkr) || 0;
    const calcNetSalary = Math.max(0, calcBaseSalary - calcLeaveDeductions + calcBonuses - calcOtherDeductions);

    // Save Payroll Changes
    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingPayroll) return;

        form.put(route('payroll.update', editingPayroll.id), {
            preserveScroll: true,
            onSuccess: () => setEditingPayroll(null),
        });
    };

    // Toggle Payment Status
    const handleToggleStatus = (item: PayrollItem, newStatus: 'paid' | 'unpaid') => {
        router.patch(
            route('payroll.status', item.id),
            { payment_status: newStatus },
            { preserveScroll: true }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monthly Payroll & Salary Calculator" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header & Month Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Monthly Payroll & Salary Management
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Input monthly leaves and working days to calculate net PKR salaries and manage disbursements.
                        </p>
                    </div>

                    {/* Month Selector & Batch Generator */}
                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto flex-wrap">
                        <button
                            type="button"
                            onClick={() => {
                                router.post(
                                    route('payroll.generate'),
                                    { month: selectedMonth, year: selectedYear },
                                    { preserveScroll: true }
                                );
                            }}
                            className="h-11 px-4 text-xs font-bold rounded-2xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                        >
                            <Calculator className="size-4" />
                            <span>Generate / Process Payroll Batch</span>
                        </button>

                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <Calendar className="size-4" />
                            </div>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="h-9 px-2 bg-transparent text-xs font-extrabold text-slate-900 dark:text-white border-none focus:outline-none cursor-pointer"
                            >
                                {monthsList.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>

                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="h-9 px-2 bg-transparent text-xs font-extrabold text-slate-900 dark:text-white border-none focus:outline-none cursor-pointer"
                            >
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Base Payroll */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 hover:border-blue-300 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                            <span>Base Monthly Payroll</span>
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                                <Banknote className="size-4" />
                            </div>
                        </div>
                        <div className="text-xl font-extrabold text-slate-900 dark:text-white pt-1">
                            PKR {Number(summary.total_base).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Standard monthly base salaries sum</p>
                    </div>

                    {/* Total Net Calculated */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 hover:border-purple-300 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                            <span>Net Calculated Payable</span>
                            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                                <BadgeDollarSign className="size-4" />
                            </div>
                        </div>
                        <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 pt-1">
                            PKR {Number(summary.total_net).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Net total after leave deductions & bonuses</p>
                    </div>

                    {/* Total Paid */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 hover:border-emerald-300 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                            <span>Total Disbursed (Paid)</span>
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-4" />
                            </div>
                        </div>
                        <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 pt-1">
                            PKR {Number(summary.total_paid).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Completed salary payouts</p>
                    </div>

                    {/* Total Unpaid */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 hover:border-amber-300 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                            <span>Outstanding (Pending)</span>
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                                <Clock className="size-4" />
                            </div>
                        </div>
                        <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 pt-1">
                            PKR {Number(summary.total_unpaid).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Pending salary disbursements</p>
                    </div>
                </div>

                {/* Filter / Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search employee name or code..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <Receipt className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Records for {monthsList.find((m) => m.value === selectedMonth)?.label} {selectedYear}: <strong className="text-slate-900 dark:text-white">{payrolls.total}</strong></span>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Base Salary</th>
                                    <th className="px-6 py-4">Days / Leaves</th>
                                    <th className="px-6 py-4">Deductions & Bonuses</th>
                                    <th className="px-6 py-4">Net Payable (PKR)</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payrolls.data.length > 0 ? (
                                    payrolls.data.map((item) => {
                                        const isPaid = item.payment_status === 'paid';

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                {/* Employee Info */}
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={route('employees.show', item.employee_id)}
                                                                className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                            >
                                                                {item.employee.name}
                                                            </Link>
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
                                                                {item.employee.employee_code}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                                                            {item.employee.department?.name || 'Staff'} {item.employee.designation ? `• ${item.employee.designation.name}` : ''}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Base Salary */}
                                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                                                    PKR {Number(item.base_salary_pkr).toLocaleString()}
                                                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                                                        Daily ~ PKR {Number(item.daily_rate_pkr).toLocaleString()}
                                                    </span>
                                                </td>

                                                {/* Days & Leaves */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1 text-xs font-semibold">
                                                        <div>Work Days: <strong className="text-slate-900 dark:text-white">{item.total_working_days}</strong></div>
                                                        <div className="text-[11px]">
                                                            Leaves: <span className="font-bold text-amber-600">{item.leaves_taken} taken</span>{' '}
                                                            ({item.unpaid_leaves > 0 ? <strong className="text-rose-600">{item.unpaid_leaves} unpaid</strong> : <span className="text-emerald-600">0 unpaid</span>})
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Deductions & Bonuses */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-0.5 text-xs font-medium">
                                                        {Number(item.leave_deduction_pkr) > 0 && (
                                                            <span className="text-rose-600 font-bold block text-[11px]">
                                                                - PKR {Number(item.leave_deduction_pkr).toLocaleString()} (Leave)
                                                            </span>
                                                        )}
                                                        {Number(item.other_deductions_pkr) > 0 && (
                                                            <span className="text-rose-600 font-bold block text-[11px]">
                                                                - PKR {Number(item.other_deductions_pkr).toLocaleString()} (Other)
                                                            </span>
                                                        )}
                                                        {Number(item.bonuses_pkr) > 0 && (
                                                            <span className="text-emerald-600 font-bold block text-[11px]">
                                                                + PKR {Number(item.bonuses_pkr).toLocaleString()} (Bonus)
                                                            </span>
                                                        )}
                                                        {Number(item.leave_deduction_pkr) === 0 && Number(item.bonuses_pkr) === 0 && Number(item.other_deductions_pkr) === 0 && (
                                                            <span className="text-slate-400 text-xs italic">Standard Payroll</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Net Salary PKR */}
                                                <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white text-base">
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        PKR {Number(item.net_salary_pkr).toLocaleString()}
                                                    </span>
                                                </td>

                                                {/* Payment Status */}
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                        isPaid
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : item.payment_status === 'processing'
                                                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                    }`}>
                                                        {isPaid ? 'Paid' : item.payment_status === 'processing' ? 'Processing' : 'Unpaid'}
                                                    </span>
                                                    {item.payment_date && (
                                                        <span className="text-[10px] text-slate-400 block mt-0.5">
                                                            {item.payment_date}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Quick Status Toggle */}
                                                        {isPaid ? (
                                                            <button
                                                                onClick={() => handleToggleStatus(item, 'unpaid')}
                                                                className="h-8 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                                                                title="Mark as Unpaid"
                                                            >
                                                                <Clock className="size-3.5" />
                                                                <span>Unpaid</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleToggleStatus(item, 'paid')}
                                                                className="h-8 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1 shadow-2xs"
                                                                title="Mark as Paid"
                                                            >
                                                                <BadgeCheck className="size-3.5" />
                                                                <span>Mark Paid</span>
                                                            </button>
                                                        )}

                                                        {/* Edit Modal Icon Button */}
                                                        <button
                                                            onClick={() => handleEditPayroll(item)}
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Calculate & Edit Payroll"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                            No payroll entries generated for this month yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={payrolls} />
                </div>

                {/* Redesigned Edit / Recalculate Payroll Modal Popup */}
                {editingPayroll && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 my-4 animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                                        <Calculator className="size-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                                            Salary Calculator: {editingPayroll.employee.name}
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {monthsList.find((m) => m.value === editingPayroll.month)?.label} {editingPayroll.year} Monthly Salary Calculation
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setEditingPayroll(null)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Auto Calculation Live Preview Box */}
                                <div className="p-4 rounded-2xl bg-gradient-to-tr from-blue-50/80 via-blue-50 to-indigo-50/60 dark:from-slate-950 dark:to-slate-900 border border-blue-200/80 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                        <span>Base Monthly Salary:</span>
                                        <span className="text-slate-900 dark:text-white font-extrabold">PKR {calcBaseSalary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        <span>Daily Rate ({calcWorkingDays} Days):</span>
                                        <span>PKR {Math.round(calcDailyRate).toLocaleString()} / day</span>
                                    </div>

                                    {calcUnpaidLeaves > 0 && (
                                        <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                                            <span>Unpaid Leave Deduction ({calcUnpaidLeaves} days):</span>
                                            <span>- PKR {Math.round(calcLeaveDeductions).toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-blue-200/60 dark:border-slate-800 flex items-center justify-between">
                                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">Calculated Net Payable:</span>
                                        <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                                            PKR {Math.round(calcNetSalary).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Form Input Controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Working Days in Month</Label>
                                        <Input
                                            type="number"
                                            value={form.data.total_working_days}
                                            onChange={(e) => form.setData('total_working_days', e.target.value)}
                                            placeholder="Standard 26"
                                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Allowed Paid Leaves</Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={form.data.allowed_paid_leaves}
                                            onChange={(e) => form.setData('allowed_paid_leaves', e.target.value)}
                                            placeholder="e.g. 1.5 or 2"
                                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Leaves Taken</Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={form.data.leaves_taken}
                                            onChange={(e) => form.setData('leaves_taken', e.target.value)}
                                            placeholder="e.g. 1.5 or 2.5"
                                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-amber-600 dark:text-amber-400"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bonuses / Performance (PKR)</Label>
                                        <Input
                                            type="number"
                                            value={form.data.bonuses_pkr}
                                            onChange={(e) => form.setData('bonuses_pkr', e.target.value)}
                                            placeholder="0"
                                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Other Deductions (PKR)</Label>
                                        <Input
                                            type="number"
                                            value={form.data.other_deductions_pkr}
                                            onChange={(e) => form.setData('other_deductions_pkr', e.target.value)}
                                            placeholder="0"
                                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Status</Label>
                                    <select
                                        value={form.data.payment_status}
                                        onChange={(e) => form.setData('payment_status', e.target.value as any)}
                                        className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                                    >
                                        <option value="unpaid">Unpaid / Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="paid">Paid & Disbursed</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Remarks</Label>
                                    <Input
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                        placeholder="Optional explanation for bonus or leave deduction..."
                                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                                    />
                                </div>

                                {/* Modal Actions */}
                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPayroll(null)}
                                        disabled={form.processing}
                                        className="h-10 px-4 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {form.processing ? (
                                            <div className="flex items-center gap-2">
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            <span>Save & Calculate Payroll</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
