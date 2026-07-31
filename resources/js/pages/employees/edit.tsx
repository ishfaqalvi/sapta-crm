import SearchableSelect from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeDollarSign,
    Building2,
    Calendar,
    Camera,
    CreditCard,
    GitBranch,
    LoaderCircle,
    Mail,
    Phone,
    User,
    UserCog,
} from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

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

interface EmployeeEditProps {
    employee: EmployeeItem;
    departments: DepartmentSimple[];
    designations: DesignationSimple[];
    users: UserSimple[];
}

export default function EmployeeEdit({ employee, departments, designations, users }: EmployeeEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'HR & Operations',
            href: '/employees',
        },
        {
            title: 'Employee Directory',
            href: '/employees',
        },
        {
            title: `Edit ${employee.name}`,
            href: `/employees/${employee.id}/edit`,
        },
    ];

    const [avatarPreview, setAvatarPreview] = useState<string | null>(employee.avatar);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        _method: 'put',
        name: employee.name,
        email: employee.email,
        phone: employee.phone || '',
        joining_date: employee.joining_date || '',
        department_id: (employee.department_id || '') as string | number,
        sub_department_id: (employee.sub_department_id || '') as string | number,
        designation_id: (employee.designation_id || '') as string | number,
        user_id: (employee.user_id || '') as string | number,
        employment_type: employee.employment_type,
        base_salary_pkr: employee.base_salary_pkr as number | string,
        allowed_paid_leaves: employee.allowed_paid_leaves as number | string,
        bank_name: employee.bank_name || '',
        account_number: employee.account_number || '',
        iban: employee.iban || '',
        emergency_contact: employee.emergency_contact || '',
        notes: employee.notes || '',
        status: employee.status,
        avatar: null as File | null,
        remove_avatar: false as boolean,
    });

    const selectedDeptModel = departments.find(
        (d) => String(d.id) === String(form.data.department_id)
    );
    const availableSubDepts = selectedDeptModel ? selectedDeptModel.sub_departments : [];

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData((prev) => ({
                ...prev,
                avatar: file,
                remove_avatar: false,
            }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        form.setData((prev) => ({
            ...prev,
            avatar: null,
            remove_avatar: true,
        }));
        setAvatarPreview(null);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('employees.update', employee.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Employee - ${employee.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header with Back Link on Right */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Edit Staff Profile: {employee.name}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-extrabold border border-blue-200 dark:border-blue-800">
                                {employee.employee_code}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Update employee personal details, organizational roles, PKR compensation, and banking info.
                        </p>
                    </div>

                    <Link
                        href={route('employees.index')}
                        className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Directory</span>
                    </Link>
                </div>

                <form noValidate onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Photo & Personal Information */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <User className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Personal & Contact Details
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Staff identity, photo upload (optional), and contact information.
                                </p>
                            </div>
                        </div>

                        {/* Photo Upload Tile (Optional) */}
                        <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 max-w-xl">
                            <div className="relative size-16 rounded-2xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold text-xl flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-slate-200/40">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview" className="size-full object-cover" />
                                ) : (
                                    <User className="size-7 text-white/80" />
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={avatarInputRef}
                                        onChange={handleAvatarChange}
                                        accept="image/*"
                                        className="hidden"
                                        id="emp-photo-upload-edit"
                                    />
                                    <label
                                        htmlFor="emp-photo-upload-edit"
                                        className="h-9 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer inline-flex items-center gap-2 transition-colors shadow-2xs"
                                    >
                                        <Camera className="size-4 text-blue-600" />
                                        <span>Change Photo (Optional)</span>
                                    </label>

                                    {avatarPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="h-9 px-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors"
                                        >
                                            Remove Photo
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Supported formats: JPG, PNG, WEBP (Max 4MB).</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="emp_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Full Name *
                                </Label>
                                <Input
                                    id="emp_name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Sadiq Khan"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                                />
                                {form.errors.name && <p className="text-xs font-semibold text-rose-500">{form.errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="emp_email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Email Address *
                                </Label>
                                <Input
                                    id="emp_email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    placeholder="sadiq@company.com"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                                />
                                {form.errors.email && <p className="text-xs font-semibold text-rose-500">{form.errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="emp_phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Phone Number (Optional)
                                </Label>
                                <Input
                                    id="emp_phone"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    placeholder="+92 300 1234567"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="emp_emergency" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Emergency Contact *
                                </Label>
                                <Input
                                    id="emp_emergency"
                                    value={form.data.emergency_contact}
                                    onChange={(e) => form.setData('emergency_contact', e.target.value)}
                                    placeholder="+92 321 9876543"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all"
                                />
                                {form.errors.emergency_contact && <p className="text-xs font-semibold text-rose-500">{form.errors.emergency_contact}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Department & Position Assignment */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <Building2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Department & Organizational Position
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Assign staff to departments, sub-units, designations, and set employment status.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department *</Label>
                                <SearchableSelect
                                    options={departments.map((d) => ({
                                        value: d.id,
                                        label: d.name,
                                    }))}
                                    value={form.data.department_id}
                                    onChange={(val) => form.setData('department_id', val)}
                                    placeholder="Search department..."
                                    searchPlaceholder="Search dept..."
                                    required
                                />
                                {form.errors.department_id && <p className="text-xs font-semibold text-rose-500">{form.errors.department_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sub-Department *</Label>
                                <SearchableSelect
                                    options={availableSubDepts.map((sub) => ({
                                        value: sub.id,
                                        label: sub.name,
                                    }))}
                                    value={form.data.sub_department_id}
                                    onChange={(val) => form.setData('sub_department_id', val)}
                                    placeholder="Search sub-unit..."
                                    searchPlaceholder="Search sub-unit..."
                                    required
                                />
                                {form.errors.sub_department_id && <p className="text-xs font-semibold text-rose-500">{form.errors.sub_department_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Designation / Role *</Label>
                                <SearchableSelect
                                    options={designations.map((desig) => ({
                                        value: desig.id,
                                        label: desig.name,
                                    }))}
                                    value={form.data.designation_id}
                                    onChange={(val) => form.setData('designation_id', val)}
                                    placeholder="Search position..."
                                    searchPlaceholder="Search position..."
                                    required
                                />
                                {form.errors.designation_id && <p className="text-xs font-semibold text-rose-500">{form.errors.designation_id}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="emp_joining_edit" className="text-xs font-bold text-slate-700 dark:text-slate-300">Joining Date *</Label>
                                <Input
                                    id="emp_joining_edit"
                                    type="date"
                                    value={form.data.joining_date}
                                    onChange={(e) => form.setData('joining_date', e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                />
                                {form.errors.joining_date && <p className="text-xs font-semibold text-rose-500">{form.errors.joining_date}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Employment Type *</Label>
                                <select
                                    value={form.data.employment_type}
                                    onChange={(e) => form.setData('employment_type', e.target.value as any)}
                                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                >
                                    <option value="full_time">Full Time</option>
                                    <option value="part_time">Part Time</option>
                                    <option value="contract">Contract</option>
                                    <option value="intern">Intern</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Staff Status *</Label>
                                <select
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value as any)}
                                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                >
                                    <option value="active">Active Staff</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="resigned">Resigned</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Salary PKR & Payroll Settings */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <BadgeDollarSign className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Compensation & Monthly Payroll Configuration (PKR)
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Monthly base PKR salary and leave allowance for salary calculations.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="emp_salary_edit" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Base Monthly Salary (PKR) *
                                </Label>
                                <Input
                                    id="emp_salary_edit"
                                    type="number"
                                    value={form.data.base_salary_pkr}
                                    onChange={(e) => form.setData('base_salary_pkr', e.target.value)}
                                    placeholder="e.g. 150000"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-extrabold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                                />
                                {form.errors.base_salary_pkr && (
                                    <p className="text-xs font-semibold text-rose-500">{form.errors.base_salary_pkr}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="emp_leaves_edit" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Allowed Paid Leaves / Month *
                                </Label>
                                <Input
                                    id="emp_leaves_edit"
                                    type="number"
                                    step="0.5"
                                    value={form.data.allowed_paid_leaves}
                                    onChange={(e) => form.setData('allowed_paid_leaves', e.target.value)}
                                    placeholder="e.g. 1.5 or 2"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-600 transition-all"
                                />
                                {form.errors.allowed_paid_leaves && (
                                    <p className="text-xs font-semibold text-rose-500">{form.errors.allowed_paid_leaves}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Banking Information (Optional) */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                <CreditCard className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Banking & Payout Account Details (Optional)
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Bank name, account number, and IBAN for direct salary disbursement.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="emp_bank_edit" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Bank Name (Optional)
                                </Label>
                                <Input
                                    id="emp_bank_edit"
                                    value={form.data.bank_name}
                                    onChange={(e) => form.setData('bank_name', e.target.value)}
                                    placeholder="e.g. Meezan Bank Limited"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="emp_account_edit" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Account Number (Optional)
                                </Label>
                                <Input
                                    id="emp_account_edit"
                                    value={form.data.account_number}
                                    onChange={(e) => form.setData('account_number', e.target.value)}
                                    placeholder="0101-010203040506"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="emp_iban_edit" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    IBAN Code (Optional)
                                </Label>
                                <Input
                                    id="emp_iban_edit"
                                    value={form.data.iban}
                                    onChange={(e) => form.setData('iban', e.target.value)}
                                    placeholder="PK36MEZN00010102..."
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-end gap-4 pt-4 pb-12 border-t border-slate-200/80 dark:border-slate-800">
                        <Link
                            href={route('employees.index')}
                            className="h-12 px-6 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center shadow-2xs"
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-12 px-8 text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                        >
                            {form.processing ? (
                                <div className="flex items-center gap-2">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Updating Employee Profile...</span>
                                </div>
                            ) : (
                                <span>Update Employee Profile</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
