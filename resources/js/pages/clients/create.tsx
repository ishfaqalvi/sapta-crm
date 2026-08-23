import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building,
    Building2,
    Coins,
    Globe,
    FileText,
    LoaderCircle,
    Mail,
    MapPin,
    Phone,
    User,
} from 'lucide-react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Client Hub',
        href: '/clients',
    },
    {
        title: 'Add New Client',
        href: '/clients/create',
    },
];

interface ClientCreateProps {
    next_client_code: string;
}

export default function ClientCreate({ next_client_code }: ClientCreateProps) {
    const form = useForm({
        name: '',
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        mobile: '',
        city: '',
        country: '',
        currency: 'AED',
        status: 'active' as 'active' | 'inactive',
        notes: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post('/clients');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add New Client" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header with Back Link on Right */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                {next_client_code}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Add New Client Profile
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Register client organization, primary contact details, currency setup, and retainer agreements.
                        </p>
                    </div>

                    <Link
                        href="/clients"
                        className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Directory</span>
                    </Link>
                </div>

                <form noValidate onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Organization & Business Identity */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Building className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Organization & Business Setup
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Client organization name, legal business entity, currency preference, and account status.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="client_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Client / Organization Name *
                                </Label>
                                <input
                                    id="client_name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Acme International LLC"
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        form.errors.name
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                />
                                {form.errors.name && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Company / Legal Registered Name (Optional)
                                </Label>
                                <input
                                    id="company_name"
                                    value={form.data.company_name}
                                    onChange={(e) => form.setData('company_name', e.target.value)}
                                    placeholder="e.g. Acme Tech Solutions FZ-LLC"
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        form.errors.company_name
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                />
                                {form.errors.company_name && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.company_name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="currency" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Default Billing Currency *
                                </Label>
                                <select
                                    id="currency"
                                    value={form.data.currency}
                                    onChange={(e) => form.setData('currency', e.target.value)}
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold text-slate-900 dark:text-white focus:outline-none transition-all cursor-pointer ${
                                        form.errors.currency
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                >
                                    <option value="AED">AED - UAE Dirham (د.إ)</option>
                                    <option value="USD">USD - US Dollar ($)</option>
                                    <option value="PKR">PKR - Pakistani Rupee (Rs)</option>
                                    <option value="EUR">EUR - Euro (€)</option>
                                    <option value="GBP">GBP - British Pound (£)</option>
                                    <option value="SAR">SAR - Saudi Riyal (ر.س)</option>
                                </select>
                                {form.errors.currency && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.currency}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Account Status *
                                </Label>
                                <select
                                    id="status"
                                    value={form.data.status}
                                    onChange={(e: any) => form.setData('status', e.target.value)}
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold text-slate-900 dark:text-white focus:outline-none transition-all cursor-pointer ${
                                        form.errors.status
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                >
                                    <option value="active">Active Client</option>
                                    <option value="inactive">Inactive / On-Hold</option>
                                </select>
                                {form.errors.status && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.status}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contact Records */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <User className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Primary Contact Person & Location
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Individual contact record, official email address, phone, and geographic location.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="contact_person" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Primary Contact Person Name *
                                </Label>
                                <input
                                    id="contact_person"
                                    value={form.data.contact_person}
                                    onChange={(e) => form.setData('contact_person', e.target.value)}
                                    placeholder="e.g. John Doe"
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        form.errors.contact_person
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                />
                                {form.errors.contact_person && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.contact_person}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Email Address (Optional)
                                </Label>
                                <input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    placeholder="john@acme.com"
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        form.errors.email
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                />
                                {form.errors.email && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="mobile" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Mobile / WhatsApp (Optional)
                                </Label>
                                <input
                                    id="mobile"
                                    value={form.data.mobile}
                                    onChange={(e) => form.setData('mobile', e.target.value)}
                                    placeholder="+971 50 1234567"
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        form.errors.mobile
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                />
                                {form.errors.mobile && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.mobile}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Telephone Line (Optional)
                                </Label>
                                <input
                                    id="phone"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    placeholder="+971 4 9876543"
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        form.errors.phone
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                />
                                {form.errors.phone && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.phone}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="city" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    City (Optional)
                                </Label>
                                <input
                                    id="city"
                                    value={form.data.city}
                                    onChange={(e) => form.setData('city', e.target.value)}
                                    placeholder="Dubai"
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        form.errors.city
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                />
                                {form.errors.city && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.city}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="country" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Country (Optional)
                                </Label>
                                <input
                                    id="country"
                                    value={form.data.country}
                                    onChange={(e) => form.setData('country', e.target.value)}
                                    placeholder="United Arab Emirates"
                                    className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        form.errors.country
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                    }`}
                                />
                                {form.errors.country && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.country}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Notes & Instructions */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Retainer Terms & Special Instructions
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Specify contract notes, billing cycles, or communication requirements.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Client Notes & Special Instructions (Optional)
                            </Label>
                            <textarea
                                id="notes"
                                rows={3}
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Enter specific instructions, preferred communication channels, billing cycles, or contract terms..."
                                className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950 border p-3 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                    form.errors.notes
                                        ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                        : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900'
                                }`}
                            />
                            {form.errors.notes && <p className="text-[11px] font-semibold text-rose-500 mt-1">{form.errors.notes}</p>}
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-end gap-4 pt-4 pb-12 border-t border-slate-200/80 dark:border-slate-800">
                        <Link
                            href="/clients"
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center shadow-2xs"
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {form.processing ? (
                                <div className="flex items-center gap-2">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Saving Client Profile...</span>
                                </div>
                            ) : (
                                <span>Save Client Profile</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
