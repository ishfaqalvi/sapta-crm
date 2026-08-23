import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Coins,
    Edit2,
    Globe,
    LoaderCircle,
    Plus,
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
        title: 'Currencies',
        href: '/currencies',
    },
];

export interface CurrencyItem {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate_to_pkr: number;
    is_base: boolean;
    is_active: boolean;
    usages_count?: number;
    updated_at: string;
}

interface CurrenciesIndexProps {
    currencies: PaginatedData<CurrencyItem>;
    stats: {
        total: number;
        active: number;
        base: string;
    };
    filters?: {
        search?: string;
    };
}

export default function CurrenciesIndex({ currencies, stats, filters }: CurrenciesIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<CurrencyItem | null>(null);

    // Delete Confirmation Modal State
    const [deletingCurrency, setDeletingCurrency] = useState<CurrencyItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const addForm = useForm<{
        code: string;
        name: string;
        symbol: string;
        exchange_rate_to_pkr: string | number;
        is_active: boolean;
    }>({
        code: '',
        name: '',
        symbol: '$',
        exchange_rate_to_pkr: '',
        is_active: true,
    });

    const editForm = useForm<{
        code: string;
        name: string;
        symbol: string;
        exchange_rate_to_pkr: string | number;
        is_active: boolean;
    }>({
        code: '',
        name: '',
        symbol: '$',
        exchange_rate_to_pkr: '',
        is_active: true,
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
                '/currencies',
                { search: searchQuery },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleAddSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        addForm.post('/currencies', {
            onSuccess: () => {
                setIsAddModalOpen(false);
                addForm.reset();
            },
        });
    };

    const openEditModal = (c: CurrencyItem) => {
        setEditingCurrency(c);
        editForm.setData({
            code: c.code,
            name: c.name,
            symbol: c.symbol,
            exchange_rate_to_pkr: c.exchange_rate_to_pkr,
            is_active: c.is_active,
        });
    };

    const handleEditSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!editingCurrency) return;
        editForm.put(`/currencies/${editingCurrency.id}`, {
            onSuccess: () => setEditingCurrency(null),
        });
    };

    const confirmDelete = () => {
        if (!deletingCurrency) return;
        setIsDeleting(true);
        router.delete(`/currencies/${deletingCurrency.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeletingCurrency(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Currencies Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Currencies & Exchange Rates CRUD
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage billing currencies, PKR conversion exchange rates, and multi-currency engine settings.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-10 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="size-4" />
                        <span>Add New Currency</span>
                    </button>
                </div>

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Configured</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total} Currencies</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Coins className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Currencies</p>
                            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active} Active</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">System Base Currency</p>
                            <h3 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{stats.base} (Rate = 1.0)</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Globe className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Toolbar Search */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by currency code (e.g. USD), currency name, or symbol..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>
                </div>

                {/* Currencies Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Currency Code & Name</th>
                                    <th className="px-6 py-4">Symbol</th>
                                    <th className="px-6 py-4">Exchange Rate (to 1 PKR)</th>
                                    <th className="px-6 py-4">Currency Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {currencies.data.length > 0 ? (
                                    currencies.data.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Code & Name */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                                        {c.code}
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                                            {c.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono block">
                                                            {c.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Symbol */}
                                            <td className="px-6 py-4 font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                                                {c.symbol}
                                            </td>

                                            {/* Exchange Rate */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm font-mono block">
                                                        PKR {Number(c.exchange_rate_to_pkr).toFixed(4)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-semibold block">
                                                        1 {c.code} = {Number(c.exchange_rate_to_pkr).toFixed(2)} PKR
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td className="px-6 py-4">
                                                {c.is_base ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                        Base Currency
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                        Foreign Billing
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                                    c.is_active
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                                }`}>
                                                    {c.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(c)}
                                                        className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="Edit Currency"
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </button>

                                                    {!c.is_base && c.code !== 'PKR' && (
                                                        <button
                                                            onClick={() => setDeletingCurrency(c)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No currencies configured. Click <strong>Add New Currency</strong> to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={currencies} />
                </div>

                {/* ADD CURRENCY MODAL */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <Plus className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Add New Currency
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Create new currency and configure exchange rate to PKR.
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

                            <form onSubmit={handleAddSubmit} noValidate className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="code" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Currency Code *
                                        </Label>
                                        <Input
                                            id="code"
                                            value={addForm.data.code}
                                            onChange={(e) => addForm.setData('code', e.target.value.toUpperCase())}
                                            placeholder="e.g. CAD"
                                            className={`h-11 rounded-xl uppercase font-mono font-extrabold bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white transition-all ${
                                                addForm.errors.code
                                                    ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                        />
                                        {addForm.errors.code && <p className="text-xs font-semibold text-rose-500">{addForm.errors.code}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="symbol" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Symbol *
                                        </Label>
                                        <Input
                                            id="symbol"
                                            value={addForm.data.symbol}
                                            onChange={(e) => addForm.setData('symbol', e.target.value)}
                                            placeholder="e.g. $ or CAD"
                                            className={`h-11 rounded-xl font-bold bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white transition-all ${
                                                addForm.errors.symbol
                                                    ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                        />
                                        {addForm.errors.symbol && <p className="text-xs font-semibold text-rose-500">{addForm.errors.symbol}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Currency Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={addForm.data.name}
                                        onChange={(e) => addForm.setData('name', e.target.value)}
                                        placeholder="e.g. Canadian Dollar"
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                            addForm.errors.name
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {addForm.errors.name && <p className="text-xs font-semibold text-rose-500">{addForm.errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="exchange_rate_to_pkr" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Exchange Rate (1 {addForm.data.code || 'UNIT'} = ? PKR) *
                                    </Label>
                                    <Input
                                        id="exchange_rate_to_pkr"
                                        type="number"
                                        step="0.0001"
                                        value={addForm.data.exchange_rate_to_pkr}
                                        onChange={(e) => addForm.setData('exchange_rate_to_pkr', e.target.value)}
                                        placeholder="e.g. 205.5000"
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-extrabold text-slate-900 dark:text-white transition-all ${
                                            addForm.errors.exchange_rate_to_pkr
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10'
                                        }`}
                                    />
                                    {addForm.errors.exchange_rate_to_pkr && <p className="text-xs font-semibold text-rose-500">{addForm.errors.exchange_rate_to_pkr}</p>}
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        id="add_is_active"
                                        type="checkbox"
                                        checked={addForm.data.is_active}
                                        onChange={(e) => addForm.setData('is_active', e.target.checked)}
                                        className="size-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                    />
                                    <Label htmlFor="add_is_active" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                        Active status for billing drop-downs
                                    </Label>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="h-10 px-5 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={addForm.processing}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {addForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving Currency...</span>
                                            </>
                                        ) : (
                                            <span>Save Currency</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT CURRENCY MODAL */}
                {editingCurrency && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <Edit2 className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Edit Currency {editingCurrency.code}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Update exchange rate or currency configuration.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingCurrency(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} noValidate className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_code" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Code *
                                        </Label>
                                        <Input
                                            id="edit_code"
                                            value={editForm.data.code}
                                            disabled={editingCurrency.is_base}
                                            onChange={(e) => editForm.setData('code', e.target.value.toUpperCase())}
                                            className={`h-11 rounded-xl uppercase font-mono font-extrabold bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                                editForm.errors.code
                                                    ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                        />
                                        {editForm.errors.code && <p className="text-xs font-semibold text-rose-500">{editForm.errors.code}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_symbol" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Symbol *
                                        </Label>
                                        <Input
                                            id="edit_symbol"
                                            value={editForm.data.symbol}
                                            onChange={(e) => editForm.setData('symbol', e.target.value)}
                                            className={`h-11 rounded-xl font-bold bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                                editForm.errors.symbol
                                                    ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                        />
                                        {editForm.errors.symbol && <p className="text-xs font-semibold text-rose-500">{editForm.errors.symbol}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Currency Name *
                                    </Label>
                                    <Input
                                        id="edit_name"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                            editForm.errors.name
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {editForm.errors.name && <p className="text-xs font-semibold text-rose-500">{editForm.errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_exchange_rate" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Exchange Rate (1 {editForm.data.code} = ? PKR) *
                                    </Label>
                                    <Input
                                        id="edit_exchange_rate"
                                        type="number"
                                        step="0.0001"
                                        disabled={editingCurrency.is_base}
                                        value={editForm.data.exchange_rate_to_pkr}
                                        onChange={(e) => editForm.setData('exchange_rate_to_pkr', e.target.value)}
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-extrabold text-slate-900 dark:text-white transition-all ${
                                            editForm.errors.exchange_rate_to_pkr
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10'
                                        }`}
                                    />
                                    {editForm.errors.exchange_rate_to_pkr && <p className="text-xs font-semibold text-rose-500">{editForm.errors.exchange_rate_to_pkr}</p>}
                                    {editingCurrency.is_base && (
                                        <p className="text-[11px] text-slate-400 font-semibold italic">Base currency rate is locked to 1.0000.</p>
                                    )}
                                </div>

                                {!editingCurrency.is_base && (
                                    <div className="flex items-center gap-3 pt-2">
                                        <input
                                            id="edit_is_active"
                                            type="checkbox"
                                            checked={editForm.data.is_active}
                                            onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                            className="size-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                        />
                                        <Label htmlFor="edit_is_active" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                            Active status
                                        </Label>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingCurrency(null)}
                                        className="h-10 px-5 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {editForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Updating Currency...</span>
                                            </>
                                        ) : (
                                            <span>Update Currency</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {deletingCurrency && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingCurrency(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                                    Delete Currency {deletingCurrency.code}?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deletingCurrency.name}"</strong> ({deletingCurrency.code})? This action cannot be undone.
                                </p>
                            </div>

                            {/* Base / Usages Check Warning */}
                            {deletingCurrency.is_base || deletingCurrency.code === 'PKR' ? (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 text-left">
                                    <strong>Cannot Delete:</strong> Base currency (PKR) is required by the system and cannot be deleted.
                                </div>
                            ) : (deletingCurrency.usages_count || 0) > 0 ? (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 text-left">
                                    <strong>Cannot Delete:</strong> This currency is assigned to {deletingCurrency.usages_count} active transaction(s), invoice(s), client(s), or project(s). Reassign or delete those records first.
                                </div>
                            ) : null}

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingCurrency(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>

                                {!deletingCurrency.is_base && deletingCurrency.code !== 'PKR' && !(deletingCurrency.usages_count && deletingCurrency.usages_count > 0) && (
                                    <button
                                        type="button"
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <span>Delete Currency</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
