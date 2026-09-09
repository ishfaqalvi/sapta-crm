import FilePreviewModal from '@/components/file-preview-modal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    Download,
    Eye,
    EyeOff,
    File,
    FileImage,
    FileSpreadsheet,
    FileText,
    FolderKanban,
    Globe,
    Key,
    Layers,
    ListTodo,
    PauseCircle,
    Tag,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ProjectDetailProps {
    project: {
        id: number;
        client_id: number;
        project_name: string;
        category?: { id: number; name: string } | null;
        currency?: string;
        client?: {
            id: number;
            name: string;
            company_name?: string;
            client_code: string;
            email?: string;
            phone?: string;
            city?: string;
            country?: string;
            status?: string;
        } | null;
        start_date: string | null;
        deadline: string | null;
        status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
        progress_percentage: number;
        notes: string | null;
        created_at: string | null;
        milestones: Array<{
            id: number;
            milestone_name: string;
            due_date: string | null;
            status: string;
            notes: string | null;
        }>;
        tasks: Array<{
            id: number;
            task_title: string;
            task_description: string | null;
            priority: string;
            status: string;
            start_date: string | null;
            due_date: string | null;
            assigned_employee?: {
                id: number;
                name: string;
                employee_code: string;
                avatar?: string | null;
            } | null;
            messages_count: number;
        }>;
        credentials: Array<{
            id: number;
            service_name: string;
            username: string;
            password?: string;
            url?: string;
            notes?: string;
        }>;
        documents: Array<{
            id: number;
            title: string;
            file_path: string;
            file_name?: string | null;
            file_type?: string | null;
            file_size?: number | null;
            created_at: string | null;
            updated_at?: string | null;
        }>;
    };
    permissions: {
        view_milestones: boolean;
        view_tasks: boolean;
        view_credentials: boolean;
        view_documents: boolean;
    };
}

export function formatDateOnly(dateStr?: string | null): string {
    if (!dateStr || dateStr.trim() === '' || dateStr === '-') return '—';
    
    // If it's already in "DD MMM YYYY" format (e.g. "09 Sep 2026")
    const alreadyFormattedRegex = /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i;
    if (alreadyFormattedRegex.test(dateStr.trim())) {
        return dateStr.trim();
    }

    try {
        // If it's "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss" or ISO string
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10) - 1;
            const day = parseInt(isoMatch[3], 10);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if (month >= 0 && month < 12 && !isNaN(day) && !isNaN(year)) {
                const formattedDay = day < 10 ? `0${day}` : `${day}`;
                return `${formattedDay} ${months[month]} ${year}`;
            }
        }

        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        }
    } catch {
        // fallback
    }

    return dateStr;
}

export function resolveDocumentUrl(filePath?: string | null): string {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    if (filePath.startsWith('/')) {
        return filePath;
    }
    if (filePath.startsWith('uploads/')) {
        return `/${filePath}`;
    }
    if (filePath.startsWith('storage/')) {
        return `/${filePath}`;
    }
    return `/storage/${filePath}`;
}

export function formatDateTime(dateStr?: string | null): string {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return (
            date.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }) +
            ', ' +
            date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            })
        );
    } catch {
        return dateStr;
    }
}

export function formatFileSize(bytes?: number | null): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileIcon(fileType?: string | null) {
    const ext = (fileType || '').toLowerCase();
    if (ext === 'pdf') {
        return <FileText className="size-6 text-rose-500" />;
    }
    if (ext === 'doc' || ext === 'docx') {
        return <FileText className="size-6 text-blue-500" />;
    }
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
        return <FileSpreadsheet className="size-6 text-emerald-500" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
        return <FileImage className="size-6 text-purple-500" />;
    }
    return <File className="size-6 text-indigo-500" />;
}

export function getFileBadgeClass(fileType?: string | null) {
    const ext = (fileType || '').toLowerCase();
    if (ext === 'pdf') {
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800';
    }
    if (ext === 'doc' || ext === 'docx') {
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800';
    }
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800';
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
}

