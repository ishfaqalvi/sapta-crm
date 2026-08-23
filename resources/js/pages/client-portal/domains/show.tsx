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
    Check,
    Clock,
    Copy,
    CreditCard,
    DollarSign,
    Edit2,
    ExternalLink,
    FileText,
    Globe,
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

export interface DomainPaymentItem {
    id: number;
    client_domain_id: number;
    client_id: number;
    title: string;
    amount: number;
    exchange_rate: number;
    amount_pkr: number;
    payment_type: 'registration' | 'renewal' | 'transfer' | 'other';
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

export interface LinkedHostingItem {
    id: number;
    package_name: string;
    domain_name?: string;
    server_name?: string;
    server_ip?: string;
    status: 'active' | 'suspended' | 'cancelled' | 'pending';
    monthly_price_pkr?: number;
    expiry_date?: string;
}

export interface ClientPortalDomainDetailItem {
    id: number;
    client_id: number;
    domain_name: string;
    registrar: string;
    registration_date: string | null;
    expiry_date: string;
    renewal_cost_pkr: number;
    client_price_pkr: number;
    auto_renew: boolean;
    has_hosting_bundle: boolean;
    nameserver_1: string | null;
    nameserver_2: string | null;
    nameserver_3: string | null;
    nameserver_4: string | null;
    status: 'active' | 'pending_renewal' | 'expired' | 'transferred';
    notes: string | null;
    created_at: string;
    client?: {
        id: number;
        name: string;
        client_code: string;
        company_name?: string;
        currency?: string;
    };
    hostings?: LinkedHostingItem[];
    payments?: DomainPaymentItem[];
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

interface ClientPortalDomainShowProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    domain: ClientPortalDomainDetailItem;
}

export default function ClientPortalDomainShow({
    client,
    domain,
}: ClientPortalDomainShowProps) {
    const user = (usePage().props.auth as any)?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Domains & DNS', href: '/client-portal/domains' },
        { title: domain.domain_name, href: `/client-portal/domains/${domain.id}` },
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

    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
    const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
    const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);

