import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Client } from '@/types';
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

interface ClientEditProps {
    client: Client;
}

export default function ClientEdit({ client }: ClientEditProps) {
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
            title: `Edit ${client.name} (${client.client_code})`,
            href: `/clients/${client.id}/edit`,
        },
    ];

    const form = useForm({
        name: client.name || '',
        company_name: client.company_name || '',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        mobile: client.mobile || '',
        city: client.city || '',
        country: client.country || '',
        currency: client.currency || 'AED',
        status: client.status || 'active',
        notes: client.notes || '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(`/clients/${client.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Client - ${client.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header with Back Link on Right */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                {client.client_code}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Edit Client Profile Details
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Update client organization details, primary contact info, currency setup, and contract notes.
                        </p>
                    </div>

                    <Link
                        href="/clients"
                        className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Directory</span>
                    </Link>
                </div>

                <form noValidate onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Organization & Business Identity */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
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
                                <Input
                                    id="client_name"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Acme International LLC"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                                />
                                {form.errors.name && <p className="text-xs font-semibold text-rose-500">{form.errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="company_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Company / Legal Registered Name (Optional)
                                </Label>
                                <Input
                                    id="company_name"
                                    value={form.data.company_name}
                                    onChange={(e) => form.setData('company_name', e.target.value)}
                                    placeholder="e.g. Acme Tech Solutions FZ-LLC"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all"
                                />
                                {form.errors.company_name && <p className="text-xs font-semibold text-rose-500">{form.errors.company_name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="currency" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Default Billing Currency *
                                </Label>
                                <select
                                    id="currency"
                                    value={form.data.currency}
                                    onChange={(e) => form.setData('currency', e.target.value)}
                                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                >
                                    <option value="AED">AED - UAE Dirham (د.إ)</option>
                                    <option value="USD">USD - US Dollar ($)</option>
                                    <option value="PKR">PKR - Pakistani Rupee (Rs)</option>
                                    <option value="EUR">EUR - Euro (€)</option>
                                    <option value="GBP">GBP - British Pound (£)</option>
                                    <option value="SAR">SAR - Saudi Riyal (ر.س)</option>
                                </select>
                                {form.errors.currency && <p className="text-xs font-semibold text-rose-500">{form.errors.currency}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Account Status *
                                </Label>
                                <select
                                    id="status"
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value as 'active' | 'inactive')}
                                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                >
                                    <option value="active">Active Client</option>
                                    <option value="inactive">Inactive / On Hold</option>
                                </select>
                                {form.errors.status && <p className="text-xs font-semibold text-rose-500">{form.errors.status}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Primary Contact & Address */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <User className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Primary Contact Person & Location
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Key point of contact, official email, phone numbers, and physical location.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="contact_person" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Contact Person Name *
                                </Label>
                                <Input
                                    id="contact_person"
                                    value={form.data.contact_person}
                                    onChange={(e) => form.setData('contact_person', e.target.value)}
                                    placeholder="e.g. Sadiq Khan"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all"
                                />
                                {form.errors.contact_person && <p className="text-xs font-semibold text-rose-500">{form.errors.contact_person}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Email Address (Optional)
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    placeholder="sadiq@company.com"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all"
                                />
                                {form.errors.email && <p className="text-xs font-semibold text-rose-500">{form.errors.email}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="mobile" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Mobile / WhatsApp (Optional)
                                </Label>
                                <Input
                                    id="mobile"
                                    value={form.data.mobile}
                                    onChange={(e) => form.setData('mobile', e.target.value)}
                                    placeholder="+971 50 1234567"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all"
                                />
                                {form.errors.mobile && <p className="text-xs font-semibold text-rose-500">{form.errors.mobile}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Telephone / Office Line (Optional)
                                </Label>
                                <Input
                                    id="phone"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    placeholder="+971 4 9876543"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="city" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    City (Optional)
                                </Label>
                                <Input
                                    id="city"
                                    value={form.data.city}
                                    onChange={(e) => form.setData('city', e.target.value)}
                                    placeholder="Dubai"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="country" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Country (Optional)
                                </Label>
                                <Input
                                    id="country"
                                    value={form.data.country}
                                    onChange={(e) => form.setData('country', e.target.value)}
                                    placeholder="United Arab Emirates"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Contract Terms & Special Instructions */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
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
                                rows={4}
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Enter specific instructions, preferred communication channels, billing cycles, or contract terms..."
                                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all focus:outline-none"
                            />
                            {form.errors.notes && <p className="text-xs font-semibold text-rose-500">{form.errors.notes}</p>}
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-end gap-4 pt-4 pb-12 border-t border-slate-200/80 dark:border-slate-800">
                        <Link
                            href="/clients"
                            className="h-12 px-6 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center shadow-2xs"
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-12 px-8 text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                        >
                            {form.processing ? (
                                <div className="flex items-center gap-2">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Updating Client Profile...</span>
                                </div>
                            ) : (
                                <span>Update Client Profile</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
