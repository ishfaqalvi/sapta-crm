import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Client } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    BadgeDollarSign,
    Building,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    Edit2,
    Globe,
    Layers,
    LoaderCircle,
    Plus,
    Receipt,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

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
        title: 'Milestone Payments',
        href: '/website-payments',
    },
];

export interface ProjectPaymentItem {
    id: number;
    website_project_id: number;
    client_id: number;
    milestone_title: string;
    amount: number;
    exchange_rate?: number;
    amount_pkr?: number;
    payment_stage: 'advance' | 'partial' | 'full';
    status: 'pending' | 'paid';
    paid_at: string | null;
    payment_method: string | null;
    notes: string | null;
    client: Client | null;
    website_project: {
        id: number;
        project_name: string;
        currency: string;
        total_budget: number;
    } | null;
}

interface SimpleProject {
    id: number;
    project_name: string;
    currency: string;
    total_budget: number;
    client: Client | null;
}

interface ProjectPaymentsIndexProps {
    payments: PaginatedData<ProjectPaymentItem>;
    projects: SimpleProject[];
    stats: {
        total: number;
        paid: number;
        pending: number;
        total_paid_pkr?: number;
        total_pending_pkr?: number;
    };
    exchange_rates?: Record<string, number>;
    filters?: {
        search?: string;
        status?: string;
        stage?: string;
    };
}

