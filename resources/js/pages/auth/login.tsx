import { useForm } from '@inertiajs/react';
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: any;
}

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login.store'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Welcome Back" description="Sign in to your Sapta CRM admin account">
            {status && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center">
                    {status}
                </div>
            )}

            <form noValidate className="space-y-4" onSubmit={submit}>
                {/* Email Field */}
                <div>
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Email Address
                    </Label>
                    <div className="relative flex items-center">
                        <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
                            <Mail className="size-4.5" />
                        </div>
                        <input
                            id="email"
                            type="text"
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="admin@sapta.com"
                            className="h-11 w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all shadow-xs"
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                {/* Password Field */}
                <div>
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Password
                    </Label>
                    <div className="relative flex items-center">
                        <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
                            <Lock className="size-4.5" />
                        </div>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="h-11 w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all shadow-xs"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onCheckedChange={(checked) => setData('remember', Boolean(checked))}
                            tabIndex={3}
                            className="size-4 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                        />
                        <Label htmlFor="remember" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                            Keep me logged in
                        </Label>
                    </div>

                    {canResetPassword && (
                        <TextLink href={route('password.request')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold" tabIndex={5}>
                            Forgot password?
                        </TextLink>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#1741b6] text-white font-semibold text-sm shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all disabled:opacity-75 disabled:pointer-events-none mt-1"
                    tabIndex={4}
                    disabled={processing}
                >
                    {processing ? (
                        <div className="flex items-center justify-center gap-2">
                            <LoaderCircle className="size-4.5 animate-spin" />
                            <span>Authenticating...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <span>Sign In to Dashboard</span>
                            <ArrowRight className="size-4.5" />
                        </div>
                    )}
                </Button>
            </form>
        </AuthLayout>
    );
}
