import SearchableSelect from '@/components/searchable-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeDollarSign,
    Building,
    FileText,
    LineChart,
    LoaderCircle,
} from 'lucide-react';
import { FormEventHandler } from 'react';

interface SimpleClient {
    id: number;
    client_code: string;
    name: string;
    company_name: string | null;
    currency: string;
}

interface ServiceCategoryOption {
    id: number;
    name: string;
}

interface ServiceItem {
    id: number;
    client_id: number;
    category_id?: number | null;
    service_name: string;
    monthly_fee: number | string;
    contract_months: number;
    currency: string;
    start_date: string | null;
    billing_day: number;
    status: 'active' | 'paused' | 'stopped';
    notes: string | null;
}

interface ClientServicesEditProps {
    service: ServiceItem;
    clients: SimpleClient[];
    categories: ServiceCategoryOption[];
}

export default function ClientServiceEdit({ service, clients, categories }: ClientServicesEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Services', href: '/services' },
        { title: `Edit ${service.service_name}`, href: `/services/${service.id}/edit` },
    ];

    const formatForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0].split(' ')[0];
    };

    const form = useForm({
        client_id: service.client_id || '',
        category_id: service.category_id || '',
        service_name: service.service_name || '',
        monthly_fee: service.monthly_fee || '',
        contract_months: service.contract_months || 12,
        currency: service.currency || 'AED',
        start_date: formatForInput(service.start_date),
        billing_day: service.billing_day || 1,
        status: service.status || 'active',
        notes: service.notes || '',
    });

    const handleClientChange = (clientId: string) => {
        form.setData('client_id', clientId);
        const selected = clients.find((c) => String(c.id) === String(clientId));
        if (selected) {
            form.setData('currency', selected.currency);
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(`/services/${service.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Service - ${service.service_name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Edit Service
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Update monthly fee, status, billing schedule, and client assignment.
                        </p>
                    </div>

                    <Link
                        href="/services"
                        className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Services</span>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                    {/* Section 1: Basic Information */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <LineChart className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Service & Client Configuration
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Select client, service category, service name, and contract status.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="client_id" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Select Client *
                            </Label>
                            <SearchableSelect
                                options={clients.map((c) => ({
                                    value: c.id,
                                    label: c.name,
                                    subLabel: `${c.client_code} ${c.company_name ? `• ${c.company_name}` : ''}`,
                                }))}
                                value={form.data.client_id}
                                onChange={(val) => handleClientChange(String(val))}
                                placeholder="Choose a client..."
                                searchPlaceholder="Search client name or code..."
                            />
                            {form.errors.client_id && <p className="text-xs font-semibold text-rose-500">{form.errors.client_id}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="category_id" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Service Category *
                                </Label>
                                <SearchableSelect
                                    options={categories.map((cat) => ({
                                        value: cat.id,
                                        label: cat.name,
                                    }))}
                                    value={form.data.category_id}
                                    onChange={(val) => form.setData('category_id', val)}
                                    placeholder="Select Service Category"
                                    searchPlaceholder="Search category..."
                                    required
                                />
                                {form.errors.category_id && <p className="text-xs font-semibold text-rose-500">{form.errors.category_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="service_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Service Name *
                                </Label>
                                <Input
                                    id="service_name"
                                    value={form.data.service_name}
                                    onChange={(e) => form.setData('service_name', e.target.value)}
                                    placeholder="e.g. Monthly Web Maintenance"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    required
                                />
                                {form.errors.service_name && <p className="text-xs font-semibold text-rose-500">{form.errors.service_name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Contract Status *
                                </Label>
                                <select
                                    id="status"
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value as any)}
                                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                >
                                    <option value="active">Active Service</option>
                                    <option value="paused">Paused</option>
                                    <option value="stopped">Stopped / Closed</option>
                                </select>
                                {form.errors.status && <p className="text-xs font-semibold text-rose-500">{form.errors.status}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Compensation & Schedule */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <BadgeDollarSign className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Monthly Fee & Contract Schedule
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Monthly fee amount, billing currency, start date, and monthly billing day.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="monthly_fee" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Monthly Dues / Fee *
                                </Label>
                                <Input
                                    id="monthly_fee"
                                    type="number"
                                    step="0.01"
                                    value={form.data.monthly_fee}
                                    onChange={(e) => form.setData('monthly_fee', e.target.value)}
                                    placeholder="e.g. 3500"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-extrabold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-600 transition-all"
                                    required
                                />
                                {form.errors.monthly_fee && <p className="text-xs font-semibold text-rose-500">{form.errors.monthly_fee}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="contract_months" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Contract Duration (Months) *
                                </Label>
                                <Input
                                    id="contract_months"
                                    type="number"
                                    min={1}
                                    max={120}
                                    value={form.data.contract_months}
                                    onChange={(e) => form.setData('contract_months', e.target.value as any)}
                                    placeholder="e.g. 12"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    required
                                />
                                {form.errors.contract_months && <p className="text-xs font-semibold text-rose-500">{form.errors.contract_months}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="currency" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Billing Currency *
                                </Label>
                                <select
                                    id="currency"
                                    value={form.data.currency}
                                    onChange={(e) => form.setData('currency', e.target.value)}
                                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    required
                                >
                                    <option value="AED">AED - UAE Dirham</option>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="PKR">PKR - Pakistani Rupee</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="SAR">SAR - Saudi Riyal</option>
                                </select>
                                {form.errors.currency && <p className="text-xs font-semibold text-rose-500">{form.errors.currency}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="billing_day" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Monthly Due Day (1 - 31) *
                                </Label>
                                <Input
                                    id="billing_day"
                                    type="number"
                                    min={1}
                                    max={31}
                                    value={form.data.billing_day}
                                    onChange={(e) => form.setData('billing_day', e.target.value as any)}
                                    placeholder="e.g. 5"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    required
                                />
                                {form.errors.billing_day && <p className="text-xs font-semibold text-rose-500">{form.errors.billing_day}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="start_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Service Start Date *
                                </Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={form.data.start_date}
                                    onChange={(e) => form.setData('start_date', e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    required
                                />
                                {form.errors.start_date && <p className="text-xs font-semibold text-rose-500">{form.errors.start_date}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Notes */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Service Specifications & Notes
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Key deliverables, scope notes, or special instructions.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <textarea
                                id="notes"
                                rows={4}
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Add any custom instructions or deliverables..."
                                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                            />
                            {form.errors.notes && <p className="text-xs font-semibold text-rose-500">{form.errors.notes}</p>}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link
                            href="/services"
                            className="h-11 px-6 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center justify-center"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="h-11 px-7 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                            <span>Update Service</span>
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
