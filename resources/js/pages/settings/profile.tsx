import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Camera,
    Check,
    KeyRound,
    LoaderCircle,
    Lock,
    Mail,
    ShieldCheck,
    Sparkles,
    Trash2,
    User as UserIcon,
} from 'lucide-react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile Settings',
        href: '/profile',
    },
];

interface ProfileFormData {
    name: string;
    email: string;
    avatar: File | null;
    remove_avatar: boolean;
    _method: string;
    [key: string]: any;
}

export default function UserProfile({ status }: { mustVerifyEmail?: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);

    // Spatie Roles & Permissions check
    const roles = user.roles || [];
    const primaryRole = roles[0] || 'Super Admin';
    const isSuperAdmin = roles.some((r) => ['super admin', 'super-admin'].includes(r.toLowerCase()));
    const roleDisplayName = primaryRole;

    // Profile & Avatar Form
    const profileForm = useForm<ProfileFormData>({
        name: user.name,
        email: user.email,
        avatar: null,
        remove_avatar: false,
        _method: 'PATCH',
    });

    // Password Form
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Handle Profile Picture File Change
    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            profileForm.setData({
                ...profileForm.data,
                avatar: file,
                remove_avatar: false,
            });

            const reader = new FileReader();
            reader.onload = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove Profile Picture
    const handleRemoveAvatar = () => {
        profileForm.setData({
            ...profileForm.data,
            avatar: null,
            remove_avatar: true,
        });
        setAvatarPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Submit Profile & Avatar Form
    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        profileForm.post(route('profile.update'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    // Submit Password Form (routed to profile.password.update)
    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('profile.password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
            onError: (errors) => {
                if (errors.password) {
                    passwordForm.reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errors.current_password) {
                    passwordForm.reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile Settings" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header matching Standard Design */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                ACCOUNT SETTINGS
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Profile & Security
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Manage your personal profile details, avatar, and authentication security credentials.
                        </p>
                    </div>
                </div>

                {/* Status Alert Banner */}
                {status === 'profile-updated' && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                        <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Your profile information has been updated successfully.</span>
                    </div>
                )}

                {/* Realistic, Clean User Identity Summary Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                            {/* Avatar with subtle edit trigger */}
                            <div className="relative group shrink-0">
                                <div className="size-20 sm:size-22 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-extrabold text-2xl shadow-inner border border-slate-200 dark:border-slate-700">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={user.name}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        user.name?.charAt(0).toUpperCase() || 'U'
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 size-7 rounded-xl bg-[#003796] hover:bg-[#002a75] text-white shadow-md flex items-center justify-center transition-all cursor-pointer"
                                    title="Change photo"
                                >
                                    <Camera className="size-3.5" />
                                </button>
                            </div>

                            {/* User Info Details */}
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                        {user.name}
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 inline-flex items-center gap-1">
                                        <ShieldCheck className="size-3 text-blue-600 dark:text-blue-400" />
                                        <span>{roleDisplayName}</span>
                                    </span>
                                    {isSuperAdmin && (
                                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 inline-flex items-center gap-1">
                                            <Sparkles className="size-3 text-amber-500" />
                                            <span>Full Access</span>
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="size-3.5 text-slate-400" />
                                        <span>{user.email}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                                        <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                                        <span>Active Account</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Photo Upload & Remove Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-center sm:self-start">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-9 px-3.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            >
                                <Camera className="size-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Change Photo</span>
                            </button>
                            {avatarPreview && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    className="h-9 px-3 text-xs font-bold rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors inline-flex items-center gap-1.5 border border-rose-200/60 dark:border-rose-900 cursor-pointer"
                                    title="Remove photo"
                                >
                                    <Trash2 className="size-3.5" />
                                    <span>Remove</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2-Column Responsive Layout for Forms */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Personal Information (lg:col-span-7) */}
                    <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5 flex flex-col justify-between">
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#003796] dark:text-blue-400">
                                    <UserIcon className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Personal Information
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Update your display name and primary contact email address.
                                    </p>
                                </div>
                            </div>

                            <form id="profile-form" onSubmit={submitProfile} noValidate className="space-y-4">
                                {/* Name Input */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Full Name <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        placeholder="Full Name"
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                            profileForm.errors.name
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {profileForm.errors.name && (
                                        <p className="text-xs text-rose-500 font-semibold">{profileForm.errors.name}</p>
                                    )}
                                </div>

                                {/* Email Input */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Email Address <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        placeholder="your.email@example.com"
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                            profileForm.errors.email
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {profileForm.errors.email && (
                                        <p className="text-xs text-rose-500 font-semibold">{profileForm.errors.email}</p>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Transition
                                show={profileForm.recentlySuccessful}
                                enter="transition ease-in-out duration-300"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out duration-300"
                                leaveTo="opacity-0"
                            >
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                    <Check className="size-4" />
                                    Changes saved
                                </span>
                            </Transition>

                            <Button
                                type="submit"
                                form="profile-form"
                                disabled={profileForm.processing}
                                className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all ml-auto inline-flex items-center gap-2 cursor-pointer"
                            >
                                {profileForm.processing ? (
                                    <>
                                        <LoaderCircle className="size-3.5 animate-spin" />
                                        <span>Saving Profile...</span>
                                    </>
                                ) : (
                                    <span>Save Profile Details</span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Password & Credentials (lg:col-span-5) */}
                    <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5 flex flex-col justify-between">
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                    <KeyRound className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Security Credentials
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Ensure your account uses a secure password.
                                    </p>
                                </div>
                            </div>

                            <form id="password-form" onSubmit={submitPassword} noValidate className="space-y-3.5">
                                {/* Current Password */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="current_password"
                                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                    >
                                        Current Password <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        value={passwordForm.data.current_password}
                                        onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                        type="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className={`h-10 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white transition-all ${
                                            passwordForm.errors.current_password
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {passwordForm.errors.current_password && (
                                        <p className="text-xs text-rose-500 font-semibold">
                                            {passwordForm.errors.current_password}
                                        </p>
                                    )}
                                </div>

                                {/* New Password */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="password"
                                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                    >
                                        New Password <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="password"
                                        ref={passwordInput}
                                        value={passwordForm.data.password}
                                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className={`h-10 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white transition-all ${
                                            passwordForm.errors.password
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {passwordForm.errors.password && (
                                        <p className="text-xs text-rose-500 font-semibold">
                                            {passwordForm.errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="text-xs font-bold text-slate-700 dark:text-slate-300"
                                    >
                                        Confirm New Password <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        value={passwordForm.data.password_confirmation}
                                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        className={`h-10 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white transition-all ${
                                            passwordForm.errors.password_confirmation
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {passwordForm.errors.password_confirmation && (
                                        <p className="text-xs text-rose-500 font-semibold">
                                            {passwordForm.errors.password_confirmation}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <Transition
                                show={passwordForm.recentlySuccessful}
                                enter="transition ease-in-out duration-300"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out duration-300"
                                leaveTo="opacity-0"
                            >
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                    <Check className="size-4" />
                                    Password updated
                                </span>
                            </Transition>

                            <Button
                                type="submit"
                                form="password-form"
                                disabled={passwordForm.processing}
                                className="h-10 px-5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all ml-auto inline-flex items-center gap-2 cursor-pointer"
                            >
                                {passwordForm.processing ? (
                                    <>
                                        <LoaderCircle className="size-3.5 animate-spin" />
                                        <span>Updating Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="size-3.5" />
                                        <span>Update Password</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
