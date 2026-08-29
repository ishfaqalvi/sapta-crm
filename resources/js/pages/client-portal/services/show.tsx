import DocumentsTab, { type ClientDocumentItem } from '@/components/documents-tab';
import SearchableSelect from '@/components/searchable-select';
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
    GitMerge,
    Key,
    KeyRound,
    Layers,
    ListTodo,
    LoaderCircle,
    Lock,
    Package,
    PauseCircle,
    Plus,
    Printer,
    Receipt,
    RefreshCw,
    Scissors,
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
    parent_id?: number | null;
    billing_month: string;
    split_title?: string | null;
    amount_due: number | string;
    amount_paid: number | string;
    payment_date: string | null;
    status: 'paid' | 'due' | 'due_pending' | 'overdue';
    payment_method: string | null;
    notes: string | null;
    children?: ServicePaymentItem[];
    invoice?: {
        id: number;
        invoice_number: string;
        status: string;
    } | null;
}

export interface ServiceTaskItem {
    id: number;
    client_service_id: number;
    assigned_employee_id?: number | null;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string | null;
    due_date?: string | null;
    description?: string | null;
    completed_at?: string | null;
    created_at?: string;
    assigned_employee?: {
        id: number;
        name: string;
        employee_code: string;
        avatar?: string | null;
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
    contract_months: number | null;
    currency: string;
    start_date: string | null;
    billing_day: number;
    status: 'active' | 'paused' | 'stopped';
    notes: string | null;
    created_at?: string;
    payments?: ServicePaymentItem[];
    tasks?: ServiceTaskItem[];
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
    employees?: {
        id: number;
        name: string;
        employee_code: string;
        avatar?: string | null;
    }[];
}

export default function ClientPortalServiceShow({ client, service, employees = [] }: ClientPortalServiceShowProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;
    const canViewBudget = hasPermission(user, 'view-client-portal-service-budget');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Services', href: '/client-portal/services' },
        { title: service.service_name, href: `/client-portal/services/${service.id}` },
    ];

