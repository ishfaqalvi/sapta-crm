import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    DollarSign,
    FolderKanban,
    Globe,
    Layers,
    LoaderCircle,
    Pencil,
    Plus,
    Receipt,
    Search,
    Server,
    Sparkles,
    Trash2,
    Wrench,
    X,
} from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PendingBillingItem {
    id: number;
    title: string;
    subtitle?: string;
    amount: number;
    amount_pkr?: number;
    due_date?: string | null;
    category: 'project' | 'service' | 'domain' | 'hosting';
    category_label: string;
    invoiceable_type: string;
    invoiceable_id: number;
}

export interface InvoiceLineItemInput extends Record<string, any> {
    id?: number;
    uid: string;
    description: string;
    quantity: number | string;
    unit_price: number | string;
    invoiceable_type?: string | null;
    invoiceable_id?: number | null;
    category?: 'project' | 'service' | 'domain' | 'hosting' | 'manual';
    category_label?: string;
}

export interface ClientInvoiceFormState extends Record<string, any> {
    invoice_number: string;
    issue_date: string;
    due_date: string;
    status: 'due' | 'paid' | 'cancelled';
    tax_rate: string;
    discount: string;
    notes: string;
    terms: string;
    items: InvoiceLineItemInput[];
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
    invoice: {
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
        status: 'due' | 'paid' | 'cancelled';
        notes?: string | null;
        terms?: string | null;
        items: {
            id?: number;
            description: string;
            quantity: number | string;
            unit_price: number | string;
            amount?: number | string;
            invoiceable_type?: string | null;
            invoiceable_id?: number | null;
            category?: 'project' | 'service' | 'domain' | 'hosting' | 'manual';
            category_label?: string;
        }[];
    };
    currencies?: { code: string; name: string; symbol: string; exchange_rate_to_pkr?: number }[];
    pendingProjects?: PendingBillingItem[];
    pendingServices?: PendingBillingItem[];
    pendingDomains?: PendingBillingItem[];
    pendingHostings?: PendingBillingItem[];
}

