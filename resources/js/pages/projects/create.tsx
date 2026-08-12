import SearchableSelect from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeDollarSign,
    Building,
    Calendar,
    Clock,
    FileText,
    Globe,
    LoaderCircle,
} from 'lucide-react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Website Projects',
        href: '/website-projects',
    },
    {
        title: 'Add Website Project',
        href: '/website-projects/create',
    },
];

interface SimpleClient {
    id: number;
    client_code: string;
    name: string;
    company_name: string | null;
    currency: string;
}

interface ProjectCategoryOption {
    id: number;
    name: string;
    color: string | null;
}

interface WebsiteProjectCreateProps {
    clients: SimpleClient[];
    categories: ProjectCategoryOption[];
}

export default function WebsiteProjectCreate({ clients, categories }: WebsiteProjectCreateProps) {
    const form = useForm({
        client_id: (clients.length > 0 ? clients[0].id : '') as string | number,
        category_id: '' as string | number,
        project_name: '',
        total_budget: '' as string | number,
        currency: clients.length > 0 ? clients[0].currency : 'AED',
        start_date: new Date().toISOString().split('T')[0],
        deadline: '',
        status: 'in_progress' as 'in_progress' | 'on_hold' | 'completed' | 'cancelled',
        progress_percentage: 0 as number | string,
        notes: '',
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
        form.post('/website-projects');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Website Project" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header with Back Link on Right */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Add New Website Project
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Set up website development contract, client assignment, total budget, deadline, and initial progress.
                        </p>
                    </div>

                    <Link
                        href="/website-projects"
                        className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Projects</span>
                    </Link>
                </div>

                <form noValidate onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Client & Project Setup */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Building className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Client & Project Assignment
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Assign project to client organization and specify project title & status.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="client_id" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Select Client *
                                </Label>
                                <SearchableSelect
                                    id="client_id"
                                    options={clients.map((c) => ({
                                        value: c.id,
                                        label: `${c.name} (${c.client_code})`,
                                        subLabel: c.company_name || undefined,
                                    }))}
                                    value={form.data.client_id}
                                    onChange={handleClientChange}
                                    placeholder="Search and select client..."
                                    searchPlaceholder="Type client name or code..."
                                    required
                                />
                                {form.errors.client_id && (
                                    <p className="text-xs font-semibold text-rose-500">{form.errors.client_id}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="category_id" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Project Category
                                </Label>
                                <SearchableSelect
                                    id="category_id"
                                    options={categories.map((cat) => ({
                                        value: cat.id,
                                        label: cat.name,
                                    }))}
                                    value={form.data.category_id}
                                    onChange={(val) => form.setData('category_id', val)}
                                    placeholder="Select Category (Web App, Mobile App...)"
                                    searchPlaceholder="Search category..."
                                />
                                {form.errors.category_id && (
                                    <p className="text-xs font-semibold text-rose-500">{form.errors.category_id}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="project_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Website Project Title *
                                </Label>
                                <Input
                                    id="project_name"
                                    value={form.data.project_name}
                                    onChange={(e) => form.setData('project_name', e.target.value)}
                                    placeholder="e.g. E-Commerce Portal Redesign"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                                    required
                                />
                                {form.errors.project_name && <p className="text-xs font-semibold text-rose-500">{form.errors.project_name}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Project Initial Status *
                                </Label>
                                <select
                                    id="status"
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value as any)}
                                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                >
                                    <option value="in_progress">In Progress</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                {form.errors.status && <p className="text-xs font-semibold text-rose-500">{form.errors.status}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="progress_percentage" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Initial Progress Percentage (0% - 100%) *
                                </Label>
                                <Input
                                    id="progress_percentage"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={form.data.progress_percentage}
                                    onChange={(e) => form.setData('progress_percentage', e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                />
                                {form.errors.progress_percentage && <p className="text-xs font-semibold text-rose-500">{form.errors.progress_percentage}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Budget & Timeline */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <BadgeDollarSign className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Total Project Budget & Timeline
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Set total contract budget, currency, start date, and target deadline.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="total_budget" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Total Project Budget *
                                </Label>
                                <Input
                                    id="total_budget"
                                    type="number"
                                    step="0.01"
                                    value={form.data.total_budget}
                                    onChange={(e) => form.setData('total_budget', e.target.value)}
                                    placeholder="e.g. 12000"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                                    required
                                />
                                {form.errors.total_budget && <p className="text-xs font-semibold text-rose-500">{form.errors.total_budget}</p>}
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
                                <Label htmlFor="start_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Project Start Date
                                </Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={form.data.start_date}
                                    onChange={(e) => form.setData('start_date', e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="deadline" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Target Completion Deadline
                                </Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={form.data.deadline}
                                    onChange={(e) => form.setData('deadline', e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Notes & Requirements */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Project Specifications & Notes
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Tech stack, staging URL, design deliverables, or client instructions.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Project Notes & Features List (Optional)
                            </Label>
                            <textarea
                                id="notes"
                                rows={4}
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Specify tech stack e.g. Laravel + Inertia React, Stripe Gateway, Custom Admin Dashboard..."
                                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white focus:border-blue-600 transition-all focus:outline-none"
                            />
                            {form.errors.notes && <p className="text-xs font-semibold text-rose-500">{form.errors.notes}</p>}
                        </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-end gap-4 pt-4 pb-12 border-t border-slate-200/80 dark:border-slate-800">
                        <Link
                            href="/website-projects"
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
                                    <span>Saving Project...</span>
                                </div>
                            ) : (
                                <span>Save Website Project</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
