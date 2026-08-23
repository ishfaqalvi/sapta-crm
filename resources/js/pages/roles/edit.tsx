import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Key,
    LoaderCircle,
    Search,
    Shield,
    X,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface RoleItemData {
    id: number;
    name: string;
    guard_name: string;
    is_core_role?: boolean;
    permissions: string[];
}

interface PermissionItem {
    id: number;
    name: string;
}

interface PermissionGroup {
    key: 'admin' | 'portal';
    title: string;
    description: string;
    modules: Record<string, PermissionItem[]>;
    total_count: number;
}

interface RoleEditProps {
    role: RoleItemData;
    permissions: PermissionItem[];
    groupedPermissions: Record<string, PermissionItem[]>;
    permissionGroups?: {
        admin: PermissionGroup;
        portal: PermissionGroup;
    };
}

// Helper to format permission slug into Title Case (e.g. view-clients -> View Clients)
const formatPermissionName = (name: string) => {
    return name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function RoleEdit({
    role,
    permissions = [],
    groupedPermissions = {},
    permissionGroups,
}: RoleEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Roles & Permissions',
            href: '/roles',
        },
        {
            title: `Edit ${role.name}`,
            href: `/roles/edit/${role.id}`,
        },
    ];

    const [activeGroupTab, setActiveGroupTab] = useState<'admin' | 'portal'>('admin');
    const [permissionSearch, setPermissionSearch] = useState('');

    const form = useForm({
        name: role.name,
        permissions: (role.permissions || []) as string[],
    });

    const adminModules = permissionGroups?.admin?.modules || Object.fromEntries(
        Object.entries(groupedPermissions).filter(
            ([, perms]) => Array.isArray(perms) && perms.some((p) => !p.name.includes('client-portal'))
        )
    );

    const portalModules = permissionGroups?.portal?.modules || Object.fromEntries(
        Object.entries(groupedPermissions).filter(
            ([, perms]) => Array.isArray(perms) && perms.some((p) => p.name.includes('client-portal'))
        )
    );

    // Toggle single permission checkbox
    const handleTogglePermission = (permissionName: string) => {
        const current = form.data.permissions;
        if (current.includes(permissionName)) {
            form.setData(
                'permissions',
                current.filter((p) => p !== permissionName)
            );
        } else {
            form.setData('permissions', [...current, permissionName]);
        }
    };

    // Toggle all permissions inside a module
    const handleToggleModule = (modulePermissions: PermissionItem[]) => {
        const moduleNames = modulePermissions.map((p) => p.name);
        const allSelected = moduleNames.every((p) => form.data.permissions.includes(p));

        if (allSelected) {
            form.setData(
                'permissions',
                form.data.permissions.filter((p) => !moduleNames.includes(p))
            );
        } else {
            const unique = new Set([...form.data.permissions, ...moduleNames]);
            form.setData('permissions', Array.from(unique));
        }
    };

    // Select / Deselect all permissions in active group
    const handleToggleEntireGroup = (modules: Record<string, PermissionItem[]>) => {
        const groupAllPerms: string[] = [];
        Object.values(modules).forEach((perms) => {
            perms.forEach((p) => groupAllPerms.push(p.name));
        });

        const isAllGroupSelected =
            groupAllPerms.length > 0 && groupAllPerms.every((p) => form.data.permissions.includes(p));

        if (isAllGroupSelected) {
            form.setData(
                'permissions',
                form.data.permissions.filter((p) => !groupAllPerms.includes(p))
            );
        } else {
            const unique = new Set([...form.data.permissions, ...groupAllPerms]);
            form.setData('permissions', Array.from(unique));
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(route('roles.update', role.id));
    };

    const adminPermNames = Object.values(adminModules).flatMap((m) => m.map((p) => p.name));
    const portalPermNames = Object.values(portalModules).flatMap((m) => m.map((p) => p.name));

    const selectedAdminCount = form.data.permissions.filter((p) => adminPermNames.includes(p)).length;
    const selectedPortalCount = form.data.permissions.filter((p) => portalPermNames.includes(p)).length;

    const currentActiveModules = activeGroupTab === 'admin' ? adminModules : portalModules;
    const currentGroupPermNames = activeGroupTab === 'admin' ? adminPermNames : portalPermNames;
    const isCurrentGroupAllSelected =
        currentGroupPermNames.length > 0 && currentGroupPermNames.every((p) => form.data.permissions.includes(p));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Role: ${role.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header matching Standard Design */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                ROLE #{role.id}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Edit Role: {role.name}
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Modify role title and update granular access permissions across Admin Panel & Client Portal.
                        </p>
                    </div>

                    <Link
                        href={route('roles.index')}
                        className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Roles Directory</span>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    {/* Section 1: Role Identity */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#003796] dark:text-blue-400">
                                <Key className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Role Identification & Title
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Update role title identifier. Guard: <code className="font-mono text-slate-600 dark:text-slate-300">{role.guard_name}</code>
                                </p>
                            </div>
                        </div>

                        <div className="max-w-2xl space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="role_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Role Name / Title <span className="text-rose-500">*</span>
                                </Label>
                                {role.is_core_role && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-200/60 dark:border-amber-800/60">
                                        Core System Role (Title Immutable)
                                    </span>
                                )}
                            </div>
                            <Input
                                id="role_name"
                                type="text"
                                value={form.data.name}
                                onChange={(e) => !role.is_core_role && form.setData('name', e.target.value)}
                                readOnly={Boolean(role.is_core_role)}
                                disabled={Boolean(role.is_core_role)}
                                required
                                className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                    role.is_core_role
                                        ? 'opacity-75 cursor-not-allowed border-slate-200 dark:border-slate-800'
                                        : form.errors.name
                                        ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                        : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                }`}
                            />
                            {form.errors.name && (
                                <p className="text-xs text-rose-500 font-semibold">{form.errors.name}</p>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Permission Matrix Assignment */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                    <Shield className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Assign Access Permissions
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Toggle permissions for Admin CRM modules and Client Portal modules.
                                    </p>
                                </div>
                            </div>

                            <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                                Total Selected:{' '}
                                <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                                    {form.data.permissions.length}
                                </span>{' '}
                                / {permissions.length}
                            </div>
                        </div>

                        {/* High-Level Category Tabs */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200/60 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setActiveGroupTab('admin')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${activeGroupTab === 'admin'
                                        ? 'bg-[#003796] text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <span>🛡️ Admin Panel Permissions</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${activeGroupTab === 'admin'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                            }`}
                                    >
                                        {selectedAdminCount}/{adminPermNames.length}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveGroupTab('portal')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${activeGroupTab === 'portal'
                                        ? 'bg-[#003796] text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <span>🌐 Client Portal Permissions</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${activeGroupTab === 'portal'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                            }`}
                                    >
                                        {selectedPortalCount}/{portalPermNames.length}
                                    </span>
                                </button>
                            </div>

                            {/* Quick Select All / Deselect All for Active Group */}
                            <div className="flex items-center gap-2 px-1">
                                <button
                                    type="button"
                                    onClick={() => handleToggleEntireGroup(currentActiveModules)}
                                    className="h-9 px-3.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                                >
                                    {isCurrentGroupAllSelected
                                        ? `Deselect All ${activeGroupTab === 'admin' ? 'Admin' : 'Portal'}`
                                        : `Select All ${activeGroupTab === 'admin' ? 'Admin' : 'Portal'}`}
                                </button>
                            </div>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder={`Filter ${activeGroupTab === 'admin' ? 'Admin Panel' : 'Client Portal'
                                    } permissions or module names...`}
                                value={permissionSearch}
                                onChange={(e) => setPermissionSearch(e.target.value)}
                                className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 pl-10 pr-9 font-medium"
                            />
                            {permissionSearch && (
                                <button
                                    type="button"
                                    onClick={() => setPermissionSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Modules Grid for Active Group - 3 Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {Object.entries(currentActiveModules)
                                .filter(([moduleTitle, modulePerms]) => {
                                    if (!permissionSearch) return modulePerms && modulePerms.length > 0;
                                    const search = permissionSearch.toLowerCase();
                                    const matchesTitle = moduleTitle.toLowerCase().includes(search);
                                    const matchesPerm = modulePerms.some((p) =>
                                        p.name.toLowerCase().includes(search)
                                    );
                                    return matchesTitle || matchesPerm;
                                })
                                .map(([moduleTitle, modulePerms]) => {
                                    const filteredPerms = permissionSearch
                                        ? modulePerms.filter(
                                            (p) =>
                                                p.name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
                                                moduleTitle.toLowerCase().includes(permissionSearch.toLowerCase())
                                        )
                                        : modulePerms;

                                    const moduleNames = modulePerms.map((p) => p.name);
                                    const isAllSelected =
                                        moduleNames.length > 0 &&
                                        moduleNames.every((p) => form.data.permissions.includes(p));

                                    return (
                                        <div
                                            key={moduleTitle}
                                            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-2.5 shadow-2xs flex flex-col justify-between"
                                        >
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                        {moduleTitle}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0">
                                                        {
                                                            modulePerms.filter((p) =>
                                                                form.data.permissions.includes(p.name)
                                                            ).length
                                                        }
                                                        /{modulePerms.length}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleModule(modulePerms)}
                                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors cursor-pointer shrink-0 ml-1"
                                                >
                                                    {isAllSelected ? 'Deselect' : 'Select All'}
                                                </button>
                                            </div>

                                            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                                {filteredPerms.map((permission) => {
                                                    const isChecked = form.data.permissions.includes(permission.name);
                                                    return (
                                                        <label
                                                            key={permission.name}
                                                            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 select-none ${isChecked
                                                                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-300 font-bold shadow-2xs'
                                                                : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() =>
                                                                    handleTogglePermission(permission.name)
                                                                }
                                                                className="size-3.5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 accent-blue-600 shrink-0 cursor-pointer"
                                                            />
                                                            <span className="text-[11px] leading-tight tracking-tight">
                                                                {formatPermissionName(permission.name)}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-end gap-4 pt-4 pb-12 border-t border-slate-200/80 dark:border-slate-800">
                        <Link
                            href={route('roles.index')}
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
                                    <span>Updating Role...</span>
                                </div>
                            ) : (
                                <span>Update Role & Permissions</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
