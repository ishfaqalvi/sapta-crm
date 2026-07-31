import { Head } from '@inertiajs/react';
import { ArrowUpRight, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthLayout({ children, title = 'Sign In', description = 'Access your Sapta CRM portal' }: AuthLayoutProps) {
    return (
        <div className="relative h-screen max-h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans flex items-center justify-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
            <Head title={`${title} | Sapta Technologies CRM`} />

            {/* Soft Ambient Background Spotlights */}
            <div className="pointer-events-none absolute -top-40 -left-40 size-[500px] rounded-full bg-blue-400/10 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-40 -right-40 size-[500px] rounded-full bg-cyan-400/10 blur-[120px]" />

            {/* Subtle Light Grid Pattern */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:3rem_3rem]" />

            {/* Master Card Container - Perfectly Proportioned 100vh Non-Scrolling Fit */}
            <div className="relative z-10 w-full max-w-4xl h-[520px] max-h-[90vh] rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-300/60 overflow-hidden grid grid-cols-1 md:grid-cols-12">

                {/* Left Brand Panel (md:col-span-5) */}
                <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 relative overflow-hidden bg-gradient-to-br from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white">
                    {/* Panel Glow */}
                    <div className="pointer-events-none absolute -top-20 -left-20 size-72 rounded-full bg-white/10 blur-[60px]" />
                    <div className="pointer-events-none absolute -bottom-20 -right-20 size-72 rounded-full bg-blue-300/20 blur-[60px]" />

                    {/* Top Logo Badge - Original Colors (No Invert) */}
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2.5 rounded-2xl bg-white p-2.5 px-4 shadow-md border border-slate-100">
                            <img src="/logo_clean.png" alt="Sapta Technologies" className="h-7 w-auto object-contain" />
                            <div className="h-4 w-px bg-slate-200" />
                            <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">
                                CRM
                            </span>
                        </div>
                    </div>

                    {/* Center Brand Text & Features */}
                    <div className="relative z-10 space-y-4 my-auto">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm">
                            <Sparkles className="size-3" />
                            Your Vision, Our Code
                        </div>

                        <h2 className="text-xl font-bold tracking-tight text-white leading-snug">
                            Sapta Intelligent Business CRM
                        </h2>

                        <p className="text-xs text-blue-100/90 leading-relaxed font-normal">
                            Centralized client operations, multi-currency reporting, and automated workflow tracking.
                        </p>

                        <div className="space-y-2.5 pt-1">
                            <div className="flex items-center gap-2.5 text-xs font-semibold text-white/95">
                                <div className="p-1.5 rounded-lg bg-white/15 border border-white/20 shrink-0">
                                    <Zap className="size-3.5 text-yellow-300" />
                                </div>
                                <span>Multi-Currency Exchange Engine</span>
                            </div>

                            <div className="flex items-center gap-2.5 text-xs font-semibold text-white/95">
                                <div className="p-1.5 rounded-lg bg-white/15 border border-white/20 shrink-0">
                                    <ShieldCheck className="size-3.5 text-cyan-300" />
                                </div>
                                <span>Enterprise Security & Audit Trail</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] text-blue-200/80 pt-3 border-t border-white/15 font-medium">
                        <span>© {new Date().getFullYear()} Sapta Technologies</span>
                        <a href="https://saptatechnologies.com" target="_blank" rel="noreferrer" className="text-white hover:text-blue-100 font-semibold flex items-center gap-0.5">
                            <span>Website</span>
                            <ArrowUpRight className="size-3" />
                        </a>
                    </div>
                </div>

                {/* Right Form Panel (md:col-span-7) */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-center p-6 sm:p-10 relative bg-white overflow-hidden">
                    {/* Mobile Top Logo Header */}
                    <div className="mb-5 md:hidden flex justify-center">
                        <img src="/logo_clean.png" alt="Sapta Technologies" className="h-8 w-auto object-contain" />
                    </div>

                    {/* Form Container - Properly Constrained Width */}
                    <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto space-y-5">
                        <div className="space-y-1 text-center md:text-left">
                            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                                {title}
                            </h3>
                            <p className="text-xs font-medium text-slate-500">
                                {description}
                            </p>
                        </div>

                        {children}
                    </div>
                </div>

            </div>
        </div>
    );
}
