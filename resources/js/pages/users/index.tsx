import Pagination, { type PaginatedData } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeCheck,
    Building,
    Edit2,
    LoaderCircle,
    Lock,
    Mail,
    Plus,
    RotateCcw,
    Search,
    Shield,
    Trash2,
    UserCheck,
    UserCog,
    UserX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: '/users',
    },
];

interface RoleItem {
    id: number;
    name: string;
}

interface ClientOption {
    id: number;
    name: string;
    company_name?: string | null;
    client_code?: string | null;
}

interface EmployeeOption {
    id: number;
    name: string;
    employee_code?: string | null;
    email?: string | null;
}

interface UserItem {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    type?: 'admin' | 'client' | 'employee';
    is_active?: boolean;
    client_id?: number | null;
    client_name?: string | null;
    employee_id?: number | null;
    employee_name?: string | null;
    roles: string[];
    is_primary_admin: boolean;
    created_at: string | null;
}

interface UsersIndexProps {
    users: PaginatedData<UserItem>;
    roles: RoleItem[];
    clients?: ClientOption[];
    employees?: EmployeeOption[];
    filters?: {
        search?: string;
        type?: string;
        status?: string;
        role?: string;
    };
}

export default function UsersIndex({ users, roles, filters }: UsersIndexProps) {
    const authUser = (usePage().props.auth as any)?.user;

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [typeFilter, setTypeFilter] = useState(filters?.type || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || '');

    // Delete Confirmation Modal State
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handle Search & Filter Input Change (Debounced)
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                route('users.index'),
                {
                    search: searchQuery || undefined,
                    type: typeFilter || undefined,
                    status: statusFilter || undefined,
                    role: roleFilter || undefined,
                },
                { preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, typeFilter, statusFilter, roleFilter]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setTypeFilter('');
        setStatusFilter('');
        setRoleFilter('');
        router.get(route('users.index'), {}, { preserveState: true, replace: true });
    };

    // Open Delete Confirmation Modal
    const handleOpenDeleteModal = (user: UserItem) => {
        if (user.id === 1 || user.is_primary_admin) {
            alert('The primary Super Admin account (ID: 1) is protected and cannot be deleted!');
            return;
        }
        setDeletingUser(user);
        setIsDeleteModalOpen(true);
    };

    // Confirm Delete User
    const handleConfirmDelete = () => {
        if (!deletingUser) return;
        setIsDeleting(true);

        router.delete(route('users.destroy', deletingUser.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeletingUser(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const hasActiveFilters = Boolean(searchQuery || typeFilter || statusFilter || roleFilter);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <UserCog className="size-6 text-[#003796] dark:text-blue-400" />
                            <span>User Management</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage system admins, staff employees, client portal users, active login status, and Spatie roles.
                        </p>
                    </div>

                    {hasPermission(authUser, 'create-users') && (
                        <Link
                            href={route('users.create')}
                            className="h-10 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Create New User</span>
                        </Link>
                    )}
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                        {/* Search Input */}
                        <div className="relative w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search user..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                            />
                        </div>

                        {/* Account Type Filter */}
                        <div className="w-full">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
                            >
                                <option value="">All Account Types</option>
                                <option value="admin">Admin / System Staff</option>
                                <option value="employee">Employee Account</option>
                                <option value="client">Client Portal</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="w-full">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>

                        {/* Role Filter */}
                        <div className="w-full">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
                            >
                                <option value="">All Roles</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.name}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="h-10 px-3 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Reset Filters</span>
                        </button>
                    )}
                </div>

                {/* Users Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Account Type</th>
                                    <th className="px-6 py-4">Login Status</th>
                                    <th className="px-6 py-4">Assigned Roles</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {users.data.length > 0 ? (
                                    users.data.map((user) => {
                                        const isSelf = user.id === authUser?.id;
                                        const isPrimaryAdmin = user.id === 1 || user.is_primary_admin;

                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                {/* User Info */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative size-10 rounded-xl bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white font-extrabold text-sm flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-800">
                                                            {user.avatar ? (
                                                                <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                                                            ) : (
                                                                user.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                                    {user.name}
                                                                </span>
                                                                {isSelf && (
                                                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                                                                <Mail className="size-3" />
                                                                <span>{user.email}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Account Type Badge */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.type === 'client' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                                                            <Building className="size-3 text-emerald-600" />
                                                            <span>Client User</span>
                                                            {user.client_name && (
                                                                <span className="text-[11px] font-semibold text-emerald-600/90 dark:text-emerald-400/90">
                                                                    ({user.client_name})
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : user.type === 'employee' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60">
                                                            <UserCheck className="size-3 text-indigo-600" />
                                                            <span>Employee User</span>
                                                            {user.employee_name && (
                                                                <span className="text-[11px] font-semibold text-indigo-600/90 dark:text-indigo-400/90">
                                                                    ({user.employee_name})
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                                                            <UserCog className="size-3 text-blue-600" />
                                                            <span>Admin / System</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Login Status */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.is_active ?? true ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                            <BadgeCheck className="size-3.5 text-emerald-500" />
                                                            <span>Active</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                            <UserX className="size-3.5 text-rose-500" />
                                                            <span>Inactive</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Assigned Multiple Roles */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {user.roles.length > 0 ? (
                                                            user.roles.map((r) => {
                                                                const isSuperAdminRole = ['super admin', 'super-admin'].includes(r.toLowerCase());
                                                                return (
                                                                    <span
                                                                        key={r}
                                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isSuperAdminRole
                                                                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                                                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                                            }`}
                                                                    >
                                                                        <Shield className="size-3" />
                                                                        <span>{r}</span>
                                                                    </span>
                                                                );
                                                            })
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">No role assigned</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Joined Date */}
                                                <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                                                    {user.created_at || 'N/A'}
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-6 py-4 text-right">
                                                    {isPrimaryAdmin ? (
                                                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-700 dark:text-amber-400 select-none">
                                                            <Lock className="size-3.5 text-amber-500" />
                                                            <span>Primary Super Admin</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {hasPermission(authUser, 'edit-users') && (
                                                                <Link
                                                                    href={route('users.edit', user.id)}
                                                                    className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                                    title="Edit User Account"
                                                                >
                                                                    <Edit2 className="size-3.5" />
                                                                </Link>
                                                            )}

                                                            {!isSelf && hasPermission(authUser, 'delete-users') && (
                                                                <button
                                                                    onClick={() => handleOpenDeleteModal(user)}
                                                                    className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No user accounts found matching your query.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination meta={users} />
                </div>

                {/* DELETE USER CONFIRMATION MODAL */}
                {isDeleteModalOpen && deletingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    Delete User Account?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                    Are you sure you want to permanently delete user account <strong>"{deletingUser.name}"</strong> ({deletingUser.email})?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete User</span>
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
