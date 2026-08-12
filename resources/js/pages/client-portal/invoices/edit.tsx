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

export interface ClientInvoiceItem {
    id: number;
    invoice_number: string;
    client_id: number;
    currency_code: string;
    subtotal: number | string;
    tax_rate?: number | string;
    tax_amount?: number | string;
    discount?: number | string;
    total_amount: number | string;
    issue_date: string;
    due_date: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    notes?: string | null;
    terms?: string | null;
    items?: {
        id?: number;
        description: string;
        quantity: number | string;
        unit_price: number | string;
    }[];
}

interface EditInvoiceProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    invoice: ClientInvoiceItem;
    currencies?: { code: string; name: string; symbol: string }[];
}

export default function EditClientInvoice({
    client,
    invoice,
    currencies = [],
}: EditInvoiceProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Invoices & Billing', href: '/client-portal/invoices' },
        { title: `Edit Invoice ${invoice.invoice_number}`, href: `/client-portal/invoices/${invoice.id}/edit` },
    ];

    const formatDateInput = (dStr?: string) => {
        if (!dStr) return '';
        return dStr.split('T')[0].split(' ')[0];
    };

    const { data, setData, put, processing, errors } = useForm({
        currency_code: invoice.currency_code || client.currency || 'USD',
        issue_date: formatDateInput(invoice.issue_date),
        due_date: formatDateInput(invoice.due_date),
        status: invoice.status,
        tax_rate: invoice.tax_rate || 0,
        discount: invoice.discount || 0,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        items: (invoice.items && invoice.items.length > 0)
            ? invoice.items.map(i => ({ description: i.description, quantity: Number(i.quantity), unit_price: i.unit_price }))
            : [{ description: '', quantity: 1, unit_price: '' }],
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

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const tax = calculateTaxAmount();
        const discount = Number(data.discount) || 0;
        return Math.max(0, subtotal + tax - discount);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(`/client-portal/invoices/${invoice.id}`);
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title={`Edit Invoice ${invoice.invoice_number}`} />

            <div className="p-4 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#003796] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20">
                            <FileText className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    Edit Invoice
                                </h1>
                                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold border border-blue-200 dark:border-blue-800">
                                    {invoice.invoice_number}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Modify items and invoice configuration.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/client-portal/invoices"
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to Invoices</span>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Invoice Configuration Card */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                            <Receipt className="size-4 text-blue-600" />
                            <span>Invoice Settings</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Billing Currency */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Billing Currency <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.currency_code}
                                    onChange={(e) => setData('currency_code', e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                >
                                    {currencies.length > 0 ? (
                                        currencies.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} ({c.name})
                                            </option>
                                        ))
                                    ) : (
                                        <option value={data.currency_code}>{data.currency_code}</option>
                                    )}
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Status <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value as any)}
                                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                >
                                    <option value="sent">Sent / Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Issue Date */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Issue Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.issue_date}
                                    onChange={(e) => setData('issue_date', e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                    required
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Due Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <DollarSign className="size-4 text-emerald-600" />
                                <span>Line Items Breakdown</span>
                            </h3>

                            <button
                                type="button"
                                onClick={addItemRow}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-blue-200 dark:border-blue-800"
                            >
                                <Plus className="size-3.5" />
                                <span>Add Item</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {data.items.map((item, index) => {
                                const lineAmount = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                                return (
                                    <div
                                        key={index}
                                        className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 items-center"
                                    >
                                        <div className="sm:col-span-6">
                                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                                Description #{index + 1}
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Service description..."
                                                value={item.description}
                                                onChange={(e) => updateItemRow(index, 'description', e.target.value)}
                                                className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                                required
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={item.quantity}
                                                onChange={(e) => updateItemRow(index, 'quantity', e.target.value)}
                                                className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                                required
                                            />
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                                                Unit Price ({data.currency_code})
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unit_price}
                                                onChange={(e) => updateItemRow(index, 'unit_price', e.target.value)}
                                                className="w-full h-9 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                                required
                                            />
                                        </div>

                                        <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-2 sm:pt-4">
                                            <div className="text-right">
                                                <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Line Total</span>
                                                <span className="text-xs font-extrabold font-mono text-slate-900 dark:text-white">
                                                    {data.currency_code} {lineAmount.toFixed(2)}
                                                </span>
                                            </div>

                                            {data.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItemRow(index)}
                                                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary Totals */}
                        <div className="flex flex-col md:flex-row justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="w-full md:w-96 space-y-3 bg-slate-50/80 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                                <div className="flex justify-between items-center">
                                    <span>Subtotal:</span>
                                    <span className="font-mono text-slate-900 dark:text-white font-extrabold">
                                        {data.currency_code} {calculateSubtotal().toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center gap-4">
                                    <span>Tax Rate (%):</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={data.tax_rate}
                                        onChange={(e) => setData('tax_rate', Number(e.target.value))}
                                        className="h-8 w-24 px-2 text-right font-mono text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                    />
                                </div>

                                <div className="flex justify-between items-center gap-4">
                                    <span>Discount ({data.currency_code}):</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.discount}
                                        onChange={(e) => setData('discount', e.target.value)}
                                        className="h-8 w-28 px-2 text-right font-mono text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                    />
                                </div>

                                <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <span>Grand Total:</span>
                                    <span className="font-mono text-blue-600 dark:text-blue-400 text-base">
                                        {data.currency_code} {calculateTotal().toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes & Terms */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Notes / Memo
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Payment Terms
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.terms}
                                    onChange={(e) => setData('terms', e.target.value)}
                                    className="w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Link
                                href="/client-portal/invoices"
                                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle2 className="size-4" />
                                <span>Update Invoice</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </ClientPortalLayout>
    );
}
