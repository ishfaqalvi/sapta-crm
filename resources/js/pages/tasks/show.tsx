import AppLayout from '@/layouts/app-layout';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    AlignLeft,
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    FolderKanban,
    Globe,
    Layers,
    ListTodo,
    Loader2,
    MessageSquare,
    Paperclip,
    RefreshCw,
    Send,
    Tag,
    Trash2,
    User,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface TaskMessageUser {
    id: number;
    name: string;
    email?: string;
    avatar?: string | null;
    type?: string;
    employee_id?: number | null;
}

export interface TaskMessageItem {
    id: number;
    taskable_type: string;
    taskable_id: number;
    user_id: number;
    message: string;
    attachment?: string | null;
    attachment_name?: string | null;
    created_at: string;
    updated_at: string;
    user?: TaskMessageUser;
}

export interface TaskDetailPageData {
    id: number;
    task_title: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string | null;
    due_date?: string | null;
    completed_at?: string | null;
    created_at?: string | null;
    description?: string | null;
    source_type: 'project' | 'service' | 'general';
    source_id?: number | null;
    source_title?: string | null;
    source_url?: string | null;
    client?: {
        id?: number;
        name?: string;
        company_name?: string;
        client_code?: string;
        currency?: string;
        status?: 'active' | 'inactive';
    } | null;
    assigned_employee?: {
        id: number;
        name: string;
        employee_code?: string;
        avatar?: string | null;
        email?: string | null;
        designation?: string | null;
        department?: string | null;
    } | null;
    messages?: TaskMessageItem[];
}

export interface ClientPortalInfo {
    id: number;
    client_code: string;
    name: string;
    company_name?: string;
    status: 'active' | 'inactive';
    currency: string;
    avatar?: string | null;
}

interface TaskShowPageProps {
    client?: ClientPortalInfo | null;
    task: TaskDetailPageData;
}

