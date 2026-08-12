import SearchableSelect from '@/components/searchable-select';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    Coins,
    DollarSign,
    FileText,
    Globe,
    Layers,
    LoaderCircle,
    Percent,
    Save,
    Sparkles,
} from 'lucide-react';
import { FormEvent } from 'react';

interface CurrencyItem {
    code: string;
    name: string;
    symbol: string;
}

interface ProjectCategoryItem {
    id: number;
    name: string;
}

interface WebsiteProjectData {
    id: number;
    category_id?: number | string | null;
    project_name: string;
    total_budget: number | string;
    currency: string;
    exchange_rate: number | string;
    start_date: string | null;
    deadline: string | null;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    notes: string | null;
}

interface ClientPortalProjectsEditProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    project: WebsiteProjectData;
    currencies: CurrencyItem[];
    categories?: ProjectCategoryItem[];
}

export default function ClientPortalProjectsEdit({
    client,
    project,
    currencies,
    categories = [],
}: ClientPortalProjectsEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Website Projects', href: '/client-portal/projects' },
        { title: `Edit ${project.project_name}`, href: `/client-portal/projects/${project.id}/edit` },
    ];

    const formatForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0].split(' ')[0];
    };

    const { data, setData, put, processing, errors } = useForm<{ [key: string]: any; project_name: string; category_id: string | number; total_budget: number | string; currency: string; exchange_rate: number | string; start_date: string; deadline: string; status: string; progress_percentage: number; notes: string }>({
        project_name: project.project_name || '',
        category_id: project.category_id || '',
        total_budget: project.total_budget || '',
        currency: project.currency || client.currency || 'USD',
        exchange_rate: project.exchange_rate || '',
        start_date: formatForInput(project.start_date),
        deadline: formatForInput(project.deadline),
        status: project.status || 'in_progress',
        progress_percentage: project.progress_percentage || 0,
        notes: project.notes || '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/client-portal/projects/update/${project.id}`);
    };

    const categoryOptions = categories.map((cat) => ({
        value: String(cat.id),
        label: cat.name,
    }));

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="projects">
            <Head title={`Edit ${project.project_name} | ${client.name}`} />

            <div className="p-6 w-full space-y-6">
                {/* Header Title & Back Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 border border-white/20">
                            <Globe className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Edit Website Project
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                Modify project attributes, timeline, and deliverables for {project.project_name}.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/client-portal/projects"
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to Projects</span>
                    </Link>
                </div>

                {/* Main Full Width Form */}
                <form noValidate onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
                    {/* Section 1: Project Identity & Classification */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Project Identity & Classification</h2>
                                <p className="text-[11px] text-slate-400 font-medium">Basic project name and category classification</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* Project Name */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Project Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.project_name}
                                    onChange={(e) => setData('project_name', e.target.value)}
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${errors.project_name
                                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                        : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                        }`}
                                />
                                {errors.project_name && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.project_name}</p>}
                            </div>

                            {/* Project Category (SearchableSelect) */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Project Category <span className="text-rose-500">*</span>
                                </label>
                                <SearchableSelect
                                    options={categoryOptions}
                                    value={data.category_id}
                                    onChange={(val) => setData('category_id', val)}
                                    placeholder="Select Project Category..."
                                    searchPlaceholder="Search project categories..."
                                    required={true}
                                />
                                {errors.category_id && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.category_id}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contract Budget & Billing Currency */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <DollarSign className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Financial & Contract Budget</h2>
                                <p className="text-[11px] text-slate-400 font-medium">Contract value and billing currency configuration</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* Budget Amount */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Total Contract Budget <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.total_budget}
                                        onChange={(e) => setData('total_budget', e.target.value)}
                                        className={`w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${errors.total_budget
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                </div>
                                {errors.total_budget && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.total_budget}</p>}
                            </div>

                            {/* Currency Selection */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Billing Currency <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                    <select
                                        value={data.currency}
                                        onChange={(e) => setData('currency', e.target.value)}
                                        className={`w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none transition-all ${errors.currency
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                            }`}
                                    >
                                        {currencies.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} - {c.name} ({c.symbol})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.currency && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.currency}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Timeline & Dates */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                <Calendar className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Timeline & Delivery Schedules</h2>
                                <p className="text-[11px] text-slate-400 font-medium">Start date and estimated deadline</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Project Start Date
                                </label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setData('start_date', e.target.value)}
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${errors.start_date
                                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                        : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                        }`}
                                />
                                {errors.start_date && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.start_date}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Target Completion Deadline
                                </label>
                                <input
                                    type="date"
                                    value={data.deadline}
                                    onChange={(e) => setData('deadline', e.target.value)}
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${errors.deadline
                                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                        : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                        }`}
                                />
                                {errors.deadline && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.deadline}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Status & Progress */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <Layers className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Project Status & Milestones</h2>
                                <p className="text-[11px] text-slate-400 font-medium">Status state and development completion percentage</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Project Status <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value as any)}
                                    className={`w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none transition-all ${errors.status
                                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                        : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                        }`}
                                >
                                    <option value="in_progress">In Progress</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                {errors.status && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.status}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Completion Progress (%)
                                </label>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={data.progress_percentage}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                setData('progress_percentage', isNaN(val) ? 0 : val);
                                            }}
                                            placeholder="0"
                                            className={`w-full h-10 pl-4 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition-all ${errors.progress_percentage
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                    </div>
                                    {errors.progress_percentage && <p className="text-rose-500 text-xs font-medium mt-1">{errors.progress_percentage}</p>}

                                    {/* Visual Progress Bar */}
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, Math.max(0, data.progress_percentage))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Specifications & Notes */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Project Scope & Directives</h2>
                                <p className="text-[11px] text-slate-400 font-medium">Deliverables, tech stack details, and guidelines</p>
                            </div>
                        </div>

                        <div className="pt-2">
                            <textarea
                                rows={5}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Detail out deliverables, wireframe specs, backend tech stack, or milestone payment rules..."
                                className={`w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${errors.notes
                                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                    : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                    }`}
                            />
                            {errors.notes && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.notes}</p>}
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Link
                            href="/client-portal/projects"
                            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {processing ? (
                                <>
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Updating Project...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    <span>Update Website Project</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </ClientPortalLayout>
    );
}