export default function EditClientInvoice({
    client,
    invoice,
    pendingProjects = [],
    pendingServices = [],
    pendingDomains = [],
    pendingHostings = [],
}: EditInvoiceProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Invoices & Billing', href: '/client-portal/invoices' },
        { title: `Edit ${invoice.invoice_number}`, href: `/client-portal/invoices/${invoice.id}/edit` },
    ];

    const clientCurrency = invoice.currency_code || client.currency || 'USD';

    // Modals State
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    // Custom Item Form State (for modal)
    const [customDescription, setCustomDescription] = useState('');
    const [customQuantity, setCustomQuantity] = useState('1');
    const [customUnitPrice, setCustomUnitPrice] = useState('');
    const [customError, setCustomError] = useState('');

    // Pending Items Filter & Search State
    const [pendingSearchQuery, setPendingSearchQuery] = useState('');
    const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'project' | 'service' | 'domain' | 'hosting'>('all');

    // Combine all pending items
    const allPendingItems = useMemo(() => {
        return [
            ...pendingProjects,
            ...pendingServices,
            ...pendingDomains,
            ...pendingHostings,
        ];
    }, [pendingProjects, pendingServices, pendingDomains, pendingHostings]);

    // Filter pending items based on search and category tab
    const filteredPendingItems = useMemo(() => {
        return allPendingItems.filter((item) => {
            const matchesCategory = activeCategoryTab === 'all' || item.category === activeCategoryTab;
            const matchesSearch =
                pendingSearchQuery.trim() === '' ||
                item.title.toLowerCase().includes(pendingSearchQuery.toLowerCase()) ||
                (item.subtitle && item.subtitle.toLowerCase().includes(pendingSearchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [allPendingItems, activeCategoryTab, pendingSearchQuery]);

    // Format initial date strings
    const formatDateForInput = (dStr?: string) => {
        if (!dStr) return '';
        return dStr.split('T')[0].split(' ')[0];
    };

    // Initialize line items from existing invoice
    const initialItems: InvoiceLineItemInput[] = useMemo(() => {
        if (!invoice.items || invoice.items.length === 0) return [];
        return invoice.items.map((i, idx) => ({
            id: i.id,
            uid: `existing_${i.id || idx}_${Date.now()}`,
            description: i.description,
            quantity: Number(i.quantity) || 1,
            unit_price: Number(i.unit_price) || 0,
            invoiceable_type: i.invoiceable_type ?? null,
            invoiceable_id: i.invoiceable_id ? Number(i.invoiceable_id) : null,
            category: i.category || 'manual',
            category_label: i.category_label || (i.invoiceable_type ? 'Linked Service' : 'Custom Item'),
        }));
    }, [invoice.items]);

    const form = useForm<ClientInvoiceFormState>({
        invoice_number: invoice.invoice_number,
        issue_date: formatDateForInput(invoice.issue_date),
        due_date: formatDateForInput(invoice.due_date),
        status: invoice.status || 'due',
        tax_rate: String(invoice.tax_rate ?? '0'),
        discount: String(invoice.discount ?? '0'),
        notes: invoice.notes || '',
        terms: invoice.terms || 'Payment is due within 7 days of invoice issuance. Thank you for your business.',
        items: initialItems,
    });

    // Check if a pending item is already added
    const isItemAdded = (item: PendingBillingItem) => {
        return (form.data.items || []).some(
            (i) => i.invoiceable_type === item.invoiceable_type && Number(i.invoiceable_id) === Number(item.invoiceable_id)
        );
    };

    // Toggle pending item
    const handleTogglePendingItem = (item: PendingBillingItem) => {
        const currentItems = form.data.items || [];
        const added = isItemAdded(item);
        if (added) {
            const filtered = currentItems.filter(
                (i) => !(i.invoiceable_type === item.invoiceable_type && Number(i.invoiceable_id) === Number(item.invoiceable_id))
            );
            form.setData('items', filtered);
        } else {
            const newItem: InvoiceLineItemInput = {
                uid: `pending_${item.category}_${item.id}_${Date.now()}`,
                description: item.title,
                quantity: 1,
                unit_price: item.amount,
                invoiceable_type: item.invoiceable_type,
                invoiceable_id: item.invoiceable_id,
                category: item.category,
                category_label: item.category_label,
            };
            form.setData('items', [...currentItems, newItem]);
        }
    };

    // Add all filtered items
    const handleAddAllFiltered = () => {
        const currentItems = form.data.items || [];
        const toAdd = filteredPendingItems.filter((item) => !isItemAdded(item));
        if (!toAdd.length) return;

        const newItems: InvoiceLineItemInput[] = toAdd.map((item) => ({
            uid: `pending_${item.category}_${item.id}_${Date.now()}_${Math.random()}`,
            description: item.title,
            quantity: 1,
            unit_price: item.amount,
            invoiceable_type: item.invoiceable_type,
            invoiceable_id: item.invoiceable_id,
            category: item.category,
            category_label: item.category_label,
        }));

        form.setData('items', [...currentItems, ...newItems]);
    };

    // Remove all pending items
    const handleRemoveAllPending = () => {
        const currentItems = form.data.items || [];
        const customOnly = currentItems.filter((i) => !i.invoiceable_type);
        form.setData('items', customOnly);
    };

    // Open Custom Item Modal (Add Mode)
    const handleOpenAddCustomModal = () => {
        setEditingItemIndex(null);
        setCustomDescription('');
        setCustomQuantity('1');
        setCustomUnitPrice('');
        setCustomError('');
        setIsCustomItemModalOpen(true);
    };

    // Open Custom Item Modal (Edit Mode)
    const handleOpenEditItemModal = (index: number) => {
        const currentItems = form.data.items || [];
        const target = currentItems[index];
        if (!target) return;
        setEditingItemIndex(index);
        setCustomDescription(target.description);
        setCustomQuantity(String(target.quantity));
        setCustomUnitPrice(String(target.unit_price));
        setCustomError('');
        setIsCustomItemModalOpen(true);
    };

    // Save Custom Item from Modal
    const handleSaveCustomItem = (e: FormEvent) => {
        e.preventDefault();
        if (!customDescription.trim()) {
            setCustomError('Please enter an item description.');
            return;
        }
        const qty = parseFloat(customQuantity);
        if (isNaN(qty) || qty <= 0) {
            setCustomError('Quantity must be greater than 0.');
            return;
        }
        const price = parseFloat(customUnitPrice);
        if (isNaN(price) || price < 0) {
            setCustomError('Please enter a valid unit price.');
            return;
        }

        const currentItems = form.data.items || [];

        if (editingItemIndex !== null && currentItems[editingItemIndex]) {
            // Edit existing item
            const updated = [...currentItems];
            updated[editingItemIndex] = {
                ...updated[editingItemIndex],
                description: customDescription.trim(),
                quantity: qty,
                unit_price: price,
            };
            form.setData('items', updated);
        } else {
            // Add new custom item
            const newItem: InvoiceLineItemInput = {
                uid: 'custom_' + Date.now(),
                description: customDescription.trim(),
                quantity: qty,
                unit_price: price,
                invoiceable_type: null,
                invoiceable_id: null,
                category: 'manual',
                category_label: 'Custom Item',
            };
            form.setData('items', [...currentItems, newItem]);
        }

        setIsCustomItemModalOpen(false);
    };

    // Remove row
    const handleRemoveItem = (index: number) => {
        const currentItems = form.data.items || [];
        const updated = currentItems.filter((_, i) => i !== index);
        form.setData('items', updated);
    };

    // Calculations
    const subtotal = useMemo(() => {
        const currentItems = form.data.items || [];
        return currentItems.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            return sum + qty * price;
        }, 0);
    }, [form.data.items]);

    const taxAmount = useMemo(() => {
        const taxRate = Number(form.data.tax_rate) || 0;
        return (subtotal * taxRate) / 100;
    }, [subtotal, form.data.tax_rate]);

    const discountAmount = useMemo(() => {
        return Number(form.data.discount) || 0;
    }, [form.data.discount]);

    const grandTotal = useMemo(() => {
        return Math.max(0, subtotal + taxAmount - discountAmount);
    }, [subtotal, taxAmount, discountAmount]);

    const formatCurrency = (amount: number, code: string = clientCurrency) => {
        return `${code} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case 'project':
                return <FolderKanban className="size-3.5 text-blue-600 dark:text-blue-400" />;
            case 'service':
                return <Wrench className="size-3.5 text-emerald-600 dark:text-emerald-400" />;
            case 'domain':
                return <Globe className="size-3.5 text-purple-600 dark:text-purple-400" />;
            case 'hosting':
                return <Server className="size-3.5 text-amber-600 dark:text-amber-400" />;
            default:
                return <Layers className="size-3.5 text-slate-500" />;
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.put(`/client-portal/invoices/update/${invoice.id}`);
    };

    const selectedPendingCount = (form.data.items || []).filter((i) => i.invoiceable_type).length;

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title={`Edit Invoice ${invoice.invoice_number}`} />

            <div className="p-4 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 inline-flex items-center gap-1.5">
                                <Receipt className="size-3.5" />
                                <span>{form.data.invoice_number}</span>
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Edit Invoice
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Modify invoice details, manage billable items, and adjust taxes or discounts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Link
                            href={`/client-portal/invoices/${invoice.id}`}
                            className="h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs"
                        >
                            <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                            <span>View Invoice</span>
                        </Link>
                    </div>
                </div>

                <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: Main Form & Line Items (8 Cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* 1. Base Settings Card */}
                        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <Receipt className="size-4 text-blue-600" />
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        Invoice Information
                                    </h3>
                                </div>

                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 text-[11px] font-extrabold font-mono inline-flex items-center gap-1.5">
                                    <DollarSign className="size-3.5" />
                                    <span>Client Currency: {clientCurrency}</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Invoice Number */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="invoice_number" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Invoice Statement # *
                                    </Label>
                                    <Input
                                        id="invoice_number"
                                        value={form.data.invoice_number}
                                        onChange={(e) => form.setData('invoice_number', e.target.value)}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-xs font-mono font-bold"
                                    />
                                    {form.errors.invoice_number && (
                                        <p className="text-xs font-semibold text-rose-500 mt-1">{form.errors.invoice_number}</p>
                                    )}
                                </div>

                                {/* Issue Date */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="issue_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Issue Date *
                                    </Label>
                                    <Input
                                        id="issue_date"
                                        type="date"
                                        value={form.data.issue_date}
                                        onChange={(e) => form.setData('issue_date', e.target.value)}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-xs font-semibold"
                                    />
                                    {form.errors.issue_date && (
                                        <p className="text-xs font-semibold text-rose-500 mt-1">{form.errors.issue_date}</p>
                                    )}
                                </div>

                                {/* Due Date */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="due_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Due Date *
                                    </Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={form.data.due_date}
                                        onChange={(e) => form.setData('due_date', e.target.value)}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-xs font-semibold"
                                    />
                                    {form.errors.due_date && (
                                        <p className="text-xs font-semibold text-rose-500 mt-1">{form.errors.due_date}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. INVOICE LINE ITEMS CARD & CLEAN TABLE */}
                        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Layers className="size-4 text-blue-600" />
                                        <span>Invoice Items ({(form.data.items || []).length})</span>
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Line items to be billed in {clientCurrency}.
                                    </p>
                                </div>

                                {/* Top Modal Buttons */}
                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    {allPendingItems.length > 0 && (
                                        <Button
                                            type="button"
                                            onClick={() => setIsPendingModalOpen(true)}
                                            className="h-9 px-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-1.5"
                                        >
                                            <Sparkles className="size-3.5" />
                                            <span>Pending Records ({allPendingItems.length})</span>
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        onClick={handleOpenAddCustomModal}
                                        variant="outline"
                                        className="h-9 px-3.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Add Custom Item</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Clean Items Table or Empty State */}
                            {(form.data.items || []).length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400">
                                                <th className="pb-3 px-2 w-10 text-center">#</th>
                                                <th className="pb-3 px-3">Description</th>
                                                <th className="pb-3 px-3 w-20 text-center">Qty</th>
                                                <th className="pb-3 px-3 w-28 text-right">Unit Price</th>
                                                <th className="pb-3 px-3 w-28 text-right">Amount</th>
                                                <th className="pb-3 px-2 w-20 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {(form.data.items || []).map((item, index) => {
                                                const itemAmount = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                                                return (
                                                    <tr key={item.uid || index} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        {/* Index */}
                                                        <td className="py-3 px-2 text-center font-mono font-bold text-slate-400">
                                                            {index + 1}
                                                        </td>

                                                        {/* Description & Type chip */}
                                                        <td className="py-3 px-3">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                                                        {item.description}
                                                                    </span>
                                                                    {item.category && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                                                            {getCategoryIcon(item.category)}
                                                                            <span>{item.category_label || item.category}</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Qty */}
                                                        <td className="py-3 px-3 text-center font-bold font-mono text-slate-700 dark:text-slate-300">
                                                            {item.quantity}
                                                        </td>

                                                        {/* Unit Price */}
                                                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-600 dark:text-slate-400">
                                                            {formatCurrency(Number(item.unit_price) || 0)}
                                                        </td>

                                                        {/* Row Total */}
                                                        <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white font-mono text-xs">
                                                            {formatCurrency(itemAmount)}
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="py-3 px-2 text-center">
                                                            <div className="inline-flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenEditItemModal(index)}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                                                    title="Edit Item"
                                                                >
                                                                    <Pencil className="size-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveItem(index)}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                                                    title="Remove Item"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
                                    <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                                        <Layers className="size-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                                            No Line Items Added Yet
                                        </h4>
                                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                                            Choose un-invoiced records from pending billing or add a custom item to this invoice.
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 pt-1">
                                        {allPendingItems.length > 0 && (
                                            <Button
                                                type="button"
                                                onClick={() => setIsPendingModalOpen(true)}
                                                className="h-8 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-1.5"
                                            >
                                                <Sparkles className="size-3.5" />
                                                <span>Select Pending Records ({allPendingItems.length})</span>
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            onClick={handleOpenAddCustomModal}
                                            variant="outline"
                                            className="h-8 px-3 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 cursor-pointer inline-flex items-center gap-1.5"
                                        >
                                            <Plus className="size-3.5" />
                                            <span>Add Custom Item</span>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {form.errors.items && (
                                <p className="text-xs font-semibold text-rose-500 mt-1">{form.errors.items}</p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Summary & Submission Card (4 Cols - Sticky) */}
                    <div className="lg:col-span-4 space-y-6 sticky top-6">
                        {/* Financial Totals Calculation */}
                        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="size-4 text-emerald-600" />
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        Financial Summary
                                    </h3>
                                </div>
                                <span className="font-mono text-xs font-bold text-slate-400">
                                    {clientCurrency}
                                </span>
                            </div>

                            <div className="space-y-3 text-xs">
                                {/* Subtotal */}
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold">
                                    <span>Subtotal</span>
                                    <span className="font-extrabold font-mono text-slate-900 dark:text-white text-sm">
                                        {formatCurrency(subtotal)}
                                    </span>
                                </div>

                                {/* Tax Rate */}
                                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold">
                                        <Label htmlFor="tax_rate" className="text-xs">Tax Rate (%)</Label>
                                        <div className="w-24">
                                            <Input
                                                id="tax_rate"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="100"
                                                value={form.data.tax_rate}
                                                onChange={(e) => form.setData('tax_rate', e.target.value)}
                                                className="h-8 text-right text-xs font-bold rounded-lg font-mono bg-slate-50 dark:bg-slate-950"
                                            />
                                        </div>
                                    </div>
                                    {taxAmount > 0 && (
                                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                                            <span>Tax Amount</span>
                                            <span className="font-mono font-bold">+{formatCurrency(taxAmount)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Discount */}
                                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold">
                                        <Label htmlFor="discount" className="text-xs">Discount ({clientCurrency})</Label>
                                        <div className="w-28">
                                            <Input
                                                id="discount"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={form.data.discount}
                                                onChange={(e) => form.setData('discount', e.target.value)}
                                                className="h-8 text-right text-xs font-bold rounded-lg font-mono bg-slate-50 dark:bg-slate-950"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Grand Total Box */}
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white space-y-1 shadow-md shadow-blue-600/20">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100 block">
                                        Total Payable Amount
                                    </span>
                                    <div className="text-2xl font-black font-mono tracking-tight">
                                        {formatCurrency(grandTotal)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes & Terms */}
                        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Notes
                                </Label>
                                <textarea
                                    id="notes"
                                    rows={2}
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    placeholder="Optional billing notes..."
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="terms" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Terms & Conditions
                                </Label>
                                <textarea
                                    id="terms"
                                    rows={2}
                                    value={form.data.terms}
                                    onChange={(e) => form.setData('terms', e.target.value)}
                                    placeholder="Payment terms..."
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={form.processing || (form.data.items || []).length === 0}
                            className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-sm font-bold shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {form.processing ? (
                                <>
                                    <LoaderCircle className="size-5 animate-spin" />
                                    <span>Updating Invoice...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="size-5" />
                                    <span>Save & Update Invoice</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* MODAL 1: SELECT PENDING BILLING RECORDS POPUP */}
            {isPendingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <Sparkles className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Select Pending Billing Records
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Pick un-invoiced milestones, services, domains, or hostings.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPendingModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Controls: Search & Category Tabs */}
                        <div className="p-4 sm:px-6 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <Input
                                    type="text"
                                    value={pendingSearchQuery}
                                    onChange={(e) => setPendingSearchQuery(e.target.value)}
                                    placeholder="Search by title, domain, hosting, or milestone..."
                                    className="pl-10 h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                                />
                            </div>

                            {/* Category Filter Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                                <button
                                    type="button"
                                    onClick={() => setActiveCategoryTab('all')}
                                    className={`h-8 px-3 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                                        activeCategoryTab === 'all'
                                            ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                    All Items ({allPendingItems.length})
                                </button>
                                {pendingProjects.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveCategoryTab('project')}
                                        className={`h-8 px-3 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                            activeCategoryTab === 'project'
                                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <FolderKanban className="size-3.5" />
                                        <span>Projects ({pendingProjects.length})</span>
                                    </button>
                                )}
                                {pendingServices.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveCategoryTab('service')}
                                        className={`h-8 px-3 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                            activeCategoryTab === 'service'
                                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Wrench className="size-3.5" />
                                        <span>Services ({pendingServices.length})</span>
                                    </button>
                                )}
                                {pendingDomains.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveCategoryTab('domain')}
                                        className={`h-8 px-3 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                            activeCategoryTab === 'domain'
                                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Globe className="size-3.5" />
                                        <span>Domains ({pendingDomains.length})</span>
                                    </button>
                                )}
                                {pendingHostings.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveCategoryTab('hosting')}
                                        className={`h-8 px-3 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                            activeCategoryTab === 'hosting'
                                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Server className="size-3.5" />
                                        <span>Hostings ({pendingHostings.length})</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Modal Items List */}
                        <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] space-y-2.5">
                            {filteredPendingItems.length > 0 ? (
                                filteredPendingItems.map((item) => {
                                    const selected = isItemAdded(item);
                                    return (
                                        <div
                                            key={`${item.category}_${item.id}`}
                                            onClick={() => handleTogglePendingItem(item)}
                                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                selected
                                                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/80 shadow-xs'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Checkbox indicator */}
                                                <div
                                                    className={`size-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                                                        selected
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                                                    }`}
                                                >
                                                    {selected && <Check className="size-3.5 stroke-[3]" />}
                                                </div>

                                                <div className="min-w-0 space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                                            {item.title}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                                                            {getCategoryIcon(item.category)}
                                                            <span>{item.category}</span>
                                                        </span>
                                                    </div>
                                                    {item.subtitle && (
                                                        <p className="text-[11px] text-slate-400 truncate">
                                                            {item.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="font-black font-mono text-xs text-slate-900 dark:text-white">
                                                    {formatCurrency(item.amount)}
                                                </div>
                                                {item.due_date && (
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        Due: {item.due_date}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center space-y-2">
                                    <Layers className="size-8 text-slate-300 mx-auto" />
                                    <p className="text-xs text-slate-500 font-semibold">
                                        No pending records found in this view.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddAllFiltered}
                                    className="h-8 px-3 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                    Select All Filtered ({filteredPendingItems.length})
                                </Button>
                                {selectedPendingCount > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleRemoveAllPending}
                                        className="h-8 px-3 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl cursor-pointer"
                                    >
                                        Deselect All
                                    </Button>
                                )}
                            </div>

                            <Button
                                type="button"
                                onClick={() => setIsPendingModalOpen(false)}
                                className="h-9 px-4 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                            >
                                Done Selecting ({selectedPendingCount})
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADD / EDIT CUSTOM LINE ITEM MODAL */}
            {isCustomItemModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    {editingItemIndex !== null ? <Pencil className="size-5" /> : <Plus className="size-5" />}
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {editingItemIndex !== null ? 'Edit Invoice Line Item' : 'Add Custom Line Item'}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        {editingItemIndex !== null
                                            ? 'Update line item details and pricing'
                                            : 'Add custom work, support hours, or ad-hoc deliverables'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCustomItemModalOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSaveCustomItem} className="p-5 sm:p-6 space-y-4">
                            {customError && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                    {customError}
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="custom_desc" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Item Description *
                                </Label>
                                <Input
                                    id="custom_desc"
                                    type="text"
                                    value={customDescription}
                                    onChange={(e) => setCustomDescription(e.target.value)}
                                    placeholder="e.g. Additional Landing Page Development"
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-xs font-semibold"
                                    autoFocus
                                />
                            </div>

                            {/* Qty & Unit Price */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="custom_qty" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Quantity *
                                    </Label>
                                    <Input
                                        id="custom_qty"
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        value={customQuantity}
                                        onChange={(e) => setCustomQuantity(e.target.value)}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-xs font-mono font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="custom_price" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Unit Price ({clientCurrency}) *
                                    </Label>
                                    <Input
                                        id="custom_price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={customUnitPrice}
                                        onChange={(e) => setCustomUnitPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 text-xs font-mono font-bold"
                                    />
                                </div>
                            </div>

                            {/* Live Total Calculation Preview */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500">Calculated Row Total:</span>
                                <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                                    {formatCurrency(
                                        (parseFloat(customQuantity) || 0) * (parseFloat(customUnitPrice) || 0)
                                    )}
                                </span>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-3 flex items-center justify-end gap-2.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCustomItemModalOpen(false)}
                                    className="h-10 px-4 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-10 px-5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
                                >
                                    {editingItemIndex !== null ? 'Save Changes' : 'Add Item to Invoice'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ClientPortalLayout>
    );
}
