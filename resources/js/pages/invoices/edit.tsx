import SearchableSelect from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    FileText,
    LoaderCircle,
    Plus,
    Receipt,
    Trash2,
} from 'lucide-react';
import { FormEventHandler } from 'react';

interface ClientOption {
    id: number;
    name: string;
    company_name?: string;
    currency?: string;
}

interface CurrencyOption {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate_to_pkr: number;
}

interface InvoicesEditProps {
    invoice: {
        id: number;
        invoice_number: string;
        client_id: number;
        currency_code: string;
        exchange_rate_to_pkr: number;
        subtotal: number;
        tax_rate: number;
        tax_amount: number;
        discount: number;
        total_amount: number;
        total_amount_pkr: number;
        issue_date: string;
        due_date: string;
        status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
        notes?: string;
        terms?: string;
        items: Array<{
            id?: number;
            description: string;
            quantity: number;
            unit_price: number;
            amount: number;
        }>;
    };
    clients: ClientOption[];
    currencies: CurrencyOption[];
}

export default function InvoicesEdit({
    invoice,
    clients,
    currencies,
}: InvoicesEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Invoices', href: '/invoices' },
        { title: `Edit ${invoice.invoice_number}`, href: `/invoices/${invoice.id}/edit` },
    ];

    const form = useForm({
        client_id: String(invoice.client_id),
        currency_code: invoice.currency_code,
        issue_date: invoice.issue_date.split('T')[0],
        due_date: invoice.due_date.split('T')[0],
        status: invoice.status,
        tax_rate: invoice.tax_rate,
        discount: invoice.discount,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        items: invoice.items.length > 0
            ? invoice.items.map((i) => ({
                  description: i.description,
                  quantity: i.quantity,
                  unit_price: i.unit_price,
              }))
            : [{ description: '', quantity: 1, unit_price: 0 }],
    });

    const clientSelectOptions = clients.map((c) => ({
        value: String(c.id),
        label: c.name,
        subLabel: c.company_name ? c.company_name : 'Individual Client',
    }));

    const handleClientChange = (clientId: string) => {
        form.setData((prevData) => {
            const selectedClient = clients.find((c) => String(c.id) === String(clientId));
            return {
                ...prevData,
                client_id: clientId,
                currency_code: selectedClient?.currency || prevData.currency_code,
            };
        });
    };

    const selectedCurrencyObj = currencies.find((c) => c.code === form.data.currency_code);
    const exchangeRate = selectedCurrencyObj ? Number(selectedCurrencyObj.exchange_rate_to_pkr) : invoice.exchange_rate_to_pkr || 1.0;

    const addItem = () => {
        form.setData('items', [
            ...form.data.items,
            { description: '', quantity: 1, unit_price: 0 },
        ]);
    };

    const removeItem = (index: number) => {
        if (form.data.items.length <= 1) return;
        const newItems = form.data.items.filter((_, i) => i !== index);
        form.setData('items', newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...form.data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        form.setData('items', newItems);
    };

    const subtotal = form.data.items.reduce((sum, item) => {
        const qty = parseFloat(String(item.quantity)) || 0;
        const price = parseFloat(String(item.unit_price)) || 0;
        return sum + qty * price;
    }, 0);

    const taxRate = parseFloat(String(form.data.tax_rate)) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = parseFloat(String(form.data.discount)) || 0;
    const grandTotal = Math.max(0, subtotal + taxAmount - discount);
    const grandTotalPKR = grandTotal * exchangeRate;

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(`/invoices/${invoice.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${invoice.invoice_number}`} />

            <div className="p-4 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
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
                                Modify billing items and payment terms.
                            </p>
                        </div>
                    </div>

                    <Link
                        href={`/invoices/${invoice.id}`}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Cancel & View Invoice</span>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                            1. Invoice Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="client_id" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Select Client *
                                </Label>
                                <SearchableSelect
                                    options={clientSelectOptions}
                                    value={form.data.client_id}
                                    onChange={(val) => handleClientChange(val)}
                                    placeholder="-- Choose Client --"
                                    searchPlaceholder="Type client name or company..."
                                    required
                                />
                                {form.errors.client_id && <p className="text-xs font-semibold text-rose-500">{form.errors.client_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="currency_code" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Billing Currency *
                                </Label>
                                <select
                                    id="currency_code"
                                    value={form.data.currency_code}
                                    onChange={(e) => form.setData('currency_code', e.target.value)}
                                    className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white px-3 focus:outline-none focus:border-blue-600 transition-all"
                                >
                                    {currencies.map((c) => (
                                        <option key={c.id} value={c.code}>
                                            {c.name} ({c.code} - {c.symbol})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Payment Status *
                                </Label>
                                <select
                                    id="status"
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value as any)}
                                    className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white px-3 focus:outline-none focus:border-blue-600 transition-all"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="issue_date" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Issue Date *
                                </Label>
                                <Input
                                    id="issue_date"
                                    type="date"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                                    value={form.data.issue_date}
                                    onChange={(e) => form.setData('issue_date', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="due_date" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Due Date *
                                </Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                                    value={form.data.due_date}
                                    onChange={(e) => form.setData('due_date', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                    <Receipt className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                                        2. Line Items & Services
                                    </h3>
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={addItem}
                                className="h-9 px-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-800"
                            >
                                <Plus className="size-4" />
                                <span>Add Item</span>
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {form.data.items.map((item, idx) => {
                                const itemTotal = (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unit_price)) || 0);
                                return (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 items-center"
                                    >
                                        <div className="sm:col-span-6 space-y-1">
                                            <Label className="text-[11px] font-bold text-slate-500 block uppercase">
                                                Description #{idx + 1}
                                            </Label>
                                            <Input
                                                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-medium"
                                                value={item.description}
                                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="sm:col-span-2 space-y-1">
                                            <Label className="text-[11px] font-bold text-slate-500 block uppercase">Qty / Hrs</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="sm:col-span-2 space-y-1">
                                            <Label className="text-[11px] font-bold text-slate-500 block uppercase">Unit Price</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold font-mono"
                                                value={item.unit_price}
                                                onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-2 sm:pt-4">
                                            <div className="text-right">
                                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Amount</span>
                                                <span className="text-xs font-extrabold font-mono text-slate-900 dark:text-white">
                                                    {form.data.currency_code} {itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {form.data.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
                                                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                                    title="Remove item"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col md:flex-row justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="w-full md:w-96 space-y-3 bg-slate-50/80 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                    <span>Subtotal:</span>
                                    <span className="font-mono text-slate-900 dark:text-white font-extrabold">
                                        {form.data.currency_code} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                                    <span>Tax Rate (%):</span>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        className="h-8 w-24 text-right font-mono text-xs font-bold bg-white dark:bg-slate-900"
                                        value={form.data.tax_rate}
                                        onChange={(e) => form.setData('tax_rate', e.target.value as any)}
                                    />
                                </div>

                                <div className="flex justify-between items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                                    <span>Discount Amount:</span>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="h-8 w-28 text-right font-mono text-xs font-bold bg-white dark:bg-slate-900"
                                        value={form.data.discount}
                                        onChange={(e) => form.setData('discount', e.target.value as any)}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <span>Total Amount:</span>
                                    <span className="font-mono text-blue-600 dark:text-blue-400 text-base">
                                        {form.data.currency_code} {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Customer Notes / Memo
                                </Label>
                                <textarea
                                    id="notes"
                                    rows={3}
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="terms" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Terms & Payment Instructions
                                </Label>
                                <textarea
                                    id="terms"
                                    rows={3}
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                    value={form.data.terms}
                                    onChange={(e) => form.setData('terms', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Link
                                href={`/invoices/${invoice.id}`}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </Link>

                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {form.processing ? (
                                    <>
                                        <LoaderCircle className="size-4 animate-spin" />
                                        <span>Updating Invoice...</span>
                                    </>
                                ) : (
                                    <span>Update Invoice</span>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
