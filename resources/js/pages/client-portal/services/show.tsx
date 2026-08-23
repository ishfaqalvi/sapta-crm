import DocumentsTab, { type ClientDocumentItem } from '@/components/documents-tab';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Building,
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    DollarSign,
    Edit2,
    Eye,
    EyeOff,
    FileText,
    Key,
    Layers,
    LoaderCircle,
    Lock,
    Package,
    PauseCircle,
    Plus,
    Printer,
    Receipt,
    RefreshCw,
    Shield,
    ShieldCheck,
    StopCircle,
    Trash2,
    User,
    X,
} from 'lucide-react';
import React, { FormEvent, useState } from 'react';

export interface ServicePaymentItem {
    id: number;
    client_service_id: number;
    client_id: number;
    billing_month: string;
    amount_due: number | string;
    amount_paid: number | string;
    payment_date: string | null;
    status: 'paid' | 'due' | 'due_pending' | 'overdue';
    payment_method: string | null;
    notes: string | null;
    invoice?: {
        id: number;
        invoice_number: string;
        status: string;
    } | null;
}

export interface ServiceCredentialItem {
    id: number;
    title: string;
    type?: string;
    username?: string | null;
    password?: string | null;
    url?: string | null;
    notes?: string | null;
    created_at?: string;
}

export interface ClientServiceDetailItem {
    id: number;
    client_id: number;
    category_id?: number | null;
    category?: {
        id: number;
        name: string;
    } | null;
    service_name: string;
    monthly_fee: number | string;
    contract_months: number;
    currency: string;
    start_date: string | null;
    billing_day: number;
    status: 'active' | 'paused' | 'stopped';
    notes: string | null;
    created_at?: string;
    payments?: ServicePaymentItem[];
    credentials?: ServiceCredentialItem[];
    documents?: ClientDocumentItem[];
}

interface ClientPortalServiceShowProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    service: ClientServiceDetailItem;
    company?: {
        name: string;
        email: string;
        phone?: string;
        address?: string;
        tax_id?: string;
        logo?: string;
    };
}

