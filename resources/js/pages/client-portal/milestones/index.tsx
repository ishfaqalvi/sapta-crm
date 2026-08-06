import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BadgeDollarSign,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Edit2,
    Globe,
    Layers,
    LoaderCircle,
    Lock,
    Plus,
    Receipt,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

interface SimpleProject {
    id: number;
    project_name: string;
    currency: string;
    total_budget: number | string;
}

export interface MilestonePaymentItem {
    id: number;
    website_project_id: number;
    client_id: number;
    milestone_title: string;
    amount: number | string;
    exchange_rate?: number | string;
    amount_pkr?: number | string;
    payment_stage: 'advance' | 'partial' | 'full';
    status: 'pending' | 'paid';
    paid_at: string | null;
    payment_method: string | null;
    notes: string | null;
    created_at: string;
    website_project?: {
        id: number;
        project_name: string;
        client_id: number;
        currency: string;
        total_budget: number | string;
    };
}

interface ClientPortalMilestonesIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    milestones: PaginatedData<MilestonePaymentItem>;
    projects: SimpleProject[];
    stats: {
        total_milestones: number;
        paid_count: number;
        pending_count: number;
        total_paid_amount: number;
        total_pending_amount: number;
        total_budget_allocated: number;
    };
    filters?: {
        search?: string;
        status?: string;
        stage?: string;
        project_id?: string;
    };
}

