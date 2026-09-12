import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    DollarSign,
    FileSpreadsheet,
    FileText,
    LoaderCircle,
    PenTool,
    Plus,
    Receipt,
    Save,
    Sparkles,
    Trash2,
    Upload,
    User,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CurrencyItem {
    code: string;
    name: string;
    symbol: string;
    exchange_rate_to_pkr: number;
}

interface QuotationCreateProps {
    currencies: CurrencyItem[];
    suggestedNumber: string;
}

export interface ItemRow {
    description: string;
    amount: number | string;
}

export default function QuotationCreate({
    currencies,
    suggestedNumber,
}: QuotationCreateProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Quotations', href: '/quotations' },
        { title: 'Create Quotation', href: '/quotations/create' },
    ];

    const [items, setItems] = useState<ItemRow[]>([
        {
            description: '',
            amount: '',
        },
    ]);

    const { data, setData, post, processing, errors } = useForm<{
        [key: string]: any;
        quotation_number: string;
        currency_code: string;
        exchange_rate_to_pkr: number;
        subject: string;
        customer_prefix: string;
        customer_name: string;
        customer_email: string;
        customer_phone: string;
        customer_address: string;
        company_name: string;
        company_phone: string;
        company_address: string;
        company_email: string;
        company_whatsapp: string;
        existing_company_logo: string;
        company_logo: File | null;
        existing_signature_image: string;
        signature_image: File | null;
        greeting: string;
        opening_text: string;
        closing_text: string;
        tax_rate: number | string;
        discount: number | string;
        date: string;
        expiry_date: string;
        status: 'draft' | 'sent' | 'accepted' | 'paid' | 'rejected' | 'expired';
        notes: string;
        terms: string;
        authorized_by_text: string;
        items: ItemRow[];
    }>({
        quotation_number: suggestedNumber || '',
        currency_code: 'AED',
        exchange_rate_to_pkr: 1,
        subject: '',
        customer_prefix: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        company_name: '',
        company_phone: '',
        company_address: '',
        company_email: '',
        company_whatsapp: '',
        existing_company_logo: '',
        company_logo: null,
        existing_signature_image: '',
        signature_image: null,
        greeting: 'Dear Sir/Madam,',
        opening_text: "We thank you for providing us with an opportunity to submit our quotation for shifting your home furniture and appliances. Our prices are reasonable; our staff are professional and well trained to handle all your stuff and equipment's with care. Please find the complete details and expenses to cover this operation.",
        closing_text: 'In case of any queries, kindly get in touch with us. Thank you and I look forward to hearing from you.',
        tax_rate: '',
        discount: '',
        date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        status: 'draft',
        notes: '',
        terms: '',
        authorized_by_text: '',
        items: items,
    });

    const [showCompanyDetails, setShowCompanyDetails] = useState(true);
    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

    // Keep items in sync with useForm
    useEffect(() => {
        setData('items', items);
    }, [items]);

    // Recalculate totals
    const subtotal = items.reduce((acc, itm) => {
        const val = parseFloat(String(itm.amount)) || 0;
        return acc + val;
    }, 0);

    const taxVal = parseFloat(String(data.tax_rate)) || 0;
    const taxAmount = (subtotal * taxVal) / 100;
    const discountVal = parseFloat(String(data.discount)) || 0;
    const grandTotal = Math.max(0, subtotal + taxAmount - discountVal);

    // Dynamic Items management
    const handleItemChange = (index: number, field: keyof ItemRow, value: string) => {
        const updated = [...items];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };
        setItems(updated);
    };

    const addItemRow = () => {
        setItems([...items, { description: '', amount: '' }]);
    };

    const removeItemRow = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleCurrencyChange = (currCode: string) => {
        const match = currencies.find((c) => c.code === currCode);
        setData((prev) => ({
            ...prev,
            currency_code: currCode,
            exchange_rate_to_pkr: match ? Number(match.exchange_rate_to_pkr) : 1,
        }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('company_logo', file);
            setCompanyLogoPreview(URL.createObjectURL(file));
        }
    };

    const removeLogo = () => {
        setData('company_logo', null);
        setData('existing_company_logo', '');
        setCompanyLogoPreview(null);
    };

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('signature_image', file);
            setSignaturePreview(URL.createObjectURL(file));
        }
    };

    const removeSignature = () => {
        setData('signature_image', null);
        setData('existing_signature_image', '');
        setSignaturePreview(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/quotations', {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create New Quotation - Admin Portal" />

            <div className="p-6 w-full space-y-6">
                {/* Header Title & Back Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 border border-white/20">
                            <FileSpreadsheet className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Create New Quotation
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                Set up formal price quote parameters, line items, and terms for general/walk-in customer ({data.currency_code}).
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/quotations"
                        className="h-10 px-3 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to Quotations</span>
                    </Link>
                </div>

                {/* Form Top Error Summary Banner */}
                {Object.keys(errors).length > 0 && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-start gap-3 shadow-xs">
                        <AlertCircle className="size-5 shrink-0 text-rose-500 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-bold text-sm text-rose-800 dark:text-rose-300">
                                Please correct the validation errors below:
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-rose-700 dark:text-rose-400">
                                {Object.entries(errors).map(([key, msg]) => (
                                    <li key={key}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Main Full Width Form */}
                <form
                    noValidate
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8"
                >
                    {/* Section 1: Quotation Information & Schedule */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    Quotation Parameters & Timeline
                                </h2>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Quotation number, currency, issue date, and validity
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                            {/* Quotation Number */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Quotation # <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.quotation_number}
                                    onChange={(e) => setData('quotation_number', e.target.value)}
                                    placeholder={suggestedNumber || 'e.g. Quote-1'}
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-mono font-bold text-blue-600 dark:text-blue-400 placeholder:text-slate-400 focus:outline-none transition-all ${
                                        errors.quotation_number
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                    }`}
                                    required
                                />
                                {errors.quotation_number && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.quotation_number}</p>
                                )}
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Currency <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.currency_code}
                                    onChange={(e) => handleCurrencyChange(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                                >
                                    {currencies.map((curr) => (
                                        <option key={curr.code} value={curr.code}>
                                            {curr.code} - {curr.name} ({curr.symbol})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quotation Date */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Quotation Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${
                                        errors.date
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                    }`}
                                    required
                                />
                                {errors.date && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.date}</p>
                                )}
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Valid Until / Expiry Date
                                </label>
                                <input
                                    type="date"
                                    value={data.expiry_date}
                                    onChange={(e) => setData('expiry_date', e.target.value)}
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${
                                        errors.expiry_date
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                    }`}
                                />
                                {errors.expiry_date && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.expiry_date}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* Status */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Status <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value as any)}
                                    className={`w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none ${
                                        errors.status
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                    }`}
                                >
                                    <option value="draft">Draft (Unpaid)</option>
                                    <option value="sent">Sent (Unpaid)</option>
                                    <option value="accepted">Accepted (Invoice Ready)</option>
                                    <option value="paid">Paid (Invoice Settled)</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="expired">Expired</option>
                                </select>
                                {errors.status && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.status}</p>
                                )}
                            </div>

                            {/* Subject / Scope */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Subject / Scope Title
                                </label>
                                <input
                                    type="text"
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    placeholder="e.g. Service Quotation & Proposal"
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        errors.subject
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                    }`}
                                />
                                {errors.subject && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.subject}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Recipient Details (Optional) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <User className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    Recipient Information <span className="text-slate-400 font-normal text-xs normal-case">(Optional)</span>
                                </h2>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Customer and contact recipient details (all fields optional)
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                            {/* Prefix */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Prefix <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.customer_prefix}
                                    onChange={(e) => setData('customer_prefix', e.target.value)}
                                    placeholder="e.g. Mr/Mrs"
                                    className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                />
                            </div>

                            {/* Customer Name */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Recipient Name <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.customer_name}
                                    onChange={(e) => setData('customer_name', e.target.value)}
                                    placeholder="e.g. Customer Name"
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        errors.customer_name
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                    }`}
                                />
                                {errors.customer_name && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.customer_name}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Contact Phone <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.customer_phone}
                                    onChange={(e) => setData('customer_phone', e.target.value)}
                                    placeholder="e.g. +971 50 123 4567"
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        errors.customer_phone
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                    }`}
                                />
                                {errors.customer_phone && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.customer_phone}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Email Address <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                                </label>
                                <input
                                    type="email"
                                    value={data.customer_email}
                                    onChange={(e) => setData('customer_email', e.target.value)}
                                    placeholder="e.g. customer@example.com"
                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                        errors.customer_email
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                    }`}
                                />
                                {errors.customer_email && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.customer_email}</p>
                                )}
                            </div>
                        </div>

                        {/* Customer Address */}
                        <div className="pt-2">
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                Recipient Address <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={data.customer_address}
                                onChange={(e) => setData('customer_address', e.target.value)}
                                placeholder="e.g. Suite #, Building, City, Country"
                                className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                    errors.customer_address
                                        ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                        : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                }`}
                            />
                            {errors.customer_address && (
                                <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.customer_address}</p>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Provider / Company Details (Manual Entry) */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                    <Building2 className="size-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            Provider / Company Details
                                        </h2>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                                            <PenTool className="size-3" /> Manual Entry
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        Enter your company provider details for this quotation.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setShowCompanyDetails(!showCompanyDetails)}
                                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer px-2 py-1"
                                >
                                    {showCompanyDetails ? 'Hide Provider Details' : 'Show Provider Details'}
                                </button>
                            </div>
                        </div>

                        {showCompanyDetails && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Company Provider Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.company_name}
                                        onChange={(e) => setData('company_name', e.target.value)}
                                        placeholder="e.g. Company / Business Name"
                                        className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                    />
                                    {errors.company_name && (
                                        <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.company_name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Company Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={data.company_phone}
                                        onChange={(e) => setData('company_phone', e.target.value)}
                                        placeholder="e.g. +971 50 123 4567"
                                        className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                    />
                                    {errors.company_phone && (
                                        <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.company_phone}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Company WhatsApp
                                    </label>
                                    <input
                                        type="text"
                                        value={data.company_whatsapp}
                                        onChange={(e) => setData('company_whatsapp', e.target.value)}
                                        placeholder="e.g. +971 50 123 4567"
                                        className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                    />
                                    {errors.company_whatsapp && (
                                        <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.company_whatsapp}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Company Email
                                    </label>
                                    <input
                                        type="email"
                                        value={data.company_email}
                                        onChange={(e) => setData('company_email', e.target.value)}
                                        placeholder="e.g. company@example.com"
                                        className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                            errors.company_email
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                        }`}
                                    />
                                    {errors.company_email && (
                                        <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.company_email}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Company Address
                                    </label>
                                    <input
                                        type="text"
                                        value={data.company_address}
                                        onChange={(e) => setData('company_address', e.target.value)}
                                        placeholder="e.g. Office #, Building, City, Country"
                                        className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                    />
                                    {errors.company_address && (
                                        <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.company_address}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                        Company Logo (Optional)
                                    </label>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                        {companyLogoPreview && (
                                            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
                                                <img
                                                    src={companyLogoPreview}
                                                    alt="Logo Preview"
                                                    className="h-8 max-w-[90px] object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeLogo}
                                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                    title="Remove Logo"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        />
                                    </div>
                                    {errors.company_logo && (
                                        <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.company_logo}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Salutation Greeting
                                </label>
                                <input
                                    type="text"
                                    value={data.greeting}
                                    onChange={(e) => setData('greeting', e.target.value)}
                                    placeholder="e.g. Dear Sir/Madam,"
                                    className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                />
                                {errors.greeting && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.greeting}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Inquiry Opener Text
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.opening_text}
                                    onChange={(e) => setData('opening_text', e.target.value)}
                                    placeholder="We thank you for providing us with an opportunity to submit our quotation..."
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                />
                                {errors.opening_text && (
                                    <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.opening_text}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Line Items Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                    <Receipt className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        Quotation Line Items
                                    </h2>
                                    <p className="text-[11px] text-slate-400 font-medium">
                                        Add itemized services, description breakdown, and pricing ({data.currency_code})
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addItemRow}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-all cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                <span>Add Line Item</span>
                            </button>
                        </div>

                        {errors.items && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                                {errors.items}
                            </div>
                        )}

                        <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                                            <th className="py-3 px-3 w-12 text-center">#</th>
                                            <th className="py-3 px-3">Description <span className="text-rose-500">*</span></th>
                                            <th className="py-3 px-3 w-48 text-right">Amount ({data.currency_code}) <span className="text-rose-500">*</span></th>
                                            <th className="py-3 px-3 w-12 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                        {items.map((item, index) => {
                                            const descErr = errors[`items.${index}.description`];
                                            const amountErr = errors[`items.${index}.amount`];

                                            return (
                                                <tr
                                                    key={index}
                                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                                >
                                                    <td className="py-3 px-3 text-center font-bold text-slate-400 align-top pt-4">
                                                        {index + 1}
                                                    </td>
                                                    <td className="py-3 px-3 align-top">
                                                        <textarea
                                                            rows={2}
                                                            value={item.description}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'description', e.target.value)
                                                            }
                                                            placeholder="Enter service or item description..."
                                                            className={`w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl border placeholder:text-slate-400 focus:outline-none font-semibold ${
                                                                descErr
                                                                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                                    : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                            }`}
                                                            required
                                                        />
                                                        {descErr && (
                                                            <p className="text-rose-500 text-[11px] font-medium mt-1">{descErr}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 align-top">
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={item.amount}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'amount', e.target.value)
                                                            }
                                                            placeholder="0.00"
                                                            className={`w-full h-10 px-3 text-xs text-right font-mono bg-slate-50 dark:bg-slate-950 rounded-xl border placeholder:text-slate-400 focus:outline-none font-bold ${
                                                                amountErr
                                                                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                                    : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                                            }`}
                                                            required
                                                        />
                                                        {amountErr && (
                                                            <p className="text-rose-500 text-[11px] font-medium mt-1 text-right">{amountErr}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-center align-top pt-2">
                                                        {items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItemRow(index)}
                                                                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Calculation Summary Box */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                            <div className="w-full sm:w-1/2 space-y-2">
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Closing Remarks
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.closing_text}
                                    onChange={(e) => setData('closing_text', e.target.value)}
                                    placeholder="In case of any queries, kindly get in touch with us. Thank you and I look forward to hearing from you."
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                />
                                {errors.closing_text && (
                                    <p className="text-rose-500 text-xs font-medium mt-1">{errors.closing_text}</p>
                                )}
                            </div>

                            <div className="w-full sm:w-80 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
                                    <span>Subtotal:</span>
                                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                                        {data.currency_code}{' '}
                                        {Number(subtotal).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
                                    <span className="shrink-0">Tax (%):</span>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        max="100"
                                        value={data.tax_rate}
                                        onChange={(e) => setData('tax_rate', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-20 h-8 px-2 text-xs text-right bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono placeholder:text-slate-400"
                                    />
                                </div>
                                {errors.tax_rate && (
                                    <p className="text-rose-500 text-[11px] font-medium text-right">{errors.tax_rate}</p>
                                )}

                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
                                    <span className="shrink-0">Discount:</span>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={data.discount}
                                        onChange={(e) => setData('discount', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        className="w-24 h-8 px-2 text-xs text-right bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-mono placeholder:text-slate-400"
                                    />
                                </div>
                                {errors.discount && (
                                    <p className="text-rose-500 text-[11px] font-medium text-right">{errors.discount}</p>
                                )}

                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm font-black text-slate-900 dark:text-white">
                                    <span className="tracking-wide">GRAND TOTAL:</span>
                                    <span className="text-base text-blue-600 dark:text-blue-400 font-mono">
                                        {data.currency_code}{' '}
                                        {Number(grandTotal).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Signature & Authorization */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <PenTool className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    Signature & Authorization
                                </h2>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Signatory designation text and optional client/provider signature image upload
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Authorized Signatory Heading
                                </label>
                                <input
                                    type="text"
                                    value={data.authorized_by_text}
                                    onChange={(e) => setData('authorized_by_text', e.target.value)}
                                    placeholder="e.g. For, Your Company Name"
                                    className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                />
                                {errors.authorized_by_text && (
                                    <p className="text-rose-500 text-xs font-medium mt-1">{errors.authorized_by_text}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Upload Signature Image (Optional)
                                </label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSignatureChange}
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                    {signaturePreview && (
                                        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
                                            <img
                                                src={signaturePreview}
                                                alt="Signature Preview"
                                                className="h-8 max-w-[100px] object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeSignature}
                                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                title="Remove Signature"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                            <span className="text-[11px] text-emerald-600 font-bold pr-1">Ready</span>
                                        </div>
                                    )}
                                </div>
                                {errors.signature_image && (
                                    <p className="text-rose-500 text-xs font-medium mt-1">{errors.signature_image}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 6: Additional Notes & Terms (Optional) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                <FileText className="size-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    Additional Notes & Terms (Optional)
                                </h2>
                                <p className="text-[11px] text-slate-400 font-medium">
                                    Custom instructions, payment conditions, or delivery milestones
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Customer Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Any specific note regarding this quote..."
                                    className={`w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl border placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${
                                        errors.notes
                                            ? 'border-rose-500'
                                            : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                />
                                {errors.notes && (
                                    <p className="text-rose-500 text-xs font-medium mt-1">{errors.notes}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Terms & Conditions
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.terms}
                                    onChange={(e) => setData('terms', e.target.value)}
                                    placeholder="Standard terms, validity conditions, etc..."
                                    className={`w-full px-4 py-3 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl border placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 ${
                                        errors.terms
                                            ? 'border-rose-500'
                                            : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                />
                                {errors.terms && (
                                    <p className="text-rose-500 text-xs font-medium mt-1">{errors.terms}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link
                            href="/quotations"
                            className="h-10 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="h-10 px-6 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Saving Quotation...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    <span>Save & Generate Quotation</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