export default function ClientPortalServiceShow({ client, service }: ClientPortalServiceShowProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Services', href: '/client-portal/services' },
        { title: service.service_name, href: `/client-portal/services/${service.id}` },
    ];

    // URL Tab persistence support ('details' | 'payments' | 'credentials' | 'documents')
    const getInitialTab = (): 'details' | 'payments' | 'credentials' | 'documents' => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'payments' || tab === 'credentials' || tab === 'details' || tab === 'documents') {
                return tab;
            }
        }
        return 'details';
    };

    const [activeTab, setActiveTabState] = useState<'details' | 'payments' | 'credentials' | 'documents'>(getInitialTab);

    const setActiveTab = (tab: 'details' | 'payments' | 'credentials' | 'documents') => {
        setActiveTabState(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    // Credentials Modal State & Handlers via Inertia useForm
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isCredModalOpen, setIsCredModalOpen] = useState(false);
    const [editingCred, setEditingCred] = useState<ServiceCredentialItem | null>(null);
    const [deletingCred, setDeletingCred] = useState<ServiceCredentialItem | null>(null);
    const [isDeletingCred, setIsDeletingCred] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});

    const {
        data: credData,
        setData: setCredData,
        post: postCred,
        put: putCred,
        processing: isSavingCred,
        errors: credErrors,
        reset: resetCredForm,
        clearErrors: clearCredErrors,
    } = useForm({
        title: '',
        type: 'hosting',
        client_service_id: service.id as number | string,
        username: '',
        password: '',
        url: '',
        notes: '',
    });

    const handleCopy = (text: string, idStr: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idStr);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const openCreateCredModal = () => {
        setEditingCred(null);
        resetCredForm();
        clearCredErrors();
        setCredData({
            title: '',
            type: 'hosting',
            client_service_id: service.id,
            username: '',
            password: '',
            url: '',
            notes: '',
        });
        setIsCredModalOpen(true);
    };

    const openEditCredModal = (cred: ServiceCredentialItem) => {
        setEditingCred(cred);
        clearCredErrors();
        const initialNotes =
            cred.notes ||
            [
                cred.username ? `Username: ${cred.username}` : '',
                cred.password ? `Password: ${cred.password}` : '',
                cred.url ? `URL: ${cred.url}` : '',
            ]
                .filter(Boolean)
                .join('\n');

        setCredData({
            title: cred.title,
            type: cred.type || 'hosting',
            client_service_id: service.id,
            username: cred.username || '',
            password: cred.password || '',
            url: cred.url || '',
            notes: initialNotes,
        });
        setIsCredModalOpen(true);
    };

    const closeCredModal = () => {
        setIsCredModalOpen(false);
        setEditingCred(null);
        resetCredForm();
        clearCredErrors();
    };

    const handleSaveCredential = (e: FormEvent) => {
        e.preventDefault();
        credData.client_service_id = service.id;

        if (editingCred) {
            putCred(`/client-portal/services/credentials/update/${editingCred.id}`, {
                onSuccess: () => closeCredModal(),
            });
        } else {
            postCred('/client-portal/services/credentials/store', {
                onSuccess: () => closeCredModal(),
            });
        }
    };

    const handleDeleteCredential = () => {
        if (!deletingCred) return;
        setIsDeletingCred(true);
        router.delete(`/client-portal/services/credentials/destroy/${deletingCred.id}`, {
            onSuccess: () => {
                setDeletingCred(null);
                setIsDeletingCred(false);
            },
            onError: () => setIsDeletingCred(false),
        });
    };

    // Generate Payment Modal State (Asking ONLY for Billing Month)
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [generateMonth, setGenerateMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isGenerating, setIsGenerating] = useState(false);

    // Delete Payment Confirmation State
    const [deletingPayment, setDeletingPayment] = useState<ServicePaymentItem | null>(null);
    const [isDeletingPayment, setIsDeletingPayment] = useState(false);

    // Generate Official Invoice Confirmation State
    const [confirmingInvoicePayment, setConfirmingInvoicePayment] = useState<ServicePaymentItem | null>(null);
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

    const handleGenerateInvoiceSubmit = () => {
        if (!confirmingInvoicePayment) return;
        setIsGeneratingInvoice(true);
        router.post(
            `/client-portal/services/payments/${confirmingInvoicePayment.id}/generate-invoice`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmingInvoicePayment(null);
                    setIsGeneratingInvoice(false);
                },
                onError: () => {
                    setIsGeneratingInvoice(false);
                },
                onFinish: () => {
                    setIsGeneratingInvoice(false);
                },
            }
        );
    };

    const formatDateOnly = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        const cleanDate = dateString.includes('T') ? dateString.split('T')[0] : dateString.split(' ')[0];
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

    const formatCurrency = (val: number | string, currencySymbol: string = service.currency || client.currency || '$') => {
        const num = typeof val === 'number' ? val : parseFloat(val || '0');
        return `${currencySymbol} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const totalContractMonths = service.contract_months || 12;
    const totalContractValue = Number(service.monthly_fee) * totalContractMonths;
    const paymentsList = service.payments || [];
    const totalPaid = paymentsList
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);

    const paidPercentage = totalContractValue > 0 ? Math.min(100, Math.round((totalPaid / totalContractValue) * 100)) : 0;

    // Handle Generation (Asking ONLY for Month)
    const openGenerateModal = () => {
        setGenerateMonth(new Date().toISOString().slice(0, 7));
        setIsGenerateModalOpen(true);
    };

    const handleGenerateSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        router.post(
            '/client-portal/services/payments/generate',
            {
                client_service_id: service.id,
                billing_month: generateMonth,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsGenerateModalOpen(false);
                    setIsGenerating(false);
                },
                onError: () => {
                    setIsGenerating(false);
                },
                onFinish: () => {
                    setIsGenerating(false);
                },
            }
        );
    };

    // Handle Delete Payment
    const handleDeletePayment = () => {
        if (!deletingPayment) return;
        setIsDeletingPayment(true);
        router.delete(`/client-portal/services/payments/destroy/${deletingPayment.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingPayment(null);
                setIsDeletingPayment(false);
            },
            onError: () => {
                setIsDeletingPayment(false);
            },
            onFinish: () => {
                setIsDeletingPayment(false);
            },
        });
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title={`${service.service_name} | ${client.name}`} />

            <div className="p-2 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950">
                {/* 1. TOP HEADER CARD: TABS ON LEFT, BACK BUTTON ON RIGHT */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                    {/* Left: Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {/* TAB 1: Details */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'details'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <FileText className="size-4" />
                            <span>1. Details</span>
                        </button>

                        {/* TAB 2: Payments */}
                        {hasPermission(user, 'view-client-portal-service-payments') && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('payments')}
                                className={`flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'payments'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Receipt className="size-4" />
                                <span>2. Payments ({paymentsList.length})</span>
                            </button>
                        )}

                        {/* TAB 3: Credentials */}
                        {hasPermission(user, 'view-client-portal-service-credentials') && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('credentials')}
                                className={`flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'credentials'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Key className="size-4" />
                                <span>3. Credentials ({service.credentials?.length || 0})</span>
                            </button>
                        )}

                        {/* TAB 4: Documents */}
                        {hasPermission(user, 'view-client-portal-service-documents') && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('documents')}
                                className={`flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'documents'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <FileText className="size-4" />
                                <span>4. Documents ({service.documents?.length || 0})</span>
                            </button>
                        )}
                    </div>

                    {/* Right: Back Button */}
                    <Link
                        href="/client-portal/services"
                        className="h-10 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to Services</span>
                    </Link>
                </div>

                {/* 2. TAB 1 CONTENT: DETAILS */}
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Service Title & Status Banner */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                        {service.service_name}
                                    </h1>

                                    {service.category && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                            {service.category.name}
                                        </span>
                                    )}

                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize inline-flex items-center gap-1 ${service.status === 'active'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                            : service.status === 'paused'
                                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                            }`}
                                    >
                                        {service.status === 'active' ? (
                                            <>
                                                <CheckCircle2 className="size-3.5" />
                                                <span>Active</span>
                                            </>
                                        ) : service.status === 'paused' ? (
                                            <>
                                                <PauseCircle className="size-3.5" />
                                                <span>Paused</span>
                                            </>
                                        ) : (
                                            <>
                                                <StopCircle className="size-3.5" />
                                                <span>Stopped</span>
                                            </>
                                        )}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Building className="size-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{client.name}</span>
                                    <span className="font-mono text-blue-600 text-[11px] font-bold">({client.client_code})</span>
                                    {client.company_name && <span>• {client.company_name}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Top Executive KPI Cards Grid (4 Cards) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Monthly Fee */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Fee</span>
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <DollarSign className="size-4" />
                                    </div>
                                </div>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {formatCurrency(service.monthly_fee)} <span className="text-xs text-slate-400 font-semibold">/ mo</span>
                                </p>
                                <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                    Billing Currency: <strong className="text-slate-700 dark:text-slate-300 font-mono">{service.currency || client.currency}</strong>
                                </p>
                            </div>

                            {/* Contract Value & Duration */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contract Value</span>
                                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                        <Package className="size-4" />
                                    </div>
                                </div>
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {formatCurrency(totalContractValue)}
                                </p>
                                <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                    Duration: <strong className="text-slate-700 dark:text-slate-300">{totalContractMonths} Months</strong>
                                </p>
                            </div>

                            {/* Billing Cycle & Start Date */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Billing Cycle</span>
                                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                        <Calendar className="size-4" />
                                    </div>
                                </div>
                                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Day {service.billing_day} of month
                                </p>
                                <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                    Started: {formatDateOnly(service.start_date)}
                                </p>
                            </div>

                            {/* Total Paid & Settle % */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Paid</span>
                                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                        <RefreshCw className="size-4" />
                                    </div>
                                </div>
                                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(totalPaid)}
                                </p>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${paidPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Detail Cards: Scope Notes & Account Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Scope Notes Card */}
                            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText className="size-4 text-blue-600" />
                                    <span>Service Scope & Deliverables</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Category</span>
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            {service.category?.name || 'General Service'}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Monthly Due Day</span>
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            Day {service.billing_day} of month
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Contract Duration</span>
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            {totalContractMonths} Months
                                        </p>
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {service.notes || 'No custom scope notes logged for this service subscription.'}
                                </div>
                            </div>

                            {/* Account Info Card */}
                            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <User className="size-4 text-blue-600" />
                                    <span>Account Info</span>
                                </h3>

                                <div className="space-y-4 text-xs">
                                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                        <div className="size-10 rounded-xl bg-gradient-to-br from-[#003796] to-[#1d4ed8] text-white font-black text-sm flex items-center justify-center shrink-0">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{client.name}</h4>
                                            <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                                {client.client_code}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-slate-600 dark:text-slate-300 font-medium">
                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-400">Company Name</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{client.company_name || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-400">Account Currency</span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{client.currency || 'USD'}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                            <span className="text-slate-400">Subscription Status</span>
                                            <span className="font-bold capitalize text-slate-800 dark:text-slate-200">{service.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. TAB 2 CONTENT: PAYMENTS */}
                {activeTab === 'payments' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <Receipt className="size-4 text-emerald-600" />
                                <span>Monthly Billing & Payment History</span>
                            </h3>

                            {hasPermission(user, 'create-client-portal-service-payments') && (
                                <button
                                    type="button"
                                    onClick={openGenerateModal}
                                    className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="size-4" />
                                    <span>Generate Monthly Bill</span>
                                </button>
                            )}
                        </div>

                        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs w-full min-w-0">
                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <table className="w-full min-w-[750px] text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="px-2 py-4">Billing Month</th>
                                            <th className="px-2 py-4">Amount Due</th>
                                            <th className="px-2 py-4">Amount Paid</th>
                                            <th className="px-2 py-4">Status</th>
                                            <th className="px-2 py-4">Payment Date</th>
                                            <th className="px-2 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                                        {paymentsList.length > 0 ? (
                                            paymentsList.map((pay) => (
                                                <tr key={pay.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-2 py-4 font-bold text-slate-900 dark:text-white font-mono">
                                                        {pay.billing_month}
                                                    </td>
                                                    <td className="px-2 py-4 font-bold text-slate-900 dark:text-white font-mono">
                                                        {formatCurrency(pay.amount_due)}
                                                    </td>
                                                    <td className="px-2 py-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                                        {formatCurrency(pay.amount_paid)}
                                                    </td>
                                                    <td className="px-2 py-4">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${pay.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                : pay.status === 'overdue'
                                                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                                }`}
                                                        >
                                                            {pay.status === 'paid' ? 'Paid / Cleared' : pay.status === 'overdue' ? 'Overdue' : 'Due'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-4 text-slate-500 font-medium">
                                                        {formatDateOnly(pay.payment_date)}
                                                    </td>
                                                    <td className="px-2 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* GENERATE OR PRINT INVOICE BUTTON */}
                                                            {pay.invoice ? (
                                                                hasPermission(user, 'print-client-portal-invoices') && (
                                                                    <a
                                                                        href={`/client-portal/invoices/${pay.invoice.id}/pdf`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="h-8 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer border border-blue-200/50 hover:border-transparent"
                                                                        title="Open & Print Invoice PDF"
                                                                    >
                                                                        <Printer className="size-3.5" />
                                                                        <span>Print</span>
                                                                    </a>
                                                                )
                                                            ) : (
                                                                hasPermission(user, 'create-client-portal-invoices') && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setConfirmingInvoicePayment(pay)}
                                                                        className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                                                                        title="Generate Invoice for this payment"
                                                                    >
                                                                        <FileText className="size-3.5" />
                                                                        <span>Generate Invoice</span>
                                                                    </button>
                                                                )
                                                            )}

                                                            {/* PROTECTION CHECK FOR GENERATED INVOICE OR PAID PAYMENTS */}
                                                            {pay.invoice || pay.status === 'paid' ? (
                                                                <span
                                                                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold inline-flex items-center gap-1 cursor-not-allowed"
                                                                    title="Payments with generated invoice or paid status cannot be deleted"
                                                                >
                                                                    <ShieldCheck className="size-3 text-emerald-500" />
                                                                    <span>Locked</span>
                                                                </span>
                                                            ) : (
                                                                hasPermission(user, 'delete-client-portal-service-payments') && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDeletingPayment(pay)}
                                                                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                                                        title="Delete Payment Record"
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
                                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                                                    No billing records logged yet. Click "Generate Monthly Bill" to create a billing statement.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. TAB 3 CONTENT: CREDENTIALS */}
                {activeTab === 'credentials' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Service Credentials & Access Logins ({service.credentials?.length || 0})
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Hosting, CMS, Database, Domain, and API access notes for {service.service_name}.
                                </p>
                            </div>

                            {hasPermission(user, 'create-client-portal-service-credentials') && (
                                <button
                                    type="button"
                                    onClick={openCreateCredModal}
                                    className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                                >
                                    <Plus className="size-4" />
                                    <span>Add Service Credential</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {service.credentials && service.credentials.length > 0 ? (
                                service.credentials.map((cred) => {
                                    const fullContent =
                                        cred.notes ||
                                        [
                                            cred.username ? `Username: ${cred.username}` : '',
                                            cred.password ? `Password: ${cred.password}` : '',
                                            cred.url ? `URL: ${cred.url}` : '',
                                        ]
                                            .filter(Boolean)
                                            .join('\n');

                                    return (
                                        <div
                                            key={cred.id}
                                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                                            <Key className="size-4" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                                {cred.title}
                                                            </h4>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {fullContent && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(fullContent, `cred-${cred.id}`)}
                                                                className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 transition-all font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer"
                                                                title="Copy All Credentials"
                                                            >
                                                                {copiedId === `cred-${cred.id}` ? (
                                                                    <span className="text-[10px] font-bold text-emerald-600">Copied!</span>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="size-3.5" />
                                                                        <span>Copy</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                        {hasPermission(user, 'edit-client-portal-service-credentials') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditCredModal(cred)}
                                                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                                                                title="Edit Credential"
                                                            >
                                                                <Edit2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                        {hasPermission(user, 'delete-client-portal-service-credentials') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingCred(cred)}
                                                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                                                title="Delete Credential"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed max-h-60 overflow-y-auto">
                                                    {fullContent || <span className="text-slate-400 italic font-sans">No credentials text stored.</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 italic text-sm">
                                    No credentials linked to this service yet. Click "Add Service Credential" to store logins.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 5. TAB 4 CONTENT: DOCUMENTS */}
                {activeTab === 'documents' && (
                    <DocumentsTab
                        documents={service.documents || []}
                        uploadUrl={`/client-portal/services/${service.id}/documents/store`}
                        deleteUrlPrefix={`/client-portal/services/${service.id}/documents/destroy`}
                    />
                )}
            </div>

            {/* GENERATE PAYMENT MODAL (ASKING ONLY FOR MONTH) */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="size-5 text-emerald-600" />
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Generate Monthly Bill
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsGenerateModalOpen(false)}
                                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form noValidate onSubmit={handleGenerateSubmit} className="space-y-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Select the target billing month for <strong className="text-slate-800 dark:text-slate-200">{service.service_name}</strong> to generate the monthly payment record.
                            </p>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Billing Month <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="month"
                                    value={generateMonth}
                                    onChange={(e) => setGenerateMonth(e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-mono"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsGenerateModalOpen(false)}
                                    className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className="h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <span>Generate Bill</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* DELETE PAYMENT CONFIRMATION MODAL */}
            {deletingPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                        <button
                            type="button"
                            onClick={() => setDeletingPayment(null)}
                            className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                            <AlertTriangle className="size-6" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Payment Record?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Are you sure you want to delete payment log for <strong className="text-slate-900 dark:text-white">"{deletingPayment.billing_month}"</strong>?
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingPayment(null)}
                                disabled={isDeletingPayment}
                                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeletePayment}
                                disabled={isDeletingPayment}
                                className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                            >
                                {isDeletingPayment ? (
                                    <>
                                        <LoaderCircle className="size-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete Record</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GENERATE OFFICIAL INVOICE CONFIRMATION MODAL */}
            {confirmingInvoicePayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                        <button
                            type="button"
                            onClick={() => setConfirmingInvoicePayment(null)}
                            className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                            <FileText className="size-6" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Generate Invoice Confirmation</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Are you sure you want to generate an official invoice for service billing <strong>"{service.service_name} ({confirmingInvoicePayment.billing_month})"</strong> ({formatCurrency(confirmingInvoicePayment.amount_due)})?
                            </p>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-2">
                                Note: Once generated, this payment record will be locked from deletion.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setConfirmingInvoicePayment(null)}
                                disabled={isGeneratingInvoice}
                                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerateInvoiceSubmit}
                                disabled={isGeneratingInvoice}
                                className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none shadow-md shadow-blue-600/20 cursor-pointer"
                            >
                                {isGeneratingInvoice && <LoaderCircle className="size-4 animate-spin" />}
                                <span>Yes, Generate Invoice</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE / EDIT CREDENTIAL MODAL */}
            {isCredModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-lg max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                    <Key className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {editingCred ? 'Edit Service Credential' : 'Add New Service Credential'}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">Copy & paste login details or access notes</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeCredModal}
                                className="size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form noValidate onSubmit={handleSaveCredential} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Credential Title *</label>
                                <input
                                    type="text"
                                    value={credData.title}
                                    onChange={(e) => {
                                        setCredData('title', e.target.value);
                                        if (credErrors.title) clearCredErrors('title');
                                    }}
                                    placeholder="e.g. cPanel & Database Logins / WordPress Admin"
                                    className={`w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${credErrors.title ? 'border-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                />
                                {credErrors.title && (
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{credErrors.title}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Credentials Details / Copy-Paste Text</label>
                                <textarea
                                    rows={8}
                                    value={credData.notes}
                                    onChange={(e) => {
                                        setCredData('notes', e.target.value);
                                        if (credErrors.notes) clearCredErrors('notes');
                                    }}
                                    placeholder="Paste all credentials here...&#10;e.g.&#10;URL: https://example.com/cpanel&#10;Username: admin&#10;Password: supersecretpass&#10;Database: db_name"
                                    className={`w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border font-mono text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none ${credErrors.notes ? 'border-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                />
                                {credErrors.notes && (
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{credErrors.notes}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeCredModal}
                                    disabled={isSavingCred}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingCred}
                                    className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSavingCred && <LoaderCircle className="size-4 animate-spin" />}
                                    <span>{editingCred ? 'Update Credential' : 'Save Credential'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CREDENTIAL MODAL */}
            {deletingCred && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                        <button
                            type="button"
                            onClick={() => setDeletingCred(null)}
                            className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                            <Trash2 className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Credential?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{deletingCred.title}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingCred(null)}
                                disabled={isDeletingCred}
                                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteCredential}
                                disabled={isDeletingCred}
                                className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                            >
                                {isDeletingCred && <LoaderCircle className="size-4 animate-spin" />}
                                <span>{isDeletingCred ? 'Deleting...' : 'Confirm Delete'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ClientPortalLayout>
    );
}
