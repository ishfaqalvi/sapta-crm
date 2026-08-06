import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    Camera,
    CheckCircle2,
    Coins,
    CreditCard,
    KeyRound,
    LoaderCircle,
    Lock,
    Mail,
    MapPin,
    Phone,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    User,
    UserCheck,
    UserPlus,
    UserX,
    X,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

interface ClientPortalProfileProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        contact_person?: string;
        email?: string;
        phone?: string;
        mobile?: string;
        city?: string;
        country?: string;
        currency: string;
        status: 'active' | 'inactive';
        notes?: string;
        created_at: string;
        user?: {
            id: number;
            email: string;
            avatar?: string | null;
            type: string;
            created_at: string;
        };
    };
    currencies?: { code: string; name: string; symbol: string }[];
    isAdmin?: boolean;
}

export default function ClientPortalProfileIndex({ client, currencies = [], isAdmin = false }: ClientPortalProfileProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Account Profile & Settings', href: '/client-portal/profile' },
    ];

    // Revoke Access Modal State
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);

    // Organization Form
    const profileForm = useForm({
        company_name: client.company_name || '',
        contact_person: client.contact_person || client.name || '',
        phone: client.phone || '',
        mobile: client.mobile || '',
        city: client.city || '',
        country: client.country || '',
        currency: client.currency || 'USD',
    });

    // Password Form (Client self-service)
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Create Portal Account Form (Admin action in portal)
    const createAccountForm = useForm({
        email: client.email || '',
        password: '',
    });

    // Avatar Upload Form
    const avatarForm = useForm({
        avatar: null as File | null,
        remove_avatar: false,
    });

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        avatarForm.setData('avatar', file);
        avatarForm.post('/client-portal/profile/avatar', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                avatarForm.reset();
            },
        });
    };

    const handleRemoveAvatar = () => {
        avatarForm.post('/client-portal/profile/avatar', {
            preserveScroll: true,
            data: { remove_avatar: true },
            onSuccess: () => {
                avatarForm.reset();
            },
        });
    };

    // Admin Reset Password Form
    const adminResetForm = useForm({
        password: '',
    });

    const handleProfileSubmit = (e: FormEvent) => {
        e.preventDefault();
        profileForm.post('/client-portal/profile/update', {
            preserveScroll: true,
        });
    };

    const handlePasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        passwordForm.put('/client-portal/profile/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handleCreateAccountSubmit = (e: FormEvent) => {
        e.preventDefault();
        createAccountForm.post('/client-portal/profile/create-account', {
            preserveScroll: true,
            onSuccess: () => createAccountForm.reset(),
        });
    };

    const handleAdminResetPasswordSubmit = (e: FormEvent) => {
        e.preventDefault();
        adminResetForm.put('/client-portal/profile/reset-password', {
            preserveScroll: true,
            onSuccess: () => adminResetForm.reset(),
        });
    };

    const handleConfirmRevoke = () => {
        if (isRevoking) return;
        setIsRevoking(true);
        profileForm.delete('/client-portal/profile/revoke-account', {
            preserveScroll: true,
            onSuccess: () => setShowRevokeModal(false),
            onFinish: () => setIsRevoking(false),
        });
    };

    const formatDateOnly = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        const cleanDate = dateStr.split('T')[0].split(' ')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = parseInt(parts[1], 10) - 1;
            return `${parts[2]} ${months[month]} ${parts[0]}`;
        }
        return cleanDate;
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="settings">
            <Head title={`Account Profile & Settings | ${client.name}`} />

            <div className="p-6 w-full space-y-6">
                {/* Header Title Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                {client.client_code}
                            </span>
                            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Account Profile & Portal Settings
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                            Manage organization contact information, billing currency, and portal login account credentials.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        {client.user ? (
                            <span className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 flex items-center gap-1.5 shadow-2xs">
                                <ShieldCheck className="size-4" />
                                <span>Portal Access Active</span>
                            </span>
                        ) : (
                            <span className="px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 flex items-center gap-1.5 shadow-2xs">
                                <ShieldAlert className="size-4" />
                                <span>No Portal Account</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Top KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Portal Status</p>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                                {client.user ? 'Active Login' : 'Disabled'}
                            </h3>
                        </div>
                        <div className={`size-10 rounded-xl flex items-center justify-center ${client.user ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'}`}>
                            {client.user ? <ShieldCheck className="size-5" /> : <ShieldAlert className="size-5" />}
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Primary Contact</p>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 truncate max-w-[140px]">
                                {client.contact_person || client.name}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <User className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Billing Currency</p>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                                {client.currency}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Coins className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Registered Date</p>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                                {formatDateOnly(client.created_at)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Building2 className="size-5" />
                        </div>
                    </div>
                </div>

                {/* 2-Column Standard Cards Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Organization Details Card */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Building2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Organization & Contact Setup
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Official business details, contact person, location, and billing currency.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileSubmit} noValidate className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Company Name */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.data.company_name}
                                        onChange={(e) => profileForm.setData('company_name', e.target.value)}
                                        placeholder="e.g. Acme Corporation"
                                        className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                    />
                                    {profileForm.errors.company_name && (
                                        <p className="text-rose-500 text-[11px] font-semibold mt-1">{profileForm.errors.company_name}</p>
                                    )}
                                </div>

                                {/* Contact Person */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Contact Person Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.data.contact_person}
                                        onChange={(e) => profileForm.setData('contact_person', e.target.value)}
                                        placeholder="Primary Contact"
                                        className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                    />
                                    {profileForm.errors.contact_person && (
                                        <p className="text-rose-500 text-[11px] font-semibold mt-1">{profileForm.errors.contact_person}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.data.phone}
                                        onChange={(e) => profileForm.setData('phone', e.target.value)}
                                        placeholder="+1 555 123 4567"
                                        className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                    />
                                </div>

                                {/* Mobile */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Mobile Number
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.data.mobile}
                                        onChange={(e) => profileForm.setData('mobile', e.target.value)}
                                        placeholder="+1 555 987 6543"
                                        className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                    />
                                </div>

                                {/* City */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.data.city}
                                        onChange={(e) => profileForm.setData('city', e.target.value)}
                                        placeholder="City"
                                        className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                    />
                                </div>

                                {/* Country */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.data.country}
                                        onChange={(e) => profileForm.setData('country', e.target.value)}
                                        placeholder="Country"
                                        className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                    />
                                </div>

                                {/* Billing Currency */}
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Preferred Billing Currency *
                                    </label>
                                    <select
                                        value={profileForm.data.currency}
                                        onChange={(e) => profileForm.setData('currency', e.target.value)}
                                        className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-mono"
                                    >
                                        {currencies.length > 0 ? (
                                            currencies.map((c) => (
                                                <option key={c.code} value={c.code}>
                                                    {c.code} - {c.name} ({c.symbol})
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="AED">AED (د.إ)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="PKR">PKR (Rs)</option>
                                                <option value="EUR">EUR (€)</option>
                                                <option value="GBP">GBP (£)</option>
                                                <option value="SAR">SAR (ر.س)</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {hasPermission(user, 'edit-client-portal-profile') && (
                                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="submit"
                                        disabled={profileForm.processing}
                                        className="bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="size-4" />
                                        <span>{profileForm.processing ? 'Saving...' : 'Save Profile Details'}</span>
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Column: Portal Account Security & Credentials Card */}
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 flex flex-col justify-between">
                        {client.user ? (
                            /* PORTAL USER ACCOUNT EXISTS */
                            <div>
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                            <KeyRound className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                                Portal Login Account
                                            </h3>
                                            <p className="text-xs text-slate-400">Active client portal login user</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Active
                                    </span>
                                </div>

                                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Portal Login Email</p>
                                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{client.user.email}</p>
                                </div>

                                {/* User Profile Picture Section */}
                                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            User Profile Picture
                                        </p>
                                        {avatarForm.processing && (
                                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                <LoaderCircle className="size-3 animate-spin" /> Uploading...
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Avatar Display */}
                                        <div className="relative size-14 rounded-2xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-black text-lg flex items-center justify-center shadow-md overflow-hidden shrink-0 border-2 border-white dark:border-slate-800">
                                            {client.user.avatar ? (
                                                <img src={client.user.avatar} alt={client.name} className="size-full object-cover" />
                                            ) : (
                                                client.name.substring(0, 2).toUpperCase()
                                            )}
                                        </div>

                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <label className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer inline-flex items-center gap-1.5">
                                                    <Camera className="size-3.5" />
                                                    <span>Upload Photo</span>
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                                        onChange={handleAvatarUpload}
                                                        className="hidden"
                                                    />
                                                </label>

                                                {client.user.avatar && (
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveAvatar}
                                                        disabled={avatarForm.processing}
                                                        className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 border border-rose-200/60 dark:border-rose-800/80 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        <span>Remove</span>
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                JPG, PNG, GIF, or WEBP (Max 4MB).
                                            </p>
                                        </div>
                                    </div>
                                    {avatarForm.errors.avatar && (
                                        <p className="text-rose-500 text-[11px] font-semibold">{avatarForm.errors.avatar}</p>
                                    )}
                                </div>

                                {isAdmin ? (
                                    /* ADMIN VIEWING PORTAL: Reset Password / Revoke Account */
                                    <div className="space-y-4 mt-5">
                                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                            Admin Account Controls
                                        </h4>
                                        <form onSubmit={handleAdminResetPasswordSubmit} noValidate className="space-y-3">
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    Reset Password
                                                </label>
                                                <input
                                                    type="password"
                                                    value={adminResetForm.data.password}
                                                    onChange={(e) => adminResetForm.setData('password', e.target.value)}
                                                    placeholder="Enter new password"
                                                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                                />
                                                {adminResetForm.errors.password && (
                                                    <p className="text-rose-500 text-[11px] font-semibold mt-1">{adminResetForm.errors.password}</p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRevokeModal(true)}
                                                    className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-800/80 text-xs font-extrabold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0"
                                                >
                                                    <UserX className="size-3.5" />
                                                    <span>Revoke Access</span>
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={adminResetForm.processing}
                                                    className="bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                                                >
                                                    <KeyRound className="size-4" />
                                                    <span>{adminResetForm.processing ? 'Resetting...' : 'Reset Password'}</span>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    /* CLIENT SELF-SERVICE: Change Password */
                                    <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4 mt-4">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Current Password *
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.data.current_password}
                                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                            />
                                            {passwordForm.errors.current_password && (
                                                <p className="text-rose-500 text-[11px] font-semibold mt-1">{passwordForm.errors.current_password}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                                New Password *
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.data.password}
                                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                            />
                                            {passwordForm.errors.password && (
                                                <p className="text-rose-500 text-[11px] font-semibold mt-1">{passwordForm.errors.password}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Confirm New Password *
                                            </label>
                                            <input
                                                type="password"
                                                value={passwordForm.data.password_confirmation}
                                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                            />
                                        </div>

                                        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <button
                                                type="submit"
                                                disabled={passwordForm.processing}
                                                className="bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                                            >
                                                <Lock className="size-4" />
                                                <span>{passwordForm.processing ? 'Updating...' : 'Update Password'}</span>
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ) : (
                            /* NO PORTAL USER ACCOUNT CREATED YET */
                            <div>
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                        <UserX className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Portal User Setup
                                        </h3>
                                        <p className="text-xs text-slate-400">No portal login account registered</p>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                                    <strong className="block font-bold">No Active Portal Account</strong>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                        This client currently does not have a user login account for the Client Portal.
                                    </p>
                                </div>

                                {isAdmin && (
                                    /* ADMIN CAN CREATE PORTAL ACCOUNT FROM PORTAL WORKSPACE */
                                    <form onSubmit={handleCreateAccountSubmit} noValidate className="space-y-4 mt-5">
                                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                            <UserPlus className="size-4 text-blue-600" />
                                            <span>Create Portal Account For Client</span>
                                        </h4>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Portal Login Email *
                                            </label>
                                            <input
                                                type="email"
                                                value={createAccountForm.data.email}
                                                onChange={(e) => createAccountForm.setData('email', e.target.value)}
                                                placeholder="client.login@domain.com"
                                                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                            />
                                            {createAccountForm.errors.email && (
                                                <p className="text-rose-500 text-[11px] font-semibold mt-1">{createAccountForm.errors.email}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Initial Password *
                                            </label>
                                            <input
                                                type="password"
                                                value={createAccountForm.data.password}
                                                onChange={(e) => createAccountForm.setData('password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                            />
                                            {createAccountForm.errors.password && (
                                                <p className="text-rose-500 text-[11px] font-semibold mt-1">{createAccountForm.errors.password}</p>
                                            )}
                                        </div>

                                        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <button
                                                type="submit"
                                                disabled={createAccountForm.processing}
                                                className="bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                                            >
                                                <UserCheck className="size-4" />
                                                <span>{createAccountForm.processing ? 'Creating...' : 'Create Portal Account'}</span>
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Security Tip Footer */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mt-4">
                            <strong className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 mb-1">
                                Security Information
                            </strong>
                            Portal account credentials grant isolated access to workspace deliverables, invoices, and credentials for <strong className="text-slate-900 dark:text-white">{client.name}</strong>.
                        </div>
                    </div>
                </div>

                {/* CONFIRM REVOKE ACCESS MODAL */}
                {showRevokeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 shrink-0">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                                        Revoke Portal Account Access?
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Are you sure you want to revoke portal login access for <span className="font-bold text-slate-800 dark:text-slate-200">"{client.name}"</span> ({client.user?.email})? The client will no longer be able to log in to their portal workspace.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRevokeModal(false)}
                                    disabled={isRevoking}
                                    className="h-10 px-4 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirmRevoke}
                                    disabled={isRevoking}
                                    className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isRevoking ? (
                                        <div className="flex items-center gap-2">
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Revoking Access...</span>
                                        </div>
                                    ) : (
                                        <span>Revoke Access</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientPortalLayout>
    );
}