    // Selected Payment for Actions
    const [selectedPayment, setSelectedPayment] = useState<DomainPaymentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingPayment, setIsDeletingPayment] = useState(false);
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

    // Edit Domain Form
    const editDomainForm = useForm({
        domain_name: domain.domain_name,
        registrar: domain.registrar || 'Namecheap',
        registration_date: domain.registration_date ? domain.registration_date.split('T')[0] : '',
        expiry_date: domain.expiry_date ? domain.expiry_date.split('T')[0] : '',
        client_price_pkr: String(domain.client_price_pkr || ''),
        auto_renew: Boolean(domain.auto_renew),
        nameserver_1: domain.nameserver_1 || '',
        nameserver_2: domain.nameserver_2 || '',
        notes: domain.notes || '',
    });

    // Add Payment Form
    const addPaymentForm = useForm({
        client_domain_id: domain.id,
        title: `Annual Renewal (${new Date().getFullYear()} - ${new Date().getFullYear() + 1})`,
        amount: String(domain.client_price_pkr || ''),
        payment_type: 'renewal',
        due_date: domain.expiry_date ? domain.expiry_date.split('T')[0] : '',
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

    const handleCopy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleEditDomainSubmit = (e: FormEvent) => {
        e.preventDefault();
        editDomainForm.put(`/client-portal/domains/update/${domain.id}`, {
            onSuccess: () => setIsEditModalOpen(false),
        });
    };

    const handleDeleteDomainSubmit = () => {
        if (isDeleting) return;
        setIsDeleting(true);
        router.delete(`/client-portal/domains/destroy/${domain.id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                router.visit('/client-portal/domains');
            },
            onError: () => setIsDeleting(false),
        });
    };

    const handleAddPaymentSubmit = (e: FormEvent) => {
        e.preventDefault();
        addPaymentForm.post('/client-portal/domains/payments/store', {
            onSuccess: () => {
                setIsAddPaymentModalOpen(false);
                addPaymentForm.reset();
            },
        });
    };

    const openEditPaymentModal = (payment: DomainPaymentItem) => {
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
        editPaymentForm.put(`/client-portal/domains/payments/update/${selectedPayment.id}`, {
            onSuccess: () => {
                setIsEditPaymentModalOpen(false);
                setSelectedPayment(null);
            },
        });
    };

    const openDeletePaymentModal = (payment: DomainPaymentItem) => {
        setSelectedPayment(payment);
        setIsDeletePaymentModalOpen(true);
    };

    const handleDeletePaymentSubmit = () => {
        if (!selectedPayment || isDeletingPayment) return;
        setIsDeletingPayment(true);
        router.delete(`/client-portal/domains/payments/destroy/${selectedPayment.id}`, {
            preserveScroll: true,
            onFinish: () => setIsDeletingPayment(false),
            onSuccess: () => {
                setIsDeletePaymentModalOpen(false);
                setSelectedPayment(null);
            },
            onError: () => setIsDeletingPayment(false),
        });
    };

    const openGenerateInvoiceModal = (payment: DomainPaymentItem) => {
        setSelectedPayment(payment);
        setIsGenerateInvoiceModalOpen(true);
    };

    const handleGenerateInvoiceSubmit = () => {
        if (!selectedPayment) return;
        setIsGeneratingInvoice(true);
        router.post(
            `/client-portal/domains/payments/${selectedPayment.id}/generate-invoice`,
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

    const formatCurrency = (amount: number | string | null | undefined) => {
        const num = Number(amount || 0);
        const curr = client.currency || domain.client?.currency || 'USD';
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

    const daysRemaining = getDaysRemaining(domain.expiry_date);
    const isExpired = daysRemaining < 0;
    const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 30;

    const nameserversList = [
        { label: 'Nameserver 1 (Primary)', value: domain.nameserver_1, key: 'ns1' },
        { label: 'Nameserver 2 (Secondary)', value: domain.nameserver_2, key: 'ns2' },
        { label: 'Nameserver 3', value: domain.nameserver_3, key: 'ns3' },
        { label: 'Nameserver 4', value: domain.nameserver_4, key: 'ns4' },
    ].filter((ns) => ns.value);

    // Primary linked hosting (if any)
    const linkedHosting = domain.hostings && domain.hostings.length > 0 ? domain.hostings[0] : null;

    // Payments Calculations
    const paymentsList = domain.payments || [];
    const totalBilled = paymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPaid = paymentsList.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingBalance = totalBilled - totalPaid;
    const hasAnyInvoice = paymentsList.some((p) => Boolean(p.invoice)) || Boolean(domain.invoice);

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title={`${domain.domain_name} | ${client.name}`} />

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
                            <FileText className="size-4" />
                            <span>1. Details</span>
                        </button>

                        {/* TAB 2: Invoices & Billing */}
                        {hasPermission(user, 'view-client-portal-domain-payments') && (
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
                        {hasPermission(user, 'edit-client-portal-domains') && (
                            <button
                                type="button"
                                onClick={() => {
                                    editDomainForm.setData({
                                        domain_name: domain.domain_name,
                                        registrar: domain.registrar || 'Namecheap',
                                        registration_date: domain.registration_date ? domain.registration_date.split('T')[0] : '',
                                        expiry_date: domain.expiry_date ? domain.expiry_date.split('T')[0] : '',
                                        client_price_pkr: String(domain.client_price_pkr || ''),
                                        auto_renew: Boolean(domain.auto_renew),
                                        nameserver_1: domain.nameserver_1 || '',
                                        nameserver_2: domain.nameserver_2 || '',
                                        notes: domain.notes || '',
                                    });
                                    editDomainForm.clearErrors();
                                    setIsEditModalOpen(true);
                                }}
                                className="h-10 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all inline-flex items-center gap-2 cursor-pointer"
                            >
                                <Edit2 className="size-4" />
                                <span>Edit Domain</span>
                            </button>
                        )}

                        <Link
                            href="/client-portal/domains"
                            className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Back to Domains</span>
                        </Link>
                    </div>
                </div>

                {/* 2. TAB 1 CONTENT: DETAILS */}
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Domain Title & Status Banner */}
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white shadow-md shadow-blue-600/20 shrink-0">
                                    <Globe className="size-7" />
                                </div>
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight break-all">
                                            {domain.domain_name}
                                        </h1>
                                        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                                            {domain.registrar}
                                        </span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${domain.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                : domain.status === 'expired'
                                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                }`}
                                        >
                                            {domain.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        Registered with {domain.registrar} &bull; Next renewal on {formatDate(domain.expiry_date)}
                                    </p>
                                </div>
                            </div>

                            {/* Banner Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                                {hasPermission(user, 'view-client-portal-domain-payments') && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('invoices')}
                                        className="h-10 px-3 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800 shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                                    >
                                        <Receipt className="size-4 text-blue-600 dark:text-blue-400" />
                                        <span>Manage Invoices ({paymentsList.length})</span>
                                    </button>
                                )}

                                {hasAnyInvoice ? (
                                    <span
                                        className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold inline-flex items-center gap-1.5 cursor-not-allowed border border-slate-200/60 dark:border-slate-800"
                                        title="Domains with generated invoices cannot be deleted"
                                    >
                                        <ShieldCheck className="size-4 text-emerald-500" />
                                        <span>Locked</span>
                                    </span>
                                ) : (
                                    hasPermission(user, 'delete-client-portal-domains') && (
                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteModalOpen(true)}
                                            className="h-10 px-3 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-200/60 dark:border-rose-800/60 shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer"
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
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
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
                                        Expires on {formatDate(domain.expiry_date)}
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Renewal Fee */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Annual Fee
                                    </span>
                                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <CreditCard className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                        {formatCurrency(domain.client_price_pkr)}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                                        <span>Auto-renew:</span>
                                        <span className={`font-bold ${domain.auto_renew ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {domain.auto_renew ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Card 3: Payments Status */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
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

                            {/* Card 4: Linked Hosting */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                        Linked Hosting
                                    </span>
                                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                                        <Server className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    {linkedHosting ? (
                                        <>
                                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                                                {linkedHosting.package_name}
                                            </h3>
                                            <p className="text-xs text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                                                <span>Connected ({linkedHosting.status})</span>
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-base font-extrabold text-slate-400 dark:text-slate-500">
                                                None Linked
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                Standalone domain record
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2-Column Info Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left Column: Domain Details + Linked Hosting Card (7 cols) */}
                            <div className="lg:col-span-7 space-y-6">
                                {/* Domain Registration & Lifecycle Details */}
                                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <Calendar className="size-4 text-blue-600" />
                                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            Domain Registration & Lifecycle Details
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Registrar Vendor</span>
                                            <p className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">{domain.registrar}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Annual Renewal Price</span>
                                            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(domain.client_price_pkr)}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Registration Date</span>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">{formatDate(domain.registration_date)}</p>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Next Expiry Date</span>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">{formatDate(domain.expiry_date)}</p>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">Auto-Renewal Setting</span>
                                        <span className={`font-bold px-2.5 py-1 rounded-full text-[10px] uppercase ${domain.auto_renew ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {domain.auto_renew ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>

                                    {domain.notes && (
                                        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Notes / Remarks</span>
                                            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{domain.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Linked Web Hosting Card */}
                                <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Server className="size-4 text-teal-600" />
                                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                Linked Web Hosting Package
                                            </h3>
                                        </div>
                                        {linkedHosting && (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                                                {linkedHosting.status}
                                            </span>
                                        )}
                                    </div>

                                    {linkedHosting ? (
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                        {linkedHosting.package_name}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        Server: {linkedHosting.server_name || 'Main Server Node'}
                                                    </p>
                                                </div>
                                                {linkedHosting.server_ip && (
                                                    <div className="text-left sm:text-right">
                                                        <span className="text-[10px] font-bold uppercase text-slate-400">Server IP</span>
                                                        <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                                            {linkedHosting.server_ip}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs">
                                                <span className="text-slate-400">Manage hosting specifications & server details</span>
                                                <Link
                                                    href="/client-portal/hostings"
                                                    className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <span>View in Hosting Portal</span>
                                                    <ExternalLink className="size-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 text-center space-y-1">
                                            <Server className="size-6 text-slate-300 mx-auto" />
                                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Web Hosting Package Linked</p>
                                            <p className="text-[11px] text-slate-400">This domain operates as a standalone registration record.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: DNS & Nameservers Card (5 cols) */}
                            <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Globe className="size-4 text-blue-600" />
                                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            DNS & Nameservers
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        {nameserversList.length} Active
                                    </span>
                                </div>

                                {nameserversList.length > 0 ? (
                                    <div className="space-y-3">
                                        {nameserversList.map((ns) => (
                                            <div
                                                key={ns.key}
                                                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 group"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                                        {ns.label}
                                                    </span>
                                                    <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
                                                        {ns.value}
                                                    </code>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(ns.value || '', ns.key)}
                                                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 shadow-2xs transition-all shrink-0 cursor-pointer"
                                                    title="Copy Nameserver"
                                                >
                                                    {copiedKey === ns.key ? (
                                                        <Check className="size-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 text-center space-y-1">
                                        <Globe className="size-6 text-slate-300 mx-auto" />
                                        <p className="text-xs text-slate-400 italic">No custom nameservers configured yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. TAB 2 CONTENT: INVOICES & BILLING (ALIGNED WITH PROJECTS) */}
                {activeTab === 'invoices' && (
                    <div className="space-y-6">
                        {/* Financial Overview Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed / Scheduled</span>
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {formatCurrency(totalBilled)}
                                </h3>
                                <p className="text-xs text-slate-400">{paymentsList.length} Payment Record(s)</p>
                            </div>

                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paid Amount</span>
                                <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(totalPaid)}
                                </h3>
                                <p className="text-xs text-emerald-600 font-medium">Settled Invoices</p>
                            </div>

                            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending / Due Balance</span>
                                <h3 className={`text-xl font-extrabold ${pendingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                    {formatCurrency(pendingBalance)}
                                </h3>
                                <p className="text-xs text-slate-400">Unsettled / Pending Payments</p>
                            </div>
                        </div>

                        {/* Payments & Invoices Table Card */}
                        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                        <Receipt className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Domain Payments & Renewal Invoices
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Manage periodic billing records and generate official invoices for {domain.domain_name}.
                                        </p>
                                    </div>
                                </div>

                                {hasPermission(user, 'create-client-portal-domain-payments') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            addPaymentForm.setData({
                                                client_domain_id: domain.id,
                                                title: `Annual Renewal (${new Date().getFullYear()} - ${new Date().getFullYear() + 1})`,
                                                amount: String(domain.client_price_pkr || ''),
                                                payment_type: 'renewal',
                                                due_date: domain.expiry_date ? domain.expiry_date.split('T')[0] : '',
                                                notes: '',
                                            });
                                            addPaymentForm.clearErrors();
                                            setIsAddPaymentModalOpen(true);
                                        }}
                                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
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
                                                <th className="px-4 py-3">Payment / Renewal Title</th>
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
                                                                {payment.payment_type}
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
                                                                    className="font-mono font-bold text-blue-600 hover:underline inline-flex items-center gap-1.5"
                                                                >
                                                                    <span>{payment.invoice.invoice_number}</span>
                                                                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                                                                        {payment.invoice.status}
                                                                    </span>
                                                                </Link>
                                                            ) : (
                                                                <span className="text-slate-400 italic text-[11px]">No Invoice</span>
                                                            )}
                                                        </td>

                                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                            <div className="inline-flex items-center gap-1.5">
                                                                {/* 1. Generate Invoice (if no invoice) or Print Invoice (if invoice exists) */}
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

                                                                {/* 2. Edit (if no invoice & not paid) */}
                                                                {!hasInvoice && !isPaid && hasPermission(user, 'edit-client-portal-domain-payments') && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEditPaymentModal(payment)}
                                                                        className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center transition-all cursor-pointer"
                                                                        title="Edit Payment Record"
                                                                    >
                                                                        <Edit2 className="size-3.5" />
                                                                    </button>
                                                                )}

                                                                {/* 3. Delete (if no invoice & not paid) */}
                                                                {!hasInvoice && !isPaid ? (
                                                                    hasPermission(user, 'delete-client-portal-domain-payments') && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openDeletePaymentModal(payment)}
                                                                            className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-600 hover:text-white inline-flex items-center justify-center transition-all cursor-pointer"
                                                                            title="Delete Payment Record"
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                        </button>
                                                                    )
                                                                ) : (
                                                                    <span
                                                                        className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 inline-flex items-center justify-center cursor-not-allowed"
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
                                    <div>
                                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">No Payment Records Yet</h4>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Click "Add Payment / Renewal Record" above to create your first billing item for this domain.
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
                                    <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                        <Receipt className="size-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Add Payment / Renewal Record</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Record a new registration or renewal billing item for {domain.domain_name}.</p>
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
                                            placeholder="e.g. 4500"
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
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                                        >
                                            <option value="renewal">Annual Renewal</option>
                                            <option value="registration">Initial Registration</option>
                                            <option value="transfer">Domain Transfer</option>
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
                                        className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${addPaymentForm.errors.due_date
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {addPaymentForm.errors.due_date && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{addPaymentForm.errors.due_date}</p>
                                    )}
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
                                        className={`w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${addPaymentForm.errors.notes
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {addPaymentForm.errors.notes && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{addPaymentForm.errors.notes}</p>
                                    )}
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
                                            className="w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600 transition-all"
                                        >
                                            <option value="renewal">Annual Renewal</option>
                                            <option value="registration">Initial Registration</option>
                                            <option value="transfer">Domain Transfer</option>
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
                                        className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${editPaymentForm.errors.due_date
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {editPaymentForm.errors.due_date && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{editPaymentForm.errors.due_date}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Notes / Remarks
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={editPaymentForm.data.notes}
                                        onChange={(e) => editPaymentForm.setData('notes', e.target.value)}
                                        className={`w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editPaymentForm.errors.notes
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {editPaymentForm.errors.notes && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{editPaymentForm.errors.notes}</p>
                                    )}
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
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                                    <FileText className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        Generate Official Invoice
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">Domain Billing Record</p>
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
                                    Are you sure you want to delete payment record <strong className="text-slate-900 dark:text-white">"{selectedPayment.title}"</strong>?
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
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                                >
                                    {isDeletingPayment ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Payment</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT DOMAIN MODAL */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="w-full max-w-lg max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <Globe className="size-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Domain Record</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Update registration, pricing, and nameserver details.</p>
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

                            <form noValidate onSubmit={handleEditDomainSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Domain Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editDomainForm.data.domain_name}
                                        onChange={(e) => editDomainForm.setData('domain_name', e.target.value.toLowerCase().trim())}
                                        placeholder="e.g. mycompany.com"
                                        className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editDomainForm.errors.domain_name
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {editDomainForm.errors.domain_name && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{editDomainForm.errors.domain_name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Registrar Vendor <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editDomainForm.data.registrar}
                                            onChange={(e) => editDomainForm.setData('registrar', e.target.value)}
                                            placeholder="e.g. Namecheap, GoDaddy"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editDomainForm.errors.registrar
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editDomainForm.errors.registrar && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editDomainForm.errors.registrar}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Registration Date
                                        </label>
                                        <input
                                            type="date"
                                            value={editDomainForm.data.registration_date}
                                            onChange={(e) => editDomainForm.setData('registration_date', e.target.value)}
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${editDomainForm.errors.registration_date
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editDomainForm.errors.registration_date && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editDomainForm.errors.registration_date}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Next Expiry / Renewal Date <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={editDomainForm.data.expiry_date}
                                            onChange={(e) => editDomainForm.setData('expiry_date', e.target.value)}
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:outline-none transition-all ${editDomainForm.errors.expiry_date
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editDomainForm.errors.expiry_date && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editDomainForm.errors.expiry_date}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Annual Renewal Price ({client.currency || 'USD'}) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editDomainForm.data.client_price_pkr}
                                            onChange={(e) => editDomainForm.setData('client_price_pkr', e.target.value)}
                                            placeholder="e.g. 4500"
                                            className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editDomainForm.errors.client_price_pkr
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editDomainForm.errors.client_price_pkr && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editDomainForm.errors.client_price_pkr}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Primary Nameserver (NS1)
                                        </label>
                                        <input
                                            type="text"
                                            value={editDomainForm.data.nameserver_1}
                                            onChange={(e) => editDomainForm.setData('nameserver_1', e.target.value)}
                                            placeholder="e.g. ns1.cloudflare.com"
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editDomainForm.errors.nameserver_1
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editDomainForm.errors.nameserver_1 && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editDomainForm.errors.nameserver_1}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Secondary Nameserver (NS2)
                                        </label>
                                        <input
                                            type="text"
                                            value={editDomainForm.data.nameserver_2}
                                            onChange={(e) => editDomainForm.setData('nameserver_2', e.target.value)}
                                            placeholder="e.g. ns2.cloudflare.com"
                                            className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editDomainForm.errors.nameserver_2
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                                }`}
                                        />
                                        {editDomainForm.errors.nameserver_2 && (
                                            <p className="text-rose-500 text-xs font-medium mt-1">{editDomainForm.errors.nameserver_2}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Notes / Account Reference
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={editDomainForm.data.notes}
                                        onChange={(e) => editDomainForm.setData('notes', e.target.value)}
                                        placeholder="Add any specific registrar account details, email or contact info..."
                                        className={`w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${editDomainForm.errors.notes
                                            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {editDomainForm.errors.notes && (
                                        <p className="text-rose-500 text-xs font-medium mt-1">{editDomainForm.errors.notes}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editDomainForm.processing}
                                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {editDomainForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Update Domain</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE DOMAIN CONFIRMATION MODAL */}
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
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Domain?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete domain <strong className="text-slate-900 dark:text-white">"{domain.domain_name}"</strong>?
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
                                    onClick={handleDeleteDomainSubmit}
                                    disabled={isDeleting}
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Domain</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientPortalLayout>
    );
}
