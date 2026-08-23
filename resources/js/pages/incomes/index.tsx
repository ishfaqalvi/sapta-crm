import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect, { type SelectOption } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    Clock,
    Download,
    Edit2,
    FileSpreadsheet,
    LoaderCircle,
    Plus,
    RotateCcw,
    Search,
    Tag,
    Trash2,
    TrendingUp,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Income Tracker', href: '/incomes' },
];

export interface IncomeCategoryOption {
    id: number;
    name: string;
}

export interface IncomeItem {
    id: number;
    income_category_id?: number | null;
    category?: IncomeCategoryOption | null;
    title: string;
    amount: number | string;
    currency: string;
    income_date: string;
    notes?: string | null;
    created_at?: string;
}

interface IncomesIndexProps {
    incomes: PaginatedData<IncomeItem>;
    stats: {
        total: number;
        this_month: number;
        today: number;
        count: number;
    };
    categories: IncomeCategoryOption[];
    filters: {
        search?: string;
        category_id?: string;
        start_date?: string;
        end_date?: string;
    };
}

interface IncomeForm {
    [key: string]: any;
    title: string;
    income_category_id: string;
    amount: string;
    income_date: string;
    notes: string;
}

export default function IncomesIndex({ incomes, stats, categories = [], filters }: IncomesIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [categoryIdFilter, setCategoryIdFilter] = useState(filters.category_id || '');
    const [startDateFilter, setStartDateFilter] = useState(filters.start_date || '');
    const [endDateFilter, setEndDateFilter] = useState(filters.end_date || '');

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);
    const [deletingIncome, setDeletingIncome] = useState<IncomeItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const todayDateStr = new Date().toISOString().split('T')[0];

    // Category options for SearchableSelect
    const filterCategoryOptions: SelectOption[] = [
        { value: '', label: 'All Categories' },
        ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ];

    const formCategoryOptions: SelectOption[] = [
        { value: '', label: 'Select Category' },
        ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ];

    // Forms
    const createForm = useForm<IncomeForm>({
        title: '',
        income_category_id: '',
        amount: '',
        income_date: todayDateStr,
        notes: '',
    });

    const editForm = useForm<IncomeForm>({
        title: '',
        income_category_id: '',
        amount: '',
        income_date: todayDateStr,
        notes: '',
    });

    // Debounced Search & Filter
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/incomes',
                {
                    search: searchQuery || undefined,
                    category_id: categoryIdFilter || undefined,
                    start_date: startDateFilter || undefined,
                    end_date: endDateFilter || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, categoryIdFilter, startDateFilter, endDateFilter]);

    const handleClearFilters = () => {
        setSearchQuery('');
        setCategoryIdFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
        router.get('/incomes', {}, { preserveState: true, replace: true });
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (categoryIdFilter) params.append('category_id', categoryIdFilter);
        if (startDateFilter) params.append('start_date', startDateFilter);
        if (endDateFilter) params.append('end_date', endDateFilter);

        const url = `/incomes/export?${params.toString()}`;
        window.location.href = url;
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/incomes', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                createForm.setData('income_date', todayDateStr);
            },
        });
    };

    const handleEditOpen = (inc: IncomeItem) => {
        setEditingIncome(inc);
        editForm.setData({
            title: inc.title,
            income_category_id: inc.income_category_id ? String(inc.income_category_id) : '',
            amount: String(inc.amount),
            income_date: inc.income_date ? inc.income_date.substring(0, 10) : todayDateStr,
            notes: inc.notes || '',
        });
        editForm.clearErrors();
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingIncome) return;
        editForm.put(`/incomes/${editingIncome.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingIncome(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteSubmit = () => {
        if (!deletingIncome) return;
        setIsDeleting(true);
        router.delete(`/incomes/${deletingIncome.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingIncome(null);
            },
        });
    };

    const formatAmount = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val || 0;
        return `Rs. ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const parts = dateStr.substring(0, 10).split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            return new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }).format(date);
        }
        return dateStr;
    };

    const hasActiveFilters = Boolean(searchQuery || categoryIdFilter || startDateFilter || endDateFilter);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Income Tracker" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <TrendingUp className="size-6 text-emerald-600 dark:text-emerald-400" />
                            <span>Income Tracker</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Log and monitor company revenues and income entries in PKR.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        {hasPermission(user, 'view-income-categories') && (
                            <Link
                                href={route('income-categories.index')}
                                className="h-10 px-4 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2"
                            >
                                <Tag className="size-4" />
                                <span>Manage Categories</span>
                            </Link>
                        )}

                        <button
                            onClick={handleExportExcel}
                            className="h-10 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer"
                            title="Export to Excel / CSV"
                        >
                            <FileSpreadsheet className="size-4" />
                            <span>Export Excel</span>
                        </button>

                        {hasPermission(user, 'create-incomes') && (
                            <button
                                onClick={() => {
                                    createForm.reset();
                                    createForm.clearErrors();
                                    createForm.setData('income_date', todayDateStr);
                                    setIsCreateOpen(true);
                                }}
                                className="h-10 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer"
                            >
                                <Plus className="size-4" />
                                <span>Add Income Entry</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Recorded Income</p>
                            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                                {formatAmount(stats.total)}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">This Month Income</p>
                            <h3 className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
                                {formatAmount(stats.this_month)}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <Calendar className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Income</p>
                            <h3 className="text-lg sm:text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                                {formatAmount(stats.today)}
                            </h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            <Clock className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                        {/* Search Input */}
                        <div className="relative w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search income title..."
                                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                            />
                        </div>

                        {/* Searchable Category Select */}
                        <div className="w-full">
                            <SearchableSelect
                                options={filterCategoryOptions}
                                value={categoryIdFilter}
                                onChange={(val) => setCategoryIdFilter(val)}
                                placeholder="All Categories"
                                searchPlaceholder="Search category..."
                            />
                        </div>

                        {/* From Date */}
                        <div className="relative flex items-center w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-all focus-within:border-blue-600">
                            <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mr-2 shrink-0 select-none">
                                From:
                            </span>
                            <input
                                type="date"
                                value={startDateFilter}
                                onChange={(e) => setStartDateFilter(e.target.value)}
                                className="w-full h-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                                title="From Date"
                            />
                        </div>

                        {/* To Date */}
                        <div className="relative flex items-center w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-all focus-within:border-blue-600">
                            <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 mr-2 shrink-0 select-none">
                                To:
                            </span>
                            <input
                                type="date"
                                value={endDateFilter}
                                onChange={(e) => setEndDateFilter(e.target.value)}
                                className="w-full h-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                                title="To Date"
                            />
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="h-10 px-3 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800 transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                            <RotateCcw className="size-3.5" />
                            <span>Reset Filters</span>
                        </button>
                    )}
                </div>

                {/* Incomes Table */}
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Amount (PKR)</th>
                                    <th className="px-6 py-4">Notes</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {incomes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No income entries logged yet.
                                        </td>
                                    </tr>
                                ) : (
                                    incomes.data.map((inc) => (
                                        <tr key={inc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white">
                                                {inc.title}
                                            </td>

                                            <td className="px-6 py-4">
                                                {inc.category ? (
                                                    <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        {inc.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">Uncategorized</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                                                {formatDate(inc.income_date)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    {formatAmount(inc.amount)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 max-w-xs truncate text-slate-500 dark:text-slate-400" title={inc.notes || undefined}>
                                                {inc.notes || <span className="text-slate-300 dark:text-slate-600 italic">No notes</span>}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {hasPermission(user, 'edit-incomes') && (
                                                        <button
                                                            onClick={() => handleEditOpen(inc)}
                                                            className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Edit Income"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </button>
                                                    )}

                                                    {hasPermission(user, 'delete-incomes') && (
                                                        <button
                                                            onClick={() => setDeletingIncome(inc)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Delete Income"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={incomes} />
                </div>

                {/* CREATE INCOME MODAL */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                        <TrendingUp className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Add Income Entry
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Log new revenue or payment received (PKR).
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} noValidate className="space-y-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Income Title *
                                    </Label>
                                    <Input
                                        id="create_title"
                                        value={createForm.data.title}
                                        onChange={(e) => createForm.setData('title', e.target.value)}
                                        placeholder="e.g. Website Maintenance Fee / Custom Software Dev"
                                        required
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${createForm.errors.title
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {createForm.errors.title && (
                                        <p className="text-xs font-semibold text-rose-500">{createForm.errors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Income Category
                                    </Label>
                                    <SearchableSelect
                                        options={formCategoryOptions}
                                        value={createForm.data.income_category_id}
                                        onChange={(val) => createForm.setData('income_category_id', val)}
                                        hasError={Boolean(createForm.errors.income_category_id)}
                                        placeholder="Select Category"
                                        searchPlaceholder="Search category..."
                                    />
                                    {createForm.errors.income_category_id && (
                                        <p className="text-xs font-semibold text-rose-500">{createForm.errors.income_category_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create_amount" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Amount (PKR Rs.) *
                                    </Label>
                                    <Input
                                        id="create_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={createForm.data.amount}
                                        onChange={(e) => createForm.setData('amount', e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all font-mono ${createForm.errors.amount
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {createForm.errors.amount && (
                                        <p className="text-xs font-semibold text-rose-500">{createForm.errors.amount}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Date Received *
                                    </Label>
                                    <Input
                                        id="create_date"
                                        type="date"
                                        value={createForm.data.income_date}
                                        onChange={(e) => createForm.setData('income_date', e.target.value)}
                                        required
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${createForm.errors.income_date
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {createForm.errors.income_date && (
                                        <p className="text-xs font-semibold text-rose-500">{createForm.errors.income_date}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create_notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Notes / Details
                                    </Label>
                                    <textarea
                                        id="create_notes"
                                        rows={3}
                                        value={createForm.data.notes}
                                        onChange={(e) => createForm.setData('notes', e.target.value)}
                                        placeholder="Optional notes..."
                                        className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-xs font-medium text-slate-900 dark:text-white transition-all ${createForm.errors.notes
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {createForm.errors.notes && (
                                        <p className="text-xs font-semibold text-rose-500">{createForm.errors.notes}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="h-10 px-4 rounded-xl text-xs font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {createForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Save Entry</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT INCOME MODAL */}
                {editingIncome && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                        <Edit2 className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Edit Income Entry
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Update income parameters (PKR).
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingIncome(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} noValidate className="space-y-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Income Title *
                                    </Label>
                                    <Input
                                        id="edit_title"
                                        value={editForm.data.title}
                                        onChange={(e) => editForm.setData('title', e.target.value)}
                                        required
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${editForm.errors.title
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {editForm.errors.title && (
                                        <p className="text-xs font-semibold text-rose-500">{editForm.errors.title}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Income Category
                                    </Label>
                                    <SearchableSelect
                                        options={formCategoryOptions}
                                        value={editForm.data.income_category_id}
                                        onChange={(val) => editForm.setData('income_category_id', val)}
                                        hasError={Boolean(editForm.errors.income_category_id)}
                                        placeholder="Select Category"
                                        searchPlaceholder="Search category..."
                                    />
                                    {editForm.errors.income_category_id && (
                                        <p className="text-xs font-semibold text-rose-500">{editForm.errors.income_category_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_amount" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Amount (PKR Rs.) *
                                    </Label>
                                    <Input
                                        id="edit_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editForm.data.amount}
                                        onChange={(e) => editForm.setData('amount', e.target.value)}
                                        required
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all font-mono ${editForm.errors.amount
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {editForm.errors.amount && (
                                        <p className="text-xs font-semibold text-rose-500">{editForm.errors.amount}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Date Received *
                                    </Label>
                                    <Input
                                        id="edit_date"
                                        type="date"
                                        value={editForm.data.income_date}
                                        onChange={(e) => editForm.setData('income_date', e.target.value)}
                                        required
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${editForm.errors.income_date
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {editForm.errors.income_date && (
                                        <p className="text-xs font-semibold text-rose-500">{editForm.errors.income_date}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Notes / Details
                                    </Label>
                                    <textarea
                                        id="edit_notes"
                                        rows={3}
                                        value={editForm.data.notes}
                                        onChange={(e) => editForm.setData('notes', e.target.value)}
                                        className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-xs font-medium text-slate-900 dark:text-white transition-all ${editForm.errors.notes
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {editForm.errors.notes && (
                                        <p className="text-xs font-semibold text-rose-500">{editForm.errors.notes}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingIncome(null)}
                                        className="h-10 px-4 rounded-xl text-xs font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {editForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <span>Update Entry</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {deletingIncome && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingIncome(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Income Entry?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deletingIncome.title}"</strong>? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingIncome(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteSubmit}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Entry</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
