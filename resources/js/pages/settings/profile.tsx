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
    CheckCircle2,
    KeyRound,
    LoaderCircle,
    Mail,
    ShieldCheck,
    Sparkles,
    Trash2,
    User as UserIcon,
} from 'lucide-react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile',
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
        _method: 'POST',
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

    // Submit Password Form
    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
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
            <Head title="User Profile" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Top Profile Hero Header Banner */}
                <div className="relative rounded-3xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] p-6 sm:p-8 text-white shadow-xl shadow-blue-950/15 overflow-hidden">
                    {/* Glowing Mesh Circles */}
                    <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-[80px]" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-cyan-400/20 blur-[80px]" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar Container with Camera Badge */}
                        <div className="relative group shrink-0">
                            <div className="size-28 sm:size-32 rounded-full overflow-hidden bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-extrabold text-3xl shadow-2xl ring-4 ring-white/30">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt={user.name} className="size-full object-cover" />
                                ) : (
                                    user.name?.charAt(0) || 'A'
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 p-2.5 rounded-full bg-white text-blue-700 hover:bg-blue-50 shadow-lg transition-transform active:scale-95"
                                title="Change Profile Photo"
                            >
                                <Camera className="size-4" />
                            </button>
                        </div>

                        {/* User Details & Spatie Role Badges */}
                        <div className="space-y-3 text-center md:text-left my-auto">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                                    {user.name}
                                </h1>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider border border-white/20">
                                    <ShieldCheck className="size-3.5 text-cyan-300" />
                                    {roleDisplayName}
                                </span>
                            </div>

                            <p className="text-sm text-blue-100/90 flex items-center justify-center md:justify-start gap-2 font-medium">
                                <Mail className="size-4 text-blue-200" />
                                <span>{user.email}</span>
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-medium backdrop-blur-sm border border-white/15">
                                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                                    <span>Account Active</span>
                                </div>
                                {/* Only display Full CRM Access badge for Spatie super-admin users */}
                                {isSuperAdmin && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-white text-xs font-medium backdrop-blur-sm border border-white/15">
                                        <Sparkles className="size-3.5 text-yellow-300" />
                                        <span>Full CRM Access</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Alert Banner */}
                {status === 'profile-updated' && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2 shadow-xs">
                        <Check className="size-5 text-emerald-600" />
                        <span>Your profile details have been updated successfully!</span>
                    </div>
                )}

                {/* Main 2-Column Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Personal Info & Avatar Management (lg:col-span-7) */}
                    <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <UserIcon className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h2>
                                <p className="text-xs text-slate-500">Update your photo, full name, and email address.</p>
                            </div>
                        </div>

                        <form onSubmit={submitProfile} className="space-y-6">
                            {/* Avatar File Manager Box */}
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="space-y-1 text-center sm:text-left">
                                    <span className="text-xs font-bold text-slate-800 dark:text-white block">
                                        Profile Photo
                                    </span>
                                    <p className="text-[11px] text-slate-500">
                                        JPG, PNG, GIF or WebP. Max 4MB.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
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
                                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 transition-all"
                                    >
                                        Upload New Photo
                                    </button>
                                    {avatarPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            className="px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 transition-all"
                                            title="Remove photo"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Name & Email Inputs */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                        Full Name
                                    </Label>
                                    <Input
                                        id="name"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                        placeholder="Full Name"
                                        required
                                    />
                                    {profileForm.errors.name && (
                                        <p className="text-xs text-rose-500">{profileForm.errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                        placeholder="admin@sapta.com"
                                        required
                                    />
                                    {profileForm.errors.email && (
                                        <p className="text-xs text-rose-500">{profileForm.errors.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <Button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="h-11 px-6 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all"
                                >
                                    {profileForm.processing ? (
                                        <div className="flex items-center gap-2">
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Saving Profile...</span>
                                        </div>
                                    ) : (
                                        <span>Save Changes</span>
                                    )}
                                </Button>

                                <Transition
                                    show={profileForm.recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                        <Check className="size-4" />
                                        Saved
                                    </span>
                                </Transition>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Account Security & Password (lg:col-span-5) */}
                    <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                <KeyRound className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security Credentials</h2>
                                <p className="text-xs text-slate-500">Update your account login password.</p>
                            </div>
                        </div>

                        <form onSubmit={submitPassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="current_password" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Current Password
                                </Label>
                                <Input
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    type="password"
                                    autoComplete="current-password"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                                    placeholder="••••••••"
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="text-xs text-rose-500">{passwordForm.errors.current_password}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    New Password
                                </Label>
                                <Input
                                    id="password"
                                    ref={passwordInput}
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    type="password"
                                    autoComplete="new-password"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                                    placeholder="••••••••"
                                />
                                {passwordForm.errors.password && (
                                    <p className="text-xs text-rose-500">{passwordForm.errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Confirm New Password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    type="password"
                                    autoComplete="new-password"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                                    placeholder="••••••••"
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="text-xs text-rose-500">{passwordForm.errors.password_confirmation}</p>
                                )}
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="h-11 w-full text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all"
                                >
                                    {passwordForm.processing ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Updating Password...</span>
                                        </div>
                                    ) : (
                                        <span>Update Password</span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
