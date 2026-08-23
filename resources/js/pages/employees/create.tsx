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
    Check,
    CreditCard,
    GitBranch,
    KeyRound,
    LoaderCircle,
    Mail,
    Phone,
    Shield,
    User,
    UserCheck,
    UserCog,
} from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

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
        title: 'Add New Employee',
        href: '/employees/create',
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
    type?: string;
}

interface RoleSimple {
    id: number;
    name: string;
}

interface EmployeeCreateProps {
    departments: DepartmentSimple[];
    designations: DesignationSimple[];
    users: UserSimple[];
    roles?: RoleSimple[];
}

export default function EmployeeCreate({ departments, designations, users, roles = [] }: EmployeeCreateProps) {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        name: '',
        email: '',
        phone: '',
        joining_date: new Date().toISOString().split('T')[0],
        department_id: (departments.length > 0 ? departments[0].id : '') as string | number,
        sub_department_id: '' as string | number,
        designation_id: (designations.length > 0 ? designations[0].id : '') as string | number,
        user_id: '' as string | number,
        employment_type: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'intern',
        base_salary_pkr: 50000 as number | string,
        allowed_paid_leaves: 2 as number | string,
        bank_name: '',
        account_number: '',
        iban: '',
        emergency_contact: '',
        notes: '',
        status: 'active' as 'active' | 'inactive' | 'resigned',
        avatar: null as File | null,

        // User Account creation options
        create_user_account: false as boolean,
        password: '' as string,
        roles: [] as string[],
    });

    // Available sub-departments based on selected department in form
    const selectedDeptModel = departments.find(
        (d) => String(d.id) === String(form.data.department_id)
    );
    const availableSubDepts = selectedDeptModel ? selectedDeptModel.sub_departments : [];

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('avatar', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        form.setData('avatar', null);
        setAvatarPreview(null);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
        }
    };

    const handleRoleToggle = (roleName: string) => {
        const currentRoles = [...form.data.roles];
        const index = currentRoles.indexOf(roleName);
        if (index > -1) {
            currentRoles.splice(index, 1);
        } else {
            currentRoles.push(roleName);
        }
        form.setData('roles', currentRoles);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('employees.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add New Employee Profile" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header matching Client Create Standard */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                NEW STAFF
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Add New Employee Profile
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Register new staff member, organizational details, salary PKR, and system user access.
                        </p>
                    </div>

                    <Link
                        href={route('employees.index')}
                        className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Directory</span>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    {/* Section 1: Personal & Contact Info */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#003796] dark:text-blue-400">
                                <User className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Personal & Contact Details
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Full name, email address, phone, emergency contact, and photo.
                                </p>
                            </div>
                        </div>

                        {/* Photo Upload Box */}
                        <div className={`flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border transition-all ${
                            form.errors.avatar
                                ? 'border-rose-500 ring-2 ring-rose-500/20'
                                : 'border-slate-200/80 dark:border-slate-800'
                        }`}>
                            <div className="relative size-16 rounded-2xl bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white font-extrabold text-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview" className="size-full object-cover" />
                                ) : (
                                    <User className="size-8" />
                                )}
                            </div>

                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    >
                                        <Camera className="size-3.5" />
                                        <span>{avatarPreview ? 'Change Photo' : 'Upload Employee Photo'}</span>
                                    </button>
                                    {avatarPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">JPG, PNG, GIF, WebP up to 4MB.</p>
                                {form.errors.avatar && <p className="text-xs font-semibold text-rose-500 mt-1">{form.errors.avatar}</p>}
                            </div>

                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="emp_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Full Name *
                                </Label>
                                <Input
                                    id="emp_name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Muhammad Ali"
                                    required
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${
                                        form.errors.name
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
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
                                    placeholder="ali@company.com"
                                    required
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${
                                        form.errors.email
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
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
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${
                                        form.errors.phone
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                />
                                {form.errors.phone && <p className="text-xs font-semibold text-rose-500">{form.errors.phone}</p>}
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
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${
                                        form.errors.emergency_contact
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                />
                                {form.errors.emergency_contact && <p className="text-xs font-semibold text-rose-500">{form.errors.emergency_contact}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Department & Position Assignment */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
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
                                    hasError={Boolean(form.errors.department_id)}
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
                                    hasError={Boolean(form.errors.sub_department_id)}
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
                                    hasError={Boolean(form.errors.designation_id)}
                                    required
                                />
                                {form.errors.designation_id && <p className="text-xs font-semibold text-rose-500">{form.errors.designation_id}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="emp_joining_page" className="text-xs font-bold text-slate-700 dark:text-slate-300">Joining Date *</Label>
                                <Input
                                    id="emp_joining_page"
                                    type="date"
                                    value={form.data.joining_date}
                                    onChange={(e) => form.setData('joining_date', e.target.value)}
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white transition-all ${
                                        form.errors.joining_date
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                />
                                {form.errors.joining_date && <p className="text-xs font-semibold text-rose-500">{form.errors.joining_date}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Employment Type *</Label>
                                <select
                                    value={form.data.employment_type}
                                    onChange={(e) => form.setData('employment_type', e.target.value as any)}
                                    className={`w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold text-slate-900 dark:text-white focus:outline-none transition-all ${
                                        form.errors.employment_type
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                >
                                    <option value="full_time">Full Time</option>
                                    <option value="part_time">Part Time</option>
                                    <option value="contract">Contract</option>
                                    <option value="intern">Intern</option>
                                </select>
                                {form.errors.employment_type && <p className="text-xs font-semibold text-rose-500">{form.errors.employment_type}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Staff Status *</Label>
                                <select
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value as any)}
                                    className={`w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold text-slate-900 dark:text-white focus:outline-none transition-all ${
                                        form.errors.status
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                >
                                    <option value="active">Active Staff</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="resigned">Resigned</option>
                                </select>
                                {form.errors.status && <p className="text-xs font-semibold text-rose-500">{form.errors.status}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Salary PKR & Payroll Settings */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
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
                                <Label htmlFor="emp_salary_page" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Base Monthly Salary (PKR) *
                                </Label>
                                <Input
                                    id="emp_salary_page"
                                    type="number"
                                    value={form.data.base_salary_pkr}
                                    onChange={(e) => form.setData('base_salary_pkr', e.target.value)}
                                    placeholder="e.g. 150000"
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-extrabold text-slate-900 dark:text-white transition-all ${
                                        form.errors.base_salary_pkr
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10'
                                    }`}
                                />
                                {form.errors.base_salary_pkr && (
                                    <p className="text-xs font-semibold text-rose-500">{form.errors.base_salary_pkr}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="emp_leaves_page" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Allowed Paid Leaves / Month *
                                </Label>
                                <Input
                                    id="emp_leaves_page"
                                    type="number"
                                    step="0.5"
                                    value={form.data.allowed_paid_leaves}
                                    onChange={(e) => form.setData('allowed_paid_leaves', e.target.value)}
                                    placeholder="e.g. 1.5 or 2"
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                        form.errors.allowed_paid_leaves
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10'
                                    }`}
                                />
                                {form.errors.allowed_paid_leaves && (
                                    <p className="text-xs font-semibold text-rose-500">{form.errors.allowed_paid_leaves}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: System User Account Creation */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                    <KeyRound className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        System User Login Account
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Allow this employee to log in to system with employee type account.
                                    </p>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form.data.create_user_account}
                                    onChange={(e) => form.setData('create_user_account', e.target.checked)}
                                    className="size-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600"
                                />
                                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                    Create User Login Account
                                </span>
                            </label>
                        </div>

                        {form.data.create_user_account && (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-1.5 max-w-md">
                                    <Label htmlFor="emp_user_password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Employee Login Password *
                                    </Label>
                                    <Input
                                        id="emp_user_password"
                                        type="password"
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        placeholder="Minimum 8 characters..."
                                        required={form.data.create_user_account}
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                            form.errors.password
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {form.errors.password && <p className="text-xs font-semibold text-rose-500">{form.errors.password}</p>}
                                </div>

                                {roles.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Assign System Roles for Employee
                                        </Label>
                                        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border transition-all ${
                                            form.errors.roles
                                                ? 'border-rose-500 ring-2 ring-rose-500/20'
                                                : 'border-slate-200/80 dark:border-slate-800'
                                        }`}>
                                            {roles.map((role) => {
                                                const isChecked = form.data.roles.includes(role.name);
                                                return (
                                                    <label
                                                        key={role.id}
                                                        onClick={() => handleRoleToggle(role.name)}
                                                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${isChecked
                                                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <div className={`size-4 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                                                            {isChecked && <Check className="size-3 stroke-[3]" />}
                                                        </div>
                                                        <span className="truncate">{role.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {form.errors.roles && <p className="text-xs font-semibold text-rose-500 mt-1">{form.errors.roles}</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section 5: Banking Information (Optional) */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
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
                                <Label htmlFor="emp_bank_page" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Bank Name (Optional)
                                </Label>
                                <Input
                                    id="emp_bank_page"
                                    value={form.data.bank_name}
                                    onChange={(e) => form.setData('bank_name', e.target.value)}
                                    placeholder="e.g. Meezan Bank Limited"
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${
                                        form.errors.bank_name
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10'
                                    }`}
                                />
                                {form.errors.bank_name && <p className="text-xs font-semibold text-rose-500">{form.errors.bank_name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="emp_account_page" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Account Number (Optional)
                                </Label>
                                <Input
                                    id="emp_account_page"
                                    value={form.data.account_number}
                                    onChange={(e) => form.setData('account_number', e.target.value)}
                                    placeholder="0101-010203040506"
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${
                                        form.errors.account_number
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10'
                                    }`}
                                />
                                {form.errors.account_number && <p className="text-xs font-semibold text-rose-500">{form.errors.account_number}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="emp_iban_page" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    IBAN Code (Optional)
                                </Label>
                                <Input
                                    id="emp_iban_page"
                                    value={form.data.iban}
                                    onChange={(e) => form.setData('iban', e.target.value)}
                                    placeholder="PK36MEZN00010102..."
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${
                                        form.errors.iban
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10'
                                    }`}
                                />
                                {form.errors.iban && <p className="text-xs font-semibold text-rose-500">{form.errors.iban}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-end gap-4 pt-4 pb-12 border-t border-slate-200/80 dark:border-slate-800">
                        <Link
                            href={route('employees.index')}
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center shadow-2xs"
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                        >
                            {form.processing ? (
                                <div className="flex items-center gap-2">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Saving Employee Profile...</span>
                                </div>
                            ) : (
                                <span>Save Employee Profile</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
