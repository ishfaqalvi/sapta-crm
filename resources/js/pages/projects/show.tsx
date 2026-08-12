import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    BadgeCheck,
    BadgeDollarSign,
    Building,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    Copy,
    DollarSign,
    Eye,
    EyeOff,
    FileText,
    FolderKanban,
    Globe,
    Key,
    Layers,
    ListTodo,
    PauseCircle,
    Printer,
    Receipt,
    ShieldCheck,
    Sparkles,
    User,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface TaskEmployee {
    id: number;
    name: string;
    employee_code?: string;
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
    client?: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        email?: string;
        phone?: string;
    } | null;
    payments?: ProjectPaymentItem[];
    tasks?: ProjectTaskItem[];
    credentials?: ProjectCredentialItem[];
}

interface CompanySettings {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    logo?: string;
}

interface WebsiteProjectShowProps {
    project: WebsiteProjectDetail;
    companySettings?: CompanySettings;
}

export default function WebsiteProjectShow({ project, companySettings }: WebsiteProjectShowProps) {
    const companyInfo = companySettings || {
        name: 'Sapta Technologies',
        email: 'contact@saptatechnologies.com',
        phone: '+92 300 1234567',
        address: 'Office #402, Software Technology Park, Lahore, Pakistan',
        tax_id: 'NTN-892415-0',
        logo: '/app-logo-icon.png',
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Website Projects', href: '/website-projects' },
        { title: project.project_name, href: `/website-projects/${project.id}` },
    ];

    // Active Tab Persistence via URL query param 'tab'
    const getInitialTab = (): 'details' | 'budget' | 'tasks' | 'credentials' => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'budget' || tab === 'tasks' || tab === 'credentials' || tab === 'details') {
                return tab;
            }
        }
        return 'details';
    };

    const [activeTab, setActiveTabState] = useState<'details' | 'budget' | 'tasks' | 'credentials'>(getInitialTab);

    const setActiveTab = (tab: 'details' | 'budget' | 'tasks' | 'credentials') => {
        setActiveTabState(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    // Password visibility & clipboard state
    const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const togglePasswordVisibility = (credId: number) => {
        setVisiblePasswords((prev) => ({ ...prev, [credId]: !prev[credId] }));
    };

    const copyToClipboard = (text: string, identifier: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(identifier);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Financial Calculations
    const numericBudget = typeof project.total_budget === 'string' ? parseFloat(project.total_budget) : project.total_budget || 0;

    const totalPaid = (project.payments || [])
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount || 0), 0);

    const remainingBalance = Math.max(0, numericBudget - totalPaid);
    const collectionPercentage = numericBudget > 0 ? Math.min(100, Math.round((totalPaid / numericBudget) * 100)) : 0;

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return (num || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: project.currency || project.client?.currency || 'USD',
            maximumFractionDigits: 0,
        });
    };

    const formatDateOnly = (dateStr?: string | null) => {
        if (!dateStr) return 'Flexible';
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

    // EXACT 1-TO-1 MATCH PRINT INVOICE GENERATOR
    const handlePrintInvoice = (pay: ProjectPaymentItem) => {
        const printWindow = window.open('', '_blank', 'width=850,height=950');
        if (!printWindow) return;

        const invoiceHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Invoice #${pay.id} - ${pay.milestone_title}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;800&display=swap');
                    
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body {
                        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: #ffffff;
                        color: #0f172a;
                        padding: 40px;
                        font-size: 13px;
                        line-height: 1.5;
                    }

                    .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding-bottom: 24px;
                        border-bottom: 2px solid #f1f5f9;
                        margin-bottom: 32px;
                    }

                    .brand-name {
                        font-size: 22px;
                        font-weight: 900;
                        color: #0052D4;
                        text-transform: uppercase;
                        letter-spacing: -0.5px;
                    }

                    .brand-sub {
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 500;
                        margin-top: 2px;
                    }

                    .invoice-title {
                        font-size: 24px;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        color: #0f172a;
                        text-align: right;
                    }

                    .invoice-num {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 14px;
                        font-weight: 800;
                        color: #0052D4;
                        text-align: right;
                        margin-top: 2px;
                    }

                    .meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 32px;
                        margin-bottom: 36px;
                    }

                    .meta-label {
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        color: #94a3b8;
                        margin-bottom: 6px;
                    }

                    .meta-title {
                        font-size: 15px;
                        font-weight: 800;
                        color: #0f172a;
                        margin-bottom: 4px;
                    }

                    .meta-text {
                        color: #475569;
                        font-size: 12px;
                        font-weight: 500;
                        margin-bottom: 2px;
                    }

                    .table-container {
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        overflow: hidden;
                        margin-bottom: 32px;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                    }

                    th {
                        background: #f8fafc;
                        padding: 14px 18px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        color: #64748b;
                        border-bottom: 1px solid #e2e8f0;
                    }

                    td {
                        padding: 16px 18px;
                        font-size: 12px;
                        font-weight: 600;
                        color: #1e293b;
                        border-bottom: 1px solid #f1f5f9;
                    }

                    tr:last-child td {
                        border-bottom: none;
                    }

                    .mono-val {
                        font-family: 'JetBrains Mono', monospace;
                        font-weight: 800;
                    }

                    .status-pill {
                        display: inline-block;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 10px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .status-paid {
                        background: #dcfce7;
                        color: #15803d;
                        border: 1px solid #bbf7d0;
                    }

                    .status-pending {
                        background: #fef3c7;
                        color: #b45309;
                        border: 1px solid #fde68a;
                    }

                    .totals-section {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 40px;
                    }

                    .totals-box {
                        width: 320px;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 20px;
                    }

                    .totals-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 600;
                    }

                    .totals-row.final {
                        margin-top: 12px;
                        padding-top: 12px;
                        border-top: 2px solid #e2e8f0;
                        font-size: 14px;
                        font-weight: 800;
                        color: #0f172a;
                    }

                    .final-amount {
                        font-family: 'JetBrains Mono', monospace;
                        font-size: 20px;
                        font-weight: 900;
                        color: #0052D4;
                    }

                    .footer {
                        padding-top: 24px;
                        border-top: 1px solid #f1f5f9;
                        font-size: 11px;
                        color: #94a3b8;
                        text-align: center;
                        font-weight: 500;
                    }

                    @media print {
                        body { padding: 0; background: white; }
                        .invoice-container { max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="header">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <img src="${companyInfo.logo || '/app-logo-icon.png'}" alt="Company Logo" style="height: 48px; width: auto; object-fit: contain;" />
                            <div>
                                <div class="brand-name">${companyInfo.name}</div>
                                <div class="brand-sub">${companyInfo.email} ${companyInfo.phone ? ' • ' + companyInfo.phone : ''}</div>
                                ${companyInfo.address ? `<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${companyInfo.address}${companyInfo.tax_id ? ' • NTN: ' + companyInfo.tax_id : ''}</div>` : ''}
                            </div>
                        </div>
                        <div>
                            <div class="invoice-title">INVOICE</div>
                            <div class="invoice-num">#INV-MS-${pay.id}</div>
                        </div>
                    </div>

                    <div class="meta-grid">
                        <div>
                            <div class="meta-label">Billed To:</div>
                            <div class="meta-title">${project.client?.company_name || project.client?.name || 'Client'}</div>
                            <div class="meta-text"><strong>Attn:</strong> ${project.client?.name || ''}</div>
                            <div class="meta-text"><strong>Client Code:</strong> ${project.client?.client_code || 'N/A'}</div>
                        </div>

                        <div style="text-align: right;">
                            <div class="meta-label">Invoice & Project Details:</div>
                            <div class="meta-text"><strong>Project:</strong> ${project.project_name}</div>
                            <div class="meta-text"><strong>Ref:</strong> #PROJ-${project.id}</div>
                            <div class="meta-text"><strong>Date:</strong> ${pay.paid_at ? formatDateOnly(pay.paid_at) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div class="meta-text"><strong>Billing Currency:</strong> ${project.currency || project.client?.currency || 'USD'}</div>
                        </div>
                    </div>

                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Description / Milestone Title</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div style="font-weight: 800; color: #0f172a;">${pay.milestone_title}</div>
                                        ${pay.notes ? `<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${pay.notes}</div>` : ''}
                                    </td>
                                    <td style="text-transform: capitalize;">${pay.payment_stage}</td>
                                    <td>
                                        <span class="status-pill ${pay.status === 'paid' ? 'status-paid' : 'status-pending'}">
                                            ${pay.status}
                                        </span>
                                    </td>
                                    <td style="text-align: right;" class="mono-val">${formatCurrency(pay.amount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="totals-section">
                        <div class="totals-box">
                            <div class="totals-row">
                                <span>Milestone Amount:</span>
                                <span class="mono-val" style="color: #0f172a;">${formatCurrency(pay.amount)}</span>
                            </div>
                            <div class="totals-row">
                                <span>Status:</span>
                                <span style="font-weight: 800; text-transform: uppercase; ${pay.status === 'paid' ? 'color: #16a34a;' : 'color: #d97706;'}">${pay.status}</span>
                            </div>
                            <div class="totals-row final">
                                <span>Total Settled:</span>
                                <span class="final-amount">${formatCurrency(pay.amount)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        Thank you for your business! This is an official system-generated milestone invoice receipt.
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.project_name} - Project Workspace`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0">
                {/* Top Action Bar & Navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/website-projects"
                        className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to Website Projects Directory</span>
                    </Link>
                </div>

                {/* Primary Project Header Banner (Frosted Glass) */}
                <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                {project.category && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                                        {project.category.name}
                                    </span>
                                )}

                                <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                                        project.status === 'in_progress'
                                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60'
                                            : project.status === 'completed'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60'
                                            : project.status === 'on_hold'
                                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60'
                                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60'
                                    }`}
                                >
                                    {project.status === 'in_progress' ? (
                                        <>
                                            <Clock className="size-3" />
                                            <span>In Progress</span>
                                        </>
                                    ) : project.status === 'completed' ? (
                                        <>
                                            <CheckCircle2 className="size-3" />
                                            <span>Completed</span>
                                        </>
                                    ) : project.status === 'on_hold' ? (
                                        <>
                                            <PauseCircle className="size-3" />
                                            <span>On Hold</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="size-3" />
                                            <span>Cancelled</span>
                                        </>
                                    )}
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                {project.project_name}
                            </h1>

                            {project.client && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                                    <Building className="size-4 text-blue-600" />
                                    <span>Client: <strong>{project.client.name}</strong> ({project.client.company_name || 'Individual'})</span>
                                    <span>•</span>
                                    <span className="font-mono text-blue-600 dark:text-blue-400">{project.client.client_code}</span>
                                </p>
                            )}
                        </div>

                        {/* Progress Badge */}
                        <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 shrink-0 min-w-[200px] space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-500 dark:text-slate-400">Development Progress</span>
                                <span className="text-blue-600 font-extrabold font-mono">{project.progress_percentage}%</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                                    style={{ width: `${project.progress_percentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Header Financial Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-100 block">Total Budget</span>
                            <h3 className="text-xl font-black font-mono mt-1">{formatCurrency(numericBudget)}</h3>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100 block">Total Collected</span>
                            <h3 className="text-xl font-black font-mono mt-1">{formatCurrency(totalPaid)}</h3>
                            <p className="text-[10px] text-emerald-100 mt-1 font-bold">{collectionPercentage}% Payment Received</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 text-white shadow-lg shadow-rose-500/20">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-100 block">Remaining Balance</span>
                            <h3 className="text-xl font-black font-mono mt-1">{formatCurrency(remainingBalance)}</h3>
                        </div>
                    </div>
                </div>

                {/* 4 Tab Navigation Header */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 shrink-0 ${
                            activeTab === 'details'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <FolderKanban className="size-4" />
                        <span>Project Overview & Specs</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('budget')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 shrink-0 ${
                            activeTab === 'budget'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Receipt className="size-4" />
                        <span>Milestone Payments ({project.payments?.length || 0})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 shrink-0 ${
                            activeTab === 'tasks'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <ListTodo className="size-4" />
                        <span>Deliverables & Tasks ({project.tasks?.length || 0})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('credentials')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all inline-flex items-center gap-2 shrink-0 ${
                            activeTab === 'credentials'
                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Key className="size-4" />
                        <span>Access Logins ({project.credentials?.length || 0})</span>
                    </button>
                </div>

                {/* TAB 1: OVERVIEW & SPECS */}
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Project Specifications & Notes */}
                            <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText className="size-4 text-blue-600" />
                                    <span>Project Notes & Requirements</span>
                                </h3>
                                {project.notes ? (
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                        {project.notes}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No specific project notes provided.</p>
                                )}
                            </div>

                            {/* Timeline Breakdown */}
                            <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="size-4 text-emerald-600" />
                                    <span>Project Timeline & Key Dates</span>
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Start Date</span>
                                        <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                            {formatDateOnly(project.start_date)}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Target Deadline</span>
                                        <p className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                                            {formatDateOnly(project.deadline)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar: Client Details Card */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <User className="size-4 text-purple-600" />
                                    <span>Client Information</span>
                                </h3>

                                {project.client ? (
                                    <div className="space-y-3 text-xs">
                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Client Name</span>
                                            <p className="font-extrabold text-slate-900 dark:text-white">{project.client.name}</p>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Company</span>
                                            <p className="font-extrabold text-slate-900 dark:text-white">{project.client.company_name || 'Individual'}</p>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 space-y-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Client Code</span>
                                            <p className="font-extrabold font-mono text-blue-600">{project.client.client_code}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No client assigned to this project.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: MILESTONE PAYMENTS (Read-Only) */}
                {activeTab === 'budget' && (
                    <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Project Milestone Payments & Billing
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">Read-only list of milestone payments and invoice status.</p>
                            </div>
                        </div>

                        {project.payments && project.payments.length > 0 ? (
                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <table className="w-full text-left text-xs min-w-[750px]">
                                    <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px] font-extrabold text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 whitespace-nowrap">Milestone Title</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Stage</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Amount</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Paid Date</th>
                                            <th className="px-4 py-3 text-right whitespace-nowrap">Invoice</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                        {project.payments.map((pay) => (
                                            <tr key={pay.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className="font-extrabold text-slate-900 dark:text-white block">{pay.milestone_title}</span>
                                                    {pay.notes && <span className="text-[11px] text-slate-400 block">{pay.notes}</span>}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                                                        {pay.payment_stage}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap font-black font-mono text-slate-900 dark:text-white">
                                                    {formatCurrency(pay.amount)}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            pay.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                                        }`}
                                                    >
                                                        {pay.status}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                                                    {formatDateOnly(pay.paid_at)}
                                                </td>

                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => handlePrintInvoice(pay)}
                                                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white font-extrabold text-[11px] inline-flex items-center gap-1.5 transition-all"
                                                    >
                                                        <Printer className="size-3.5" />
                                                        <span>Print Invoice</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-8">No payment milestones recorded for this project.</p>
                        )}
                    </div>
                )}

                {/* TAB 3: DELIVERABLES & TASKS (Read-Only) */}
                {activeTab === 'tasks' && (
                    <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Project Deliverables & Tasks
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">Read-only list of project tasks and assigned team members.</p>
                            </div>
                        </div>

                        {project.tasks && project.tasks.length > 0 ? (
                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <table className="w-full text-left text-xs min-w-[750px]">
                                    <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[10px] font-extrabold text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 whitespace-nowrap">Task Title</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Assigned Member</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Priority</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3 whitespace-nowrap">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                        {project.tasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className="font-extrabold text-slate-900 dark:text-white block">{task.task_title}</span>
                                                    {task.description && <span className="text-[11px] text-slate-400 block max-w-xs truncate">{task.description}</span>}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {task.assigned_employee ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-xs">
                                                                {task.assigned_employee.name.charAt(0)}
                                                            </div>
                                                            <span className="font-bold text-slate-900 dark:text-white">{task.assigned_employee.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unassigned</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            task.priority === 'urgent'
                                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60'
                                                                : task.priority === 'high'
                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60'
                                                        }`}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            task.status === 'completed'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                                                                : task.status === 'in_progress'
                                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                                                    {formatDateOnly(task.due_date)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-8">No tasks created for this project.</p>
                        )}
                    </div>
                )}

                {/* TAB 4: ACCESS LOGINS & CREDENTIALS (Read-Only) */}
                {activeTab === 'credentials' && (
                    <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Project Access Logins & Credentials
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">Read-only list of hosting, CMS, database, and admin access keys.</p>
                            </div>
                        </div>

                        {project.credentials && project.credentials.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {project.credentials.map((cred) => (
                                    <div
                                        key={cred.id}
                                        className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">{cred.title}</span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                                                {cred.type}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-xs">
                                            {cred.url && (
                                                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                    <span className="text-slate-400 font-bold text-[10px] uppercase">URL</span>
                                                    <a
                                                        href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-600 font-bold hover:underline truncate max-w-[200px]"
                                                    >
                                                        {cred.url}
                                                    </a>
                                                </div>
                                            )}

                                            {cred.username && (
                                                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                    <span className="text-slate-400 font-bold text-[10px] uppercase">Username</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{cred.username}</span>
                                                        <button
                                                            onClick={() => copyToClipboard(cred.username!, `u-${cred.id}`)}
                                                            className="text-slate-400 hover:text-blue-600 p-1"
                                                            title="Copy Username"
                                                        >
                                                            <Copy className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {cred.password && (
                                                <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                                                    <span className="text-slate-400 font-bold text-[10px] uppercase">Password</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                                                            {visiblePasswords[cred.id] ? cred.password : '••••••••••••'}
                                                        </span>
                                                        <button
                                                            onClick={() => togglePasswordVisibility(cred.id)}
                                                            className="text-slate-400 hover:text-blue-600 p-1"
                                                        >
                                                            {visiblePasswords[cred.id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(cred.password!, `p-${cred.id}`)}
                                                            className="text-slate-400 hover:text-blue-600 p-1"
                                                            title="Copy Password"
                                                        >
                                                            <Copy className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-8">No access logins saved for this project.</p>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