export default function ClientPortalMilestonesIndex({
    client,
    milestones,
    projects,
    stats,
    filters,
}: ClientPortalMilestonesIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Project Milestones', href: '/client-portal/milestones' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || '');
    const [selectedStage, setSelectedStage] = useState(filters?.stage || '');
    const [selectedProject, setSelectedProject] = useState(filters?.project_id || '');

    // Modal state for Create / Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<MilestonePaymentItem | null>(null);

    // Delete modal state
    const [deletingMilestone, setDeletingMilestone] = useState<MilestonePaymentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isFirstRender = useRef(true);

    const formatForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0].split(' ')[0];
    };

    const formatDateOnly = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Pending';
        const cleanDate = dateStr.split('T')[0].split(' ')[0];
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 0 && month < 12) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const formattedDay = day < 10 ? `0${day}` : `${day}`;
                return `${formattedDay} ${months[month]} ${year}`;
            }
        }
        return cleanDate;
    };

    const formatCurrency = (val: number | string, currencySymbol: string = client.currency || '$') => {
        const num = Number(val) || 0;
        return `${currencySymbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getStageBadgeClass = (stage: string) => {
        switch (stage) {
            case 'advance':
                return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60';
            case 'partial':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60';
            case 'full':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60';
            case 'pending':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    // Options for SearchableSelect
    const projectOptions = projects.map((p) => ({
        value: p.id.toString(),
        label: p.project_name,
        subLabel: `Budget: ${p.currency || '$'} ${Number(p.total_budget || 0).toLocaleString()}`,
    }));

    // Form Hook
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        website_project_id: '',
        milestone_title: '',
        amount: '',
        payment_stage: 'partial',
        status: 'pending',
        paid_at: '',
        payment_method: '',
        notes: '',
    });

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/client-portal/milestones',
                {
                    search: searchQuery,
                    status: selectedStatus,
                    stage: selectedStage,
                    project_id: selectedProject,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatus, selectedStage, selectedProject]);

    const openCreateModal = () => {
        setEditingMilestone(null);
        clearErrors();
        reset();
        if (projects.length > 0) {
            setData('website_project_id', projects[0].id.toString());
        }
        setIsModalOpen(true);
    };

    const openEditModal = (item: MilestonePaymentItem) => {
        setEditingMilestone(item);
        clearErrors();
        setData({
            website_project_id: item.website_project_id ? item.website_project_id.toString() : '',
            milestone_title: item.milestone_title || '',
            amount: item.amount ? item.amount.toString() : '',
            payment_stage: item.payment_stage || 'partial',
            status: item.status || 'pending',
            paid_at: formatForInput(item.paid_at),
            payment_method: item.payment_method || '',
            notes: item.notes || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMilestone(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingMilestone) {
            put(`/client-portal/milestones/update/${editingMilestone.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/client-portal/milestones/store', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!deletingMilestone) return;
        setIsDeleting(true);
        router.delete(`/client-portal/milestones/destroy/${deletingMilestone.id}`, {
            onSuccess: () => {
                setDeletingMilestone(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="milestones">
            <Head title={`Project Milestones | ${client.name}`} />

            <div className="p-6 w-full space-y-6">
                {/* Header Title & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Project Milestones & Settlements
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Manage milestone budgets, payment stages, and settlement status for website projects.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-milestones') && (
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add Project Milestone</span>
                        </button>
                    )}
                </div>

                {/* KPI Stat Cards (Admin Standard) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Milestones</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total_milestones}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Receipt className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Settled (Paid)</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {formatCurrency(stats.total_paid_amount)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Settlements</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                {formatCurrency(stats.total_pending_amount)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Clock className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Allocated Budget</p>
                            <h3 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                                {formatCurrency(stats.total_budget_allocated)}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <BadgeDollarSign className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full lg:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search milestone title, notes, or project..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Project Filter */}
                        {projects.length > 0 && (
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                            >
                                <option value="">All Projects</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.project_name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="paid">Paid (Settled)</option>
                            <option value="pending">Pending</option>
                        </select>

                        {/* Stage Filter */}
                        <select
                            value={selectedStage}
                            onChange={(e) => setSelectedStage(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Stages</option>
                            <option value="advance">Advance</option>
                            <option value="partial">Partial</option>
                            <option value="full">Full Payment</option>
                        </select>
                    </div>
                </div>

                {/* Table View (Full width layout) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                                    <th className="px-6 py-4">Milestone Title</th>
                                    <th className="px-6 py-4">Website Project</th>
                                    <th className="px-6 py-4">Payment Stage</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Paid Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {milestones.data.length > 0 ? (
                                    milestones.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1 rounded-md shrink-0 ${item.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                                            }`}>
                                                            <Receipt className="size-3.5" />
                                                        </div>
                                                        <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                                            {item.milestone_title}
                                                        </span>
                                                    </div>
                                                    {item.notes && (
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 pl-5">
                                                            {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {item.website_project ? (
                                                    <Link
                                                        href={`/client-portal/projects/${item.website_project_id}`}
                                                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                                                    >
                                                        <Globe className="size-3.5 text-blue-500" />
                                                        <span>{item.website_project.project_name}</span>
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400 italic">N/A</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStageBadgeClass(item.payment_stage)}`}>
                                                    {item.payment_stage}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                    {formatCurrency(item.amount, item.website_project?.currency || client.currency || '$')}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                                                    <Calendar className="size-3.5 text-indigo-500" />
                                                    {formatDateOnly(item.paid_at)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block border ${getStatusBadgeClass(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {hasPermission(user, 'edit-client-portal-milestones') && (
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Edit Milestone"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                    {hasPermission(user, 'delete-client-portal-milestones') && (
                                                        item.status === 'paid' ? (
                                                            <button
                                                                disabled
                                                                className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed flex items-center justify-center shadow-2xs opacity-60"
                                                                title="Paid / Settled milestone payments cannot be deleted"
                                                            >
                                                                <Lock className="size-3.5" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeletingMilestone(item)}
                                                                className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                title="Delete Milestone"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                            No project milestone payments found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {milestones.data.length > 0 && <Pagination meta={milestones} />}

                {/* Create / Edit Milestone Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <Receipt className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            {editingMilestone ? 'Edit Project Milestone' : 'Add New Project Milestone'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Define milestone title, budget amount, and settlement status.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Website Project (Searchable) */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Website Project <span className="text-rose-500">*</span>
                                        </label>
                                        <SearchableSelect
                                            options={projectOptions}
                                            value={data.website_project_id}
                                            onChange={(val) => setData('website_project_id', val)}
                                            placeholder="Select Website Project..."
                                            searchPlaceholder="Type to search project..."
                                        />
                                        {errors.website_project_id && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.website_project_id}</p>}
                                    </div>

                                    {/* Milestone Title */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Milestone Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.milestone_title}
                                            onChange={(e) => setData('milestone_title', e.target.value)}
                                            placeholder="e.g. Initial Advance Payment / Wireframes Approval"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${errors.milestone_title
                                                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {errors.milestone_title && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.milestone_title}</p>}
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Milestone Amount ({client.currency || '$'}) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            placeholder="0.00"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${errors.amount
                                                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {errors.amount && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.amount}</p>}
                                    </div>

                                    {/* Stage & Status (Side by side) */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                                Stage <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={data.payment_stage}
                                                onChange={(e) => setData('payment_stage', e.target.value as any)}
                                                className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                                            >
                                                <option value="advance">Advance</option>
                                                <option value="partial">Partial</option>
                                                <option value="full">Full Payment</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                                Status <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value as any)}
                                                className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="paid">Paid (Settled)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Paid Date */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Settlement / Paid Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.paid_at}
                                            onChange={(e) => setData('paid_at', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Payment Method / Channel
                                        </label>
                                        <input
                                            type="text"
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                            placeholder="e.g. Bank Transfer / Wise / Stripe"
                                            className="w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>

                                    {/* Notes (Full width) */}
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                            Milestone Scope & Settlement Notes
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Add milestone deliverables or payment transaction reference..."
                                            className="w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Form Action Buttons */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>{editingMilestone ? 'Update Milestone' : 'Save Milestone'}</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingMilestone && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                    <AlertTriangle className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Delete Milestone?</h3>
                                    <p className="text-xs text-slate-400 font-medium">This action cannot be undone.</p>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingMilestone.milestone_title}</strong>?
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setDeletingMilestone(null)}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Milestone</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientPortalLayout>
    );
}
