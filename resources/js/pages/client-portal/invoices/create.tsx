import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    FileText,
    Globe,
    Plus,
    Receipt,
    Trash2,
} from 'lucide-react';
import { FormEvent } from 'react';

export interface InvoiceLineItemInput {
    description: string;
    quantity: number | string;
    unit_price: number | string;
}

interface CreateInvoiceProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    projects?: { id: number; project_name: string }[];
    currencies?: { code: string; name: string; symbol: string }[];
    nextInvoiceNumber?: string;
    defaultTaxRate?: number;
}

export default function CreateClientInvoice({
    client,
    projects = [],
    currencies = [],
    nextInvoiceNumber = 'SAPTA-INV-001',
    defaultTaxRate = 0,
}: CreateInvoiceProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Invoices & Billing', href: '/client-portal/invoices' },
        { title: 'Create Invoice', href: '/client-portal/invoices/create' },
    ];

    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const getDueDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    };

    const { data, setData, post, processing, errors } = useForm({
        website_project_id: '' as string | number,
        currency_code: client.currency || 'USD',
        issue_date: getTodayDate(),
        due_date: getDueDate(),
        status: 'sent' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
        tax_rate: defaultTaxRate,
        discount: 0 as number | string,
        notes: '',
        terms: 'Payment due within 7 days of invoice issuance. Thank you for your business.',
        items: [
            { description: 'Development Services', quantity: 1, unit_price: '' }
        ] as InvoiceLineItemInput[],
    });

    const addItemRow = () => {
        setData('items', [...data.items, { description: '', quantity: 1, unit_price: '' }]);
    };

    const removeItemRow = (index: number) => {
        if (data.items.length === 1) return;
        const newItems = data.items.filter((_, idx) => idx !== index);
        setData('items', newItems);
    };

    const updateItemRow = (index: number, field: keyof InvoiceLineItemInput, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    const calculateSubtotal = () => {
        return data.items.reduce((acc, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            return acc + qty * price;
        }, 0);
    };

    const calculateTaxAmount = () => {
        const subtotal = calculateSubtotal();
        const taxRate = Number(data.tax_rate) || 0;
        return (subtotal * taxRate) / 100;
    };

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        const taxAmount = calculateTaxAmount();
        const discount = Number(data.discount) || 0;
        return Math.max(0, subtotal + taxAmount - discount);
    };

    const formatCurrency = (val: number | string) => {
        const num = Number(val) || 0;
        return `${data.currency_code || 'USD'} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/client-portal/invoices/store');
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="payments">
            <Head title={`Create Invoice | ${client.name}`} />

            <div className="p-6 w-full space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/client-portal/invoices"
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    Create New Invoice
                                </h1>
                                <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    {nextInvoiceNumber}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                Generate a new official billing invoice for {client.name}.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/client-portal/invoices"
                            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                        >
                            Cancel
                        </Link>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                        >
                            <CheckCircle2 className="size-4" />
                            <span>{processing ? 'Saving...' : 'Save & Issue Invoice'}</span>
                        </button>
                    </div>
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    {/* General Information Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Receipt className="size-4" />
                            </div>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                General Invoice Details
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Associated Project */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Associated Website Project
                                </label>
                                <select
                                    value={data.website_project_id}
                                    onChange={(e) => setData('website_project_id', e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                >
                                    <option value="">General Account Invoice (No Project)</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.project_name}
                                        </option>
                                    ))}
                                </select>
                                {errors.website_project_id && (
                                    <p className="text-rose-500 text-[11px] font-semibold mt-1">{errors.website_project_id}</p>
                                )}
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Currency <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.currency_code}
                                    onChange={(e) => setData('currency_code', e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-mono"
                                >
                                    {currencies.length > 0 ? (
                                        currencies.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} - {c.name} ({c.symbol})
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="USD">USD ($)</option>
                                            <option value="PKR">PKR (Rs)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                        </>
                                    )}
                                </select>
                                {errors.currency_code && (
                                    <p className="text-rose-500 text-[11px] font-semibold mt-1">{errors.currency_code}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Invoice Status <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e: any) => setData('status', e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                >
                                    <option value="sent">Sent / Pending</option>
                                    <option value="draft">Draft</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                {errors.status && (
                                    <p className="text-rose-500 text-[11px] font-semibold mt-1">{errors.status}</p>
                                )}
                            </div>

                            {/* Issue Date */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Issue Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.issue_date}
                                    onChange={(e) => setData('issue_date', e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                />
                                {errors.issue_date && (
                                    <p className="text-rose-500 text-[11px] font-semibold mt-1">{errors.issue_date}</p>
                                )}
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Due Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                />
                                {errors.due_date && (
                                    <p className="text-rose-500 text-[11px] font-semibold mt-1">{errors.due_date}</p>
                                )}
                            </div>

                            {/* Tax Rate % */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Tax Rate (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.tax_rate}
                                    onChange={(e) => setData('tax_rate', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-mono"
                                />
                                {errors.tax_rate && (
                                    <p className="text-rose-500 text-[11px] font-semibold mt-1">{errors.tax_rate}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Line Items Breakdown Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                    <FileText className="size-4" />
                                </div>
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Invoice Line Items
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={addItemRow}
                                className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                                <Plus className="size-4" />
                                <span>Add Line Item</span>
                            </button>
                        </div>

                        {errors.items && (
                            <p className="text-rose-500 text-[11px] font-semibold">{errors.items}</p>
                        )}

                        <div className="space-y-3">
                            {data.items.map((item, idx) => {
                                const qty = Number(item.quantity) || 0;
                                const price = Number(item.unit_price) || 0;
                                const rowAmount = qty * price;

                                return (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end transition-all"
                                    >
                                        <div className="sm:col-span-5">
                                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                                                Item Description <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItemRow(idx, 'description', e.target.value)}
                                                placeholder="e.g. Custom Website Development Services"
                                                className="w-full h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                                                className="w-full h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 text-center font-mono"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                                                Unit Price ({data.currency_code})
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) => updateItemRow(idx, 'unit_price', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-mono"
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                                                Row Total
                                            </label>
                                            <div className="h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-end font-mono">
                                                {formatCurrency(rowAmount)}
                                            </div>
                                        </div>

                                        <div className="sm:col-span-1 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => removeItemRow(idx)}
                                                disabled={data.items.length === 1}
                                                className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 hover:bg-rose-100 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
                                                title="Remove Row"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary & Terms Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Notes & Terms */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Discount Amount ({data.currency_code})
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.discount}
                                    onChange={(e) => setData('discount', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Invoice Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Additional notes for the client..."
                                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Terms & Conditions
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.terms}
                                    onChange={(e) => setData('terms', e.target.value)}
                                    placeholder="Payment terms..."
                                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                />
                            </div>
                        </div>

                        {/* Right: Clean White/Slate Billing Summary Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6">
                            <div>
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span>Calculated Billing Summary</span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                        {data.currency_code}
                                    </span>
                                </h4>

                                <div className="mt-4 space-y-3.5 text-xs font-semibold">
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Subtotal</span>
                                        <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(calculateSubtotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                        <span>Tax ({data.tax_rate || 0}%)</span>
                                        <span className="font-mono text-slate-900 dark:text-white">+{formatCurrency(calculateTaxAmount())}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                                        <span>Discount</span>
                                        <span className="font-mono">-{formatCurrency(data.discount || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-5">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                            Grand Total Amount
                                        </span>
                                        <h2 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
                                            {formatCurrency(calculateGrandTotal())}
                                        </h2>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <Link
                                        href="/client-portal/invoices"
                                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="size-4" />
                                        <span>{processing ? 'Saving...' : 'Save & Issue Invoice'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </ClientPortalLayout>
    );
}
