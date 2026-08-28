import SearchableSelect from '@/components/searchable-select';
import DocumentsTab, { type ClientDocumentItem } from '@/components/documents-tab';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    BadgeCheck,
    BadgeDollarSign,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    Copy,
    DollarSign,
    Edit2,
    Eye,
    EyeOff,
    FileText,
    FolderKanban,
    Globe,
    Key,
    Layers,
    ListTodo,
    LoaderCircle,
    Plus,
    Printer,
    Receipt,
    ShieldCheck,
    Sparkles,
    Trash2,
    User,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface TaskEmployee {
    id: number;
    name: string;
    employee_code: string;
    avatar?: string;
}

interface ProjectTaskItem {
    id: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    due_date?: string;
    start_date?: string;
    description?: string;
    assigned_employee_id?: number | null;
    assigned_employee?: TaskEmployee;
}

interface ProjectCredentialItem {
    id: number;
    title: string;
    type: 'hosting' | 'cms' | 'database' | 'domain' | 'api' | 'other';
    username?: string | null;
    password?: string | null;
    url?: string | null;
    notes?: string | null;
}

interface ProjectPaymentItem {
    id: number;
    milestone_title: string;
    amount: number | string;
    payment_stage: 'advance' | 'partial' | 'full';
    status: 'pending' | 'paid';
    paid_at?: string;
    payment_method?: string;
    notes?: string;
    invoice?: {
        id: number;
        invoice_number: string;
        status: string;
    } | null;
}

interface WebsiteProjectDetail {
    id: number;
    project_name: string;
    total_budget: number | string;
    currency: string;
    exchange_rate?: number | string;
    total_budget_pkr?: number | string;
    start_date?: string;
    deadline?: string;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    notes?: string;
    created_at: string;
    category?: { id: number; name: string } | null;
    payments?: ProjectPaymentItem[];
    tasks?: ProjectTaskItem[];
    credentials?: ProjectCredentialItem[];
    documents?: ClientDocumentItem[];
}

interface CompanyInfo {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    logo?: string;
}

interface ClientPortalProjectsShowProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    project: WebsiteProjectDetail;
    company?: CompanyInfo;
    employees?: TaskEmployee[];
    errors?: Record<string, string>;
}

