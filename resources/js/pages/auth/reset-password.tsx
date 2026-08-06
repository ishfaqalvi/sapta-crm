import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle, Lock, Mail } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

interface ResetPasswordForm {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
    [key: string]: any;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Set New Password" description="Create a secure new password for your account to regain access">
            <Head title="Reset Password" />

            <form noValidate className="space-y-4" onSubmit={submit}>
                {/* Email Address (ReadOnly) */}
                <div>
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                        Email Address
                    </Label>
                    <div className="relative flex items-center">
                        <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
                            <Mail className="size-4.5" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            readOnly
                            className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 pl-10 pr-4 text-sm font-semibold text-slate-600 dark:text-slate-400 cursor-not-allowed shadow-xs"
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                {/* New Password */}
                <div>
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                        New Password *
                    </Label>
                    <div className="relative flex items-center">
                        <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
                            <Lock className="size-4.5" />
                        </div>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            autoComplete="new-password"
                            autoFocus
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Enter new password"
                            className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-10 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all shadow-xs"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                {/* Confirm New Password */}
                <div>
                    <Label htmlFor="password_confirmation" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                        Confirm New Password *
                    </Label>
                    <div className="relative flex items-center">
                        <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
                            <Lock className="size-4.5" />
                        </div>
                        <input
                            id="password_confirmation"
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirm new password"
                            className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-10 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all shadow-xs"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                        </button>
                    </div>
                    <InputError message={errors.password_confirmation} />
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#1741b6] text-white font-semibold text-sm shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all disabled:opacity-75 disabled:pointer-events-none cursor-pointer mt-2"
                    disabled={processing}
                >
                    {processing ? (
                        <div className="flex items-center justify-center gap-2">
                            <LoaderCircle className="size-4.5 animate-spin" />
                            <span>Updating Password...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <span>Reset Password & Log In</span>
                            <CheckCircle2 className="size-4.5" />
                        </div>
                    )}
                </Button>
            </form>

            <div className="text-slate-500 dark:text-slate-400 text-center text-xs font-medium pt-2">
                <span>Or return to </span>
                <TextLink href={route('login')} className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1">
                    <ArrowLeft className="size-3.5" />
                    <span>Log In Page</span>
                </TextLink>
            </div>
        </AuthLayout>
    );
}
