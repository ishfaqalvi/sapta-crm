import FilePreviewModal from '@/components/file-preview-modal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlignLeft,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FolderKanban,
    ListTodo,
    Loader2,
    MessageSquare,
    Paperclip,
    RefreshCw,
    Send,
    Tag,
    Trash2,
    User,
    Wrench,
    X,
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

export interface AdminServiceTaskConversationData {
    id: number;
    task_title: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string | null;
    due_date?: string | null;
    completed_at?: string | null;
    created_at?: string | null;
    description?: string | null;
    attachment?: string | null;
    attachment_name?: string | null;
    source_type: 'service';
    source_id: number;
    source_title: string;
    source_code?: string | null;
    source_url: string;
    from?: string | null;
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

export interface AdminServiceInfo {
    id: number;
    service_name: string;
    service_code?: string;
    status: string;
    client?: {
        id?: number;
        name?: string;
        company_name?: string;
        client_code?: string;
        currency?: string;
    } | null;
    category?: {
        id?: number;
        name?: string;
    } | null;
}

interface TaskConversationPageProps {
    service: AdminServiceInfo;
    task: AdminServiceTaskConversationData;
}

export default function AdminServiceTaskConversationPage({
    service,
    task,
}: TaskConversationPageProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const currentUserId = user?.id;

    // Messages Stream State
    const [messages, setMessages] = useState<TaskMessageItem[]>(task.messages || []);
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<TaskMessageItem | null>(null);
    const [isDeletingMessage, setIsDeletingMessage] = useState(false);

    // Live status quick-updater
    const [currentStatus, setCurrentStatus] = useState<string>(task.status || 'todo');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Preview File Modal State
    const [previewFile, setPreviewFile] = useState<{
        url: string;
        name?: string;
        type?: string;
        size?: number;
    } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Services Directory', href: '/services' },
        {
            title: service.service_name,
            href: `/services/${service.id}?tab=tasks`,
        },
        {
            title: `Task #${task.id}: ${task.task_title}`,
            href: `/services/${service.id}/tasks/${task.id}/conversation`,
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

    // Refresh conversation messages stream
    const fetchMessages = async (showLoading = false) => {
        if (showLoading) setIsRefreshing(true);
        try {
            const res = await fetch(`/task-messages/service/${task.id}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.messages)) {
                    setMessages(data.messages);
                }
            }
        } catch (err) {
            console.error('Failed to refresh service task messages:', err);
        } finally {
            if (showLoading) setIsRefreshing(false);
        }
    };

    // Auto-poll messages every 10 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            fetchMessages(false);
        }, 10000);
        return () => clearInterval(timer);
    }, [task.id]);

    // Send Message
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!inputText.trim() && !selectedFile) || isSending) return;

        setIsSending(true);
        setErrorMessage(null);

        try {
            const formData = new FormData();
            formData.append('taskable_type', 'service');
            formData.append('taskable_id', task.id.toString());
            if (inputText.trim()) {
                formData.append('message', inputText.trim());
            }
            if (selectedFile) {
                formData.append('attachment', selectedFile);
            }

            const xsrfToken = getXsrfToken();
            const res = await fetch('/task-messages/store', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken,
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to send message.');
            }

            const data = await res.json();
            if (data && data.data) {
                setMessages((prev) => [...prev, data.data]);
                setInputText('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setTimeout(scrollToBottom, 80);
            } else {
                fetchMessages(false);
                setInputText('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred while sending your message.');
        } finally {
            setIsSending(false);
        }
    };

    // Quick Status Update
    const handleStatusChange = (newStatus: string) => {
        if (newStatus === currentStatus || isUpdatingStatus) return;
        setIsUpdatingStatus(true);

        router.post(
            `/services/tasks/${task.id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCurrentStatus(newStatus);
                    setIsUpdatingStatus(false);
                },
                onError: (errors) => {
                    console.error('Failed to update task status:', errors);
                    setIsUpdatingStatus(false);
                },
            }
        );
    };

    // Delete message
    const handleDeleteMessageConfirm = async () => {
        if (!messageToDelete || isDeletingMessage) return;
        setIsDeletingMessage(true);

        try {
            const xsrfToken = getXsrfToken();
            const res = await fetch(`/task-messages/destroy/${messageToDelete.id}`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': xsrfToken,
                },
                body: JSON.stringify({ _method: 'DELETE' }),
            });

            if (res.ok) {
                setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
                setMessageToDelete(null);
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.message || 'Failed to delete message.');
            }
        } catch (err: any) {
            alert(err.message || 'An error occurred while deleting the message.');
        } finally {
            setIsDeletingMessage(false);
        }
    };

    // File Preview Handler
    const handlePreview = (url: string, name?: string) => {
        const ext = name?.split('.').pop()?.toLowerCase() || '';
        setPreviewFile({
            url,
            name: name || 'Attachment',
            type: ext,
        });
    };

    // Helper Formatter
    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return (
                date.toLocaleDateString('en-GB', {
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
    };

    const formatDateOnly = (dateStr?: string | null) => {
        if (!dateStr) return '—';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="size-3.5" />
                        Completed
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Loader2 className="size-3.5 animate-spin" />
                        In Progress
                    </span>
                );
            case 'in_review':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        <Clock className="size-3.5" />
                        In Review
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <AlertCircle className="size-3.5" />
                        Cancelled
                    </span>
                );
            case 'todo':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Clock className="size-3.5" />
                        To Do
                    </span>
                );
        }
    };

    const getPriorityBadge = (priority?: string) => {
        switch (priority) {
            case 'urgent':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                        Urgent
                    </span>
                );
            case 'high':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-orange-500 text-white shadow-xs">
                        High
                    </span>
                );
            case 'medium':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-xs">
                        Medium
                    </span>
                );
            case 'low':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-slate-500 text-white shadow-xs">
                        Low
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Task Conversation: ${task.task_title}`} />

            <div className="flex flex-col flex-1 h-[calc(100vh-4rem)] overflow-hidden bg-slate-50/70 dark:bg-slate-950">
                {/* TOP HEADER BAR */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3.5 shrink-0 z-10 shadow-2xs">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Link
                                href={`/services/${service.id}?tab=tasks`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs hover:text-blue-600 dark:hover:text-blue-400"
                            >
                                <ArrowLeft className="size-4" />
                                <span>Back to Service Tasks</span>
                            </Link>

                            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-[10px] font-black tracking-wider uppercase border border-blue-200/60 dark:border-blue-800/60">
                                        Task #{task.id}
                                    </span>
                                    {getPriorityBadge(task.priority)}
                                    {getStatusBadge(currentStatus)}
                                </div>
                                <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate mt-0.5 tracking-tight">
                                    {task.task_title}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                            {/* Refresh Button */}
                            <button
                                type="button"
                                onClick={() => fetchMessages(true)}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                                title="Refresh messages"
                            >
                                <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>

                            {/* Service Workspace Link */}
                            <Link
                                href={`/services/${service.id}`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white hover:brightness-110 shadow-sm transition-all"
                            >
                                <Wrench className="size-3.5" />
                                <span className="hidden sm:inline">Service Workspace</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT WORKSPACE: CHAT (LEFT) & SIDEBAR (RIGHT) */}
                <div className="flex-1 overflow-hidden max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-5">
                    {/* LEFT AREA: CONVERSATION STREAM */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                        {/* Stream Header */}
                        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
                                    <MessageSquare className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>Task Discussion & Messages</span>
                                        <span className="px-2 py-0.2 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                            {messages.length}
                                        </span>
                                    </h2>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Live channel with assigned staff and administration
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error Banner */}
                        {errorMessage && (
                            <div className="m-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="size-4 shrink-0 text-rose-500" />
                                    <span>{errorMessage}</span>
                                </div>
                                <button
                                    onClick={() => setErrorMessage(null)}
                                    className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Messages Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                                    <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center">
                                        <MessageSquare className="size-7" />
                                    </div>
                                    <div className="max-w-sm">
                                        <h3 className="font-black text-slate-900 dark:text-white text-sm">
                                            No messages yet
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Start the discussion by posting instructions, progress updates, or relevant attachments for this task.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isSelf = currentUserId && msg.user_id === currentUserId;
                                    const senderName = msg.user?.name || (isSelf ? 'You' : 'User');
                                    const senderAvatar = msg.user?.avatar;
                                    const senderType = msg.user?.type;

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-3 group ${isSelf ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!isSelf && (
                                                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden mt-1 shadow-2xs">
                                                    {senderAvatar ? (
                                                        <img
                                                            src={senderAvatar}
                                                            alt={senderName}
                                                            className="size-full object-cover"
                                                        />
                                                    ) : (
                                                        senderName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                            )}

                                            <div
                                                className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                                                    isSelf ? 'items-end' : 'items-start'
                                                }`}
                                            >
                                                {/* Author Header */}
                                                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {isSelf ? 'You' : senderName}
                                                    </span>
                                                    {senderType && (
                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                            {senderType}
                                                        </span>
                                                    )}
                                                    <span className="text-slate-400 text-[10px]">
                                                        {formatDateTime(msg.created_at)}
                                                    </span>

                                                    {/* Delete Message Button */}
                                                    {(isSelf || user?.type === 'admin' || user?.roles?.some((r: any) => r.name === 'Super Admin' || r.name === 'admin')) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setMessageToDelete(msg)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                                            title="Delete message"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Bubble */}
                                                <div
                                                    className={`rounded-3xl p-4 shadow-2xs ${
                                                        isSelf
                                                            ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white rounded-tr-xs'
                                                            : 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/70 dark:border-slate-700/60'
                                                    }`}
                                                >
                                                    {msg.message && (
                                                        <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap select-text">
                                                            {msg.message}
                                                        </p>
                                                    )}

                                                    {/* Attachment Card */}
                                                    {msg.attachment && (
                                                        <div
                                                            className={`mt-2.5 p-2.5 rounded-2xl flex items-center justify-between gap-3 ${
                                                                isSelf
                                                                    ? 'bg-white/10 border border-white/20'
                                                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div
                                                                    className={`p-2 rounded-xl shrink-0 ${
                                                                        isSelf
                                                                            ? 'bg-white/20 text-white'
                                                                            : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                                                    }`}
                                                                >
                                                                    <Paperclip className="size-3.5" />
                                                                </div>
                                                                <span className="text-xs font-bold truncate">
                                                                    {msg.attachment_name || 'Attached File'}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handlePreview(
                                                                            msg.attachment!,
                                                                            msg.attachment_name || 'Attachment'
                                                                        )
                                                                    }
                                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                                        isSelf
                                                                            ? 'hover:bg-white/20 text-white'
                                                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                                    }`}
                                                                    title="Preview file"
                                                                >
                                                                    <Eye className="size-3.5" />
                                                                </button>
                                                                <a
                                                                    href={msg.attachment}
                                                                    download={msg.attachment_name || 'attachment'}
                                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                                        isSelf
                                                                            ? 'hover:bg-white/20 text-white'
                                                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                                    }`}
                                                                    title="Download file"
                                                                >
                                                                    <Download className="size-3.5" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {isSelf && (
                                                <div className="size-8 rounded-full bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white flex items-center justify-center font-black text-xs shrink-0 overflow-hidden mt-1 shadow-2xs">
                                                    {user?.avatar ? (
                                                        <img
                                                            src={user.avatar}
                                                            alt={user.name}
                                                            className="size-full object-cover"
                                                        />
                                                    ) : (
                                                        (user?.name || 'A').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Box Footer */}
                        <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            {/* Selected File Badge */}
                            {selectedFile && (
                                <div className="mb-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 text-xs">
                                    <Paperclip className="size-3.5 shrink-0" />
                                    <span className="font-bold truncate max-w-xs">{selectedFile.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex items-end gap-2.5">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setSelectedFile(e.target.files[0]);
                                        }
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSending}
                                    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors shrink-0 shadow-2xs cursor-pointer"
                                    title="Attach document or screenshot"
                                >
                                    <Paperclip className="size-4" />
                                </button>

                                <div className="flex-1 relative">
                                    <textarea
                                        ref={textareaRef}
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Type your message, notes, or instructions... (Shift+Enter for newline)"
                                        rows={2}
                                        disabled={isSending}
                                        className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={(!inputText.trim() && !selectedFile) || isSending}
                                    className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer shrink-0"
                                >
                                    {isSending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="size-4" />
                                            <span className="hidden sm:inline">Send</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT AREA: TASK META & SERVICE SIDEBAR */}
                    <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4 shrink-0 overflow-y-auto">
                        {/* Task Details Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                    <ListTodo className="size-4 text-blue-600" />
                                    <span>Task Information</span>
                                </h3>
                                {getStatusBadge(currentStatus)}
                            </div>

                            {/* Quick Status Updater */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                    Update Task Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={currentStatus}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        disabled={isUpdatingStatus}
                                        className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 cursor-pointer"
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="in_review">In Review</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    {isUpdatingStatus && (
                                        <Loader2 className="absolute right-3 top-2.5 size-3.5 animate-spin text-blue-600 pointer-events-none" />
                                    )}
                                </div>
                            </div>

                            {/* Priority & Assignee */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                        Priority
                                    </span>
                                    <div className="mt-1">{getPriorityBadge(task.priority)}</div>
                                </div>

                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                        Task ID
                                    </span>
                                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block mt-1">
                                        #{task.id}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {task.description && (
                                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <AlignLeft className="size-3 text-slate-400" />
                                        <span>Description</span>
                                    </span>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/60 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 whitespace-pre-line">
                                        {task.description}
                                    </p>
                                </div>
                            )}

                            {/* Task Attachment if any */}
                            {task.attachment && (
                                <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Paperclip className="size-3 text-slate-400" />
                                        <span>Task Attachment</span>
                                    </span>
                                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                            {task.attachment_name || 'Task Attachment'}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handlePreview(
                                                        task.attachment!,
                                                        task.attachment_name || 'Attachment'
                                                    )
                                                }
                                                className="p-1 rounded text-slate-500 hover:text-blue-600"
                                            >
                                                <Eye className="size-3.5" />
                                            </button>
                                            <a
                                                href={task.attachment}
                                                download
                                                className="p-1 rounded text-slate-500 hover:text-blue-600"
                                            >
                                                <Download className="size-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dates Timeline */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="size-3.5 text-slate-400" />
                                        <span>Start Date</span>
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {formatDateOnly(task.start_date)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="size-3.5 text-slate-400" />
                                        <span>Due Date</span>
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {formatDateOnly(task.due_date)}
                                    </span>
                                </div>

                                {task.completed_at && (
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <CheckCircle2 className="size-3.5 text-emerald-500" />
                                            <span>Completed At</span>
                                        </span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatDateOnly(task.completed_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assigned Employee Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                    <User className="size-4 text-blue-600" />
                                    <span>Assigned Staff</span>
                                </h3>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Assignee
                                </span>
                            </div>

                            {task.assigned_employee ? (
                                <div className="flex items-center gap-3">
                                    <div className="size-11 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-2xs">
                                        {task.assigned_employee.avatar ? (
                                            <img
                                                src={task.assigned_employee.avatar}
                                                alt={task.assigned_employee.name}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            task.assigned_employee.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                            {task.assigned_employee.name}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                            {task.assigned_employee.designation ||
                                                task.assigned_employee.department ||
                                                task.assigned_employee.employee_code ||
                                                'Assigned Team Member'}
                                        </p>
                                        {task.assigned_employee.email && (
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {task.assigned_employee.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
                                    <p className="text-xs text-slate-400 italic">No staff assigned to this task</p>
                                </div>
                            )}
                        </div>

                        {/* Associated Service Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                    <Wrench className="size-4 text-blue-600" />
                                    <span>Client Service</span>
                                </h3>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {service.service_code || `SRV-${service.id}`}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div>
                                    <span className="text-slate-400 text-[11px] block">Service Title</span>
                                    <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5">
                                        {service.service_name}
                                    </span>
                                </div>

                                {service.client && (
                                    <div>
                                        <span className="text-slate-400 text-[11px] block">Client / Account</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                                            {service.client.company_name || service.client.name}
                                        </span>
                                    </div>
                                )}

                                {service.category && (
                                    <div>
                                        <span className="text-slate-400 text-[11px] block">Category</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                                            {service.category.name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Link
                                    href={`/services/${service.id}`}
                                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Wrench className="size-3.5" />
                                    <span>Open Service Workspace</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE MESSAGE CONFIRMATION MODAL */}
            {messageToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                            <Trash2 className="size-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h4 className="text-base font-black text-slate-900 dark:text-white">
                                Delete Message?
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Are you sure you want to delete this message? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setMessageToDelete(null)}
                                disabled={isDeletingMessage}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteMessageConfirm}
                                disabled={isDeletingMessage}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                            >
                                {isDeletingMessage ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ATTACHMENT PREVIEW MODAL */}
            {previewFile && (
                <FilePreviewModal
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    fileUrl={previewFile.url}
                    fileName={previewFile.name}
                    fileType={previewFile.type}
                    fileSize={previewFile.size}
                />
            )}
        </AppLayout>
    );
}