export default function ClientPortalProjectsShow({
    client,
    project,
    employees = [],
}: ClientPortalProjectsShowProps) {
    const { auth } = usePage().props as unknown as SharedData & { errors?: Record<string, string> };
    const user = auth?.user;
    const canViewBudget = hasPermission(user, 'view-client-portal-project-budget');

    const employeeOptions = [
        { value: '', label: 'Unassigned (Select Employee...)' },
        ...(employees || []).map((emp) => ({
            value: emp.id,
            label: emp.name,
            subLabel: emp.employee_code ? `(${emp.employee_code})` : undefined,
        })),
    ];

    // Active Tab Persistence via URL query param 'tab'
    const getInitialTab = (): 'details' | 'budget' | 'tasks' | 'credentials' | 'documents' => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'budget' && canViewBudget) return 'budget';
            if (tab === 'tasks' || tab === 'credentials' || tab === 'details' || tab === 'documents') {
                return tab;
            }
        }
        return 'details';
    };

    const [activeTab, setActiveTabState] = useState<'details' | 'budget' | 'tasks' | 'credentials' | 'documents'>(getInitialTab);

    const setActiveTab = (tab: 'details' | 'budget' | 'tasks' | 'credentials' | 'documents') => {
        setActiveTabState(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    // Password visibility state for credentials
    const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Task Modals State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTaskItem | null>(null);
    const [deletingTask, setDeletingTask] = useState<ProjectTaskItem | null>(null);
    const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
    const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});

    const [taskFormData, setTaskFormData] = useState({
        assigned_employee_id: '' as string | number,
        task_title: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
        description: '',
    });

    // Credential Modals State
    const [isCredModalOpen, setIsCredModalOpen] = useState(false);
    const [editingCred, setEditingCred] = useState<ProjectCredentialItem | null>(null);
    const [deletingCred, setDeletingCred] = useState<ProjectCredentialItem | null>(null);
    const [isCredSubmitting, setIsCredSubmitting] = useState(false);
    const [credErrors, setCredErrors] = useState<Record<string, string>>({});

    const [credFormData, setCredFormData] = useState({
        title: '',
        type: 'other',
        notes: '',
    });

    // Milestone Payment Modals State
    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<ProjectPaymentItem | null>(null);
    const [deletingMilestone, setDeletingMilestone] = useState<ProjectPaymentItem | null>(null);
    const [isMilestoneSubmitting, setIsMilestoneSubmitting] = useState(false);
    const [milestoneErrors, setMilestoneErrors] = useState<Record<string, string>>({});
    const [amountError, setAmountError] = useState<string | null>(null);
    const [generatingInvoiceId, setGeneratingInvoiceId] = useState<number | null>(null);
    const [confirmingInvoiceMilestone, setConfirmingInvoiceMilestone] = useState<ProjectPaymentItem | null>(null);

    const [confirmingPaidMilestone, setConfirmingPaidMilestone] = useState<ProjectPaymentItem | null>(null);
    const [markingPaidMilestoneId, setMarkingPaidMilestoneId] = useState<number | null>(null);

    const handleExecuteGenerateInvoice = () => {
        if (!confirmingInvoiceMilestone) return;
        const milestoneId = confirmingInvoiceMilestone.id;
        setGeneratingInvoiceId(milestoneId);
        router.post(
            `/client-portal/projects/milestones/${milestoneId}/generate-invoice`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setConfirmingInvoiceMilestone(null),
                onFinish: () => setGeneratingInvoiceId(null),
            }
        );
    };

    const handleExecuteMarkMilestonePaid = () => {
        if (!confirmingPaidMilestone) return;
        const milestoneId = confirmingPaidMilestone.id;
        setMarkingPaidMilestoneId(milestoneId);
        router.post(
            `/client-portal/projects/milestones/${milestoneId}/mark-as-paid`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setConfirmingPaidMilestone(null),
                onFinish: () => setMarkingPaidMilestoneId(null),
            }
        );
    };

    const [milestoneFormData, setMilestoneFormData] = useState({
        milestone_title: '',
        amount: '' as number | string,
        payment_stage: 'advance' as 'advance' | 'partial' | 'full',
        status: 'pending' as 'pending' | 'paid',
        paid_at: '',
        notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Projects', href: '/client-portal/projects' },
        { title: project.project_name, href: `/client-portal/projects/${project.id}` },
    ];

    const formatDateOnly = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
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

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return (num || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: project.currency || client.currency || 'USD',
            maximumFractionDigits: 0,
        });
    };

    // Calculate Financial & Milestone Totals & Budget Constraints
    const totalBudget = typeof project.total_budget === 'string' ? parseFloat(project.total_budget) : project.total_budget || 0;

    // Sum of all created milestones (both pending and paid)
    const totalAllocatedMilestones = project.payments?.reduce(
        (acc, p) => acc + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0),
        0
    ) || 0;

    const unallocatedBudget = Math.max(0, totalBudget - totalAllocatedMilestones);

    const paidPayments = project.payments?.filter((p) => p.status === 'paid') || [];
    const totalPaid = paidPayments.reduce((acc, p) => acc + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0);
    const pendingBalance = Math.max(0, totalBudget - totalPaid);

    const completedTasksCount = project.tasks?.filter((t) => t.status === 'completed').length || 0;
    const totalTasksCount = project.tasks?.length || 0;

    // Toggle password visibility
    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Copy text handler
    const handleCopy = (text: string, idStr: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idStr);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // MILESTONE PAYMENT HANDLERS
    const openCreateMilestoneModal = () => {
        setEditingMilestone(null);
        setMilestoneErrors({});
        setAmountError(null);
        setMilestoneFormData({
            milestone_title: '',
            amount: unallocatedBudget > 0 ? unallocatedBudget.toString() : '',
            payment_stage: 'advance',
            status: 'pending',
            paid_at: '',
            notes: '',
        });
        setIsMilestoneModalOpen(true);
    };

    const openEditMilestoneModal = (m: ProjectPaymentItem) => {
        if (m.invoice || m.status === 'paid') return; // Protection: Milestone with generated invoice or paid status cannot be edited
        setEditingMilestone(m);
        setMilestoneErrors({});
        setAmountError(null);
        setMilestoneFormData({
            milestone_title: m.milestone_title || '',
            amount: m.amount || '',
            payment_stage: (m.payment_stage as any) || 'advance',
            status: (m.status as any) || 'pending',
            paid_at: m.paid_at || '',
            notes: m.notes || '',
        });
        setIsMilestoneModalOpen(true);
    };

    const handleMilestoneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMilestoneErrors({});
        setAmountError(null);

        const enteredAmount = parseFloat(milestoneFormData.amount as string) || 0;
        const maxAllocatable = editingMilestone
            ? unallocatedBudget + (typeof editingMilestone.amount === 'string' ? parseFloat(editingMilestone.amount) : editingMilestone.amount || 0)
            : unallocatedBudget;

        if (enteredAmount > maxAllocatable + 0.01) {
            const err = `Milestone amount cannot exceed remaining unallocated budget (${formatCurrency(maxAllocatable)})`;
            setAmountError(err);
            setMilestoneErrors({ amount: err });
            return;
        }

        setIsMilestoneSubmitting(true);

        const payload = {
            website_project_id: project.id,
            ...milestoneFormData,
        };

        if (editingMilestone) {
            router.post(`/client-portal/projects/milestones/update/${editingMilestone.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsMilestoneModalOpen(false);
                    setIsMilestoneSubmitting(false);
                    setMilestoneErrors({});
                },
                onError: (errs) => {
                    setIsMilestoneSubmitting(false);
                    setMilestoneErrors(errs || {});
                    if (errs?.amount) setAmountError(errs.amount);
                },
            });
        } else {
            router.post('/client-portal/projects/milestones/store', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsMilestoneModalOpen(false);
                    setIsMilestoneSubmitting(false);
                    setMilestoneErrors({});
                },
                onError: (errs) => {
                    setIsMilestoneSubmitting(false);
                    setMilestoneErrors(errs || {});
                    if (errs?.amount) setAmountError(errs.amount);
                },
            });
        }
    };

    const handleDeleteMilestone = () => {
        if (!deletingMilestone || isMilestoneSubmitting || deletingMilestone.status === 'paid') return;
        setIsMilestoneSubmitting(true);
        router.delete(`/client-portal/projects/milestones/destroy/${deletingMilestone.id}`, {
            preserveScroll: true,
            onFinish: () => setIsMilestoneSubmitting(false),
            onSuccess: () => {
                setDeletingMilestone(null);
            },
            onError: () => setIsMilestoneSubmitting(false),
        });
    };

    // TASK HANDLERS
    const openCreateTaskModal = () => {
        setEditingTask(null);
        setTaskFormData({
            assigned_employee_id: '',
            task_title: '',
            priority: 'medium',
            status: 'todo',
            due_date: new Date().toISOString().split('T')[0],
            description: '',
        });
        setTaskErrors({});
        setIsTaskModalOpen(true);
    };

    const openEditTaskModal = (t: ProjectTaskItem) => {
        setEditingTask(t);
        setTaskFormData({
            assigned_employee_id: t.assigned_employee_id || '',
            task_title: t.task_title || '',
            priority: t.priority || 'medium',
            status: t.status || 'todo',
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
            website_project_id: project.id,
            ...taskFormData,
        };

        if (editingTask) {
            router.post(`/client-portal/projects/tasks/update/${editingTask.id}`, payload, {
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
            router.post('/client-portal/projects/tasks/store', payload, {
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

    const handleTaskStatusQuickChange = (task: ProjectTaskItem, newStatus: string) => {
        router.post(
            `/client-portal/projects/tasks/update/${task.id}`,
            {
                website_project_id: project.id,
                task_title: task.task_title,
                priority: task.priority,
                status: newStatus,
                due_date: task.due_date,
                description: task.description,
            },
            { preserveScroll: true }
        );
    };

    const handleDeleteTask = () => {
        if (!deletingTask || isTaskSubmitting) return;
        setIsTaskSubmitting(true);
        router.delete(`/client-portal/projects/tasks/destroy/${deletingTask.id}`, {
            preserveScroll: true,
            onFinish: () => setIsTaskSubmitting(false),
            onSuccess: () => {
                setDeletingTask(null);
            },
            onError: () => setIsTaskSubmitting(false),
        });
    };

    // CREDENTIAL HANDLERS
    const openCreateCredModal = () => {
        setEditingCred(null);
        setCredFormData({
            title: '',
            type: 'other',
            notes: '',
        });
        setCredErrors({});
        setIsCredModalOpen(true);
    };

    const openEditCredModal = (c: ProjectCredentialItem) => {
        setEditingCred(c);
        const initialNotes = c.notes || [
            c.username ? `Username: ${c.username}` : '',
            c.password ? `Password: ${c.password}` : '',
            c.url ? `URL: ${c.url}` : '',
        ].filter(Boolean).join('\n');

        setCredFormData({
            title: c.title || '',
            type: c.type || 'other',
            notes: initialNotes,
        });
        setCredErrors({});
        setIsCredModalOpen(true);
    };

    const handleCredSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCredSubmitting(true);
        setCredErrors({});

        const payload = {
            website_project_id: project.id,
            title: credFormData.title,
            type: credFormData.type || 'other',
            notes: credFormData.notes,
        };

        if (editingCred) {
            router.put(`/client-portal/projects/credentials/update/${editingCred.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCredModalOpen(false);
                    setIsCredSubmitting(false);
                    setCredErrors({});
                },
                onError: (errs) => {
                    setIsCredSubmitting(false);
                    setCredErrors(errs || {});
                },
            });
        } else {
            router.post('/client-portal/projects/credentials/store', payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCredModalOpen(false);
                    setIsCredSubmitting(false);
                    setCredErrors({});
                },
                onError: (errs) => {
                    setIsCredSubmitting(false);
                    setCredErrors(errs || {});
                },
            });
        }
    };

    const handleDeleteCred = () => {
        if (!deletingCred || isCredSubmitting) return;
        setIsCredSubmitting(true);
        router.delete(`/client-portal/projects/credentials/destroy/${deletingCred.id}`, {
            preserveScroll: true,
            onFinish: () => setIsCredSubmitting(false),
            onSuccess: () => {
                setDeletingCred(null);
            },
            onError: () => setIsCredSubmitting(false),
        });
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="projects">
            <Head title={`${project.project_name} | ${client.name}`} />

            <div className="p-2 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950">
                {/* 1. TOP HEADER BAR: TABS ON LEFT, BACK BUTTON ON RIGHT */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                    {/* Left: 4 Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {/* TAB 1: Details */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'details'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <FileText className="size-4" />
                            <span>1. Details</span>
                        </button>

                        {/* TAB 2: Budget & Invoices */}
                        {canViewBudget && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('budget')}
                                className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'budget'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <BadgeDollarSign className="size-4" />
                                <span>2. Budget & Invoices</span>
                            </button>
                        )}

                        {/* TAB 3: Tasks */}
                        {hasPermission(user, 'view-client-portal-project-tasks') && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('tasks')}
                                className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'tasks'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <ListTodo className="size-4" />
                                <span>3. Tasks ({totalTasksCount})</span>
                            </button>
                        )}

                        {/* TAB 4: Credentials */}
                        {hasPermission(user, 'view-client-portal-project-credentials') && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('credentials')}
                                className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'credentials'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Key className="size-4" />
                                <span>4. Credentials ({project.credentials?.length || 0})</span>
                            </button>
                        )}

                        {/* TAB 5: Documents */}
                        {hasPermission(user, 'view-client-portal-project-documents') && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('documents')}
                                className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'documents'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <FileText className="size-4" />
                                <span>5. Documents ({project.documents?.length || 0})</span>
                            </button>
                        )}
                    </div>

                    {/* Right: Action Buttons (Edit & Back to Projects on Right) */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 pr-1.5">
                        {hasPermission(user, 'edit-client-portal-projects') && (
                            <Link
                                href={`/client-portal/projects/${project.id}/edit`}
                                className="h-10 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all inline-flex items-center gap-2"
                            >
                                <Edit2 className="size-4" />
                                <span>Edit Project</span>
                            </Link>
                        )}
                        <Link
                            href="/client-portal/projects"
                            className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Back to Projects</span>
                        </Link>
                    </div>
                </div>

                {/* 2. TAB CONTENT */}

                {/* TAB 1: DETAILS */}
                {activeTab === 'details' && (
                    <div className="space-y-4">
                        {/* Project Header Banner Card inside Details tab */}
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 border border-white/20">
                                    <Globe className="size-7" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        {project.category && (
                                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                                                {project.category.name}
                                            </span>
                                        )}
                                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                            {project.project_name}
                                        </h1>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${project.status === 'in_progress'
                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60'
                                                : project.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                                }`}
                                        >
                                            {project.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium flex flex-wrap items-center gap-3">
                                        <span>Started: <strong>{formatDateOnly(project.start_date)}</strong></span>
                                        <span>•</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                            Deadline: <strong>{formatDateOnly(project.deadline)}</strong>
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Grid: Scope & Notes + Completion Status + Parameters */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Scope & Notes (Left 2 cols) */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                            <FileText className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                                Project Overview & Description
                                            </h3>
                                            <p className="text-xs text-slate-400">Detailed requirements and specs</p>
                                        </div>
                                    </div>

                                    {project.notes ? (
                                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                            {project.notes}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic py-4">No notes or description added for this project.</p>
                                    )}
                                </div>

                                {/* Progress Percentage Card */}
                                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <span className="flex items-center gap-2">
                                            <Layers className="size-4 text-blue-600" />
                                            Completion Status
                                        </span>
                                        <span className="text-blue-600 dark:text-blue-400 font-black text-sm">{project.progress_percentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                                        <div
                                            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${project.progress_percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Project Attributes (Right 1 col) */}
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            <FolderKanban className="size-5" />
                                        </div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                            Project Parameters
                                        </h3>
                                    </div>

                                    <div className="space-y-3 text-xs font-medium">
                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                            <span className="text-slate-400">Reference ID</span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-white">#PROJ-{project.id}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                            <span className="text-slate-400">Category</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{project.category?.name || 'General Project'}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                            <span className="text-slate-400">Currency</span>
                                            <span className="font-mono font-bold text-slate-900 dark:text-white uppercase">{project.currency}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                            <span className="text-slate-400">Start Date</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{formatDateOnly(project.start_date)}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                            <span className="text-slate-400">Target Deadline</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">{formatDateOnly(project.deadline)}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-slate-400">Client Account</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{client.name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: BUDGET & INVOICES */}
                {activeTab === 'budget' && canViewBudget && (
                    <div className="space-y-4">
                        {/* Financial Stat Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Contract Budget</p>
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                                        {formatCurrency(project.total_budget)}
                                    </h3>
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                                        Unallocated: {formatCurrency(unallocatedBudget)}
                                    </p>
                                </div>
                                <div className="size-11 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <DollarSign className="size-5" />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Collected Amount</p>
                                    <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        {formatCurrency(totalPaid)}
                                    </h3>
                                    <p className="text-[10px] text-emerald-600/80 font-bold mt-1">
                                        {paidPayments.length} Paid Settlements
                                    </p>
                                </div>
                                <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <BadgeDollarSign className="size-5" />
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Remaining Balance</p>
                                    <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                        {formatCurrency(pendingBalance)}
                                    </h3>
                                    <p className="text-[10px] text-amber-600/80 font-bold mt-1">
                                        To be Collected
                                    </p>
                                </div>
                                <div className="size-11 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Receipt className="size-5" />
                                </div>
                            </div>
                        </div>

                        {/* Milestone Payments Log & Control */}
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                        <BadgeDollarSign className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            Milestone Payments & Invoices ({project.payments?.length || 0})
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Billing settlements & printable invoice receipts</p>
                                    </div>
                                </div>

                                {hasPermission(user, 'create-client-portal-project-milestones') && (
                                    <button
                                        type="button"
                                        onClick={openCreateMilestoneModal}
                                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                                    >
                                        <Plus className="size-4" />
                                        <span>Add New Milestone</span>
                                    </button>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <table className="w-full min-w-[750px] text-left text-xs text-slate-600 dark:text-slate-300">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-400">
                                        <tr>
                                            <th className="px-3 py-3">Milestone Title</th>
                                            <th className="px-3 py-3">Stage</th>
                                            <th className="px-3 py-3">Amount</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3">Paid Date</th>
                                            <th className="px-3 py-3">Invoice Ref</th>
                                            <th className="px-3 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {project.payments && project.payments.length > 0 ? (
                                            project.payments.map((pay) => (
                                                <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-white">
                                                        {pay.milestone_title}
                                                        {pay.notes && (
                                                            <span className="block text-[10px] text-slate-400 font-normal">
                                                                {pay.notes}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3.5 capitalize font-medium">
                                                        {pay.payment_stage}
                                                    </td>
                                                    <td className="px-3 py-3.5 font-extrabold text-slate-900 dark:text-white">
                                                        {formatCurrency(pay.amount)}
                                                    </td>
                                                    <td className="px-3 py-3.5">
                                                        <span
                                                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${pay.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                                                }`}
                                                        >
                                                            {pay.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3.5 font-medium text-slate-500">
                                                        {pay.status === 'paid' && pay.paid_at ? formatDateOnly(pay.paid_at) : '-'}
                                                    </td>
                                                    <td className="px-3 py-3.5 whitespace-nowrap">
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
                                                    <td className="px-3 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* MARK AS PAID BUTTON (Only if invoice exists & milestone is unpaid) */}
                                                            {pay.invoice && pay.status !== 'paid' && hasPermission(user, 'edit-client-portal-project-milestones') && (
                                                                <button
                                                                    type="button"
                                                                    disabled={markingPaidMilestoneId === pay.id}
                                                                    onClick={() => setConfirmingPaidMilestone(pay)}
                                                                    className="h-8 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border border-emerald-200/50"
                                                                    title="Mark Milestone as Paid"
                                                                >
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    <span>Mark as Paid</span>
                                                                </button>
                                                            )}

                                                            {/* GENERATE OR PRINT INVOICE BUTTON */}
                                                            {pay.invoice ? (
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
                                                            ) : (
                                                                hasPermission(user, 'create-client-portal-invoices') && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={generatingInvoiceId === pay.id}
                                                                        onClick={() => setConfirmingInvoiceMilestone(pay)}
                                                                        className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                                                                        title="Generate Invoice for this milestone"
                                                                    >
                                                                        {generatingInvoiceId === pay.id ? (
                                                                            <LoaderCircle className="size-3.5 animate-spin" />
                                                                        ) : (
                                                                            <FileText className="size-3.5" />
                                                                        )}
                                                                        <span>Generate Invoice</span>
                                                                    </button>
                                                                )
                                                            )}

                                                            {/* PROTECTION CHECK FOR GENERATED INVOICE OR PAID MILESTONES */}
                                                            {pay.invoice || pay.status === 'paid' ? (
                                                                <span
                                                                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold inline-flex items-center gap-1 cursor-not-allowed"
                                                                    title="Milestone with generated invoice or paid status cannot be edited or deleted"
                                                                >
                                                                    <ShieldCheck className="size-3 text-emerald-500" />
                                                                    <span>Locked</span>
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    {/* EDIT MILESTONE BUTTON */}
                                                                    {hasPermission(user, 'edit-client-portal-project-milestones') && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openEditMilestoneModal(pay)}
                                                                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                                                                            title="Edit Milestone"
                                                                        >
                                                                            <Edit2 className="size-3.5" />
                                                                        </button>
                                                                    )}

                                                                    {/* DELETE MILESTONE BUTTON */}
                                                                    {hasPermission(user, 'delete-client-portal-project-milestones') && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeletingMilestone(pay)}
                                                                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                                                            title="Delete Milestone"
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                                                    No milestone payment logs created yet. Click "Add New Milestone" to add one.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: TASKS */}
                {activeTab === 'tasks' && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <ListTodo className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                            Project Tasks ({totalTasksCount})
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">
                                            Sprint deliverables, assignees, and progress status.
                                        </p>
                                    </div>
                                </div>

                                {hasPermission(user, 'create-client-portal-project-tasks') && (
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

                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <table className="w-full min-w-[750px] text-left text-xs text-slate-600 dark:text-slate-300">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-400">
                                        <tr>
                                            <th className="px-3 py-3">Task Title</th>
                                            <th className="px-3 py-3">Assigned Employee</th>
                                            <th className="px-3 py-3">Priority</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3">Due Date</th>
                                            <th className="px-3 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {project.tasks && project.tasks.length > 0 ? (
                                            project.tasks.map((task) => (
                                                <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-3 py-3.5 font-bold text-slate-900 dark:text-white">
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
                                                                <User className="size-3.5 text-slate-400" />
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
                                                        {hasPermission(user, 'edit-client-portal-project-tasks') ? (
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
                                                    <td className="px-3 py-3.5 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {hasPermission(user, 'edit-client-portal-project-tasks') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditTaskModal(task)}
                                                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                                                                    title="Edit Task"
                                                                >
                                                                    <Edit2 className="size-3.5" />
                                                                </button>
                                                            )}
                                                            {hasPermission(user, 'delete-client-portal-project-tasks') && (
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
                                                    No tasks created for this project yet. Click "Add New Task" to create one.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: CREDENTIALS */}
                {activeTab === 'credentials' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Project Credentials ({project.credentials?.length || 0})
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Hosting, CMS, Database, Domain, and API access notes for {project.project_name}.
                                </p>
                            </div>

                            {hasPermission(user, 'create-client-portal-project-credentials') && (
                                <button
                                    type="button"
                                    onClick={openCreateCredModal}
                                    className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                                >
                                    <Plus className="size-4" />
                                    <span>Add Project Credential</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {project.credentials && project.credentials.length > 0 ? (
                                project.credentials.map((cred) => {
                                    const fullContent = cred.notes || [
                                        cred.username ? `Username: ${cred.username}` : '',
                                        cred.password ? `Password: ${cred.password}` : '',
                                        cred.url ? `URL: ${cred.url}` : '',
                                    ].filter(Boolean).join('\n');

                                    return (
                                        <div
                                            key={cred.id}
                                            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
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
                                                        {hasPermission(user, 'edit-client-portal-project-credentials') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditCredModal(cred)}
                                                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                                                                title="Edit Credential"
                                                            >
                                                                <Edit2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                        {hasPermission(user, 'delete-client-portal-project-credentials') && (
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
                                    No credentials linked to this project yet. Click "Add Project Credential" to store logins.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 5: DOCUMENTS */}
                {activeTab === 'documents' && (
                    <DocumentsTab
                        documents={project.documents || []}
                        uploadUrl={`/client-portal/projects/${project.id}/documents/store`}
                        deleteUrlPrefix={`/client-portal/projects/${project.id}/documents/destroy`}
                        canUpload={hasPermission(user, 'create-client-portal-project-documents')}
                        canDelete={hasPermission(user, 'delete-client-portal-project-documents')}
                    />
                )}

                {/* MILESTONE PAYMENT MODAL (Create / Edit - STANDARD CRM DESIGN) */}
                {isMilestoneModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-lg max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            {/* Standard Header with Close Button */}
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <BadgeDollarSign className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            {editingMilestone ? 'Edit Milestone Payment' : 'Add New Milestone Payment'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Configure milestone stage and budget settlement</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMilestoneModalOpen(false)}
                                    className="size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleMilestoneSubmit} className="space-y-4">
                                {/* Remaining Unallocated Budget Banner */}
                                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-xs flex items-center justify-between">
                                    <span className="font-bold text-blue-700 dark:text-blue-300">Remaining Allocatable Budget:</span>
                                    <span className="font-extrabold text-blue-900 dark:text-blue-100 text-sm font-mono">
                                        {formatCurrency(
                                            editingMilestone
                                                ? unallocatedBudget + (typeof editingMilestone.amount === 'string' ? parseFloat(editingMilestone.amount) : editingMilestone.amount || 0)
                                                : unallocatedBudget
                                        )}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Milestone Title *</label>
                                    <input
                                        type="text"
                                        value={milestoneFormData.milestone_title}
                                        onChange={(e) => {
                                            setMilestoneFormData({ ...milestoneFormData, milestone_title: e.target.value });
                                            if (milestoneErrors.milestone_title) {
                                                setMilestoneErrors((prev) => ({ ...prev, milestone_title: '' }));
                                            }
                                        }}
                                        placeholder="e.g. 50% Advance Payment / Final Settlement"
                                        className={`w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${milestoneErrors.milestone_title ? 'border-rose-500 text-rose-600 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                    />
                                    {milestoneErrors.milestone_title && (
                                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{milestoneErrors.milestone_title}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount ({project.currency}) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={milestoneFormData.amount}
                                            onChange={(e) => {
                                                setMilestoneFormData({ ...milestoneFormData, amount: e.target.value });
                                                setAmountError(null);
                                                if (milestoneErrors.amount) {
                                                    setMilestoneErrors((prev) => ({ ...prev, amount: '' }));
                                                }
                                            }}
                                            placeholder="0.00"
                                            className={`w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${amountError || milestoneErrors.amount ? 'border-rose-500 text-rose-600 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                                                }`}
                                        />
                                        {(amountError || milestoneErrors.amount) && (
                                            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{amountError || milestoneErrors.amount}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Stage *</label>
                                        <select
                                            value={milestoneFormData.payment_stage}
                                            onChange={(e) => {
                                                setMilestoneFormData({ ...milestoneFormData, payment_stage: e.target.value as any });
                                                if (milestoneErrors.payment_stage) {
                                                    setMilestoneErrors((prev) => ({ ...prev, payment_stage: '' }));
                                                }
                                            }}
                                            className={`w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-semibold ${milestoneErrors.payment_stage ? 'border-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-800'
                                                }`}
                                        >
                                            <option value="advance">Advance Payment</option>
                                            <option value="partial">Partial Payment</option>
                                            <option value="full">Full Settlement</option>
                                        </select>
                                        {milestoneErrors.payment_stage && (
                                            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{milestoneErrors.payment_stage}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Reference</label>
                                    <textarea
                                        rows={2}
                                        value={milestoneFormData.notes}
                                        onChange={(e) => {
                                            setMilestoneFormData({ ...milestoneFormData, notes: e.target.value });
                                            if (milestoneErrors.notes) {
                                                setMilestoneErrors((prev) => ({ ...prev, notes: '' }));
                                            }
                                        }}
                                        placeholder="Receipt reference or notes..."
                                        className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none ${milestoneErrors.notes ? 'border-rose-500 text-rose-600' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                    />
                                    {milestoneErrors.notes && (
                                        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{milestoneErrors.notes}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsMilestoneModalOpen(false)}
                                        disabled={isMilestoneSubmitting}
                                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isMilestoneSubmitting}
                                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isMilestoneSubmitting && <LoaderCircle className="size-4 animate-spin" />}
                                        <span>{editingMilestone ? 'Update Milestone' : 'Save Milestone'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE MILESTONE MODAL */}
                {deletingMilestone && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingMilestone(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Milestone?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete milestone <strong>"{deletingMilestone.milestone_title}"</strong>?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingMilestone(null)}
                                    disabled={isMilestoneSubmitting}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteMilestone}
                                    disabled={isMilestoneSubmitting}
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition-all"
                                >
                                    {isMilestoneSubmitting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Milestone</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MARK MILESTONE AS PAID CONFIRMATION MODAL */}
                {confirmingPaidMilestone && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950">
                                    <CheckCircle2 className="size-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Mark Milestone as Paid</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Confirm payment receipt</p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                Are you sure you want to mark milestone <strong className="text-slate-900 dark:text-white">{confirmingPaidMilestone.milestone_title}</strong> ({formatCurrency(confirmingPaidMilestone.amount)}) as Paid? This will also mark its linked invoice as Paid if all milestone items are completed.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirmingPaidMilestone(null)}
                                    className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={markingPaidMilestoneId !== null}
                                    onClick={handleExecuteMarkMilestonePaid}
                                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {markingPaidMilestoneId !== null && <LoaderCircle className="size-3.5 animate-spin" />}
                                    <span>Confirm & Mark as Paid</span>
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
                                            {editingTask ? 'Edit Project Task' : 'Add New Project Task'}
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
                                        placeholder="e.g. Design Homepage Wireframe"
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

                {/* DELETE TASK MODAL */}
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

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Task?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete task <strong>"{deletingTask.task_title}"</strong>?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingTask(null)}
                                    disabled={isTaskSubmitting}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteTask}
                                    disabled={isTaskSubmitting}
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition-all"
                                >
                                    {isTaskSubmitting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Task</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CREDENTIAL MODAL (Create / Edit) */}
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
                                            {editingCred ? 'Edit Project Credential' : 'Add New Project Credential'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">Copy & paste login details or access notes</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCredModalOpen(false)}
                                    className="size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <form noValidate onSubmit={handleCredSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Credential Title *</label>
                                    <input
                                        type="text"
                                        value={credFormData.title}
                                        onChange={(e) => {
                                            setCredFormData({ ...credFormData, title: e.target.value });
                                            if (credErrors.title) setCredErrors({ ...credErrors, title: '' });
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
                                        value={credFormData.notes}
                                        onChange={(e) => {
                                            setCredFormData({ ...credFormData, notes: e.target.value });
                                            if (credErrors.notes) setCredErrors({ ...credErrors, notes: '' });
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
                                        onClick={() => setIsCredModalOpen(false)}
                                        disabled={isCredSubmitting}
                                        className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCredSubmitting}
                                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 cursor-pointer hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCredSubmitting && <LoaderCircle className="size-4 animate-spin" />}
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

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Credential?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete <strong>"{deletingCred.title}"</strong>?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingCred(null)}
                                    disabled={isCredSubmitting}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteCred}
                                    disabled={isCredSubmitting}
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition-all"
                                >
                                    {isCredSubmitting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Credential</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {/* GENERATE INVOICE CONFIRMATION MODAL */}
                {confirmingInvoiceMilestone && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setConfirmingInvoiceMilestone(null)}
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
                                    Are you sure you want to generate an official invoice for milestone <strong>"{confirmingInvoiceMilestone.milestone_title}"</strong> ({formatCurrency(confirmingInvoiceMilestone.amount)})?
                                </p>
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-2">
                                    Note: Once generated, this milestone record will be locked from editing or deletion.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setConfirmingInvoiceMilestone(null)}
                                    disabled={generatingInvoiceId === confirmingInvoiceMilestone.id}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExecuteGenerateInvoice}
                                    disabled={generatingInvoiceId === confirmingInvoiceMilestone.id}
                                    className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/20"
                                >
                                    {generatingInvoiceId === confirmingInvoiceMilestone.id && <LoaderCircle className="size-4 animate-spin" />}
                                    <span>Yes, Generate Invoice</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ClientPortalLayout>
    );
}
