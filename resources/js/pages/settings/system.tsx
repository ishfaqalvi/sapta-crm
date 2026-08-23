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
    Calendar,
    Check,
    Clock,
    Coins,
    FileText,
    Globe,
    LoaderCircle,
    Receipt,
    Server,
    ShieldAlert,
    Sliders,
    Users,
    Zap,
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
        domain_alert_first_days?: string | number;
        domain_alert_urgent_days?: string | number;
        hosting_alert_first_days?: string | number;
        hosting_alert_urgent_days?: string | number;
        invoice_due_alert_days?: string | number;
        task_due_alert_days?: string | number;
        daily_digest_enabled?: boolean;
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
        email_notifications: settings.email_notifications ?? false,
        overdue_payment_alerts: settings.overdue_payment_alerts ?? true,
        maintenance_mode: settings.maintenance_mode ?? false,
        // Configurable Cron Alert Thresholds
        domain_alert_first_days: settings.domain_alert_first_days ?? 30,
        domain_alert_urgent_days: settings.domain_alert_urgent_days ?? 7,
        hosting_alert_first_days: settings.hosting_alert_first_days ?? 15,
        hosting_alert_urgent_days: settings.hosting_alert_urgent_days ?? 7,
        invoice_due_alert_days: settings.invoice_due_alert_days ?? 3,
        task_due_alert_days: settings.task_due_alert_days ?? 1,
        daily_digest_enabled: settings.daily_digest_enabled ?? true,
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
                            System Configuration & Preferences
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage company business profile, financial defaults, HR rules, and automated notification thresholds.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                        <Link
                            href="/currencies"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs"
                        >
                            <Coins className="size-4 text-amber-500" />
                            <span>Currencies Management</span>
                        </Link>
                    </div>
                </div>

                {/* Status Alert */}
                {status && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-2xs">
                        <Check className="size-4" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    {/* Section 1: Company Profile */}
                    <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Building className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">Agency Business Information</h2>
                                <p className="text-xs text-slate-500">Legal agency details printed on official Invoices and Statements.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="company_name" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Company / Agency Name *
                                </Label>
                                <Input
                                    id="company_name"
                                    type="text"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_name}
                                    onChange={(e) => form.setData('company_name', e.target.value)}
                                    required
                                />
                                {form.errors.company_name && <p className="text-xs font-semibold text-rose-500">{form.errors.company_name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company_email" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Official Contact Email *
                                </Label>
                                <Input
                                    id="company_email"
                                    type="email"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_email}
                                    onChange={(e) => form.setData('company_email', e.target.value)}
                                    required
                                />
                                {form.errors.company_email && <p className="text-xs font-semibold text-rose-500">{form.errors.company_email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company_phone" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Business Phone Number
                                </Label>
                                <Input
                                    id="company_phone"
                                    type="text"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_phone}
                                    onChange={(e) => form.setData('company_phone', e.target.value)}
                                    placeholder="+92 300 1234567"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company_tax_id" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Tax Registration / NTN ID
                                </Label>
                                <Input
                                    id="company_tax_id"
                                    type="text"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_tax_id}
                                    onChange={(e) => form.setData('company_tax_id', e.target.value)}
                                    placeholder="NTN-892415-0"
                                />
                            </div>

                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="company_address" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Official Business Address
                                </Label>
                                <Input
                                    id="company_address"
                                    type="text"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.company_address}
                                    onChange={(e) => form.setData('company_address', e.target.value)}
                                    placeholder="Office #402, Software Technology Park, Lahore, Pakistan"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Financial & Invoicing Defaults */}
                    <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <Receipt className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">Finance & Billing Defaults</h2>
                                <p className="text-xs text-slate-500">Base currency, invoice code patterns, and tax rates.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="base_currency" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Base System Currency *
                                </Label>
                                <select
                                    id="base_currency"
                                    className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all px-3 cursor-pointer"
                                    value={form.data.base_currency}
                                    onChange={(e) => form.setData('base_currency', e.target.value)}
                                >
                                    {currencies.map((c) => (
                                        <option key={c.id} value={c.code}>
                                            {c.code} - {c.name} ({c.symbol})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="invoice_prefix" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Invoice Number Prefix *
                                </Label>
                                <Input
                                    id="invoice_prefix"
                                    type="text"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold font-mono text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.invoice_prefix}
                                    onChange={(e) => form.setData('invoice_prefix', e.target.value)}
                                    placeholder="SAPTA-INV-"
                                    required
                                />
                                {form.errors.invoice_prefix && <p className="text-xs font-semibold text-rose-500">{form.errors.invoice_prefix}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="default_tax_rate" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Default Tax Rate (%)
                                </Label>
                                <Input
                                    id="default_tax_rate"
                                    type="number"
                                    step="0.01"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.default_tax_rate}
                                    onChange={(e) => form.setData('default_tax_rate', e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Operations & HR Defaults */}
                    <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">Operations & Payroll Policies</h2>
                                <p className="text-xs text-slate-500">Project delivery milestones and monthly working days benchmarks.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="default_project_deadline_days" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Default Project Duration (Days) *
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

                    {/* Section 4: Automated Cron Notification Thresholds */}
                    <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-blue-200/90 dark:border-blue-900/60 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Clock className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily Cron Job Alert Thresholds</h2>
                                <p className="text-xs text-slate-500">Configure how many days in advance automated alert notifications are dispatched to clients and staff.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="domain_alert_first_days" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Domain 1st Reminder (Days Before) *
                                </Label>
                                <Input
                                    id="domain_alert_first_days"
                                    type="number"
                                    min="1"
                                    max="180"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.domain_alert_first_days}
                                    onChange={(e) => form.setData('domain_alert_first_days', e.target.value)}
                                    placeholder="30"
                                    required
                                />
                                <p className="text-[11px] text-slate-400">Default: 30 days before expiration</p>
                                {form.errors.domain_alert_first_days && <p className="text-xs font-semibold text-rose-500">{form.errors.domain_alert_first_days}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="domain_alert_urgent_days" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Domain Urgent Reminder (Days Before) *
                                </Label>
                                <Input
                                    id="domain_alert_urgent_days"
                                    type="number"
                                    min="1"
                                    max="60"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.domain_alert_urgent_days}
                                    onChange={(e) => form.setData('domain_alert_urgent_days', e.target.value)}
                                    placeholder="7"
                                    required
                                />
                                <p className="text-[11px] text-slate-400">Default: 7 days before expiration</p>
                                {form.errors.domain_alert_urgent_days && <p className="text-xs font-semibold text-rose-500">{form.errors.domain_alert_urgent_days}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="hosting_alert_first_days" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Hosting 1st Reminder (Days Before) *
                                </Label>
                                <Input
                                    id="hosting_alert_first_days"
                                    type="number"
                                    min="1"
                                    max="180"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.hosting_alert_first_days}
                                    onChange={(e) => form.setData('hosting_alert_first_days', e.target.value)}
                                    placeholder="15"
                                    required
                                />
                                <p className="text-[11px] text-slate-400">Default: 15 days before renewal</p>
                                {form.errors.hosting_alert_first_days && <p className="text-xs font-semibold text-rose-500">{form.errors.hosting_alert_first_days}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="hosting_alert_urgent_days" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Hosting Urgent Reminder (Days Before) *
                                </Label>
                                <Input
                                    id="hosting_alert_urgent_days"
                                    type="number"
                                    min="1"
                                    max="60"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.hosting_alert_urgent_days}
                                    onChange={(e) => form.setData('hosting_alert_urgent_days', e.target.value)}
                                    placeholder="7"
                                    required
                                />
                                <p className="text-[11px] text-slate-400">Default: 7 days before renewal</p>
                                {form.errors.hosting_alert_urgent_days && <p className="text-xs font-semibold text-rose-500">{form.errors.hosting_alert_urgent_days}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="invoice_due_alert_days" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Invoice Due Reminder (Days Before) *
                                </Label>
                                <Input
                                    id="invoice_due_alert_days"
                                    type="number"
                                    min="1"
                                    max="60"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.invoice_due_alert_days}
                                    onChange={(e) => form.setData('invoice_due_alert_days', e.target.value)}
                                    placeholder="3"
                                    required
                                />
                                <p className="text-[11px] text-slate-400">Default: 3 days before invoice due date</p>
                                {form.errors.invoice_due_alert_days && <p className="text-xs font-semibold text-rose-500">{form.errors.invoice_due_alert_days}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="task_due_alert_days" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Task Deadline Alert (Days Before) *
                                </Label>
                                <Input
                                    id="task_due_alert_days"
                                    type="number"
                                    min="1"
                                    max="30"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    value={form.data.task_due_alert_days}
                                    onChange={(e) => form.setData('task_due_alert_days', e.target.value)}
                                    placeholder="1"
                                    required
                                />
                                <p className="text-[11px] text-slate-400">Default: 1 day before due date</p>
                                {form.errors.task_due_alert_days && <p className="text-xs font-semibold text-rose-500">{form.errors.task_due_alert_days}</p>}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <input
                                    id="daily_digest_enabled"
                                    type="checkbox"
                                    checked={form.data.daily_digest_enabled}
                                    onChange={(e) => form.setData('daily_digest_enabled', e.target.checked)}
                                    className="size-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                />
                                <Label htmlFor="daily_digest_enabled" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Enable Super Admin Daily Morning Briefing Digest Notification
                                </Label>
                            </div>
                            <p className="text-[11px] text-slate-400 ml-7.5 mt-0.5">Sends a morning briefing consolidating expiring domains, hostings, overdue invoices, and due tasks.</p>
                        </div>
                    </div>

                    {/* Section 5: Security & Maintenance */}
                    <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                <ShieldAlert className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">Security & Access Controls</h2>
                                <p className="text-xs text-slate-500">System maintenance lock and payment alerts.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <input
                                    id="overdue_payment_alerts"
                                    type="checkbox"
                                    checked={form.data.overdue_payment_alerts}
                                    onChange={(e) => form.setData('overdue_payment_alerts', e.target.checked)}
                                    className="size-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                />
                                <Label htmlFor="overdue_payment_alerts" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Automatically highlight overdue payment badges across Client and Project views
                                </Label>
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <input
                                    id="maintenance_mode"
                                    type="checkbox"
                                    checked={form.data.maintenance_mode}
                                    onChange={(e) => form.setData('maintenance_mode', e.target.checked)}
                                    className="size-4.5 rounded border-slate-300 text-rose-600 focus:ring-rose-600 cursor-pointer"
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
                            className="h-11 px-8 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer"
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