    // URL Tab persistence support ('details' | 'payments' | 'tasks' | 'credentials' | 'documents')
    const getInitialTab = (): 'details' | 'payments' | 'tasks' | 'credentials' | 'documents' => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'payments' && canViewBudget) return 'payments';
            if (tab === 'tasks' || tab === 'credentials' || tab === 'details' || tab === 'documents') {
                return tab;
            }
        }
        return 'details';
    };

    const [activeTab, setActiveTabState] = useState<'details' | 'payments' | 'tasks' | 'credentials' | 'documents'>(getInitialTab);

    const employeeOptions = (employees || []).map((emp) => ({
        value: emp.id,
        label: `${emp.name} (${emp.employee_code})`,
    }));

    const setActiveTab = (tab: 'details' | 'payments' | 'tasks' | 'credentials' | 'documents') => {
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

    // TASK STATE & HANDLERS
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ServiceTaskItem | null>(null);
    const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
    const [taskFormData, setTaskFormData] = useState({
        assigned_employee_id: '' as string | number,
        task_title: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        status: 'todo' as 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled',
        start_date: '',
        due_date: new Date().toISOString().split('T')[0],
        description: '',
    });
    const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});
    const [deletingTask, setDeletingTask] = useState<ServiceTaskItem | null>(null);

    const openCreateTaskModal = () => {
        setEditingTask(null);
        setTaskFormData({
            assigned_employee_id: '',
            task_title: '',
            priority: 'medium',
            status: 'todo',
            start_date: '',
            due_date: new Date().toISOString().split('T')[0],
            description: '',
        });
        setTaskErrors({});
        setIsTaskModalOpen(true);
    };

    const openEditTaskModal = (t: ServiceTaskItem) => {
        setEditingTask(t);
        setTaskFormData({
            assigned_employee_id: t.assigned_employee_id || '',
            task_title: t.task_title || '',
            priority: t.priority || 'medium',
            status: t.status || 'todo',
            start_date: t.start_date ? t.start_date.split('T')[0].split(' ')[0] : '',
            due_date: t.due_date ? t.due_date.split('T')[0].split(' ')[0] : '',
            description: t.description || '',
        });
        setTaskErrors({});
        setIsTaskModalOpen(true);
    };

    const handleTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsTaskSubmitting(true);
        setTaskErrors({});

        const payload = {
            client_service_id: service.id,
            ...taskFormData,
        };

        if (editingTask) {
            router.post(`/client-portal/services/tasks/update/${editingTask.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsTaskModalOpen(false);
                    setIsTaskSubmitting(false);
                    setTaskErrors({});
                },
                onError: (errs) => {
                    setIsTaskSubmitting(false);
                    setTaskErrors(errs || {});
                },
            });
        } else {
            router.post('/client-portal/services/tasks/store', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsTaskModalOpen(false);
                    setIsTaskSubmitting(false);
                    setTaskErrors({});
                },
                onError: (errs) => {
                    setIsTaskSubmitting(false);
                    setTaskErrors(errs || {});
                },
            });
        }
    };

    const handleTaskStatusQuickChange = (task: ServiceTaskItem, newStatus: string) => {
        router.post(
            `/client-portal/services/tasks/update/${task.id}`,
            {
                client_service_id: service.id,
                task_title: task.task_title,
                priority: task.priority,
                status: newStatus,
                start_date: task.start_date,
                due_date: task.due_date,
                description: task.description,
            },
            { preserveScroll: true }
        );
    };

    const handleDeleteTask = () => {
        if (!deletingTask || isTaskSubmitting) return;
        setIsTaskSubmitting(true);
        router.delete(`/client-portal/services/tasks/destroy/${deletingTask.id}`, {
            preserveScroll: true,
            onFinish: () => setIsTaskSubmitting(false),
            onSuccess: () => {
                setDeletingTask(null);
            },
            onError: () => setIsTaskSubmitting(false),
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

    // Mark as Paid Confirmation State
    const [confirmingPaidPayment, setConfirmingPaidPayment] = useState<ServicePaymentItem | null>(null);
    const [isMarkingPaidPayment, setIsMarkingPaidPayment] = useState(false);

    // Split Payment Modal State
    const [splittingPayment, setSplittingPayment] = useState<ServicePaymentItem | null>(null);
    const [splitAmount, setSplitAmount] = useState<string>('');
    const [splitTitle, setSplitTitle] = useState<string>('');
    const [splitNotes, setSplitNotes] = useState<string>('');
    const [isSplitting, setIsSplitting] = useState(false);

    // Merge Payment Confirmation State
    const [mergingPayment, setMergingPayment] = useState<ServicePaymentItem | null>(null);
    const [isMerging, setIsMerging] = useState(false);

    const openSplitModal = (pay: ServicePaymentItem) => {
        setSplittingPayment(pay);
        const total = parseFloat(String(pay.amount_due || 0));
        const defaultSplit = total > 0 ? (total / 2).toFixed(2) : '';
        setSplitAmount(defaultSplit);
        setSplitTitle('');
        setSplitNotes('');
    };

    const handleSplitSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!splittingPayment || isSplitting) return;

        const val = parseFloat(splitAmount);
        const maxVal = parseFloat(String(splittingPayment.amount_due));
        if (isNaN(val) || val <= 0 || val >= maxVal) {
            return;
        }

        setIsSplitting(true);
        router.post(
            `/client-portal/services/payments/${splittingPayment.id}/split`,
            {
                split_amount: val,
                split_title: splitTitle || undefined,
                notes: splitNotes || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSplittingPayment(null);
                    setSplitAmount('');
                    setSplitTitle('');
                    setSplitNotes('');
                    setIsSplitting(false);
                },
                onError: () => setIsSplitting(false),
                onFinish: () => setIsSplitting(false),
            }
        );
    };

    const handleMergeSubmit = () => {
        if (!mergingPayment || isMerging) return;

        setIsMerging(true);
        router.post(
            `/client-portal/services/payments/${mergingPayment.id}/merge`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setMergingPayment(null);
                    setIsMerging(false);
                },
                onError: () => setIsMerging(false),
                onFinish: () => setIsMerging(false),
            }
        );
    };

    const handleMarkPaymentPaidSubmit = () => {
        if (!confirmingPaidPayment) return;
        setIsMarkingPaidPayment(true);
        router.post(
            `/client-portal/services/payments/${confirmingPaidPayment.id}/mark-as-paid`,
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

    const isOngoing = !service.contract_months || Number(service.contract_months) === 0;
    const totalContractMonths = service.contract_months ? Number(service.contract_months) : null;
    const totalContractValue = totalContractMonths ? Number(service.monthly_fee) * totalContractMonths : null;
    const paymentsList = service.payments || [];
    const totalPaid = paymentsList
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    const paidMonthsCount = paymentsList.filter((p) => p.status === 'paid').length;

    const paidPercentage = totalContractValue && totalContractValue > 0 ? Math.min(100, Math.round((totalPaid / totalContractValue) * 100)) : 0;

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
                {/* Navigation Header Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
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
                        {canViewBudget && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('payments')}
                                className={`flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'payments'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Receipt className="size-4" />
                                <span>2. Billing & Invoices ({paymentsList.length})</span>
                            </button>
                        )}

                        {/* TAB 3: Tasks */}
                        {hasPermission(user, 'view-client-portal-service-tasks') && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('tasks')}
                                className={`flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'tasks'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <ListTodo className="size-4" />
                                <span>3. Tasks ({service.tasks?.length || 0})</span>
                            </button>
                        )}

                        {hasPermission(user, 'view-client-portal-service-credentials') && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('credentials')}
                                className={`flex items-center gap-2 h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'credentials'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <KeyRound className="size-4" />
                                <span>4. Credentials ({service.credentials?.length || 0})</span>
                            </button>
                        )}

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
                                <span>5. Documents ({service.documents?.length || 0})</span>
                            </button>
                        )}
                    </div>

                    <Link
                        href="/client-portal/services"
                        className="h-10 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to Services</span>
                    </Link>
                </div>

                {/* TAB 1: DETAILS & EXECUTIVE OVERVIEW */}
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* Service Title & Master Overview */}
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
                                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border ${service.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60'
                                            : service.status === 'paused'
                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200'
                                            }`}
                                    >
                                        {service.status === 'active' ? (
                                            <>
                                                <CheckCircle2 className="size-3.5" />
                                                <span>Active Subscription</span>
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
                        {canViewBudget ? (
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
                                        {isOngoing ? 'Ongoing Retainer' : formatCurrency(totalContractValue || 0)}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                        Duration: <strong className="text-slate-700 dark:text-slate-300">
                                            {isOngoing ? 'Ongoing (Month-to-Month)' : `${totalContractMonths} Months`}
                                        </strong>
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
                                    {isOngoing ? (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
                                            {paidMonthsCount} Month{paidMonthsCount === 1 ? '' : 's'} Paid
                                        </p>
                                    ) : (
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${paidPercentage}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</span>
                                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                            <Package className="size-4" />
                                        </div>
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                                        {service.category?.name || 'General Service'}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                        Service Department
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Contract Duration</span>
                                        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                            <Calendar className="size-4" />
                                        </div>
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                                        {isOngoing ? 'Ongoing Retainer' : `${totalContractMonths} Months`}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                        {isOngoing ? 'Month-to-Month Contract' : 'Fixed Duration'}
                                    </p>
                                </div>

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

                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</span>
                                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="size-4" />
                                        </div>
                                    </div>
                                    <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 capitalize">
                                        {service.status}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                                        Subscription State
                                    </p>
                                </div>
                            </div>
                        )}

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
                                            {isOngoing ? 'Ongoing / Month-to-Month' : `${totalContractMonths} Months`}
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
                {activeTab === 'payments' && canViewBudget && (
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
                                            <th className="px-2 py-4">Invoice Ref</th>
                                            <th className="px-2 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                                        {paymentsList.length > 0 ? (
                                            paymentsList.map((pay) => (
                                                <tr key={pay.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-2 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="font-bold text-slate-900 dark:text-white font-mono">
                                                                {pay.billing_month}
                                                            </span>
                                                            {pay.parent_id ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 w-fit">
                                                                    <Scissors className="size-2.5 rotate-90" />
                                                                    <span>{pay.split_title || 'Split Installment'}</span>
                                                                </span>
                                                            ) : pay.split_title ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 w-fit">
                                                                    <span>{pay.split_title}</span>
                                                                </span>
                                                            ) : null}
                                                        </div>
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
                                                    <td className="px-2 py-4 whitespace-nowrap">
                                                        {pay.invoice ? (
                                                            <Link
                                                                href={`/client-portal/invoices/${pay.invoice.id}`}
                                                                className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5"
                                                            >
                                                                <span>{pay.invoice.invoice_number}</span>
                                                                <span
                                                                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black ${pay.invoice.status === 'paid'
                                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50'
                                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50'
                                                                        }`}
                                                                >
                                                                    {pay.invoice.status}
                                                                </span>
                                                            </Link>
                                                        ) : (
                                                            <span className="text-slate-400 italic text-[11px]">No Invoice</span>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* SPLIT BUTTON: ONLY FOR PARENT UNPAID & UN-INVOICED BILLS */}
                                                            {!pay.parent_id && !pay.invoice && pay.status !== 'paid' && parseFloat(String(pay.amount_due)) > 0 && hasPermission(user, 'edit-client-portal-service-payments') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openSplitModal(pay)}
                                                                    className="h-8 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border border-blue-200/50 hover:border-transparent"
                                                                    title="Split this bill into partial installments"
                                                                >
                                                                    <Scissors className="size-3.5" />
                                                                    <span>Split</span>
                                                                </button>
                                                            )}

                                                            {/* MERGE BUTTON: ONLY FOR CHILD UNPAID & UN-INVOICED BILLS */}
                                                            {pay.parent_id && !pay.invoice && pay.status !== 'paid' && hasPermission(user, 'edit-client-portal-service-payments') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setMergingPayment(pay)}
                                                                    className="h-8 px-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border border-purple-200/50"
                                                                    title="Merge this installment back into parent bill"
                                                                >
                                                                    <GitMerge className="size-3.5" />
                                                                    <span>Merge</span>
                                                                </button>
                                                            )}

                                                            {/* MARK AS PAID BUTTON (Only if invoice exists & payment is unpaid) */}
                                                            {pay.invoice && pay.status !== 'paid' && hasPermission(user, 'edit-client-portal-service-payments') && (
                                                                <button
                                                                    type="button"
                                                                    disabled={isMarkingPaidPayment}
                                                                    onClick={() => setConfirmingPaidPayment(pay)}
                                                                    className="h-8 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border border-emerald-200/50"
                                                                    title="Mark Service Payment as Paid"
                                                                >
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    <span>Mark as Paid</span>
                                                                </button>
                                                            )}

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

                {/* 3. TAB 3 CONTENT: TASKS */}
                {activeTab === 'tasks' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Service Deliverables & Tasks ({service.tasks?.length || 0})
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Track, assign and monitor task progress for {service.service_name}.
                                </p>
                            </div>

                            {hasPermission(user, 'create-client-portal-service-tasks') && (
                                <button
                                    type="button"
                                    onClick={openCreateTaskModal}
                                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                                >
                                    <Plus className="size-4" />
                                    <span>Add New Task</span>
                                </button>
                            )}
                        </div>

                        <div className="w-full overflow-x-auto scrollbar-thin bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                            <table className="w-full min-w-[750px] text-left text-xs text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3.5">Task Title</th>
                                        <th className="px-3 py-3.5">Assigned Employee</th>
                                        <th className="px-3 py-3.5">Priority</th>
                                        <th className="px-3 py-3.5">Status</th>
                                        <th className="px-3 py-3.5">Due Date</th>
                                        <th className="px-4 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {service.tasks && service.tasks.length > 0 ? (
                                        service.tasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                                                    <div>
                                                        <span>{task.task_title}</span>
                                                        {task.description && (
                                                            <p className="text-xs text-slate-400 font-normal line-clamp-1 mt-0.5">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5 whitespace-nowrap">
                                                    {task.assigned_employee ? (
                                                        <div className="flex items-center gap-2">
                                                            {task.assigned_employee.avatar ? (
                                                                <img
                                                                    src={task.assigned_employee.avatar}
                                                                    alt={task.assigned_employee.name}
                                                                    className="size-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                                />
                                                            ) : (
                                                                <div className="size-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                                                                    {task.assigned_employee.name.charAt(0)}
                                                                </div>
                                                            )}
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                                                {task.assigned_employee.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${task.priority === 'urgent' || task.priority === 'high'
                                                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                            : task.priority === 'medium'
                                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3.5 whitespace-nowrap">
                                                    {hasPermission(user, 'edit-client-portal-service-tasks') ? (
                                                        <select
                                                            value={task.status}
                                                            onChange={(e) => handleTaskStatusQuickChange(task, e.target.value)}
                                                            className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                        >
                                                            <option value="todo">To Do</option>
                                                            <option value="in_progress">In Progress</option>
                                                            <option value="in_review">In Review</option>
                                                            <option value="completed">Completed</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    ) : (
                                                        <span className="capitalize text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3.5 whitespace-nowrap font-medium text-slate-500">
                                                    {task.due_date ? formatDateOnly(task.due_date) : '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {hasPermission(user, 'edit-client-portal-service-tasks') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditTaskModal(task)}
                                                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                                                                title="Edit Task"
                                                            >
                                                                <Edit2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                        {hasPermission(user, 'delete-client-portal-service-tasks') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingTask(task)}
                                                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                                                title="Delete Task"
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
                                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                                No tasks created for this service yet. Click "Add New Task" to create one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. TAB 4 CONTENT: CREDENTIALS */}
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

            {/* SPLIT PAYMENT MODAL */}
            {splittingPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                    <Scissors className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        Split Monthly Bill
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">Create partial installments for separate invoicing</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSplittingPayment(null)}
                                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form noValidate onSubmit={handleSplitSubmit} className="space-y-4">
                            {/* Summary Card */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                                    <span>Billing Month:</span>
                                    <span className="font-bold text-slate-900 dark:text-white font-mono">{splittingPayment.billing_month}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                                    <span>Current Total Amount:</span>
                                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">{formatCurrency(splittingPayment.amount_due)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Split Amount for New Installment ({client.currency || 'USD'}) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={parseFloat(String(splittingPayment.amount_due)) - 0.01}
                                    value={splitAmount}
                                    onChange={(e) => setSplitAmount(e.target.value)}
                                    placeholder="Enter amount for the new installment..."
                                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-mono"
                                    required
                                />
                            </div>

                            {/* Live Calculation Preview */}
                            {parseFloat(splitAmount) > 0 && parseFloat(splitAmount) < parseFloat(String(splittingPayment.amount_due)) && (
                                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Parent Bill Remaining</span>
                                        <div className="font-mono font-bold text-blue-700 dark:text-blue-300">
                                            {formatCurrency(parseFloat(String(splittingPayment.amount_due)) - parseFloat(splitAmount))}
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">New Split Installment</span>
                                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(parseFloat(splitAmount))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Installment Label / Title (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={splitTitle}
                                    onChange={(e) => setSplitTitle(e.target.value)}
                                    placeholder="e.g. Installment 2, Advance 50%, Part Payment"
                                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    rows={2}
                                    value={splitNotes}
                                    onChange={(e) => setSplitNotes(e.target.value)}
                                    placeholder="Additional settlement notes..."
                                    className="w-full p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSplittingPayment(null)}
                                    className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSplitting || !parseFloat(splitAmount) || parseFloat(splitAmount) >= parseFloat(String(splittingPayment.amount_due))}
                                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isSplitting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Splitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Scissors className="size-4" />
                                            <span>Confirm Split</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MERGE PAYMENT CONFIRMATION MODAL */}
            {mergingPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-md my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-center">
                        <div className="size-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                            <GitMerge className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                Merge Installment Back to Parent?
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Are you sure you want to merge this split installment of <strong className="text-slate-900 dark:text-white font-mono">{formatCurrency(mergingPayment.amount_due)}</strong> ({mergingPayment.split_title || 'Split'}) back into its parent bill?
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setMergingPayment(null)}
                                className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isMerging}
                                onClick={handleMergeSubmit}
                                className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isMerging ? (
                                    <>
                                        <LoaderCircle className="size-4 animate-spin" />
                                        <span>Merging...</span>
                                    </>
                                ) : (
                                    <>
                                        <GitMerge className="size-4" />
                                        <span>Confirm Merge</span>
                                    </>
                                )}
                            </button>
                        </div>
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

            {/* MARK SERVICE PAYMENT AS PAID CONFIRMATION MODAL */}
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
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Mark Service Payment as Paid</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Confirm payment receipt for month <strong>{confirmingPaidPayment.billing_month}</strong> ({formatCurrency(confirmingPaidPayment.amount_due)}). This will also mark its linked invoice as Paid if all items are settled.
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
            {/* TASK MODAL (Create / Edit) */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-lg max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                    <ListTodo className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {editingTask ? 'Edit Service Task' : 'Add New Service Task'}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">Manage task deliverables & priority</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsTaskModalOpen(false)}
                                className="size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form noValidate onSubmit={handleTaskSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Task Title *</label>
                                <input
                                    type="text"
                                    value={taskFormData.task_title}
                                    onChange={(e) => {
                                        setTaskFormData({ ...taskFormData, task_title: e.target.value });
                                        if (taskErrors.task_title) setTaskErrors({ ...taskErrors, task_title: '' });
                                    }}
                                    placeholder="e.g. Monthly SEO Audit & Performance Report"
                                    className={`w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${taskErrors.task_title ? 'border-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                />
                                {taskErrors.task_title && (
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{taskErrors.task_title}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assigned Employee</label>
                                <SearchableSelect
                                    options={employeeOptions}
                                    value={taskFormData.assigned_employee_id}
                                    onChange={(val) => {
                                        setTaskFormData({ ...taskFormData, assigned_employee_id: val });
                                        if (taskErrors.assigned_employee_id) setTaskErrors({ ...taskErrors, assigned_employee_id: '' });
                                    }}
                                    placeholder="Unassigned (Select Employee...)"
                                    searchPlaceholder="Type employee name or code..."
                                />
                                {taskErrors.assigned_employee_id && (
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{taskErrors.assigned_employee_id}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority</label>
                                    <select
                                        value={taskFormData.priority}
                                        onChange={(e) => {
                                            setTaskFormData({ ...taskFormData, priority: e.target.value as any });
                                            if (taskErrors.priority) setTaskErrors({ ...taskErrors, priority: '' });
                                        }}
                                        className={`w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none ${taskErrors.priority ? 'border-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                    {taskErrors.priority && (
                                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{taskErrors.priority}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                                    <select
                                        value={taskFormData.status}
                                        onChange={(e) => {
                                            setTaskFormData({ ...taskFormData, status: e.target.value as any });
                                            if (taskErrors.status) setTaskErrors({ ...taskErrors, status: '' });
                                        }}
                                        className={`w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none ${taskErrors.status ? 'border-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="in_review">In Review</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    {taskErrors.status && (
                                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{taskErrors.status}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Due Date</label>
                                <input
                                    type="date"
                                    value={taskFormData.due_date}
                                    onChange={(e) => {
                                        setTaskFormData({ ...taskFormData, due_date: e.target.value });
                                        if (taskErrors.due_date) setTaskErrors({ ...taskErrors, due_date: '' });
                                    }}
                                    className={`w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${taskErrors.due_date ? 'border-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                />
                                {taskErrors.due_date && (
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{taskErrors.due_date}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description / Instructions</label>
                                <textarea
                                    rows={3}
                                    value={taskFormData.description}
                                    onChange={(e) => {
                                        setTaskFormData({ ...taskFormData, description: e.target.value });
                                        if (taskErrors.description) setTaskErrors({ ...taskErrors, description: '' });
                                    }}
                                    placeholder="Task details..."
                                    className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${taskErrors.description ? 'border-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                />
                                {taskErrors.description && (
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{taskErrors.description}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsTaskModalOpen(false)}
                                    disabled={isTaskSubmitting}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isTaskSubmitting}
                                    className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTaskSubmitting && <LoaderCircle className="size-4 animate-spin" />}
                                    <span>{editingTask ? 'Update Task' : 'Save Task'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE TASK CONFIRMATION MODAL */}
            {deletingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                        <button
                            type="button"
                            onClick={() => setDeletingTask(null)}
                            className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                            <Trash2 className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Service Task?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{deletingTask.task_title}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingTask(null)}
                                disabled={isTaskSubmitting}
                                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteTask}
                                disabled={isTaskSubmitting}
                                className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isTaskSubmitting && <LoaderCircle className="size-4 animate-spin" />}
                                <span>{isTaskSubmitting ? 'Deleting...' : 'Confirm Delete'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ClientPortalLayout>
    );
}