export default function ProjectPaymentsIndex({ payments, projects, stats, filters }: ProjectPaymentsIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(filters?.status || '');
    const [selectedStageFilter, setSelectedStageFilter] = useState(filters?.stage || '');

    // Modal state for Add Milestone Payment
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Modal state for Edit / Update Payment Settlement
    const [updatingPayment, setUpdatingPayment] = useState<ProjectPaymentItem | null>(null);

    // Delete Confirmation
    const [deletingPayment, setDeletingPayment] = useState<ProjectPaymentItem | null>(null);

    const addForm = useForm({
        website_project_id: (projects.length > 0 ? projects[0].id : '') as string | number,
        milestone_title: '',
        amount: '' as string | number,
        payment_stage: 'advance' as 'advance' | 'partial' | 'full',
        status: 'pending' as 'pending' | 'paid',
        paid_at: '',
        payment_method: 'Bank Transfer',
        notes: '',
    });

    const editForm = useForm({
        amount: '' as string | number,
        payment_stage: 'advance' as 'advance' | 'partial' | 'full',
        status: 'pending' as 'pending' | 'paid',
        paid_at: '',
        payment_method: 'Bank Transfer',
        notes: '',
    });

    // Debounced filter effect
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/website-payments',
                {
                    search: searchQuery,
                    status: selectedStatusFilter,
                    stage: selectedStageFilter,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatusFilter, selectedStageFilter]);

    const handleAddSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        addForm.post('/website-payments', {
            onSuccess: () => {
                setIsAddModalOpen(false);
                addForm.reset();
            },
        });
    };

    const openEditModal = (p: ProjectPaymentItem) => {
        setUpdatingPayment(p);
        editForm.setData({
            amount: p.amount,
            payment_stage: p.payment_stage,
            status: p.status,
            paid_at: p.paid_at || '',
            payment_method: p.payment_method || 'Bank Transfer',
            notes: p.notes || '',
        });
    };

    const handleEditSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!updatingPayment) return;
        editForm.put(`/website-payments/${updatingPayment.id}`, {
            onSuccess: () => setUpdatingPayment(null),
        });
    };

    const handleDelete = (p: ProjectPaymentItem) => {
        if (confirm(`Delete milestone payment "${p.milestone_title}"?`)) {
            router.delete(`/website-payments/${p.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Website Milestone Payments" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Website Project Milestone Payments
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Track advance payments, partial design milestones, and final launch settlements.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="size-4" />
                        <span>Add Milestone Payment</span>
                    </button>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Milestones</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Receipt className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paid Settlements (PKR)</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                PKR {Number(stats.total_paid_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">{stats.paid} Settled Milestones</span>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Dues (PKR)</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                PKR {Number(stats.total_pending_pkr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">{stats.pending} Pending Milestones</span>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Clock className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by milestone title, client name, or project title..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Payment Statuses</option>
                            <option value="paid">Paid Only</option>
                            <option value="pending">Pending Only</option>
                        </select>

                        <select
                            value={selectedStageFilter}
                            onChange={(e) => setSelectedStageFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Milestone Stages</option>
                            <option value="advance">Advance (Initial)</option>
                            <option value="partial">Partial Milestone</option>
                            <option value="full">Full / Final Settlement</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Website Project</th>
                                    <th className="px-6 py-4">Milestone Title & Stage</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status & Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payments.data.length > 0 ? (
                                    payments.data.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Client */}
                                            <td className="px-6 py-4">
                                                {p.client ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                                                            <Building className="size-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                                                {p.client.name}
                                                            </span>
                                                            <span className="text-slate-400 font-mono text-[10px] block">
                                                                {p.client.client_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Unassigned Client</span>
                                                )}
                                            </td>

                                            {/* Website Project */}
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-xs">
                                                {p.website_project?.project_name || 'Website Project'}
                                            </td>

                                            {/* Milestone Title & Stage */}
                                            <td className="px-6 py-4">
                                                <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                                                    {p.milestone_title}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 inline-block mt-1">
                                                    {p.payment_stage}
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm font-mono block">
                                                        {p.website_project?.currency || 'USD'} {Number(p.amount).toLocaleString()}
                                                    </span>
                                                    {p.amount_pkr && p.website_project?.currency !== 'PKR' && (
                                                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                                                            ≈ PKR {Number(p.amount_pkr).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                                        p.status === 'paid'
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                    }`}>
                                                        {p.status === 'paid' ? (
                                                            <>
                                                                <CheckCircle2 className="size-3" />
                                                                <span>Paid</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Clock className="size-3" />
                                                                <span>Pending</span>
                                                            </>
                                                        )}
                                                    </span>
                                                    {p.paid_at && (
                                                        <span className="text-[10px] text-slate-400 block font-medium">
                                                            Paid: {p.paid_at}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(p)}
                                                        className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                        <span>Update</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(p)}
                                                        className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No milestone payments recorded. Click <strong>Add Milestone Payment</strong> to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={payments} />
                </div>

                {/* ADD MILESTONE PAYMENT MODAL */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <Plus className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Record Milestone Payment
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Create new milestone stage for a website project.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="website_project_id" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Select Website Project *
                                    </Label>
                                    <SearchableSelect
                                        id="website_project_id"
                                        options={projects.map((p) => ({
                                            value: p.id,
                                            label: p.project_name,
                                            subLabel: p.client?.name || undefined,
                                        }))}
                                        value={addForm.data.website_project_id}
                                        onChange={(val) => addForm.setData('website_project_id', val)}
                                        placeholder="Search and select project..."
                                        searchPlaceholder="Type project or client name..."
                                        required
                                    />
                                    {addForm.errors.website_project_id && <p className="text-xs font-semibold text-rose-500">{addForm.errors.website_project_id}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="milestone_title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Milestone Title *
                                    </Label>
                                    <Input
                                        id="milestone_title"
                                        value={addForm.data.milestone_title}
                                        onChange={(e) => addForm.setData('milestone_title', e.target.value)}
                                        placeholder="e.g. 50% Advance Upon Contract Sign"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                        required
                                    />
                                    {addForm.errors.milestone_title && <p className="text-xs font-semibold text-rose-500">{addForm.errors.milestone_title}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="amount" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Amount *
                                        </Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            value={addForm.data.amount}
                                            onChange={(e) => addForm.setData('amount', e.target.value)}
                                            placeholder="e.g. 6000"
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-extrabold text-slate-900 dark:text-white focus:bg-white focus:border-emerald-600"
                                            required
                                        />
                                        {addForm.errors.amount && <p className="text-xs font-semibold text-rose-500">{addForm.errors.amount}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="payment_stage" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Payment Stage *
                                        </Label>
                                        <select
                                            id="payment_stage"
                                            value={addForm.data.payment_stage}
                                            onChange={(e) => addForm.setData('payment_stage', e.target.value as any)}
                                            className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                        >
                                            <option value="advance">Advance (Initial)</option>
                                            <option value="partial">Partial Milestone</option>
                                            <option value="full">Full / Final Settlement</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Payment Status *
                                        </Label>
                                        <select
                                            id="status"
                                            value={addForm.data.status}
                                            onChange={(e) => addForm.setData('status', e.target.value as any)}
                                            className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="payment_method" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Payment Method
                                        </Label>
                                        <select
                                            id="payment_method"
                                            value={addForm.data.payment_method}
                                            onChange={(e) => addForm.setData('payment_method', e.target.value)}
                                            className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                        >
                                            <option value="Bank Transfer">Bank Transfer / Wire</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Credit Card / Online">Credit Card / Online</option>
                                            <option value="Crypto / Other">Crypto / Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={addForm.processing}
                                        className="bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white rounded-xl gap-2"
                                    >
                                        {addForm.processing && <LoaderCircle className="size-4 animate-spin" />}
                                        <span>Save Milestone</span>
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT MILESTONE PAYMENT MODAL */}
                {updatingPayment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <Edit2 className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Update Milestone Payment
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Milestone: <strong>{updatingPayment.milestone_title}</strong>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setUpdatingPayment(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_amount" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Amount *
                                        </Label>
                                        <Input
                                            id="edit_amount"
                                            type="number"
                                            step="0.01"
                                            value={editForm.data.amount}
                                            onChange={(e) => editForm.setData('amount', e.target.value)}
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-extrabold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_payment_stage" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Payment Stage *
                                        </Label>
                                        <select
                                            id="edit_payment_stage"
                                            value={editForm.data.payment_stage}
                                            onChange={(e) => editForm.setData('payment_stage', e.target.value as any)}
                                            className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                        >
                                            <option value="advance">Advance (Initial)</option>
                                            <option value="partial">Partial Milestone</option>
                                            <option value="full">Full / Final Settlement</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Payment Status *
                                        </Label>
                                        <select
                                            id="edit_status"
                                            value={editForm.data.status}
                                            onChange={(e) => editForm.setData('status', e.target.value as any)}
                                            className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid / Settled</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_paid_at" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Settlement Date
                                        </Label>
                                        <Input
                                            id="edit_paid_at"
                                            type="date"
                                            value={editForm.data.paid_at}
                                            onChange={(e) => editForm.setData('paid_at', e.target.value)}
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_payment_method" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Payment Method
                                    </Label>
                                    <select
                                        id="edit_payment_method"
                                        value={editForm.data.payment_method}
                                        onChange={(e) => editForm.setData('payment_method', e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600"
                                    >
                                        <option value="Bank Transfer">Bank Transfer / Wire</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Credit Card / Online">Credit Card / Online</option>
                                        <option value="Crypto / Other">Crypto / Other</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setUpdatingPayment(null)}
                                        className="rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2"
                                    >
                                        {editForm.processing && <LoaderCircle className="size-4 animate-spin" />}
                                        <span>Update Milestone</span>
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
