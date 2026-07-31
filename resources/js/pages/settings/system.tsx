import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    Building,
    Check,
    Coins,
    FileText,
    Globe,
    LoaderCircle,
    Receipt,
    ShieldAlert,
    Sliders,
    Users,
} from 'lucide-react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Settings',
        href: '/settings',
    },
];

export interface SystemCurrencyItem {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate_to_pkr: number;
    is_base: boolean;
    is_active: boolean;
}

interface SystemSettingsProps {
    settings: {
        company_name: string;
        company_email: string;
        company_phone: string;
        company_address: string;
        company_tax_id: string;
        base_currency: string;
        invoice_prefix: string;
        default_tax_rate: string | number;
        auto_exchange_rates: boolean;
        default_project_deadline_days: string | number;
        monthly_working_days: string | number;
        default_paid_leaves: string | number;
        email_notifications: boolean;
        overdue_payment_alerts: boolean;
        maintenance_mode: boolean;
    };
    currencies: SystemCurrencyItem[];
    status?: string;
}

export default function SystemSettings({ settings, currencies, status }: SystemSettingsProps) {
    const form = useForm({
        company_name: settings.company_name || 'Sapta Technologies',
        company_email: settings.company_email || 'contact@saptatechnologies.com',
        company_phone: settings.company_phone || '+92 300 1234567',
        company_address: settings.company_address || 'Office #402, Software Technology Park, Lahore, Pakistan',
        company_tax_id: settings.company_tax_id || 'NTN-892415-0',
        base_currency: settings.base_currency || 'PKR',
        invoice_prefix: settings.invoice_prefix || 'SAPTA-INV-',
        default_tax_rate: settings.default_tax_rate ?? 0,
        auto_exchange_rates: settings.auto_exchange_rates ?? true,
        default_project_deadline_days: settings.default_project_deadline_days ?? 30,
        monthly_working_days: settings.monthly_working_days ?? 26,
        default_paid_leaves: settings.default_paid_leaves ?? 1.5,
        email_notifications: settings.email_notifications ?? true,
        overdue_payment_alerts: settings.overdue_payment_alerts ?? true,
        maintenance_mode: settings.maintenance_mode ?? false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post('/settings', {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Configuration" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            System Configuration & Agency Preferences
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage company business profile, financial base currencies, HR defaults, and security controls.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                        <Link
                            href="/currencies"
                            className="h-11 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs"
                        >
                            <Coins className="size-4 text-amber-500" />
                            <span>Currencies Management</span>
                        </Link>
                    </div>
                </div>

                {/* Status Alert */}
                {status && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2.5 shadow-xs">
                        <Check className="size-5 text-emerald-600 shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={submit} noValidate className="space-y-6 w-full">
                    {/* Section 1: Company Profile & Business Details */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Building className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Company Information & Identity</h2>
                                <p className="text-xs text-slate-500">Official business identity printed on proposals, invoices, and client contracts.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="company_name" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Company Name *
                                </Label>
                                <Input
                                    id="company_name"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_name}
                                    onChange={(e) => form.setData('company_name', e.target.value)}
                                    placeholder="Sapta Technologies"
                                />
                                {form.errors.company_name && <p className="text-xs font-semibold text-rose-500">{form.errors.company_name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company_email" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Official Business Email *
                                </Label>
                                <Input
                                    id="company_email"
                                    type="email"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_email}
                                    onChange={(e) => form.setData('company_email', e.target.value)}
                                    placeholder="contact@saptatechnologies.com"
                                />
                                {form.errors.company_email && <p className="text-xs font-semibold text-rose-500">{form.errors.company_email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company_phone" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Contact Phone Number
                                </Label>
                                <Input
                                    id="company_phone"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_phone}
                                    onChange={(e) => form.setData('company_phone', e.target.value)}
                                    placeholder="+92 300 1234567"
                                />
                                {form.errors.company_phone && <p className="text-xs font-semibold text-rose-500">{form.errors.company_phone}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company_tax_id" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    NTN / Tax Registration Number
                                </Label>
                                <Input
                                    id="company_tax_id"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_tax_id}
                                    onChange={(e) => form.setData('company_tax_id', e.target.value)}
                                    placeholder="e.g. NTN-892415-0"
                                />
                                {form.errors.company_tax_id && <p className="text-xs font-semibold text-rose-500">{form.errors.company_tax_id}</p>}
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="company_address" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Office Headquarters Address
                                </Label>
                                <Input
                                    id="company_address"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_address}
                                    onChange={(e) => form.setData('company_address', e.target.value)}
                                    placeholder="Office #402, Software Technology Park, Lahore, Pakistan"
                                />
                                {form.errors.company_address && <p className="text-xs font-semibold text-rose-500">{form.errors.company_address}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Multi-Currency, Invoicing & Financial Setup */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                    <Coins className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Finance, Invoicing & Multi-Currency Engine</h2>
                                    <p className="text-xs text-slate-500">Base PKR reporting, invoice generation defaults, and live currency conversions.</p>
                                </div>
                            </div>

                            <Link
                                href="/currencies"
                                className="h-9 px-4 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all inline-flex items-center gap-1.5 shadow-2xs"
                            >
                                <Coins className="size-3.5" />
                                <span>Manage Currencies</span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="base_currency" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    System Base Reporting Currency *
                                </Label>
                                <select
                                    id="base_currency"
                                    value={form.data.base_currency}
                                    onChange={(e) => form.setData('base_currency', e.target.value)}
                                    className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white px-4 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                                >
                                    {currencies.length > 0 ? (
                                        currencies.map((c) => (
                                            <option key={c.id} value={c.code}>
                                                {c.name} ({c.code} - {c.symbol})
                                            </option>
                                        ))
                                    ) : (
                                        <option value="PKR">Pakistani Rupee (PKR)</option>
                                    )}
                                </select>
                                {form.errors.base_currency && <p className="text-xs font-semibold text-rose-500">{form.errors.base_currency}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="invoice_prefix" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Invoice Prefix *
                                </Label>
                                <Input
                                    id="invoice_prefix"
                                    className="h-11 rounded-xl uppercase font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.invoice_prefix}
                                    onChange={(e) => form.setData('invoice_prefix', e.target.value.toUpperCase())}
                                    placeholder="SAPTA-INV-"
                                />
                                {form.errors.invoice_prefix && <p className="text-xs font-semibold text-rose-500">{form.errors.invoice_prefix}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="default_tax_rate" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Default Tax / GST Rate (%)
                                </Label>
                                <Input
                                    id="default_tax_rate"
                                    type="number"
                                    step="0.1"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.default_tax_rate}
                                    onChange={(e) => form.setData('default_tax_rate', e.target.value)}
                                    placeholder="0"
                                />
                                {form.errors.default_tax_rate && <p className="text-xs font-semibold text-rose-500">{form.errors.default_tax_rate}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <input
                                id="auto_exchange_rates"
                                type="checkbox"
                                checked={form.data.auto_exchange_rates}
                                onChange={(e) => form.setData('auto_exchange_rates', e.target.checked)}
                                className="size-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                            />
                            <Label htmlFor="auto_exchange_rates" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                Enable multi-currency PKR auto-conversion on client project & payment entries
                            </Label>
                        </div>

                        {/* PKR Currency Reference Rates Live Grid */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                Active System Exchange Rates to 1 PKR
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                {currencies.map((c) => (
                                    <div key={c.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block">1 {c.code} ({c.symbol})</span>
                                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm block">
                                            PKR {Number(c.exchange_rate_to_pkr).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Agency Operations & HR Defaults */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <Sliders className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Agency Operations & HR Defaults</h2>
                                <p className="text-xs text-slate-500">Standard project targets, monthly payroll working days, and leave defaults.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="default_project_deadline_days" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Target Project Duration (Days) *
                                </Label>
                                <Input
                                    id="default_project_deadline_days"
                                    type="number"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.default_project_deadline_days}
                                    onChange={(e) => form.setData('default_project_deadline_days', e.target.value)}
                                    placeholder="30"
                                />
                                {form.errors.default_project_deadline_days && <p className="text-xs font-semibold text-rose-500">{form.errors.default_project_deadline_days}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="monthly_working_days" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Payroll Working Days / Month *
                                </Label>
                                <Input
                                    id="monthly_working_days"
                                    type="number"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.monthly_working_days}
                                    onChange={(e) => form.setData('monthly_working_days', e.target.value)}
                                    placeholder="26"
                                />
                                {form.errors.monthly_working_days && <p className="text-xs font-semibold text-rose-500">{form.errors.monthly_working_days}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="default_paid_leaves" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Monthly Paid Leaves / Employee *
                                </Label>
                                <Input
                                    id="default_paid_leaves"
                                    type="number"
                                    step="0.5"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.default_paid_leaves}
                                    onChange={(e) => form.setData('default_paid_leaves', e.target.value)}
                                    placeholder="1.5"
                                />
                                {form.errors.default_paid_leaves && <p className="text-xs font-semibold text-rose-500">{form.errors.default_paid_leaves}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Notifications & System Controls */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                <Bell className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications & Security Controls</h2>
                                <p className="text-xs text-slate-500">Configure automated alerts, overdue dues flagging, and system maintenance lock.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    id="email_notifications"
                                    type="checkbox"
                                    checked={form.data.email_notifications}
                                    onChange={(e) => form.setData('email_notifications', e.target.checked)}
                                    className="size-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                />
                                <Label htmlFor="email_notifications" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Enable transactional email notifications for project milestones & payment receipts
                                </Label>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    id="overdue_payment_alerts"
                                    type="checkbox"
                                    checked={form.data.overdue_payment_alerts}
                                    onChange={(e) => form.setData('overdue_payment_alerts', e.target.checked)}
                                    className="size-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                />
                                <Label htmlFor="overdue_payment_alerts" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Automatically flag overdue payment milestones on Client and Project detail pages
                                </Label>
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <input
                                    id="maintenance_mode"
                                    type="checkbox"
                                    checked={form.data.maintenance_mode}
                                    onChange={(e) => form.setData('maintenance_mode', e.target.checked)}
                                    className="size-4.5 rounded border-slate-300 text-rose-600 focus:ring-rose-600"
                                />
                                <div>
                                    <Label htmlFor="maintenance_mode" className="text-xs font-bold text-rose-600 dark:text-rose-400 cursor-pointer block">
                                        Enable System Maintenance Lock
                                    </Label>
                                    <p className="text-[11px] text-slate-400">Lock non-admin access during database updates or system upgrades.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Standardized Primary Sapta Blue Button */}
                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-11 px-8 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all"
                        >
                            {form.processing ? (
                                <div className="flex items-center gap-2">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Saving Configuration...</span>
                                </div>
                            ) : (
                                <span>Save System Configuration</span>
                            )}
                        </Button>

                        <Transition
                            show={form.recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                <Check className="size-4" />
                                Configuration Saved Successfully
                            </span>
                        </Transition>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
