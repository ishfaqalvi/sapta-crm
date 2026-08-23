import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Printer,
} from 'lucide-react';

const monthsList = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

interface EmployeeData {
    id: number;
    employee_code: string;
    name: string;
    email: string;
    phone: string | null;
    joining_date: string | null;
    bank_name: string | null;
    account_number: string | null;
    iban: string | null;
    department: { name: string } | null;
    subDepartment: { name: string } | null;
    designation: { name: string } | null;
}

interface PayrollData {
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
    employee: EmployeeData;
}

interface BulkPayslipProps {
    payrolls: PayrollData[];
}

export default function BulkPayslips({ payrolls }: BulkPayslipProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Monthly Payroll',
            href: '/payroll',
        },
        {
            title: `Batch Payslips (${payrolls.length} Records)`,
            href: '#',
        },
    ];

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        const cleanStr = dateStr.includes(',') ? dateStr.split(',')[0].trim() : dateStr;
        const date = new Date(cleanStr);
        if (isNaN(date.getTime())) return cleanStr;
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Batch Salary Slips (${payrolls.length} Selected Employees)`} />

            {/* Print Styles for Single Page Fit Per Payslip */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                    body {
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    nav, header, sidebar, .print\\:hidden {
                        display: none !important;
                    }
                    .payslip-container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #ffffff !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .payslip-card-item {
                        border: 1.5px solid #cbd5e1 !important;
                        border-radius: 16px !important;
                        padding: 24px 28px !important;
                        margin: 0 0 0 0 !important;
                        box-shadow: none !important;
                        background: #ffffff !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        max-height: 275mm !important;
                        overflow: hidden !important;
                    }
                }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 payslip-container">
                {/* Standard Page Header Matching CRM Design */}
                <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 inline-flex items-center">
                                BATCH ({payrolls.length} STATEMENTS)
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Batch Salary Slips
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Print or save batch PDF salary statements for <strong className="text-slate-900 dark:text-white">{payrolls.length} selected staff members</strong>.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                        <Link
                            href={route('payroll.index')}
                            className="h-10 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                            <span>Back to Payroll</span>
                        </Link>

                        <button
                            onClick={handlePrint}
                            className="h-10 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                            <Printer className="size-4" />
                            <span>Print / Save All Selected as PDF</span>
                        </button>
                    </div>
                </div>

                {/* Payslips Container - Full Width */}
                <div className="space-y-8 print:space-y-0 w-full">
                    {payrolls.map((payroll) => {
                        const monthName = monthsList[payroll.month] || payroll.month;
                        const formattedPaymentDate = payroll.payment_date
                            ? formatDate(payroll.payment_date)
                            : 'Pending';

                        const formattedJoiningDate = formatDate(payroll.employee.joining_date);

                        return (
                            <div
                                key={payroll.id}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xl text-slate-900 payslip-card-item"
                            >
                                {/* Header: Company Logo & Document Title */}
                                <div className="flex items-start justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3.5">
                                            <img
                                                src="/logo.png"
                                                alt="SAPTA Logo"
                                                className="h-11 w-auto object-contain shrink-0"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/logo_clean.png';
                                                }}
                                            />
                                            <div>
                                                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight block leading-none">
                                                    SAPTA CRM
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                                                    Sapta Solutions & Technology Operations
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right space-y-1">
                                        <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-extrabold text-xs border border-blue-200/80 dark:border-blue-800">
                                            PAYSLIP #{payroll.year}-{String(payroll.month).padStart(2, '0')}-{payroll.id}
                                        </span>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                            {monthName} {payroll.year}
                                        </h3>
                                    </div>
                                </div>

                                {/* Employee Profile Information */}
                                <div className="grid grid-cols-2 gap-4 my-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs">
                                    <div className="space-y-1.5 pr-3 border-r border-slate-200 dark:border-slate-800">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                            Employee Information
                                        </div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">
                                            {payroll.employee.name}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[10px]">Staff Code:</span>
                                                <span className="font-extrabold text-blue-600 dark:text-blue-400">{payroll.employee.employee_code}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[10px]">Designation:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{payroll.employee.designation?.name || 'Staff Member'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[10px]">Department:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{payroll.employee.department?.name || 'Operations'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[10px]">Joining Date:</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{formattedJoiningDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Disbursement Column */}
                                    <div className="space-y-1.5 pl-1">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                            Disbursement & Banking
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600 dark:text-slate-300 font-medium text-[11px] pt-1">
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[10px]">Payment Mode:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">Direct Bank Transfer</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[10px]">Bank Name:</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{payroll.employee.bank_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[10px]">Account Number:</span>
                                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{payroll.employee.account_number || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 font-semibold block text-[10px]">Disbursement Date:</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formattedPaymentDate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Calculation Table */}
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        Earnings & Deductions Breakdown
                                    </div>

                                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                                                <tr>
                                                    <th className="px-4 py-2.5">Salary Description / Item</th>
                                                    <th className="px-4 py-2.5 text-center">Days / Rate Details</th>
                                                    <th className="px-4 py-2.5 text-right">Amount (PKR)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300 text-xs">
                                                <tr>
                                                    <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                                                        Base Monthly Gross Salary
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center text-slate-500 font-semibold">
                                                        {payroll.total_working_days} total working days
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-extrabold text-slate-900 dark:text-white">
                                                        PKR {Number(payroll.base_salary_pkr).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>

                                                {Number(payroll.bonuses_pkr) > 0 && (
                                                    <tr>
                                                        <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                                            Performance Bonus & Incentives
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-slate-400">-</td>
                                                        <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                            + PKR {Number(payroll.bonuses_pkr).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                )}

                                                <tr>
                                                    <td className="px-4 py-2.5">
                                                        <span className="font-semibold">Unpaid Leave Deductions</span>
                                                        <span className="text-[10px] text-slate-400 font-normal block">
                                                            Taken: {payroll.leaves_taken} days (Allowed: {payroll.allowed_paid_leaves} paid, Unpaid: {payroll.unpaid_leaves} days @ PKR {Number(payroll.daily_rate_pkr).toLocaleString()}/day)
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center text-slate-500 font-bold">
                                                        {payroll.unpaid_leaves} unpaid days
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                                                        {Number(payroll.leave_deduction_pkr) > 0
                                                            ? `- PKR ${Number(payroll.leave_deduction_pkr).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                            : 'PKR 0.00'}
                                                    </td>
                                                </tr>

                                                {Number(payroll.other_deductions_pkr) > 0 && (
                                                    <tr>
                                                        <td className="px-4 py-2.5 text-rose-600 dark:text-rose-400 font-bold">
                                                            Other Adjustments / Deductions
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-slate-400">-</td>
                                                        <td className="px-4 py-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                                                            - PKR {Number(payroll.other_deductions_pkr).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Net Salary Payable Banner */}
                                <div className="my-5 p-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white flex items-center justify-between gap-4 shadow-md print:bg-slate-900">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
                                            Total Net Disbursed Salary
                                        </span>
                                        <h2 className="text-2xl font-black tracking-tight mt-0.5">
                                            PKR {Number(payroll.net_salary_pkr).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </h2>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-xs text-xs font-black uppercase">
                                            <CheckCircle2 className="size-4 text-emerald-300" />
                                            <span>Status: {payroll.payment_status}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Remarks if set */}
                                {payroll.notes && (
                                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                                        <strong>Note / Remarks:</strong> {payroll.notes}
                                    </div>
                                )}

                                {/* Signatures & Verification Footer */}
                                <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                    <div>
                                        <div className="h-10 border-b border-slate-300 dark:border-slate-700 max-w-xs mx-auto mb-1.5"></div>
                                        <span>Authorized Signature (Finance Officer)</span>
                                    </div>
                                    <div>
                                        <div className="h-10 border-b border-slate-300 dark:border-slate-700 max-w-xs mx-auto mb-1.5"></div>
                                        <span>Employee Acknowledgment Signature</span>
                                    </div>
                                </div>

                                <div className="mt-4 text-center text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Computer Generated Salary Statement • SAPTA CRM System
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
