import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Building,
    Camera,
    Check,
    Edit2,
    KeyRound,
    LoaderCircle,
    Lock,
    Mail,
    Plus,
    Search,
    Shield,
    Trash2,
    User,
    UserCog,
    X,
} from 'lucide-react';
import { hasPermission } from '@/utils/permissions';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

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

interface UserItem {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    type?: 'admin' | 'client';
    client_id?: number | null;
    client_name?: string | null;
    roles: string[];
    is_primary_admin: boolean;
    created_at: string | null;
}

interface UsersIndexProps {
    users: PaginatedData<UserItem>;
    roles: RoleItem[];
    clients?: ClientOption[];
    filters?: {
        search?: string;
    };
}

export default function UsersIndex({ users, roles, clients = [], filters }: UsersIndexProps) {
    const authUser = (usePage().props.auth as any)?.user;

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);

    // Delete Confirmation Modal State
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Avatar preview state
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Form options for client select
    const clientOptions = (clients || []).map((c) => ({
        value: c.id,
        label: c.company_name ? `${c.name} (${c.company_name})` : c.name,
        subLabel: c.client_code ? `Code: ${c.client_code}` : undefined,
    }));

    // Inertia Form State
    const form = useForm({
        _method: 'post',
        name: '',
        email: '',
        password: '',
        type: 'admin' as 'admin' | 'client',
        client_id: '' as string | number,
        roles: [] as string[],
        avatar: null as File | null,
        remove_avatar: false as boolean,
    });

    // Handle Search Input Change
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                route('users.index'),
                { search: searchQuery },
                { preserveState: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Open Modal for Creating User
    const handleCreateUser = () => {
        setEditingUser(null);
        setAvatarPreview(null);
        form.setData({
            _method: 'post',
            name: '',
            email: '',
            password: '',
            type: 'admin',
            client_id: '',
            roles: roles.length > 0 ? [roles[0].name] : [],
            avatar: null,
            remove_avatar: false,
        });
        form.clearErrors();
        setIsModalOpen(true);
    };

    // Open Modal for Editing User
    const handleEditUser = (user: UserItem) => {
        if (user.id === 1 || user.is_primary_admin) {
            alert('The primary Super Admin account (ID: 1) is protected and cannot be edited!');
            return;
        }

        setEditingUser(user);
        setAvatarPreview(user.avatar);
        form.setData({
            _method: 'put',
            name: user.name,
            email: user.email,
            password: '',
            type: user.type || 'admin',
            client_id: user.client_id || '',
            roles: user.roles,
            avatar: null,
            remove_avatar: false,
        });
        form.clearErrors();
        setIsModalOpen(true);
    };

    // Close Create/Edit Modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setAvatarPreview(null);
        form.reset();
    };

    // Toggle Role Checkbox Selection
    const handleToggleRole = (roleName: string) => {
        const current = form.data.roles;
        if (current.includes(roleName)) {
            form.setData(
                'roles',
                current.filter((r) => r !== roleName),
            );
        } else {
            form.setData('roles', [...current, roleName]);
        }
    };

    // Handle Avatar File Upload Selection
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('avatar', file);
            form.setData('remove_avatar', false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove Selected Avatar
    const handleRemoveAvatar = () => {
        form.setData('avatar', null);
        form.setData('remove_avatar', true);
        setAvatarPreview(null);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
        }
    };

    // Submit Create or Edit User
    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (editingUser) {
            form.post(route('users.update', editingUser.id), {
                preserveScroll: true,
                onSuccess: () => handleCloseModal(),
            });
        } else {
            form.post(route('users.store'), {
                preserveScroll: true,
                onSuccess: () => handleCloseModal(),
            });
        }
    };

    // Open Delete Confirmation Modal
    const handleOpenDeleteModal = (user: UserItem) => {
        if (user.id === 1 || user.is_primary_admin) {
            alert('The primary Super Admin account (ID: 1) is protected and cannot be deleted!');
            return;
        }

        if (user.id === authUser?.id) {
            alert('You cannot delete your own logged-in account!');
            return;
        }
        setDeletingUser(user);
        setIsDeleteModalOpen(true);
    };

    // Execute User Delete
    const handleConfirmDelete = () => {
        if (!deletingUser || isDeleting) return;

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            User Management
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Manage system users, assign account types (Admin vs Client), and handle profile credentials.
                        </p>
                    </div>

                    {hasPermission(authUser, 'create-users') && (
                        <Button
                            onClick={handleCreateUser}
                            className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2"
                        >
                            <Plus className="size-4" />
                            <span>Create New User</span>
                        </Button>
                    )}
                </div>

                {/* Filter / Search Bar & Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, account type, or role..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <UserCog className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Total Users: <strong className="text-slate-900 dark:text-white">{users.total}</strong></span>
                    </div>
                </div>

                {/* Users Table / Grid View */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Account Type</th>
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
                                        const isClientUser = user.type === 'client';

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
                                                    {isClientUser ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                                                            <Building className="size-3 text-emerald-600" />
                                                            <span>Client User</span>
                                                            {user.client_name && (
                                                                <span className="text-[11px] font-semibold text-emerald-600/90 dark:text-emerald-400/90">
                                                                    ({user.client_name})
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60">
                                                            <UserCog className="size-3 text-blue-600" />
                                                            <span>Admin / Staff</span>
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
                                                                <button
                                                                    onClick={() => handleEditUser(user)}
                                                                    className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                                    title="Edit User"
                                                                >
                                                                    <Edit2 className="size-3.5" />
                                                                </button>
                                                            )}

                                                            {!isSelf && hasPermission(authUser, 'delete-users') && (
                                                                <button
                                                                    onClick={() => handleOpenDeleteModal(user)}
                                                                    className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
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
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            No user accounts found matching your query.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Standard Reusable Pagination */}
                    <Pagination meta={users} />
                </div>

                {/* Create / Edit User Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-2">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <UserCog className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                            {editingUser ? `Edit User: ${editingUser.name}` : 'Create New User Account'}
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Specify account type, basic info, and assign system roles.
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
                                {/* Account Type Selection */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                        Account Type <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => form.setData('type', 'admin')}
                                            className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                                                form.data.type === 'admin'
                                                    ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-extrabold shadow-xs'
                                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                                                <UserCog className="size-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs block font-bold">Admin / Staff</span>
                                                <span className="text-[10px] text-slate-500 block">CRM Control Panel</span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => form.setData('type', 'client')}
                                            className={`p-3 rounded-xl border transition-all text-left flex items-center gap-3 ${
                                                form.data.type === 'client'
                                                    ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-extrabold shadow-xs'
                                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                                                <Building className="size-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs block font-bold">Client User</span>
                                                <span className="text-[10px] text-slate-500 block">Client Portal Workspace</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Link to Client (If Account Type is Client) */}
                                {form.data.type === 'client' && (
                                    <div className="space-y-1">
                                        <Label htmlFor="client_id" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Assign Client Organization
                                        </Label>
                                        <SearchableSelect
                                            options={clientOptions}
                                            value={form.data.client_id}
                                            onChange={(val) => form.setData('client_id', val)}
                                            placeholder="Select Client Company..."
                                            searchPlaceholder="Search client name..."
                                        />
                                    </div>
                                )}

                                {/* Avatar Photo Upload Section */}
                                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                                    <div className="relative size-12 rounded-xl bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white font-extrabold text-base flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-800">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar preview" className="size-full object-cover" />
                                        ) : form.data.name ? (
                                            form.data.name.charAt(0).toUpperCase()
                                        ) : (
                                            <User className="size-5 text-white/80" />
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                ref={avatarInputRef}
                                                onChange={handleAvatarChange}
                                                accept="image/*"
                                                className="hidden"
                                                id="user-avatar-upload"
                                            />
                                            <label
                                                htmlFor="user-avatar-upload"
                                                className="h-8 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                                            >
                                                <Camera className="size-3.5" />
                                                <span>Upload</span>
                                            </label>

                                            {avatarPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveAvatar}
                                                    className="h-8 px-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Full Name <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                                    />
                                    {form.errors.name && <p className="text-xs font-semibold text-rose-500">{form.errors.name}</p>}
                                </div>

                                {/* Email Address */}
                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Email Address <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                        placeholder="john@example.com"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                                    />
                                    {form.errors.email && <p className="text-xs font-semibold text-rose-500">{form.errors.email}</p>}
                                </div>

                                {/* Multiple Roles Selection Checklist */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                            Assign System Roles <span className="text-rose-500">*</span>
                                        </Label>
                                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                            {form.data.roles.length} Selected
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                        {roles.map((r) => {
                                            const isChecked = form.data.roles.includes(r.name);
                                            return (
                                                <label
                                                    key={r.id}
                                                    className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-2 select-none ${isChecked
                                                        ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-bold'
                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:border-slate-300'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleToggleRole(r.name)}
                                                        className="size-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-600 accent-blue-600 shrink-0 cursor-pointer"
                                                    />
                                                    <span className="text-xs truncate">{r.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {form.errors.roles && <p className="text-xs font-semibold text-rose-500">{form.errors.roles}</p>}
                                </div>

                                {/* Password Input */}
                                <div className="space-y-1">
                                    <Label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {editingUser ? 'Password (Leave blank to keep unchanged)' : 'Account Password'}
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={form.data.password}
                                        onChange={(e) => form.setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                                    />
                                    {form.errors.password && <p className="text-xs font-semibold text-rose-500">{form.errors.password}</p>}
                                </div>

                                {/* Modal Actions Footer */}
                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>

                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2"
                                    >
                                        {form.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving User...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="size-4" />
                                                <span>{editingUser ? 'Update User' : 'Create User Account'}</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && deletingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
                            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/40">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Delete User Account
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                Are you sure you want to permanently delete the user account for{' '}
                                <strong className="text-slate-900 dark:text-white font-extrabold">{deletingUser.name}</strong> ({deletingUser.email})?
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setDeletingUser(null);
                                    }}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="h-10 px-5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="size-4" />
                                            <span>Delete User</span>
                                        </>
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
