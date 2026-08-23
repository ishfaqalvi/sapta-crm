import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Edit2,
    LoaderCircle,
    Lock,
    Plus,
    ShieldCheck,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles & Permissions',
        href: '/roles',
    },
];

interface RoleItem {
    id: number;
    name: string;
    guard_name: string;
    users_count: number;
    permissions: string[];
    is_super_admin?: boolean;
    is_protected_from_delete?: boolean;
    is_protected_from_edit?: boolean;
    created_at: string;
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

interface RolesIndexProps {
    roles: RoleItem[];
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

export default function RolesIndex({
    roles = [],
    permissions = [],
    groupedPermissions = {},
    permissionGroups,
}: RolesIndexProps) {
    const user = (usePage().props.auth as any)?.user;

    // Delete Confirmation Modal State
    const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const adminPermNames = Object.values(adminModules).flatMap((m) => m.map((p) => p.name));
    const portalPermNames = Object.values(portalModules).flatMap((m) => m.map((p) => p.name));

    // Confirm Role Delete
    const handleConfirmDelete = () => {
        if (!deletingRole) return;
        setIsDeleting(true);
        router.delete(route('roles.destroy', deletingRole.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeletingRole(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    // Open Delete Confirmation Modal
    const handleOpenDeleteModal = (role: RoleItem) => {
        const isProtected = role.is_protected_from_delete ?? ['super admin', 'super-admin', 'employee', 'client'].includes(role.name.toLowerCase());
        if (isProtected) {
            return;
        }
        setDeletingRole(role);
        setIsDeleteModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles & Permissions" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                ACCESS CONTROL
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Roles & Permissions Management
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Core roles (Super Admin, Employee, Client) & custom roles with granular permission matrices.
                        </p>
                    </div>

                    {hasPermission(user, 'create-roles') && (
                        <Link
                            href={route('roles.create')}
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                        >
                            <Plus className="size-4" />
                            <span>Create New Role</span>
                        </Link>
                    )}
                </div>

                {/* Roles Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => {
                        const normalized = role.name.toLowerCase();
                        const isSuperAdmin = role.is_super_admin ?? ['super admin', 'super-admin'].includes(normalized);
                        const isProtectedFromDelete = role.is_protected_from_delete ?? ['super admin', 'super-admin', 'employee', 'client'].includes(normalized);
                        const roleDisplayName = role.name;

                        // Calculate breakdowns
                        const roleAdminCount = role.permissions.filter((p) => adminPermNames.includes(p)).length;
                        const rolePortalCount = role.permissions.filter((p) => portalPermNames.includes(p)).length;

                        return (
                            <div
                                key={role.id}
                                className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-2 rounded-xl flex items-center justify-center ${
                                                isSuperAdmin
                                                    ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                                                    : isProtectedFromDelete
                                                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                                                    : 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400'
                                            }`}>
                                                <ShieldCheck className="size-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                                                        {roleDisplayName}
                                                    </h3>
                                                    {isProtectedFromDelete && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                            Core
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    guard: {role.guard_name}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                            <Users className="size-3 text-slate-400" />
                                            <span>
                                                {role.users_count} {role.users_count === 1 ? 'User' : 'Users'}
                                            </span>
                                        </span>
                                    </div>

                                    {/* Permissions Count Badge */}
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                            <span>Attached Scope</span>
                                            <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                                                {isSuperAdmin
                                                    ? `All System Access (${permissions.length})`
                                                    : `${role.permissions.length} Total`}
                                            </span>
                                        </div>

                                        {/* Categorized Count Breakdown */}
                                        {!isSuperAdmin && (
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-500 font-bold">🛡️ Admin</span>
                                                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                                        {roleAdminCount}
                                                    </span>
                                                </div>
                                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px]">
                                                    <span className="text-slate-500 font-bold">🌐 Portal</span>
                                                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                                        {rolePortalCount}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Permission Pills Preview */}
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {isSuperAdmin ? (
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                                    ★ Full System Permissions (Bypass)
                                                </span>
                                            ) : role.permissions.length > 0 ? (
                                                role.permissions.slice(0, 4).map((p) => (
                                                    <span
                                                        key={p}
                                                        className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium"
                                                    >
                                                        {formatPermissionName(p)}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-slate-400 italic">
                                                    No permissions attached
                                                </span>
                                            )}
                                            {!isSuperAdmin && role.permissions.length > 4 && (
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    +{role.permissions.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    {isSuperAdmin ? (
                                        <div className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 select-none">
                                            <Lock className="size-3.5 text-amber-500" />
                                            <span>Locked Core Role</span>
                                        </div>
                                    ) : isProtectedFromDelete ? (
                                        /* Employee & Client: Can edit permissions, but cannot be deleted */
                                        hasPermission(user, 'edit-roles') ? (
                                            <Link
                                                href={route('roles.edit', role.id)}
                                                className="w-full h-9 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Edit2 className="size-3.5 text-blue-600 dark:text-blue-400" />
                                                <span>Edit Permissions</span>
                                            </Link>
                                        ) : (
                                            <div className="w-full h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 select-none">
                                                <Lock className="size-3.5 text-slate-400" />
                                                <span>Core Role</span>
                                            </div>
                                        )
                                    ) : (
                                        /* Custom Roles: Both Edit and Delete enabled */
                                        <>
                                            {hasPermission(user, 'edit-roles') && (
                                                <Link
                                                    href={route('roles.edit', role.id)}
                                                    className="flex-1 h-9 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                    <span>Edit Role</span>
                                                </Link>
                                            )}

                                            {hasPermission(user, 'delete-roles') && (
                                                <button
                                                    onClick={() => handleOpenDeleteModal(role)}
                                                    className="size-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900 transition-colors flex items-center justify-center cursor-pointer"
                                                    title="Delete Role"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modern Delete Confirmation Modal */}
                {isDeleteModalOpen && deletingRole && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!isDeleting) {
                                        setIsDeleteModalOpen(false);
                                        setDeletingRole(null);
                                    }
                                }}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                                    Delete User Role?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete{' '}
                                    <strong className="text-slate-900 dark:text-white">"{deletingRole.name}"</strong>?
                                    This action cannot be undone.
                                </p>
                            </div>

                            {/* Users assigned check */}
                            {deletingRole.users_count > 0 ? (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 text-left">
                                    <strong>Cannot Delete:</strong> This role is currently assigned to{' '}
                                    {deletingRole.users_count} user(s). Reassign or change their roles first.
                                </div>
                            ) : null}

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setDeletingRole(null);
                                    }}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting || deletingRole.users_count > 0}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Confirm Delete</span>
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
