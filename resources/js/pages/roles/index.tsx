import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    Edit2,
    Key,
    LoaderCircle,
    Lock,
    Plus,
    ShieldCheck,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

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
    created_at: string;
}

interface PermissionItem {
    id: number;
    name: string;
}

interface RolesIndexProps {
    roles: RoleItem[];
    permissions: PermissionItem[];
    groupedPermissions: Record<string, PermissionItem[]>;
}

// Helper to format permission slug into Title Case (e.g. view-clients -> View Clients)
const formatPermissionName = (name: string) => {
    return name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function RolesIndex({ roles, permissions, groupedPermissions }: RolesIndexProps) {
    const user = (usePage().props.auth as any)?.user;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null);

    // Delete Confirmation Modal State
    const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form handling
    const form = useForm({
        name: '',
        permissions: [] as string[],
    });

    // Open Modal for Creating
    const handleCreateRole = () => {
        setEditingRole(null);
        form.setData({
            name: '',
            permissions: [],
        });
        form.clearErrors();
        setIsModalOpen(true);
    };

    // Open Modal for Editing (Super Admin disabled)
    const handleEditRole = (role: RoleItem) => {
        if (['super admin', 'super-admin'].includes(role.name.toLowerCase())) {
            return;
        }

        setEditingRole(role);
        form.setData({
            name: role.name,
            permissions: role.permissions,
        });
        form.clearErrors();
        setIsModalOpen(true);
    };

    // Close Create/Edit Modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
        form.reset();
    };

    // Toggle single permission checkbox
    const handleTogglePermission = (permissionName: string) => {
        const current = form.data.permissions;
        if (current.includes(permissionName)) {
            form.setData(
                'permissions',
                current.filter((p) => p !== permissionName),
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
            // Remove all from module
            form.setData(
                'permissions',
                form.data.permissions.filter((p) => !moduleNames.includes(p)),
            );
        } else {
            // Add all from module
            const unique = new Set([...form.data.permissions, ...moduleNames]);
            form.setData('permissions', Array.from(unique));
        }
    };

    // Submit Create or Edit Role (Backend validation handled via Inertia form.errors)
    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingRole) {
            form.put(route('roles.update', editingRole.id), {
                preserveScroll: true,
                onSuccess: () => handleCloseModal(),
            });
        } else {
            form.post(route('roles.store'), {
                preserveScroll: true,
                onSuccess: () => handleCloseModal(),
            });
        }
    };

    // Open Delete Confirmation Modal
    const handleOpenDeleteModal = (role: RoleItem) => {
        if (['super admin', 'super-admin'].includes(role.name.toLowerCase())) {
            return;
        }
        setDeletingRole(role);
        setIsDeleteModalOpen(true);
    };

    // Execute Delete with spinner loading state
    const handleConfirmDelete = () => {
        if (!deletingRole || isDeleting) return;

        setIsDeleting(true);
        router.delete(route('roles.destroy', deletingRole.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeletingRole(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles & Permissions" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Roles & Permissions Management
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Define user access levels and assign granular module permissions across the CRM.
                        </p>
                    </div>

                    {hasPermission(user, 'create-roles') && (
                        <Button
                            onClick={handleCreateRole}
                            className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2"
                        >
                            <Plus className="size-4" />
                            <span>Create New Role</span>
                        </Button>
                    )}
                </div>

                {/* Roles Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => {
                        const isSuperAdmin = ['super admin', 'super-admin'].includes(role.name.toLowerCase());
                        const isClientRole = role.name.toLowerCase() === 'client';
                        const roleDisplayName = role.name;

                        return (
                            <div
                                key={role.id}
                                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                                <ShieldCheck className="size-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                                                    {roleDisplayName}
                                                </h3>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    guard: {role.guard_name}
                                                </span>
                                            </div>
                                        </div>

                                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                            <Users className="size-3 text-slate-400" />
                                            <span>{role.users_count} {role.users_count === 1 ? 'User' : 'Users'}</span>
                                        </span>
                                    </div>

                                    {/* Permissions Count Badge */}
                                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                            <span>Attached Permissions</span>
                                            <span className="text-blue-600 dark:text-blue-400">
                                                {isSuperAdmin ? `All Access (${permissions.length}/${permissions.length})` : `${role.permissions.length} Enabled`}
                                            </span>
                                        </div>

                                        {/* Permission Pills Preview */}
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {isSuperAdmin ? (
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                                    ★ Full System Permissions
                                                </span>
                                            ) : role.permissions.length > 0 ? (
                                                role.permissions.slice(0, 4).map((p) => (
                                                    <span key={p} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
                                                        {formatPermissionName(p)}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-slate-400 italic">No permissions attached</span>
                                            )}
                                            {!isSuperAdmin && role.permissions.length > 4 && (
                                                <span className="text-[11px] text-slate-400 font-medium">
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
                                            <span>System Protected Role</span>
                                        </div>
                                    ) : (
                                        <>
                                            {hasPermission(user, 'edit-roles') && (
                                                <button
                                                    onClick={() => handleEditRole(role)}
                                                    className="flex-1 h-9 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                    <span>Edit Permissions</span>
                                                </button>
                                            )}

                                            {!isClientRole && hasPermission(user, 'delete-roles') && (
                                                <button
                                                    onClick={() => handleOpenDeleteModal(role)}
                                                    className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
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

                {/* Create / Edit Role Modal Overlay */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xl space-y-2 my-2">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <Key className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                            {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New User Role'}
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Specify role title and toggle module access permissions.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form noValidate onSubmit={handleSubmit} className="space-y-4">
                                {/* Role Name Input */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                        Role Title / Name
                                    </Label>
                                    <Input
                                        id="name"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="e.g. Sales Manager, Accountant, Support Staff"
                                        disabled={['super admin', 'super-admin'].includes(editingRole?.name?.toLowerCase() || '')}
                                    />
                                    {form.errors.name && (
                                        <p className="text-xs font-semibold text-rose-500">{form.errors.name}</p>
                                    )}
                                </div>

                                {/* Grouped Module Permissions */}
                                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                                            Module Permissions Checklist
                                        </Label>
                                        <span className="text-[11px] font-semibold text-slate-400">
                                            {form.data.permissions.length} Permissions Selected
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(groupedPermissions)
                                            .filter(([_, modulePerms]) => modulePerms && modulePerms.length > 0)
                                            .map(([moduleTitle, modulePerms]) => {
                                                const moduleNames = modulePerms.map((p) => p.name);
                                                const isAllSelected = moduleNames.length > 0 && moduleNames.every((p) => form.data.permissions.includes(p));

                                            return (
                                                <div
                                                    key={moduleTitle}
                                                    className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-800">
                                                        <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                            <span>{moduleTitle}</span>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleModule(modulePerms)}
                                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                                        >
                                                            {isAllSelected ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {modulePerms.map((permission) => {
                                                            const isChecked = form.data.permissions.includes(permission.name);
                                                            return (
                                                                <label
                                                                    key={permission.name}
                                                                    className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-3 select-none ${isChecked
                                                                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 font-bold'
                                                                        : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-300'
                                                                        }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => handleTogglePermission(permission.name)}
                                                                        className="size-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 accent-blue-600 shrink-0 cursor-pointer"
                                                                    />
                                                                    <span className="text-xs sm:text-sm tracking-tight">{formatPermissionName(permission.name)}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="h-11 px-5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>

                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-11 px-6 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all"
                                    >
                                        {form.processing ? (
                                            <div className="flex items-center gap-2">
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving Role...</span>
                                            </div>
                                        ) : (
                                            <span>{editingRole ? 'Update Role & Permissions' : 'Create Role'}</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modern Delete Confirmation Modal */}
                {isDeleteModalOpen && deletingRole && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                                        Delete User Role?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">"{deletingRole.name}"</span>? Any users currently assigned to this role will lose their permission scope.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isDeleting) {
                                            setIsDeleteModalOpen(false);
                                            setDeletingRole(null);
                                        }
                                    }}
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
                                            <span>Deleting Role...</span>
                                        </div>
                                    ) : (
                                        <span>Delete Role</span>
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
