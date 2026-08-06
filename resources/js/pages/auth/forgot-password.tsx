import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle, Mail, Send } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout title="Forgot Password?" description="Enter your registered email address to receive password reset link">
            <Head title="Forgot Password" />

            {status && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center">
                    {status}
                </div>
            )}

            <form noValidate className="space-y-5" onSubmit={submit}>
                <div>
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                        Email Address *
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
                            autoFocus
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="admin@sapta.com"
                            className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 transition-all shadow-xs"
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <Button
                    type="submit"
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#1741b6] text-white font-semibold text-sm shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all disabled:opacity-75 disabled:pointer-events-none cursor-pointer"
                    disabled={processing}
                >
                    {processing ? (
                        <div className="flex items-center justify-center gap-2">
                            <LoaderCircle className="size-4.5 animate-spin" />
                            <span>Sending Reset Link...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <span>Email Password Reset Link</span>
                            <Send className="size-4" />
                        </div>
                    )}
                </Button>
            </form>

            <div className="text-slate-500 dark:text-slate-400 text-center text-xs font-medium pt-2">
                <span>Remember your password? </span>
                <TextLink href={route('login')} className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1">
                    <ArrowLeft className="size-3.5" />
                    <span>Return to Log In</span>
                </TextLink>
            </div>
        </AuthLayout>
    );
}