export default function ProjectShow({ project, permissions }: ProjectDetailProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'milestones' | 'tasks' | 'credentials' | 'documents'>('details');
    const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [previewDoc, setPreviewDoc] = useState<{
        url: string;
        name?: string;
        type?: string;
        size?: number;
    } | null>(null);

    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopy = (text: string, idStr: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idStr);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Projects Directory', href: '/projects' },
        { title: project.project_name, href: `/projects/${project.id}` },
    ];

    const getStatusBadge = (st: string) => {
        switch (st) {
            case 'completed':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 inline-flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Completed</span>
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 inline-flex items-center gap-1">
                        <Clock className="size-3 text-purple-600 dark:text-purple-400" />
                        <span>In Progress</span>
                    </span>
                );
            case 'on_hold':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 inline-flex items-center gap-1">
                        <PauseCircle className="size-3 text-amber-600 dark:text-amber-400" />
                        <span>On Hold</span>
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 inline-flex items-center gap-1">
                        <XCircle className="size-3 text-rose-600 dark:text-rose-400" />
                        <span>Cancelled</span>
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {st}
                    </span>
                );
        }
    };

    const getPriorityBadge = (pr: string) => {
        switch (pr) {
            case 'high':
            case 'urgent':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60">
                        {pr}
                    </span>
                );
            case 'medium':
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                        {pr}
                    </span>
                );
            default:
                return (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200">
                        {pr || 'normal'}
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Project: ${project.project_name}`} />

            <div className="p-2 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950">
                {/* 1. TOP HEADER BAR: TABS ON LEFT, BACK BUTTON ON RIGHT */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                    {/* Left: Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {/* TAB 1: Details */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'details'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <FileText className="size-4" />
                            <span>1. Details</span>
                        </button>

                        {/* TAB 2: Milestones */}
                        {permissions.view_milestones && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('milestones')}
                                className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'milestones'
                                        ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Tag className="size-4" />
                                <span>2. Milestones ({project.milestones.length})</span>
                            </button>
                        )}

                        {/* TAB 3: Tasks */}
                        {permissions.view_tasks && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('tasks')}
                                className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'tasks'
                                        ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <ListTodo className="size-4" />
                                <span>3. Tasks ({project.tasks.length})</span>
                            </button>
                        )}

                        {/* TAB 4: Credentials */}
                        {permissions.view_credentials && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('credentials')}
                                className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'credentials'
                                        ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Key className="size-4" />
                                <span>4. Credentials ({project.credentials.length})</span>
                            </button>
                        )}

                        {/* TAB 5: Documents */}
                        {permissions.view_documents && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('documents')}
                                className={`flex items-center gap-2 h-10 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'documents'
                                        ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <FileText className="size-4" />
                                <span>5. Documents ({project.documents.length})</span>
                            </button>
                        )}
                    </div>

                    {/* Right: Back Button */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 pr-1">
                        <Link
                            href="/projects"
                            className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Back to Projects</span>
                        </Link>
                    </div>
                </div>

                {/* 2. TAB CONTENTS */}

                {/* TAB 1: DETAILS */}
                {activeTab === 'details' && (
                    <div className="space-y-4">
                        {/* Project Header Banner Card */}
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
                                        {getStatusBadge(project.status)}
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
                                            <p className="text-xs text-slate-400">Detailed requirements and specifications</p>
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

                            {/* Project Parameters (Right 1 col) */}
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
                                            <span className="text-slate-400">Start Date</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{formatDateOnly(project.start_date)}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                                            <span className="text-slate-400">Target Deadline</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">{formatDateOnly(project.deadline)}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1">
                                            <span className="text-slate-400">Client Account</span>
                                            <div className="text-right">
                                                <span className="font-bold text-slate-900 dark:text-white block">{project.client?.company_name || project.client?.name || '—'}</span>
                                                {project.client?.client_code && (
                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">{project.client.client_code}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: MILESTONES */}
                {activeTab === 'milestones' && permissions.view_milestones && (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                    <Tag className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        Project Milestones & Deliverables ({project.milestones.length})
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">Milestone roadmap & target completion checkpoints</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto scrollbar-thin">
                            <table className="w-full min-w-[700px] text-left text-xs text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3.5">Milestone Title</th>
                                        <th className="px-4 py-3.5">Target Due Date</th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="px-4 py-3.5">Notes & Brief</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {project.milestones.length > 0 ? (
                                        project.milestones.map((m) => (
                                            <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                                                    {m.milestone_name}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="size-3.5 text-slate-400" />
                                                        <span>{formatDateOnly(m.due_date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                                            m.status === 'completed' || m.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60'
                                                        }`}
                                                    >
                                                        {m.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-500 max-w-xs">
                                                    {m.notes || '—'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                                No milestones recorded for this project.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: TASKS */}
                {activeTab === 'tasks' && permissions.view_tasks && (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <ListTodo className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        Project Tasks ({project.tasks.length})
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">Sprint deliverables, assignees, and progress status.</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto scrollbar-thin">
                            <table className="w-full min-w-[750px] text-left text-xs text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3.5">Task Details</th>
                                        <th className="px-4 py-3.5">Assigned Employee</th>
                                        <th className="px-4 py-3.5">Priority</th>
                                        <th className="px-4 py-3.5">Status</th>
                                        <th className="px-4 py-3.5">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {project.tasks.length > 0 ? (
                                        project.tasks.map((task) => (
                                            <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div>
                                                        <span className="font-extrabold text-slate-900 dark:text-white block text-sm">
                                                            {task.task_title}
                                                        </span>
                                                        {task.task_description && (
                                                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                                                {task.task_description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {task.assigned_employee ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0">
                                                                {task.assigned_employee.avatar ? (
                                                                    <img
                                                                        src={task.assigned_employee.avatar}
                                                                        alt={task.assigned_employee.name}
                                                                        className="size-7 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    task.assigned_employee.name.charAt(0)
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                                                                    {task.assigned_employee.name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {task.assigned_employee.employee_code}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {getPriorityBadge(task.priority)}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {getStatusBadge(task.status)}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                        <Clock className="size-3.5 text-slate-400" />
                                                        <span>{formatDateOnly(task.due_date)}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                                No tasks found for this project.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 4: CREDENTIALS VAULT */}
                {activeTab === 'credentials' && permissions.view_credentials && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Project Credentials ({project.credentials.length})
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Hosting, CMS, Database, Domain, and API access notes for {project.project_name}.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {project.credentials.length > 0 ? (
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
                                                                {cred.service_name}
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
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-xs">
                                                    {cred.username && (
                                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                                            <span className="text-slate-400">Username / Login</span>
                                                            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                                                                <span>{cred.username}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopy(cred.username, `user-${cred.id}`)}
                                                                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                                                    title="Copy Username"
                                                                >
                                                                    <Copy className="size-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {cred.password && (
                                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                                            <span className="text-slate-400">Password</span>
                                                            <div className="flex items-center gap-1.5 font-mono">
                                                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                    {visiblePasswords[cred.id] ? cred.password : '••••••••••••'}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => togglePasswordVisibility(cred.id)}
                                                                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                                                    title={visiblePasswords[cred.id] ? 'Hide Password' : 'Show Password'}
                                                                >
                                                                    {visiblePasswords[cred.id] ? (
                                                                        <EyeOff className="size-3.5" />
                                                                    ) : (
                                                                        <Eye className="size-3.5" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopy(cred.password!, `pass-${cred.id}`)}
                                                                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                                                    title="Copy Password"
                                                                >
                                                                    <Copy className="size-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {cred.url && (
                                                        <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                                            <span className="text-slate-400">Access URL</span>
                                                            <a
                                                                href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium truncate max-w-[200px]"
                                                            >
                                                                <Globe className="size-3 shrink-0" />
                                                                <span className="truncate">{cred.url}</span>
                                                            </a>
                                                        </div>
                                                    )}

                                                    {cred.notes && (
                                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed max-h-40 overflow-y-auto mt-2">
                                                            {cred.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 italic text-sm">
                                    No credentials linked to this project yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 5: DOCUMENTS */}
                {activeTab === 'documents' && permissions.view_documents && (
                    <div className="space-y-6">
                        {/* Header Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                    <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Attached Project Documents ({project.documents.length})</span>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Review and download project contracts, proposals, specifications, reports, and design assets.
                                </p>
                            </div>
                        </div>

                        {/* Documents Cards Grid */}
                        {project.documents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {project.documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                                <div
                                                    onClick={() =>
                                                        setPreviewDoc({
                                                            url: resolveDocumentUrl(doc.file_path),
                                                            name: doc.file_name || doc.title,
                                                            type: doc.file_type || undefined,
                                                            size: doc.file_size || undefined,
                                                        })
                                                    }
                                                    className="flex items-center gap-3 cursor-pointer group min-w-0"
                                                >
                                                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 transition-colors">
                                                        {getFileIcon(doc.file_type)}
                                                    </div>
                                                    <div className="space-y-1 min-w-0">
                                                        <h4
                                                            className="font-extrabold text-slate-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                                            title={doc.title}
                                                        >
                                                            {doc.title}
                                                        </h4>
                                                        {doc.file_type && (
                                                            <span
                                                                className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-black uppercase tracking-wider border ${getFileBadgeClass(
                                                                    doc.file_type
                                                                )}`}
                                                            >
                                                                .{doc.file_type}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1 text-xs">
                                                <p className="text-slate-600 dark:text-slate-400 font-medium truncate" title={doc.file_name || doc.title}>
                                                    <span className="text-slate-400">File:</span> {doc.file_name || doc.title}
                                                </p>
                                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                                    <span>Size: {formatFileSize(doc.file_size)}</span>
                                                    {(doc.updated_at || doc.created_at) && (
                                                        <span>
                                                            Updated: {formatDateTime(doc.updated_at || doc.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPreviewDoc({
                                                            url: resolveDocumentUrl(doc.file_path),
                                                            name: doc.file_name || doc.title,
                                                            type: doc.file_type || undefined,
                                                            size: doc.file_size || undefined,
                                                        })
                                                    }
                                                    className="h-8 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.99] transition-all font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer border border-blue-200/60 dark:border-blue-900/40"
                                                    title="Preview Document"
                                                >
                                                    <Eye className="size-3.5" />
                                                    <span>Preview</span>
                                                </button>

                                                <a
                                                    href={resolveDocumentUrl(doc.file_path)}
                                                    download={doc.file_name || doc.title}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer"
                                                    title="Download File"
                                                >
                                                    <Download className="size-3.5" />
                                                    <span>Download</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 italic text-sm">
                                No documents attached to this project.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* File Preview Modal */}
            {previewDoc && (
                <FilePreviewModal
                    isOpen={!!previewDoc}
                    onClose={() => setPreviewDoc(null)}
                    fileUrl={previewDoc.url}
                    fileName={previewDoc.name}
                    fileType={previewDoc.type}
                    fileSize={previewDoc.size}
                />
            )}
        </AppLayout>
    );
}