export default function TaskShowPage({ client, task }: TaskShowPageProps) {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth.user.id;

    const [messages, setMessages] = useState<TaskMessageItem[]>(task.messages || []);
    const [currentStatus, setCurrentStatus] = useState<string>(task.status || 'todo');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<TaskMessageItem | null>(null);
    const [isDeletingMessage, setIsDeletingMessage] = useState(false);
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Client Context Resolution
    const activeClient = client || (task.client ? {
        id: task.client.id || 0,
        client_code: task.client.client_code || '',
        name: task.client.name || '',
        company_name: task.client.company_name,
        status: (task.client.status as 'active' | 'inactive') || 'active',
        currency: task.client.currency || 'USD',
    } : null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Overview', href: '/client-portal/overview' },
        {
            title: task.source_type === 'service' ? 'Services' : 'Projects',
            href: task.source_type === 'service' ? '/client-portal/services' : '/client-portal/projects',
        },
        {
            title: task.source_title || 'Workspace',
            href: task.source_url || (task.source_type === 'service' ? '/client-portal/services' : '/client-portal/projects'),
        },
        {
            title: `Task #${task.id}`,
            href: `/tasks/detail/${task.source_type}/${task.id}`,
        },
    ];

    const getXsrfToken = () => {
        const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
        const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        if (metaTag && metaTag.content) {
            return metaTag.content;
        }
        return '';
    };

    // Refresh conversation stream
    const fetchMessages = async (showLoading = false) => {
        if (showLoading) setIsRefreshing(true);
        try {
            const response = await fetch(`/task-messages/${task.source_type}/${task.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) throw new Error('Failed to load discussion');
            const data = await response.json();
            if (data.success && Array.isArray(data.messages)) {
                setMessages(data.messages);
            }
        } catch (err: any) {
            console.error('Error refreshing discussion:', err);
        } finally {
            if (showLoading) setIsRefreshing(false);
        }
    };

    // Auto poll conversation every 12 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchMessages(false);
        }, 12000);
        return () => clearInterval(interval);
    }, [task.id, task.source_type]);

    // Send Message Handler
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!inputText.trim() && !selectedFile) || isSending) return;

        setIsSending(true);
        setErrorMessage(null);

        const xsrfToken = getXsrfToken();
        const formData = new FormData();
        formData.append('task_type', task.source_type || 'project');
        formData.append('task_id', String(task.id));
        formData.append('message', inputText.trim() || '(Attachment uploaded)');
        if (selectedFile) {
            formData.append('attachment', selectedFile);
        }

        try {
            const headers: Record<string, string> = {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (xsrfToken) {
                headers['X-XSRF-TOKEN'] = xsrfToken;
            }

            const response = await fetch('/task-messages/store', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to send message.');
            }

            const data = await response.json();
            if (data.success && data.message) {
                setMessages((prev) => [...prev, data.message]);
                setInputText('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } catch (err: any) {
            console.error('Error sending task message:', err);
            setErrorMessage(err.message || 'Could not send message. Please try again.');
        } finally {
            setIsSending(false);
            if (textareaRef.current) textareaRef.current.focus();
        }
    };

    // Delete Message Handler with Modal Confirmation
    const confirmDeleteMessage = async () => {
        if (!messageToDelete || isDeletingMessage) return;

        setIsDeletingMessage(true);
        const messageId = messageToDelete.id;
        const xsrfToken = getXsrfToken();
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };
        if (xsrfToken) {
            headers['X-XSRF-TOKEN'] = xsrfToken;
        }

        try {
            const response = await fetch(`/task-messages/destroy/${messageId}`, {
                method: 'DELETE',
                headers,
                credentials: 'same-origin',
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.error) {
                throw new Error(data.error || data.message || 'Failed to delete message');
            }

            setMessages((prev) => prev.filter((m) => m.id !== messageId));
            setMessageToDelete(null);
        } catch (err: any) {
            console.error('Error deleting message:', err);
            setErrorMessage(err.message || 'Could not delete message.');
        } finally {
            setIsDeletingMessage(false);
        }
    };

    // Status Change Handler
    const handleStatusChange = (newStatus: string) => {
        setCurrentStatus(newStatus);
        setIsUpdatingStatus(true);

        router.post(
            `/tasks/detail/${task.source_type}/${task.id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onFinish: () => setIsUpdatingStatus(false),
            }
        );
    };

    // Format Helpers
    const formatTimestamp = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (isToday) return `Today at ${timeStr}`;
            return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
        } catch {
            return dateStr;
        }
    };

    const getPriorityBadge = (priority?: string) => {
        switch (priority) {
            case 'urgent':
                return {
                    label: 'Urgent',
                    className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60',
                };
            case 'high':
                return {
                    label: 'High',
                    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60',
                };
            case 'medium':
                return {
                    label: 'Medium',
                    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60',
                };
            default:
                return {
                    label: priority || 'Low',
                    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60',
                };
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'completed':
                return {
                    label: 'Completed',
                    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60',
                };
            case 'in_progress':
                return {
                    label: 'In Progress',
                    className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60',
                };
            case 'in_review':
                return {
                    label: 'In Review',
                    className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60',
                };
            case 'cancelled':
                return {
                    label: 'Cancelled',
                    className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60',
                };
            default:
                return {
                    label: 'To Do',
                    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60',
                };
        }
    };

    const priorityBadge = getPriorityBadge(task.priority);
    const statusBadge = getStatusBadge(currentStatus);

    const backUrl = task.source_url || (task.source_type === 'service' ? '/client-portal/services' : '/client-portal/projects');

    const PageContent = (
        <div className="p-2 sm:p-6 w-full space-y-6 bg-slate-50/50 dark:bg-slate-950">
            <Head title={`Task: ${task.task_title} | Client Portal`} />

            {/* 1. TOP HEADER BAR: TABS & TITLE ON LEFT, ACTION BUTTONS ON RIGHT */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                {/* Left: Navigation Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20">
                        <FileText className="size-4" />
                        <span>1. Task Details</span>
                    </div>

                    <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                        <MessageSquare className="size-4" />
                        <span>2. Discussion ({messages.length})</span>
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pr-1">
                    <button
                        type="button"
                        onClick={() => fetchMessages(true)}
                        disabled={isRefreshing}
                        className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
                        title="Refresh discussion"
                    >
                        <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                        <span>Refresh</span>
                    </button>

                    {task.source_url && (
                        <Link
                            href={task.source_url}
                            className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
                        >
                            <ExternalLink className="size-3.5 text-blue-500" />
                            <span>Open {task.source_type === 'service' ? 'Service' : 'Project'}</span>
                        </Link>
                    )}

                    <Link
                        href={backUrl}
                        className="h-10 px-3.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Back to Tasks</span>
                    </Link>
                </div>
            </div>

            {/* 2. TASK TITLE & STATUS BANNER CARD */}
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                            {task.source_type === 'service' ? 'Service Deliverable' : 'Project Task'}
                        </span>
                        <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${priorityBadge.className}`}
                        >
                            {priorityBadge.label}
                        </span>
                        <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusBadge.className}`}
                        >
                            {statusBadge.label}
                        </span>
                        {task.source_title && (
                            <span className="text-xs text-slate-400 font-medium">
                                • {task.source_title}
                            </span>
                        )}
                    </div>
                    <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-snug break-words">
                        {task.task_title}
                    </h1>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                            Task ID
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            #{task.id}
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. MAIN 2-COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* LEFT / MAIN COLUMN (2 COLS ON DESKTOP) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* DESCRIPTION & REQUIREMENTS CARD */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
                                <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                    <AlignLeft className="size-4" />
                                </div>
                                <h3>Description & Scope</h3>
                            </div>
                        </div>

                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium min-h-[80px]">
                            {task.description ? (
                                task.description
                            ) : (
                                <span className="text-slate-400 italic font-normal text-xs">
                                    No detailed description provided for this deliverable.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* LIVE DISCUSSION & QUERIES STREAM */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
                        {/* Card Header */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="size-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <MessageSquare className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        Discussion & Queries ({messages.length})
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        Real-time thread between Assigned Employee and Admins
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                                Notifications Active
                            </span>
                        </div>

                        {/* Message Thread List */}
                        <div className="p-4 sm:p-5 space-y-4 max-h-[500px] overflow-y-auto bg-slate-50/20 dark:bg-slate-950/20 scrollbar-thin">
                            {errorMessage && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {messages.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                                        <MessageSquare className="size-6" />
                                    </div>
                                    <div className="space-y-1 max-w-sm">
                                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                            No Comments or Queries Yet
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Start the discussion below to send queries, ask questions, or share task progress with the team.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = currentUserId ? msg.user_id === currentUserId : false;
                                    const isSenderAdmin =
                                        msg.user?.type === 'admin' ||
                                        msg.user?.name?.toLowerCase().includes('admin');
                                    const isDeleting = isDeletingMessage && messageToDelete?.id === msg.id;

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${
                                                isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                                            }`}
                                        >
                                            {/* Sender Avatar */}
                                            <div className="shrink-0 pt-1">
                                                {msg.user?.avatar ? (
                                                    <img
                                                        src={msg.user.avatar}
                                                        alt={msg.user.name}
                                                        className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                                                    />
                                                ) : (
                                                    <div
                                                        className={`size-7 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                                                            isSenderAdmin
                                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                        }`}
                                                    >
                                                        {msg.user?.name?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Card */}
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div
                                                    className={`flex items-center gap-1.5 text-[11px] ${
                                                        isMe ? 'justify-end' : 'justify-start'
                                                    }`}
                                                >
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {msg.user?.name || 'Staff User'}
                                                    </span>
                                                    <span
                                                        className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider ${
                                                            isSenderAdmin
                                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50'
                                                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50'
                                                        }`}
                                                    >
                                                        {isSenderAdmin ? 'Admin' : 'Employee'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-normal">
                                                        • {formatTimestamp(msg.created_at)}
                                                    </span>
                                                </div>

                                                <div
                                                    className={`p-3 rounded-xl text-xs leading-relaxed shadow-xs break-words relative group ${
                                                        isMe
                                                            ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white rounded-tr-xs'
                                                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs'
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-wrap font-medium">{msg.message}</p>

                                                    {/* Attachment */}
                                                    {msg.attachment && (
                                                        <div className="mt-2.5 pt-2.5 border-t border-white/20 dark:border-slate-800">
                                                            <a
                                                                href={msg.attachment}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                    isMe
                                                                        ? 'bg-white/20 hover:bg-white/30 text-white'
                                                                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                                                                }`}
                                                            >
                                                                <FileText className="size-3.5 shrink-0" />
                                                                <span className="truncate max-w-[200px]">
                                                                    {msg.attachment_name || 'View Attachment'}
                                                                </span>
                                                                <Download className="size-3 shrink-0 ml-1" />
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* Delete Button on Hover */}
                                                    {(isMe || isSenderAdmin) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setMessageToDelete(msg)}
                                                            className={`absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                                                                isMe
                                                                    ? 'hover:bg-white/20 text-white/80'
                                                                    : 'hover:bg-rose-50 text-rose-500 dark:hover:bg-slate-800'
                                                            }`}
                                                            title="Delete message"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Composer Form */}
                        <form
                            onSubmit={handleSendMessage}
                            className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setSelectedFile(e.target.files[0]);
                                    }
                                }}
                            />

                            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-3 space-y-2">
                                {selectedFile && (
                                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Paperclip className="size-3.5 text-blue-600 shrink-0" />
                                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                {selectedFile.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                )}

                                <textarea
                                    ref={textareaRef}
                                    rows={3}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type your message, query, or update... (Press Enter to send, Shift+Enter for new line)"
                                    className="w-full px-2 py-1 bg-transparent border-0 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-0 resize-none leading-relaxed"
                                />

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`h-9 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                                            selectedFile
                                                ? 'bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950/60 dark:border-blue-800'
                                                : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-2xs'
                                        }`}
                                        title="Attach File (Images, PDFs, Documents up to 10MB)"
                                    >
                                        <Paperclip className="size-3.5" />
                                        <span>{selectedFile ? 'Change File' : 'Attach File'}</span>
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSending || (!inputText.trim() && !selectedFile)}
                                        className="h-9 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:opacity-95 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                        title="Send Message / Reply"
                                    >
                                        {isSending ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Send className="size-3.5" />
                                        )}
                                        <span>Send Reply</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* RIGHT / SIDEBAR COLUMN (1 COL ON DESKTOP) */}
                <div className="space-y-5">
                    {/* 1. STATUS & PRIORITY CARD */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                            Status & Priority
                        </h4>

                        {/* Status Quick Change */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                Current Status
                            </label>
                            <select
                                value={currentStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={isUpdatingStatus}
                                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
                            >
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="in_review">In Review</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                Priority Level
                            </span>
                            <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${priorityBadge.className}`}
                            >
                                {priorityBadge.label}
                            </span>
                        </div>
                    </div>

                    {/* 2. ASSIGNED STAFF CARD */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                            Assigned Assignee
                        </h4>

                        {task.assigned_employee ? (
                            <div className="flex items-center gap-3 pt-1">
                                {task.assigned_employee.avatar ? (
                                    <img
                                        src={task.assigned_employee.avatar}
                                        alt={task.assigned_employee.name}
                                        className="size-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                                    />
                                ) : (
                                    <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-2xs">
                                        {task.assigned_employee.name.charAt(0)}
                                    </div>
                                )}

                                <div className="min-w-0 flex-1 space-y-0.5">
                                    <p className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                                        {task.assigned_employee.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {task.assigned_employee.designation || 'Staff Member'}
                                    </p>
                                    {task.assigned_employee.employee_code && (
                                        <span className="inline-block text-[10px] font-mono font-bold text-slate-400">
                                            ID: {task.assigned_employee.employee_code}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-400 text-xs italic">
                                No staff member assigned yet.
                            </div>
                        )}
                    </div>

                    {/* 3. DATES & TIMELINE CARD */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                            Dates & Timeline
                        </h4>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-slate-400" />
                                    <span>Start Date</span>
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {task.start_date || 'Not set'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Clock className="size-3.5 text-blue-500" />
                                    <span>Due Date</span>
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {task.due_date || 'No deadline'}
                                </span>
                            </div>

                            {task.completed_at && (
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                                        <CheckCircle2 className="size-3.5" />
                                        <span>Completed At</span>
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {formatTimestamp(task.completed_at)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. CLIENT & SOURCE CARD */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                            Project & Client Source
                        </h4>

                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                                    Workspace
                                </span>
                                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-0.5 truncate">
                                    {task.source_title || 'General Workspace'}
                                </p>
                            </div>

                            {task.client && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                                        Client Account
                                    </span>
                                    <div className="flex items-center gap-2 pt-0.5">
                                        <div className="size-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center font-bold text-xs">
                                            <Globe className="size-3.5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                {task.client.company_name || task.client.name}
                                            </p>
                                            {task.client.client_code && (
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    {task.client.client_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {task.source_url && (
                                <div className="pt-2">
                                    <Link
                                        href={task.source_url}
                                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <ExternalLink className="size-3 text-blue-500" />
                                        <span>View Full {task.source_type === 'service' ? 'Service' : 'Project'}</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. DELETE MESSAGE CONFIRMATION MODAL */}
            {messageToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
                    <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                        <button
                            type="button"
                            onClick={() => !isDeletingMessage && setMessageToDelete(null)}
                            disabled={isDeletingMessage}
                            className="absolute top-4 right-4 size-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="size-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-xs">
                            <Trash2 className="size-6" />
                        </div>

                        <div className="space-y-1.5">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Message?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Are you sure you want to permanently delete this message and its attachments?
                            </p>
                        </div>

                        {/* Message Preview Snippet */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-left space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {messageToDelete.user?.name || 'User'}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {formatTimestamp(messageToDelete.created_at)}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 italic font-normal">
                                "{messageToDelete.message}"
                            </p>
                            {messageToDelete.attachment_name && (
                                <div className="text-[10px] text-blue-500 font-medium flex items-center gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                    <Paperclip className="size-3" />
                                    <span className="truncate">{messageToDelete.attachment_name}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setMessageToDelete(null)}
                                disabled={isDeletingMessage}
                                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteMessage}
                                disabled={isDeletingMessage}
                                className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isDeletingMessage ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="size-4" />
                                        <span>Delete Message</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (activeClient) {
        return (
            <ClientPortalLayout
                client={activeClient}
                breadcrumbs={breadcrumbs}
                activeTab={task.source_type === 'service' ? 'services' : 'projects'}
            >
                {PageContent}
            </ClientPortalLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {PageContent}
        </AppLayout>
    );
}
