import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Edit2,
    ExternalLink,
    FileText,
    Globe,
    HardDrive,
    LoaderCircle,
    Plus,
    Printer,
    Receipt,
    Server,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

export interface HostingPaymentItem {
    id: number;
    client_hosting_id: number;
    client_id: number;
    title: string;
    amount: number;
    exchange_rate: number;
    amount_pkr: number;
    payment_type: 'initial_setup' | 'renewal' | 'upgrade' | 'other';
    status: 'pending' | 'paid';
    due_date: string | null;
    paid_at: string | null;
    notes: string | null;
    created_at: string;
    invoice?: {
        id: number;
        invoice_number: string;
        issue_date: string;
        due_date: string;
        status: string;
        total_amount: number;
        total_amount_pkr?: number;
        currency_code?: string;
    } | null;
}

export interface ClientPortalHostingDetailItem {
    id: number;
    client_id: number;
    hosting_title: string;
    provider: string;
    server_ip: string | null;
    server_type: string | null;
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'biennial';
    setup_date: string | null;
    expiry_date: string;
    cost_pkr: number;
    client_price_pkr: number;
    status: 'active' | 'suspended' | 'cancelled' | 'expired';
    primary_domain_id: number | null;
    disk_space: string | null;
    bandwidth: string | null;
    notes: string | null;
    created_at: string;
    primary_domain?: {
        id: number;
        domain_name: string;
        registrar?: string;
        expiry_date?: string;
    } | null;
    client?: {
        id: number;
        name: string;
        client_code: string;
        company_name?: string;
        currency?: string;
    };
    payments?: HostingPaymentItem[];
    invoice?: {
        id: number;
        invoice_number: string;
        issue_date: string;
        due_date: string;
        status: string;
        total_amount: number;
        total_amount_pkr?: number;
        currency_code?: string;
    } | null;
}

interface ClientPortalHostingShowProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    hosting: ClientPortalHostingDetailItem;
    domains?: Array<{ id: number; domain_name: string }>;
}

