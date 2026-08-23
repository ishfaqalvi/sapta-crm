import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
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
    Lock,
    Printer,
    Receipt,
    Search,
    ShieldCheck,
    Trash2,
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
    const authUser = (usePage().props.auth as any)?.user;
    const [selectedMonth, setSelectedMonth] = useState<number>(filters.month);
    const [selectedYear, setSelectedYear] = useState<number>(filters.year);
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');

    // Bulk selection state for batch payslip printing
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Edit Payroll Modal State
    const [editingPayroll, setEditingPayroll] = useState<PayrollItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Confirm Payment Disbursal Modal State
    const [payingPayroll, setPayingPayroll] = useState<PayrollItem | null>(null);
    const [isConfirmPayModalOpen, setIsConfirmPayModalOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Delete Payroll Modal State
    const [deletingPayroll, setDeletingPayroll] = useState<PayrollItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm({
        total_working_days: 26 as number | string,
        leaves_taken: 0 as number | string,
        allowed_paid_leaves: 2 as number | string,
        bonuses_pkr: 0 as number | string,
        other_deductions_pkr: 0 as number | string,
        payment_status: 'unpaid' as 'unpaid' | 'processing' | 'paid',
        notes: '' as string,
    });

    // Handle Month/Year/Search Filters
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
                    search: searchQuery || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [selectedMonth, selectedYear, searchQuery]);

    // Handle Checkbox Selection
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = payrolls.data.map((p) => p.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((item) => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Open Edit Payroll Modal
    const handleEdit = (payroll: PayrollItem) => {
        setEditingPayroll(payroll);
        form.setData({
            total_working_days: payroll.total_working_days,
            leaves_taken: payroll.leaves_taken,
            allowed_paid_leaves: payroll.allowed_paid_leaves,
            bonuses_pkr: payroll.bonuses_pkr,
            other_deductions_pkr: payroll.other_deductions_pkr,
            payment_status: payroll.payment_status,
            notes: payroll.notes || '',
        });
        setIsModalOpen(true);
    };

    // Submit Edit Form
    const handleSubmitUpdate: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingPayroll) return;

        form.put(route('payroll.update', editingPayroll.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingPayroll(null);
            },
        });
    };

    // Open Confirmation Modal to Mark as Paid
    const handleOpenConfirmPayModal = (payroll: PayrollItem) => {
        if (payroll.payment_status === 'paid') return;
        setPayingPayroll(payroll);
        setIsConfirmPayModalOpen(true);
    };

    // Execute Payment Confirmation (Irreversible)
    const handleConfirmPayment = () => {
        if (!payingPayroll) return;
        setIsProcessingPayment(true);

        router.patch(
            route('payroll.status', payingPayroll.id),
            { payment_status: 'paid' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsConfirmPayModalOpen(false);
                    setPayingPayroll(null);
                },
                onFinish: () => {
                    setIsProcessingPayment(false);
                },
            }
        );
    };

    // Open Delete Confirmation Modal
    const handleDelete = (payroll: PayrollItem) => {
        if (payroll.payment_status === 'paid') return;
        setDeletingPayroll(payroll);
    };

    // Execute Delete Confirmation
    const handleConfirmDelete = () => {
        if (!deletingPayroll || isDeleting) return;
        setIsDeleting(true);

        router.delete(route('payroll.destroy', deletingPayroll.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingPayroll(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const monthLabel = monthsList.find((m) => m.value === selectedMonth)?.label || selectedMonth;
    const isAllSelected = payrolls.data.length > 0 && selectedIds.length === payrolls.data.length;

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
                            Input monthly leaves and working days to calculate net PKR salaries and download salary slips.
                        </p>
                    </div>

                    {/* Month Selector & Batch Generator */}
                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto flex-wrap">
                        {hasPermission(authUser, 'generate-payroll') && (
                            <button
                                type="button"
                                onClick={() => {
                                    router.post(
                                        route('payroll.generate'),
                                        { month: selectedMonth, year: selectedYear },
                                        { preserveScroll: true }
                                    );
                                }}
                                className="h-10 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Calculator className="size-4" />
                                <span>Generate / Process Payroll Batch</span>
                            </button>
                        )}

                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
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
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 hover:border-blue-300 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                            <span>Net Payable Batch</span>
                            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                                <BadgeDollarSign className="size-4" />
                            </div>
                        </div>
                        <div className="text-xl font-extrabold text-slate-900 dark:text-white pt-1">
                            PKR {Number(summary.total_net).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">After deductions and bonuses</p>
                    </div>

                    {/* Total Paid */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 hover:border-emerald-300 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                            <span>Total Disbursed (Paid)</span>
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                                <BadgeCheck className="size-4" />
                            </div>
                        </div>
                        <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 pt-1">
                            PKR {Number(summary.total_paid).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Salaries marked as paid</p>
                    </div>

                    {/* Total Outstanding */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 hover:border-rose-300 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                            <span>Remaining Outstanding</span>
                            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                                <Clock className="size-4" />
                            </div>
                        </div>
                        <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 pt-1">
                            PKR {Number(summary.total_unpaid).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">Pending monthly disbursements</p>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search employee by name or staff code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>
                </div>

                {/* Batch Payslip Selection Banner */}
                {hasPermission(authUser, 'print-payslips') && selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-2xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-3 text-xs font-extrabold">
                            <span className="h-7 px-3 rounded-lg bg-indigo-600 text-white font-mono text-xs flex items-center justify-center">
                                {selectedIds.length}
                            </span>
                            <span>Selected Staff Payslips for Batch Print / PDF</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="h-9 px-3 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                            >
                                Clear Selection
                            </button>
                            <a
                                href={route('payroll.payslips-bulk', { ids: selectedIds.join(',') })}
                                target="_blank"
                                rel="noreferrer"
                                className="h-10 px-4 rounded-xl bg-[#003796] hover:bg-[#002a75] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer"
                            >
                                <Printer className="size-4" />
                                <span>Print / Download Selected Payslips ({selectedIds.length})</span>
                            </a>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    {hasPermission(authUser, 'print-payslips') && (
                                        <th className="px-4 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="size-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Base Salary</th>
                                    <th className="px-6 py-4">Days / Leaves</th>
                                    <th className="px-6 py-4">Deductions & Bonuses</th>
                                    <th className="px-6 py-4">Net Payable (PKR)</th>
                                    <th className="px-6 py-4">Disbursement Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payrolls.data.length > 0 ? (
                                    payrolls.data.map((item) => {
                                        const isPaid = item.payment_status === 'paid';
                                        const isChecked = selectedIds.includes(item.id);

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                {/* Checkbox */}
                                                {hasPermission(authUser, 'print-payslips') && (
                                                    <td className="px-4 py-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => handleSelectRow(item.id)}
                                                            className="size-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                                        />
                                                    </td>
                                                )}

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

                                                {/* Disbursement Status & Date/Time */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isPaid ? (
                                                        <div className="space-y-1">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                <Lock className="size-3 text-emerald-600" />
                                                                <span>Paid & Locked</span>
                                                            </span>
                                                            {item.payment_date && (
                                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block tracking-tight">
                                                                    {item.payment_date}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                            <Clock className="size-3 text-rose-500" />
                                                            <span>Unpaid (Pending)</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Print Payslip Button */}
                                                        {hasPermission(authUser, 'print-payslips') && (
                                                            <a
                                                                href={route('payroll.payslip', item.id)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="h-8 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white transition-all text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-blue-600/15 cursor-pointer"
                                                                title="Print / Download Salary Slip"
                                                            >
                                                                <Printer className="size-3.5" />
                                                                <span>Payslip</span>
                                                            </a>
                                                        )}

                                                        {/* Mark Paid Button with Confirmation Modal Trigger (Irreversible) */}
                                                        {!isPaid ? (
                                                            hasPermission(authUser, 'manage-payroll-status') && (
                                                                <button
                                                                    onClick={() => handleOpenConfirmPayModal(item)}
                                                                    className="h-8 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all text-xs font-extrabold inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                                                                    title="Mark Salary as Paid"
                                                                >
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    <span>Mark Paid</span>
                                                                </button>
                                                            )
                                                        ) : (
                                                            <span className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 select-none" title="Payment Complete & Locked">
                                                                <ShieldCheck className="size-4" />
                                                            </span>
                                                        )}

                                                        {/* Edit Modal Button */}
                                                        {!isPaid && hasPermission(authUser, 'edit-payroll') && (
                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                title="Recalculate / Adjust Payroll"
                                                            >
                                                                <Edit2 className="size-3.5" />
                                                            </button>
                                                        )}

                                                        {/* Delete Button */}
                                                        {!isPaid && hasPermission(authUser, 'delete-payroll') && (
                                                            <button
                                                                onClick={() => handleDelete(item)}
                                                                className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                title="Delete Payroll Record"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={hasPermission(authUser, 'print-payslips') ? 8 : 7} className="px-6 py-12 text-center text-slate-400 italic">
                                            No payroll records found for this period. Click "Generate / Process Payroll Batch" to create records.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination meta={payrolls} />
                </div>

                {/* EDIT PAYROLL MODAL */}
                {isModalOpen && editingPayroll && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#003796] dark:text-blue-400">
                                        <Calculator className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                            Adjust Payroll: {editingPayroll.employee.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Base PKR Salary: <strong className="text-slate-900 dark:text-white">PKR {Number(editingPayroll.base_salary_pkr).toLocaleString()}</strong>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmitUpdate} noValidate className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Total Working Days *
                                        </Label>
                                        <Input
                                            type="number"
                                            value={form.data.total_working_days}
                                            onChange={(e) => form.setData('total_working_days', e.target.value)}
                                            required
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Leaves Taken (Days) *
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={form.data.leaves_taken}
                                            onChange={(e) => form.setData('leaves_taken', e.target.value)}
                                            required
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Allowed Paid Leaves *
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={form.data.allowed_paid_leaves}
                                            onChange={(e) => form.setData('allowed_paid_leaves', e.target.value)}
                                            required
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Performance Bonus (PKR)
                                        </Label>
                                        <Input
                                            type="number"
                                            value={form.data.bonuses_pkr}
                                            onChange={(e) => form.setData('bonuses_pkr', e.target.value)}
                                            placeholder="0"
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Other Deductions (PKR)
                                    </Label>
                                    <Input
                                        type="number"
                                        value={form.data.other_deductions_pkr}
                                        onChange={(e) => form.setData('other_deductions_pkr', e.target.value)}
                                        placeholder="0"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-rose-600 dark:text-rose-400"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Adjustment Notes / Remarks
                                    </Label>
                                    <Input
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                        placeholder="e.g. Approved overtime allowance or advance deduction..."
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                                    />
                                </div>

                                {/* Modal Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        className="h-10 px-4 rounded-xl text-xs font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {form.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Recalculating...</span>
                                            </>
                                        ) : (
                                            <span>Recalculate & Save Payroll</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* PAYMENT CONFIRMATION MODAL (IRREVERSIBLE PAID LOCK) */}
                {isConfirmPayModalOpen && payingPayroll && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-200 my-8">
                            <div className="size-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                                <CheckCircle2 className="size-7" />
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    Confirm Salary Payment Disbursal?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Confirm marking monthly salary as PAID for staff member:
                                </p>
                            </div>

                            {/* Details Box */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-left space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-semibold">Employee:</span>
                                    <span className="font-extrabold text-slate-900 dark:text-white">{payingPayroll.employee.name} ({payingPayroll.employee.employee_code})</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400 font-semibold">Period:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{monthLabel} {payingPayroll.year}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <span className="text-slate-400 font-semibold">Net Payable:</span>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                        PKR {Number(payingPayroll.net_salary_pkr).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Alert Warning Box */}
                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-left flex items-start gap-2.5">
                                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 leading-snug">
                                    <strong>Irreversible Action:</strong> Once confirmed as PAID, this transaction will be locked with date/timestamp and cannot be changed back to unpaid.
                                </p>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsConfirmPayModalOpen(false)}
                                    disabled={isProcessingPayment}
                                    className="h-10 px-4 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleConfirmPayment}
                                    disabled={isProcessingPayment}
                                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                >
                                    {isProcessingPayment ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Disbursing Payment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="size-4" />
                                            <span>Confirm & Mark as PAID</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {deletingPayroll && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingPayroll(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Payroll Record?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete the payroll record for <strong className="text-slate-900 dark:text-white">"{deletingPayroll.employee.name}"</strong> ({monthsList.find((m) => m.value === deletingPayroll.month)?.label} {deletingPayroll.year})? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingPayroll(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Record</span>
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
