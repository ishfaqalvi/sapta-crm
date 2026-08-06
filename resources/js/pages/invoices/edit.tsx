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

interface ProjectOption {
    id: number;
    client_id: number;
    project_name: string;
    total_budget: number;
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
        website_project_id?: number;
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
    projects: ProjectOption[];
    currencies: CurrencyOption[];
}

export default function InvoicesEdit({
    invoice,
    clients,
    projects,
    currencies,
}: InvoicesEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Invoices', href: '/invoices' },
        { title: `Edit ${invoice.invoice_number}`, href: `/invoices/${invoice.id}/edit` },
    ];

    const form = useForm({
        client_id: String(invoice.client_id),
        website_project_id: invoice.website_project_id ? String(invoice.website_project_id) : '',
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
            : [{ description: 'Service Item', quantity: 1, unit_price: 0 }],
    });

    const filteredProjects = form.data.client_id
        ? projects.filter((p) => String(p.client_id) === String(form.data.client_id))
        : projects;

    // SearchableSelect Options
    const clientSelectOptions = clients.map((c) => ({
        value: String(c.id),
        label: c.name,
        subLabel: c.company_name ? c.company_name : 'Individual Client',
    }));

    const projectSelectOptions = [
        { value: '', label: '-- General Invoice (No Project) --', subLabel: 'Standalone invoice without linked project' },
        ...filteredProjects.map((p) => ({
            value: String(p.id),
            label: p.project_name,
            subLabel: `Budget: ${p.currency || 'PKR'} ${Number(p.total_budget || 0).toLocaleString()}`,
        })),
    ];

    const addItemRow = () => {
        form.setData('items', [
            ...form.data.items,
            { description: '', quantity: 1, unit_price: 0 },
        ]);
    };

    const removeItemRow = (index: number) => {
        if (form.data.items.length <= 1) return;
        const newItems = [...form.data.items];
        newItems.splice(index, 1);
        form.setData('items', newItems);
    };

    const updateItemRow = (index: number, field: 'description' | 'quantity' | 'unit_price', value: any) => {
        const newItems = [...form.data.items];
        newItems[index] = {
            ...newItems[index],
            [field]: value,
        };
        form.setData('items', newItems);
    };

    // Calculations
    const subtotal = form.data.items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        return sum + qty * price;
    }, 0);

    const taxAmount = (subtotal * (Number(form.data.tax_rate) || 0)) / 100;
    const totalAmount = subtotal + taxAmount - (Number(form.data.discount) || 0);

    const selectedCurrencyObj = currencies.find((c) => c.code === form.data.currency_code);
    const exchangeRate = selectedCurrencyObj ? Number(selectedCurrencyObj.exchange_rate_to_pkr) : 1.0;
    const totalAmountPkr = totalAmount * exchangeRate;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(`/invoices/${invoice.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${invoice.invoice_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/invoices/${invoice.id}`}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Edit Invoice {invoice.invoice_number}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Update line items, billing status, or due dates.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} noValidate className="space-y-6 max-w-5xl">
                    {/* Invoice Meta Card */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoice Information</h2>
                                <p className="text-xs text-slate-500">Client details, status, dates, and currency.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {/* Invoice Number (Read only) */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Invoice Number
                                </Label>
                                <Input
                                    disabled
                                    className="h-11 rounded-xl uppercase font-mono font-extrabold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white"
                                    value={invoice.invoice_number}
                                />
                            </div>

                            {/* Client Selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="client_id" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Select Client *
                                </Label>
                                <SearchableSelect
                                    options={clientSelectOptions}
                                    value={form.data.client_id}
                                    onChange={(val) => form.setData('client_id', val)}
                                    placeholder="-- Choose Client --"
                                    searchPlaceholder="Type client name or company..."
                                    required
                                />
                                {form.errors.client_id && <p className="text-xs font-semibold text-rose-500">{form.errors.client_id}</p>}
                            </div>

                            {/* Website Project Selector */}
                            <div className="space-y-1.5">
                                <Label htmlFor="website_project_id" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Linked Project (Optional)
                                </Label>
                                <SearchableSelect
                                    options={projectSelectOptions}
                                    value={form.data.website_project_id}
                                    onChange={(val) => form.setData('website_project_id', val)}
                                    placeholder="-- General Invoice (No Project) --"
                                    searchPlaceholder="Type project name..."
                                />
                            </div>

                            {/* Status Picker */}
                            <div className="space-y-1.5">
                                <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Invoice Status *
                                </Label>
                                <select
                                    id="status"
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value as any)}
                                    className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white px-3 focus:outline-none focus:border-blue-600 transition-all uppercase"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Currency Picker */}
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

                            {/* Issue Date */}
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
                                {form.errors.issue_date && <p className="text-xs font-semibold text-rose-500">{form.errors.issue_date}</p>}
                            </div>

                            {/* Due Date */}
                            <div className="space-y-1.5 sm:col-span-3">
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
                                {form.errors.due_date && <p className="text-xs font-semibold text-rose-500">{form.errors.due_date}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Line Items Builder Card */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                    <Receipt className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invoice Line Items</h2>
                                    <p className="text-xs text-slate-500">Edit descriptions, quantities, or pricing.</p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addItemRow}
                                className="h-9 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5"
                            >
                                <Plus className="size-3.5" />
                                <span>Add Line Item</span>
                            </Button>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-3">
                            {form.data.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 grid grid-cols-12 gap-3 items-center"
                                >
                                    <div className="col-span-12 sm:col-span-6 space-y-1">
                                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Description</Label>
                                        <Input
                                            value={item.description}
                                            onChange={(e) => updateItemRow(index, 'description', e.target.value)}
                                            className="h-10 rounded-xl bg-white dark:bg-slate-900 text-xs font-medium"
                                        />
                                    </div>

                                    <div className="col-span-5 sm:col-span-2 space-y-1">
                                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Qty</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) => updateItemRow(index, 'quantity', e.target.value)}
                                            className="h-10 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold text-center"
                                        />
                                    </div>

                                    <div className="col-span-5 sm:col-span-3 space-y-1">
                                        <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                            Rate ({form.data.currency_code})
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.unit_price}
                                            onChange={(e) => updateItemRow(index, 'unit_price', e.target.value)}
                                            className="h-10 rounded-xl bg-white dark:bg-slate-900 text-xs font-extrabold text-right font-mono"
                                        />
                                    </div>

                                    <div className="col-span-2 sm:col-span-1 flex items-center justify-end pt-5">
                                        <button
                                            type="button"
                                            onClick={() => removeItemRow(index)}
                                            disabled={form.data.items.length <= 1}
                                            className="size-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center disabled:opacity-30"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary & Calculations Section */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                        Invoice Notes
                                    </Label>
                                    <textarea
                                        id="notes"
                                        rows={2}
                                        value={form.data.notes}
                                        onChange={(e) => form.setData('notes', e.target.value)}
                                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-medium text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="terms" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                        Terms & Conditions
                                    </Label>
                                    <textarea
                                        id="terms"
                                        rows={2}
                                        value={form.data.terms}
                                        onChange={(e) => form.setData('terms', e.target.value)}
                                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 text-xs font-medium text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-500">Subtotal:</span>
                                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                                        {form.data.currency_code} {subtotal.toFixed(2)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 items-center text-xs pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="tax_rate" className="text-xs font-semibold text-slate-500 shrink-0">
                                            Tax (%):
                                        </Label>
                                        <Input
                                            id="tax_rate"
                                            type="number"
                                            step="0.1"
                                            value={form.data.tax_rate}
                                            onChange={(e) => form.setData('tax_rate', e.target.value)}
                                            className="h-8 rounded-lg bg-white dark:bg-slate-900 text-xs font-bold text-right"
                                        />
                                    </div>
                                    <span className="text-right font-bold text-slate-900 dark:text-white font-mono">
                                        + {form.data.currency_code} {taxAmount.toFixed(2)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 items-center text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <Label htmlFor="discount" className="text-xs font-semibold text-slate-500 shrink-0">
                                            Discount:
                                        </Label>
                                        <Input
                                            id="discount"
                                            type="number"
                                            step="0.01"
                                            value={form.data.discount}
                                            onChange={(e) => form.setData('discount', e.target.value)}
                                            className="h-8 rounded-lg bg-white dark:bg-slate-900 text-xs font-bold text-right"
                                        />
                                    </div>
                                    <span className="text-right font-bold text-slate-900 dark:text-white font-mono">
                                        - {form.data.currency_code} {Number(form.data.discount || 0).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-200 dark:border-slate-800">
                                    <span className="font-extrabold text-slate-900 dark:text-white">Total Amount:</span>
                                    <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono text-base">
                                        {form.data.currency_code} {totalAmount.toFixed(2)}
                                    </span>
                                </div>

                                {form.data.currency_code !== 'PKR' && (
                                    <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                                        <span>PKR Converted Total:</span>
                                        <span className="font-mono font-extrabold text-sm">
                                            PKR {totalAmountPkr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href={`/invoices/${invoice.id}`}
                            className="h-11 px-5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center justify-center"
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-11 px-8 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all"
                        >
                            {form.processing ? (
                                <div className="flex items-center gap-2">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Updating Invoice...</span>
                                </div>
                            ) : (
                                <span>Save Changes</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