export default function ClientPortalHostingShow({
    client,
    hosting,
    domains = [],
}: ClientPortalHostingShowProps) {
    const user = (usePage().props.auth as any)?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Web Hosting', href: '/client-portal/hostings' },
        { title: hosting.hosting_title, href: `/client-portal/hostings/${hosting.id}` },
    ];

    // URL Tab persistence support ('details' | 'invoices')
    const getInitialTab = (): 'details' | 'invoices' => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'invoices' || tab === 'details') {
                return tab;
            }
        }
        return 'details';
    };

    const [activeTab, setActiveTabState] = useState<'details' | 'invoices'>(getInitialTab);

    const setActiveTab = (tab: 'details' | 'invoices') => {
        setActiveTabState(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
    const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
    const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);

    // Selected Payment for Actions
    const [selectedPayment, setSelectedPayment] = useState<HostingPaymentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingPayment, setIsDeletingPayment] = useState(false);
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

    // Edit Hosting Form
    const editHostingForm = useForm({
        hosting_title: hosting.hosting_title,
        provider: hosting.provider,
        server_ip: hosting.server_ip || '',
        server_type: hosting.server_type || 'cPanel Shared',
        billing_cycle: hosting.billing_cycle,
        expiry_date: hosting.expiry_date ? hosting.expiry_date.split('T')[0] : '',
        client_price_pkr: String(hosting.client_price_pkr || ''),
        primary_domain_id: hosting.primary_domain_id ? String(hosting.primary_domain_id) : '',
        disk_space: hosting.disk_space || '',
        bandwidth: hosting.bandwidth || '',
        notes: hosting.notes || '',
    });

    // Add Payment Form
    const addPaymentForm = useForm({
        client_hosting_id: hosting.id,
        title: `Hosting Renewal (${ucfirst(str_replace('_', ' ', hosting.billing_cycle))} Plan)`,
        amount: String(hosting.client_price_pkr || ''),
        payment_type: 'renewal',
        due_date: hosting.expiry_date ? hosting.expiry_date.split('T')[0] : '',
        notes: '',
    });

    // Edit Payment Form
    const editPaymentForm = useForm({
        title: '',
        amount: '',
        payment_type: 'renewal',
        due_date: '',
        notes: '',
    });

    const handleEditHostingSubmit = (e: FormEvent) => {
        e.preventDefault();
        editHostingForm.put(`/client-portal/hostings/update/${hosting.id}`, {
            onSuccess: () => setIsEditModalOpen(false),
        });
    };

    const handleDeleteHostingSubmit = () => {
        if (isDeleting) return;
        setIsDeleting(true);
        router.delete(`/client-portal/hostings/destroy/${hosting.id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                router.visit('/client-portal/hostings');
            },
            onError: () => setIsDeleting(false),
        });
    };

    const handleAddPaymentSubmit = (e: FormEvent) => {
        e.preventDefault();
        addPaymentForm.post('/client-portal/hostings/payments/store', {
            onSuccess: () => {
                setIsAddPaymentModalOpen(false);
                addPaymentForm.reset();
            },
        });
    };

    const openEditPaymentModal = (payment: HostingPaymentItem) => {
        setSelectedPayment(payment);
        editPaymentForm.setData({
            title: payment.title,
            amount: String(payment.amount),
            payment_type: payment.payment_type,
            due_date: payment.due_date ? payment.due_date.split('T')[0] : '',
            notes: payment.notes || '',
        });
        editPaymentForm.clearErrors();
        setIsEditPaymentModalOpen(true);
    };

    const handleEditPaymentSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedPayment) return;
        editPaymentForm.put(`/client-portal/hostings/payments/update/${selectedPayment.id}`, {
            onSuccess: () => {
                setIsEditPaymentModalOpen(false);
                setSelectedPayment(null);
            },
        });
    };

    const openDeletePaymentModal = (payment: HostingPaymentItem) => {
        setSelectedPayment(payment);
        setIsDeletePaymentModalOpen(true);
    };

    const handleDeletePaymentSubmit = () => {
        if (!selectedPayment || isDeletingPayment) return;
        setIsDeletingPayment(true);
        router.delete(`/client-portal/hostings/payments/destroy/${selectedPayment.id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeletingPayment(false),
            onSuccess: () => {
                setIsDeletePaymentModalOpen(false);
                setSelectedPayment(null);
            },
            onError: () => setIsDeletingPayment(false),
        });
    };

    const openGenerateInvoiceModal = (payment: HostingPaymentItem) => {
        setSelectedPayment(payment);
        setIsGenerateInvoiceModalOpen(true);
    };

    // Mark as Paid State & Submit
    const [confirmingPaidPayment, setConfirmingPaidPayment] = useState<HostingPaymentItem | null>(null);
    const [isMarkingPaidPayment, setIsMarkingPaidPayment] = useState(false);

    const handleMarkPaymentPaidSubmit = () => {
        if (!confirmingPaidPayment) return;
        setIsMarkingPaidPayment(true);
        router.post(
            `/client-portal/hostings/payments/${confirmingPaidPayment.id}/mark-as-paid`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmingPaidPayment(null);
                    setIsMarkingPaidPayment(false);
                },
                onError: () => setIsMarkingPaidPayment(false),
                onFinish: () => setIsMarkingPaidPayment(false),
            }
        );
    };

    const handleGenerateInvoiceSubmit = () => {
        if (!selectedPayment) return;
        setIsGeneratingInvoice(true);
        router.post(
            `/client-portal/hostings/payments/${selectedPayment.id}/generate-invoice`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsGenerateInvoiceModalOpen(false);
                    setIsGeneratingInvoice(false);
                    setSelectedPayment(null);
                },
                onError: () => setIsGeneratingInvoice(false),
                onFinish: () => setIsGeneratingInvoice(false),
            }
        );
    };

    function ucfirst(str: string) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function str_replace(search: string, replace: string, subject: string) {
        if (!subject) return '';
        return subject.split(search).join(replace);
    }

    const formatCurrency = (amount: number | string | null | undefined) => {
        const num = Number(amount || 0);
        const curr = client.currency || hosting.client?.currency || 'USD';
        const symbol =
            curr === 'PKR' ? 'Rs ' : curr === 'USD' ? '$' : curr === 'AED' ? 'AED ' : curr === 'SAR' ? 'SAR ' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr + ' ';
        return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getDaysRemaining = (expiryDateStr: string) => {
        const expiry = new Date(expiryDateStr);
        const today = new Date();
        return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    };

    const daysRemaining = getDaysRemaining(hosting.expiry_date);
    const isExpired = daysRemaining < 0;
    const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 30;

    // Payments Calculations
    const paymentsList = hosting.payments || [];
    const totalBilled = paymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPaid = paymentsList.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingBalance = totalBilled - totalPaid;
    const hasAnyInvoice = paymentsList.some((p) => Boolean(p.invoice)) || Boolean(hosting.invoice);

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title={`${hosting.hosting_title} | ${client.name}`} />

            <div className="p-2 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950">
                {/* 1. TOP HEADER CARD: 2 TABS ON LEFT, ACTION BUTTONS ON RIGHT */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                    {/* Left: 2 Navigation Tabs */}
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
                            <Server className="size-4" />
                            <span>1. Details</span>
                        </button>

                        {/* TAB 2: Invoices & Billing */}
                        {hasPermission(user, 'view-client-portal-hosting-payments') && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('invoices')}
                                className={`flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'invoices'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Receipt className="size-4" />
                                <span>2. Invoices & Billing ({paymentsList.length})</span>
                            </button>
                        )}
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 pr-1.5">
                        {hasPermission(user, 'edit-client-portal-hostings') && (
                            <button
                                type="button"
                                onClick={() => {
                                    editHostingForm.setData({
                                        hosting_title: hosting.hosting_title,
                                        provider: hosting.provider,
                                        server_ip: hosting.server_ip || '',
                                        server_type: hosting.server_type || 'cPanel Shared',
                                        billing_cycle: hosting.billing_cycle,
                                        expiry_date: hosting.expiry_date ? hosting.expiry_date.split('T')[0] : '',
                                        client_price_pkr: String(hosting.client_price_pkr || ''),
                                        primary_domain_id: hosting.primary_domain_id ? String(hosting.primary_domain_id) : '',
                                        disk_space: hosting.disk_space || '',
                                        bandwidth: hosting.bandwidth || '',
                                        notes: hosting.notes || '',
                                    });
                                    editHostingForm.clearErrors();
                                    setIsEditModalOpen(true);
                                }}
                                className="h-10 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all inline-flex items-center gap-2 cursor-pointer"
                            >
                                <Edit2 className="size-4" />
                                <span>Edit Hosting</span>
                            </button>
                        )}

                        <Link
                            href="/client-portal/hostings"
                            className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Back to Hostings</span>
                        </Link>
                    </div>
                </div>

                {/* 2. TAB 1 CONTENT: DETAILS */}
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Hosting Title & Status Banner */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white shadow-md shadow-blue-600/20 shrink-0">
                                    <Server className="size-7" />
                                </div>
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-all">
                                            {hosting.hosting_title}
                                        </h1>
                                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                            {hosting.provider}
                                        </span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${hosting.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                : hosting.status === 'suspended'
                                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                }`}
                                        >
                                            {hosting.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        Provider: {hosting.provider} &bull; Next renewal on {formatDate(hosting.expiry_date)} ({ucfirst(str_replace('_', ' ', hosting.billing_cycle))})
                                    </p>
                                </div>
                            </div>

                            {/* Banner Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                {hasPermission(user, 'view-client-portal-hosting-payments') && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('invoices')}
                                        className="h-10 px-4 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800 shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                                    >
                                        <Receipt className="size-4 text-blue-600 dark:text-blue-400" />
                                        <span>Manage Invoices ({paymentsList.length})</span>
                                    </button>
                                )}

                                {hasPermission(user, 'delete-client-portal-hostings') && (
                                    hasAnyInvoice ? (
                                        <span
                                            className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold inline-flex items-center gap-1.5 cursor-not-allowed border border-slate-200/60 dark:border-slate-800"
                                            title="Hosting packages with generated invoices cannot be deleted"
                                        >
                                            <ShieldCheck className="size-4 text-emerald-500" />
                                            <span>Locked</span>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="h-10 px-3.5 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-200/60 dark:border-rose-800/60 shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                                        >
                                            <Trash2 className="size-4" />
                                            <span>Delete</span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* KPI Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: Expiry & Countdown */}
                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Renewal Countdown
                                    </span>
                                    <div
                                        className={`p-2 rounded-xl ${isExpired
                                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-600'
                                            : isExpiringSoon
                                                ? 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                                            }`}
                                    >
                                        <Clock className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <h3
                                        className={`text-xl font-extrabold ${isExpired
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : isExpiringSoon
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-slate-900 dark:text-white'
                                            }`}
                                    >
                                        {isExpired
                                            ? `Expired (${Math.abs(daysRemaining)} days ago)`
                                            : `${daysRemaining} Days Left`}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                                        Expires on {formatDate(hosting.expiry_date)}
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Recurring Fee & Billing Cycle */}
                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Recurring Price
                                    </span>
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <CreditCard className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                        {formatCurrency(hosting.client_price_pkr)}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                                        <span>Cycle:</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">
                                            {hosting.billing_cycle.replace('_', ' ')}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Card 3: Total Paid */}
                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Total Paid
                                    </span>
                                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                        <DollarSign className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(totalPaid)}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                                        Pending: {formatCurrency(pendingBalance)}
                                    </p>
                                </div>
                            </div>

                            {/* Card 4: Primary Linked Domain */}
                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Linked Domain
                                    </span>
                                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                                        <Globe className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    {hosting.primary_domain ? (
                                        <>
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate font-mono">
                                                {hosting.primary_domain.domain_name}
                                            </h3>
                                            <p className="text-xs text-emerald-600 font-bold mt-0.5">
                                                Primary Linked Domain
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-base font-extrabold text-slate-400 dark:text-slate-500">
                                                None Linked
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                Standalone server account
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2-Column Info Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* Left Column: Server Specifications & Details (7 cols) */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <Server className="size-4 text-blue-600" />
                                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            Hosting Specifications & Server Details
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Hosting Provider</span>
                                            <p className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">{hosting.provider}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Server / Panel Type</span>
                                            <p className="font-extrabold text-slate-900 dark:text-white text-sm">{hosting.server_type || 'cPanel Shared'}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Server IP Address</span>
                                            <p className="font-bold font-mono text-blue-600 dark:text-blue-400">{hosting.server_ip || 'Not Assigned'}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Billing Cycle</span>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">{hosting.billing_cycle.replace('_', ' ')}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Disk Space</span>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">{hosting.disk_space || 'Unlimited'}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Bandwidth Limit</span>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">{hosting.bandwidth || 'Unlimited'}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Setup Date</span>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">{formatDate(hosting.setup_date)}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Next Expiry Date</span>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">{formatDate(hosting.expiry_date)}</p>
                                        </div>
                                    </div>

                                    {hosting.notes && (
                                        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Notes / Server Credentials</span>
                                            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{hosting.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Primary Linked Domain Card (5 cols) */}
                            <div className="lg:col-span-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className="size-4 text-blue-600" />
                                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            Primary Linked Domain
                                        </h3>
                                    </div>
                                    {hosting.primary_domain && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                                            Connected
                                        </span>
                                    )}
                                </div>

                                {hosting.primary_domain ? (
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Domain Name</span>
                                            <h4 className="text-base font-black text-slate-900 dark:text-white font-mono">
                                                {hosting.primary_domain.domain_name}
                                            </h4>
                                            {hosting.primary_domain.registrar && (
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    Registrar: {hosting.primary_domain.registrar}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                                            <span className="text-slate-400">Domain DNS & Registration info</span>
                                            <Link
                                                href={`/client-portal/domains/${hosting.primary_domain.id}`}
                                                className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>View in Domain Portal</span>
                                                <ExternalLink className="size-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 text-center space-y-1">
                                        <Globe className="size-6 text-slate-300 mx-auto" />
                                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Domain Linked</p>
                                        <p className="text-[11px] text-slate-400">This hosting operates as an unmapped server node.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. TAB 2 CONTENT: INVOICES & BILLING (ALIGNED WITH PROJECTS & DOMAINS) */}
                {activeTab === 'invoices' && (
                    <div className="space-y-6">
                        {/* Financial Overview Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed / Scheduled</span>
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {formatCurrency(totalBilled)}
                                </h3>
                                <p className="text-xs text-slate-400">{paymentsList.length} Payment Record(s)</p>
                            </div>

                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paid Amount</span>
                                <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(totalPaid)}
                                </h3>
                                <p className="text-xs text-emerald-600 font-medium">Settled Invoices</p>
                            </div>

                            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending / Due Balance</span>
                                <h3 className={`text-xl font-extrabold ${pendingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                    {formatCurrency(pendingBalance)}
                                </h3>
                                <p className="text-xs text-slate-400">Unsettled / Pending Payments</p>
                            </div>
                        </div>

                        {/* Payments & Invoices Table Card */}
                        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                        <Receipt className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Hosting Payments & Billing Invoices
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Manage recurring subscription records and generate official invoices for {hosting.hosting_title}.
                                        </p>
                                    </div>
                                </div>

                                {hasPermission(user, 'create-client-portal-hosting-payments') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addPaymentForm.setData({
                                                client_hosting_id: hosting.id,
                                                title: `Hosting Renewal (${ucfirst(str_replace('_', ' ', hosting.billing_cycle))} Plan)`,
                                                amount: String(hosting.client_price_pkr || ''),
                                                payment_type: 'renewal',
                                                due_date: hosting.expiry_date ? hosting.expiry_date.split('T')[0] : '',
                                                notes: '',
                                            });
                                            addPaymentForm.clearErrors();
                                            setIsAddPaymentModalOpen(true);
                                        }}
                                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                                    >
                                        <Plus className="size-4" />
                                        <span>Add Payment / Renewal Record</span>
                                    </button>
                                )}
                            </div>

                            {/* TABLE */}
                            {paymentsList.length > 0 ? (
                                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3">Payment / Subscription Title</th>
                                                <th className="px-4 py-3">Type</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Due / Paid Date</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Invoice</th>
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {paymentsList.map((payment) => {
                                                const hasInvoice = Boolean(payment.invoice);
                                                const isPaid = payment.status === 'paid';

                                                return (
                                                    <tr key={payment.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                                                            <div className="space-y-0.5">
                                                                <p className="text-xs font-extrabold">{payment.title}</p>
                                                                {payment.notes && (
                                                                    <p className="text-[11px] text-slate-400 font-normal line-clamp-1">
                                                                        {payment.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                                                {payment.payment_type.replace('_', ' ')}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white whitespace-nowrap text-sm">
                                                            {formatCurrency(payment.amount)}
                                                        </td>

                                                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                                                            {payment.paid_at ? (
                                                                <span className="text-emerald-600 font-bold">Paid: {formatDate(payment.paid_at)}</span>
                                                            ) : payment.due_date ? (
                                                                <span>Due: {formatDate(payment.due_date)}</span>
                                                            ) : (
                                                                <span>-</span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            <span
                                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${isPaid
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                                                                    }`}
                                                            >
                                                                {payment.status}
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                                            {payment.invoice ? (
                                                                <Link
                                                                    href={`/client-portal/invoices/${payment.invoice.id}`}
                                                                    className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5"
                                                                >
                                                                    <span>{payment.invoice.invoice_number}</span>
                                                                    <span
                                                                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${payment.invoice.status === 'paid'
                                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50'
                                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50'
                                                                            }`}
                                                                    >
                                                                        {payment.invoice.status}
                                                                    </span>
                                                                </Link>
                                                            ) : (
                                                                <span className="text-slate-400 italic text-[11px]">No Invoice</span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1.5">
                                                                {/* 0. Mark as Paid (Only if invoice exists & payment is unpaid) */}
                                                                {hasInvoice && !isPaid && hasPermission(user, 'edit-client-portal-hosting-payments') && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={isMarkingPaidPayment}
                                                                        onClick={() => setConfirmingPaidPayment(payment)}
                                                                        className="h-8 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border border-emerald-200/50"
                                                                        title="Mark Hosting Payment as Paid"
                                                                    >
                                                                        <CheckCircle2 className="size-3.5" />
                                                                        <span>Mark as Paid</span>
                                                                    </button>
                                                                )}

                                                                {/* 1. Generate Invoice or Print Invoice */}
                                                                {hasInvoice ? (
                                                                    hasPermission(user, 'print-client-portal-invoices') && (
                                                                        <a
                                                                            href={`/client-portal/invoices/${payment.invoice!.id}/pdf`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="h-8 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer border border-blue-200/50 hover:border-transparent"
                                                                            title="Open and Print Invoice PDF"
                                                                        >
                                                                            <Printer className="size-3.5" />
                                                                            <span>Print</span>
                                                                        </a>
                                                                    )
                                                                ) : (
                                                                    hasPermission(user, 'create-client-portal-invoices') && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openGenerateInvoiceModal(payment)}
                                                                            className="h-8 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                                                                            title="Generate Official Invoice"
                                                                        >
                                                                            <FileText className="size-3.5" />
                                                                            <span>Generate Invoice</span>
                                                                        </button>
                                                                    )
                                                                )}

                                                                {/* 2. Edit */}
                                                                {!hasInvoice && !isPaid && hasPermission(user, 'edit-client-portal-hosting-payments') && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEditPaymentModal(payment)}
                                                                        className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-indigo-200/50"
                                                                        title="Edit Payment Record"
                                                                    >
                                                                        <Edit2 className="size-3.5" />
                                                                    </button>
                                                                )}

                                                                {/* 3. Delete */}
                                                                {!hasInvoice && !isPaid ? (
                                                                    hasPermission(user, 'delete-client-portal-hosting-payments') && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openDeletePaymentModal(payment)}
                                                                            className="size-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-rose-200/50"
                                                                            title="Delete Payment Record"
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                        </button>
                                                                    )
                                                                ) : (
                                                                    <span
                                                                        className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center cursor-not-allowed border border-slate-200/50"
                                                                        title="Locked by invoice or paid status"
                                                                    >
                                                                        <ShieldCheck className="size-3.5 text-emerald-500" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
                                    <Receipt className="size-8 text-slate-300 mx-auto" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            No payment records found for this hosting package.
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Click "Add Payment / Renewal Record" above to record a billing event or create an invoice.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ADD PAYMENT / RENEWAL RECORD MODAL */}
                {isAddPaymentModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="w-full max-w-lg max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <Receipt className="size-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Add Payment / Renewal Record</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Record a new subscription or renewal billing item for {hosting.hosting_title}.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddPaymentModalOpen(false)}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleAddPaymentSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Payment Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={addPaymentForm.data.title}
                                        onChange={(e) => addPaymentForm.setData('title', e.target.value)}
                                        placeholder="e.g. Annual Renewal (2026 - 2027)"
                                        className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${addPaymentForm.errors.title
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {addPaymentForm.errors.title && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{addPaymentForm.errors.title}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Amount ({client.currency || 'USD'}) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={addPaymentForm.data.amount}
                                            onChange={(e) => addPaymentForm.setData('amount', e.target.value)}
                                            placeholder="e.g. 12000"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${addPaymentForm.errors.amount
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {addPaymentForm.errors.amount && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{addPaymentForm.errors.amount}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Payment Type <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={addPaymentForm.data.payment_type}
                                            onChange={(e) => addPaymentForm.setData('payment_type', e.target.value as any)}
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                                        >
                                            <option value="renewal">Recurring Renewal</option>
                                            <option value="initial_setup">Initial Setup / Plan</option>
                                            <option value="upgrade">Resource Upgrade</option>
                                            <option value="other">Other Adjustment</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={addPaymentForm.data.due_date}
                                        onChange={(e) => addPaymentForm.setData('due_date', e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Notes / Remarks
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={addPaymentForm.data.notes}
                                        onChange={(e) => addPaymentForm.setData('notes', e.target.value)}
                                        placeholder="Optional billing note or terms..."
                                        className="w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddPaymentModalOpen(false)}
                                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addPaymentForm.processing}
                                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {addPaymentForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Save Payment Record</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT PAYMENT MODAL */}
                {isEditPaymentModalOpen && selectedPayment && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="w-full max-w-lg max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <Edit2 className="size-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Payment Record</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Update payment title, amount, and due date.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditPaymentModalOpen(false)}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleEditPaymentSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Payment Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editPaymentForm.data.title}
                                        onChange={(e) => editPaymentForm.setData('title', e.target.value)}
                                        className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editPaymentForm.errors.title
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {editPaymentForm.errors.title && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{editPaymentForm.errors.title}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Amount ({client.currency || 'USD'}) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editPaymentForm.data.amount}
                                            onChange={(e) => editPaymentForm.setData('amount', e.target.value)}
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editPaymentForm.errors.amount
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editPaymentForm.errors.amount && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editPaymentForm.errors.amount}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Payment Type <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={editPaymentForm.data.payment_type}
                                            onChange={(e) => editPaymentForm.setData('payment_type', e.target.value as any)}
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                                        >
                                            <option value="renewal">Recurring Renewal</option>
                                            <option value="initial_setup">Initial Setup / Plan</option>
                                            <option value="upgrade">Resource Upgrade</option>
                                            <option value="other">Other Adjustment</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editPaymentForm.data.due_date}
                                        onChange={(e) => editPaymentForm.setData('due_date', e.target.value)}
                                        className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Notes / Remarks
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={editPaymentForm.data.notes}
                                        onChange={(e) => editPaymentForm.setData('notes', e.target.value)}
                                        className="w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-all"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditPaymentModalOpen(false)}
                                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editPaymentForm.processing}
                                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {editPaymentForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Update Payment</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* GENERATE OFFICIAL INVOICE FOR PAYMENT CONFIRMATION MODAL */}
                {isGenerateInvoiceModalOpen && selectedPayment && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <FileText className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        Generate Official Invoice
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">Hosting Subscription Record</p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Are you sure you want to generate an official system invoice for{' '}
                                <strong className="text-slate-900 dark:text-white font-mono font-bold">{selectedPayment.title}</strong>{' '}
                                of amount{' '}
                                <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                    {formatCurrency(selectedPayment.amount)}
                                </strong>
                                ?
                            </p>

                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                                <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <span>
                                    Once generated, an invoice record will be added to the Invoices section and this payment record will be locked.
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsGenerateInvoiceModalOpen(false);
                                        setSelectedPayment(null);
                                    }}
                                    disabled={isGeneratingInvoice}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateInvoiceSubmit}
                                    disabled={isGeneratingInvoice}
                                    className="h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isGeneratingInvoice ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <span>Confirm & Generate</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DELETE PAYMENT CONFIRMATION MODAL */}
                {isDeletePaymentModalOpen && selectedPayment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeletePaymentModalOpen(false);
                                    setSelectedPayment(null);
                                }}
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
                                    Are you sure you want to delete payment <strong className="text-slate-900 dark:text-white">"{selectedPayment.title}"</strong>?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    disabled={isDeletingPayment}
                                    onClick={() => {
                                        setIsDeletePaymentModalOpen(false);
                                        setSelectedPayment(null);
                                    }}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeletePaymentSubmit}
                                    disabled={isDeletingPayment}
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none inline-flex items-center gap-2 cursor-pointer"
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

                {/* EDIT HOSTING MODAL */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="w-full max-w-4xl max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <Server className="size-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Hosting Package</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure hosting specifications and server credentials.</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleEditHostingSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Row 1 */}
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Package / Server Title <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editHostingForm.data.hosting_title}
                                            onChange={(e) => editHostingForm.setData('hosting_title', e.target.value)}
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editHostingForm.errors.hosting_title
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editHostingForm.errors.hosting_title && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editHostingForm.errors.hosting_title}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Provider / Vendor <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editHostingForm.data.provider}
                                            onChange={(e) => editHostingForm.setData('provider', e.target.value)}
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editHostingForm.errors.provider
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editHostingForm.errors.provider && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editHostingForm.errors.provider}</p>
                                        )}
                                    </div>

                                    {/* Row 2 */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Server IP Address
                                        </label>
                                        <input
                                            type="text"
                                            value={editHostingForm.data.server_ip}
                                            onChange={(e) => editHostingForm.setData('server_ip', e.target.value)}
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editHostingForm.errors.server_ip
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Server / Panel Type
                                        </label>
                                        <input
                                            type="text"
                                            value={editHostingForm.data.server_type}
                                            onChange={(e) => editHostingForm.setData('server_type', e.target.value)}
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editHostingForm.errors.server_type
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Linked Domain
                                        </label>
                                        <select
                                            value={editHostingForm.data.primary_domain_id}
                                            onChange={(e) => editHostingForm.setData('primary_domain_id', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                                        >
                                            <option value="">No Domain Linked</option>
                                            {domains.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.domain_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Row 3 */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Billing Cycle <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={editHostingForm.data.billing_cycle}
                                            onChange={(e) => editHostingForm.setData('billing_cycle', e.target.value as any)}
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly (3 Mo)</option>
                                            <option value="semi_annual">Semi-Annual (6 Mo)</option>
                                            <option value="annual">Annual (1 Year)</option>
                                            <option value="biennial">Biennial (2 Years)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Recurring Price ({client.currency || 'USD'}) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editHostingForm.data.client_price_pkr}
                                            onChange={(e) => editHostingForm.setData('client_price_pkr', e.target.value)}
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editHostingForm.errors.client_price_pkr
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editHostingForm.errors.client_price_pkr && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editHostingForm.errors.client_price_pkr}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Next Expiry / Renewal Date <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={editHostingForm.data.expiry_date}
                                            onChange={(e) => editHostingForm.setData('expiry_date', e.target.value)}
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${editHostingForm.errors.expiry_date
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editHostingForm.errors.expiry_date && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editHostingForm.errors.expiry_date}</p>
                                        )}
                                    </div>

                                    {/* Row 4 */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Disk Space
                                        </label>
                                        <input
                                            type="text"
                                            value={editHostingForm.data.disk_space}
                                            onChange={(e) => editHostingForm.setData('disk_space', e.target.value)}
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editHostingForm.errors.disk_space
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Bandwidth Limit
                                        </label>
                                        <input
                                            type="text"
                                            value={editHostingForm.data.bandwidth}
                                            onChange={(e) => editHostingForm.setData('bandwidth', e.target.value)}
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editHostingForm.errors.bandwidth
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Notes / Remarks
                                        </label>
                                        <input
                                            type="text"
                                            value={editHostingForm.data.notes}
                                            onChange={(e) => editHostingForm.setData('notes', e.target.value)}
                                            placeholder="e.g. cPanel username, server tag..."
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editHostingForm.errors.notes
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editHostingForm.processing}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {editHostingForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Update Hosting</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE HOSTING CONFIRMATION MODAL */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Hosting Package?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete hosting <strong className="text-slate-900 dark:text-white">"{hosting.hosting_title}"</strong>?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    disabled={isDeleting}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteHostingSubmit}
                                    disabled={isDeleting}
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none inline-flex items-center gap-2 cursor-pointer"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Package</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MARK HOSTING PAYMENT AS PAID CONFIRMATION MODAL */}
                {confirmingPaidPayment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setConfirmingPaidPayment(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                                <CheckCircle2 className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Mark Hosting Payment as Paid</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Confirm payment receipt for <strong>"{confirmingPaidPayment.title}"</strong> ({formatCurrency(confirmingPaidPayment.amount)}). This will renew the hosting status and mark its linked invoice as Paid if all items are settled.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setConfirmingPaidPayment(null)}
                                    disabled={isMarkingPaidPayment}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleMarkPaymentPaidSubmit}
                                    disabled={isMarkingPaidPayment}
                                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                                >
                                    {isMarkingPaidPayment && <LoaderCircle className="size-4 animate-spin" />}
                                    <span>Confirm & Mark as Paid</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientPortalLayout>
    );
};
