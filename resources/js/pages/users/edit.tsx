import SearchableSelect from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building,
    Camera,
    Check,
    KeyRound,
    LoaderCircle,
    Mail,
    Shield,
    User,
    UserCheck,
    UserCog,
} from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

interface RoleItem {
    id: number;
    name: string;
}

interface ClientOption {
    id: number;
    name: string;
    company_name?: string | null;
    client_code?: string | null;
    has_user?: boolean;
}

interface EmployeeOption {
    id: number;
    name: string;
    employee_code?: string | null;
    email?: string | null;
    has_user?: boolean;
}

interface UserItemData {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    type: 'admin' | 'client' | 'employee';
    is_active: boolean;
    client_id: number | null;
    employee_id: number | null;
    roles: string[];
}

interface UserEditProps {
    userItem: UserItemData;
    roles: RoleItem[];
    clients?: ClientOption[];
    employees?: EmployeeOption[];
}

export default function UserEdit({ userItem, roles = [], clients = [], employees = [] }: UserEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'User Management',
            href: '/users',
        },
        {
            title: `Edit ${userItem.name}`,
            href: `/users/edit/${userItem.id}`,
        },
    ];

    const [avatarPreview, setAvatarPreview] = useState<string | null>(userItem.avatar);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const clientOptions = (clients || []).map((c) => {
        const isCurrentClient = String(c.id) === String(userItem.client_id);
        const isLinkedToOther = Boolean(c.has_user) && !isCurrentClient;
        return {
            value: c.id,
            label: isLinkedToOther ? `${c.name} (Linked to another user)` : c.name,
            subLabel: c.client_code ? `Code: ${c.client_code}` : undefined,
            disabled: isLinkedToOther,
        };
    });

    const employeeOptions = (employees || []).map((e) => {
        const isCurrentEmployee = String(e.id) === String(userItem.employee_id);
        const isLinkedToOther = Boolean(e.has_user) && !isCurrentEmployee;
        return {
            value: e.id,
            label: isLinkedToOther ? `${e.name} (Linked to another user)` : e.name,
            subLabel: e.employee_code ? `Code: ${e.employee_code}` : undefined,
            disabled: isLinkedToOther,
        };
    });

    const form = useForm({
        _method: 'post',
        name: userItem.name,
        email: userItem.email,
        password: '',
        type: userItem.type || 'admin',
        is_active: userItem.is_active ?? true,
        client_id: (userItem.client_id || '') as string | number,
        employee_id: (userItem.employee_id || '') as string | number,
        roles: (userItem.roles || []) as string[],
        avatar: null as File | null,
        remove_avatar: false as boolean,
    });

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData((prev) => ({
                ...prev,
                avatar: file,
                remove_avatar: false,
            }));
            setAvatarPreview(URL.createObjectURL(file));
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
        form.post(route('users.update', userItem.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${userItem.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header matching Standard */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                USER #{userItem.id}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Edit {userItem.name}
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Modify account details, password, login status, linked profile, and Spatie roles.
                        </p>
                    </div>

                    <Link
                        href={route('users.index')}
                        className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Users Directory</span>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    {/* Section 1: Personal Credentials & Identity */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#003796] dark:text-blue-400">
                                <User className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Personal Identity & Credentials
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Full name, email address, password update, and profile photo.
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
                                        <span>{avatarPreview ? 'Change Photo' : 'Upload User Photo'}</span>
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
                                {form.errors.avatar && <p className="text-xs font-semibold text-rose-500">{form.errors.avatar}</p>}
                            </div>

                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="user_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Full Name *
                                </Label>
                                <Input
                                    id="user_name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    required
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                        form.errors.name
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                />
                                {form.errors.name && <p className="text-xs font-semibold text-rose-500">{form.errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="user_email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Email Address *
                                </Label>
                                <Input
                                    id="user_email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    required
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                        form.errors.email
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                />
                                {form.errors.email && <p className="text-xs font-semibold text-rose-500">{form.errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="user_password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Password (Leave blank to keep current)
                                </Label>
                                <Input
                                    id="user_password"
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white transition-all ${
                                        form.errors.password
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                />
                                {form.errors.password && <p className="text-xs font-semibold text-rose-500">{form.errors.password}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Account Type & Status Assignment */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <UserCog className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Account Classification & Status
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Specify user account category, active login toggle, and linked client/employee.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    User Account Type *
                                </Label>
                                <select
                                    value={form.data.type}
                                    onChange={(e) => form.setData('type', e.target.value as any)}
                                    className={`w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white transition-all focus:outline-none ${
                                        form.errors.type
                                            ? 'border border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                >
                                    <option value="admin">Admin / System Staff</option>
                                    <option value="employee">Employee Account</option>
                                    <option value="client">Client Portal Account</option>
                                </select>
                                {form.errors.type && <p className="text-xs font-semibold text-rose-500">{form.errors.type}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Login Account Status *
                                </Label>
                                <select
                                    value={form.data.is_active ? '1' : '0'}
                                    onChange={(e) => form.setData('is_active', e.target.value === '1')}
                                    className={`w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white transition-all focus:outline-none ${
                                        form.errors.is_active
                                            ? 'border border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                                >
                                    <option value="1">Active (Allowed to Login)</option>
                                    <option value="0">Inactive (Blocked from Login)</option>
                                </select>
                                {form.errors.is_active && <p className="text-xs font-semibold text-rose-500">{form.errors.is_active}</p>}
                            </div>
                        </div>

                        {/* Conditional Client Selector */}
                        {form.data.type === 'client' && (
                            <div className="space-y-1.5 max-w-xl">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Linked Client Profile *
                                </Label>
                                <SearchableSelect
                                    options={clientOptions}
                                    value={form.data.client_id}
                                    onChange={(val) => form.setData('client_id', val)}
                                    placeholder="Select Client Company..."
                                    searchPlaceholder="Search client..."
                                    hasError={Boolean(form.errors.client_id)}
                                    triggerClassName="h-11"
                                />
                                {form.errors.client_id && <p className="text-xs font-semibold text-rose-500">{form.errors.client_id}</p>}
                            </div>
                        )}

                        {/* Conditional Employee Selector */}
                        {form.data.type === 'employee' && (
                            <div className="space-y-1.5 max-w-xl">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Linked Employee Profile *
                                </Label>
                                <SearchableSelect
                                    options={employeeOptions}
                                    value={form.data.employee_id}
                                    onChange={(val) => form.setData('employee_id', val)}
                                    placeholder="Select Employee..."
                                    searchPlaceholder="Search employee..."
                                    hasError={Boolean(form.errors.employee_id)}
                                    triggerClassName="h-11"
                                />
                                {form.errors.employee_id && <p className="text-xs font-semibold text-rose-500">{form.errors.employee_id}</p>}
                            </div>
                        )}
                    </div>

                    {/* Section 3: Spatie Roles Assignment */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                <Shield className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Assign System Roles
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Assign one or more Spatie system roles for permission access control.
                                </p>
                            </div>
                        </div>

                        {roles.length > 0 ? (
                            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border transition-all ${
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
                                            className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold cursor-pointer transition-all border ${isChecked
                                                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-2xs'
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
                        ) : (
                            <p className="text-xs text-slate-400 italic">No roles configured in system.</p>
                        )}
                        {form.errors.roles && <p className="text-xs font-semibold text-rose-500">{form.errors.roles}</p>}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-end gap-4 pt-4 pb-12 border-t border-slate-200/80 dark:border-slate-800">
                        <Link
                            href={route('users.index')}
                            className="h-10 px-5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center shadow-2xs"
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                        >
                            {form.processing ? (
                                <div className="flex items-center gap-2">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Updating User Account...</span>
                                </div>
                            ) : (
                                <span>Update User Account</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
