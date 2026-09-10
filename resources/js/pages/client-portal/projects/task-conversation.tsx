import FilePreviewModal from '@/components/file-preview-modal';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
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

export interface ProjectTaskConversationData {
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
    source_type: 'project';
    source_id: number;
    source_title: string;
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

export interface ClientPortalProjectInfo {
    id: number;
    project_name: string;
    project_code?: string;
    status: string;
    client?: {
        id?: number;
        name?: string;
        company_name?: string;
        client_code?: string;
        currency?: string;
    } | null;
}

interface TaskConversationPageProps {
    client: any;
    project: ClientPortalProjectInfo;
    task: ProjectTaskConversationData;
}

export default function ProjectTaskConversationPage({
    client,
    project,
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
        { title: 'Overview', href: '/client-portal/overview' },
        { title: 'Projects', href: '/client-portal/projects' },
        {
            title: project.project_name,
            href: `/client-portal/projects/${project.id}?tab=tasks`,
        },
        {
            title: `Task #${task.id}: ${task.task_title}`,
            href: `/client-portal/projects/${project.id}/tasks/${task.id}/conversation`,
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
            const res = await fetch(`/task-messages/project/${task.id}`, {
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
            console.error('Failed to refresh task messages:', err);
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

    // Send new message
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!inputText.trim() && !selectedFile) || isSending) return;

        setIsSending(true);
        setErrorMessage(null);

        try {
            const formData = new FormData();
            formData.append('task_type', 'project');
            formData.append('task_id', String(task.id));
            if (inputText.trim()) {
                formData.append('message', inputText.trim());
            }
            if (selectedFile) {
                formData.append('attachment', selectedFile);
            }

            const res = await fetch('/task-messages/store', {
                method: 'POST',
                headers: {
                    'X-XSRF-TOKEN': getXsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.success && data.message) {
                setMessages((prev) => [...prev, data.message]);
                setInputText('');
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setTimeout(() => textareaRef.current?.focus(), 50);
            } else {
                setErrorMessage(data.error || 'Failed to post message. Please try again.');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Network error occurred. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    // Delete message
    const handleDeleteMessage = async () => {
        if (!messageToDelete || isDeletingMessage) return;

        setIsDeletingMessage(true);
        try {
            const res = await fetch(`/task-messages/destroy/${messageToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'X-XSRF-TOKEN': getXsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });

            if (res.ok) {
                setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
                setMessageToDelete(null);
            } else {
                alert('Could not delete message. You may not have permission.');
            }
        } catch (err) {
            console.error('Error deleting message:', err);
            alert('Network error while deleting message.');
        } finally {
            setIsDeletingMessage(false);
        }
    };

    // Status quick change
    const handleStatusChange = (newStatus: string) => {
        if (newStatus === currentStatus || isUpdatingStatus) return;
        setIsUpdatingStatus(true);

        router.post(
            `/client-portal/projects/tasks/${task.id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCurrentStatus(newStatus);
                    setIsUpdatingStatus(false);
                },
                onError: (errs) => {
                    setIsUpdatingStatus(false);
                    alert(Object.values(errs)[0] || 'Failed to update task status.');
                },
            }
        );
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return 'Not set';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const getPriorityBadge = (p?: string) => {
        switch (p) {
            case 'urgent':
                return {
                    label: 'Urgent Priority',
                    className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900',
                };
            case 'high':
                return {
                    label: 'High Priority',
                    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900',
                };
            case 'medium':
                return {
                    label: 'Medium Priority',
                    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900',
                };
            default:
                return {
                    label: 'Low Priority',
                    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                };
        }
    };

    const priorityBadge = getPriorityBadge(task.priority);

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="projects">
            <Head title={`Task Discussion: ${task.task_title} | ${project.project_name}`} />

            <div className="p-2 sm:p-6 w-full space-y-5 bg-slate-50/50 dark:bg-slate-950">
                {/* 1. TOP CONTEXT HEADER BAR WITH BACK BUTTON */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Task Identity & Badges */}
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="size-11 rounded-xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            <ListTodo className="size-5" />
                        </div>
                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-extrabold border border-blue-200 dark:border-blue-800">
                                    TSK-{task.id}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                                    <FolderKanban className="size-3 text-blue-500" />
                                    <span>{project.project_name}</span>
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${priorityBadge.className}`}
                                >
                                    {task.priority || 'medium'}
                                </span>
                            </div>
                            <h1 className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight truncate">
                                {task.task_title}
                            </h1>
                        </div>
                    </div>

                    {/* Right: Actions (Back to Project Tasks & Refresh) */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <button
                            type="button"
                            onClick={() => fetchMessages(true)}
                            disabled={isRefreshing}
                            className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                            title="Refresh conversation thread"
                        >
                            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Direct Back to Project Tasks Button */}
                        <Link
                            href={`/client-portal/projects/${project.id}?tab=tasks`}
                            className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
                            title="Return directly to Project Tasks Tab"
                        >
                            <ArrowLeft className="size-4" />
                            <span>Back to Project Tasks</span>
                        </Link>
                    </div>
                </div>

                {/* 2. MAIN 2-COLUMN LAYOUT: (DISCUSSIONS STREAM + SIDEBAR INFO) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* LEFT COLUMN: TASK DESCRIPTION & DISCUSSION STREAM (2 COLS) */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Task Description Card */}
                        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <AlignLeft className="size-4 text-blue-600 dark:text-blue-400" />
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                                        Task Scope & Description
                                    </h3>
                                </div>
                                {task.attachment && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPreviewFile({
                                                url: task.attachment!,
                                                name: task.attachment_name || task.task_title,
                                            })
                                        }
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/60 dark:border-blue-800/60 hover:bg-blue-100 cursor-pointer transition-all"
                                    >
                                        <Paperclip className="size-3" />
                                        <span>View Document</span>
                                        <Eye className="size-3 opacity-70" />
                                    </button>
                                )}
                            </div>

                            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium min-h-[60px]">
                                {task.description ? (
                                    task.description
                                ) : (
                                    <span className="text-slate-400 italic font-normal text-xs">
                                        No detailed description provided for this deliverable.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* LIVE DISCUSSION STREAM */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
                            {/* Discussion Card Header */}
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
                                            Real-time conversation between Assigned Staff and Project Team
                                        </p>
                                    </div>
                                </div>
                                {task.assigned_employee ? (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                                        Live Thread Active
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200/60">
                                        Pending Assignment
                                    </span>
                                )}
                            </div>

                            {/* Messages Thread List */}
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
                                                Start the discussion below to send questions, clarify deliverables, or share updates with the team.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = currentUserId ? msg.user_id === currentUserId : false;
                                        const isSenderAdmin =
                                            msg.user?.type === 'admin' ||
                                            msg.user?.name?.toLowerCase().includes('admin');

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${
                                                    isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                                                }`}
                                            >
                                                {/* Avatar */}
                                                <div className="shrink-0 pt-1">
                                                    {msg.user?.avatar ? (
                                                        <img
                                                            src={msg.user.avatar}
                                                            alt={msg.user.name}
                                                            className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                                                        />
                                                    ) : (
                                                        <div
                                                            className={`size-7 rounded-full flex items-center justify-center text-[10px] font-black uppercase text-white shadow-2xs ${
                                                                isMe
                                                                    ? 'bg-blue-600'
                                                                    : isSenderAdmin
                                                                    ? 'bg-purple-600'
                                                                    : 'bg-emerald-600'
                                                            }`}
                                                        >
                                                            {msg.user?.name?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bubble Container */}
                                                <div className={`space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                                            {isMe ? 'You' : msg.user?.name || 'User'}
                                                        </span>
                                                        <span>&bull;</span>
                                                        <span>{formatTime(msg.created_at)}</span>
                                                    </div>

                                                    <div
                                                        className={`p-3 rounded-xl text-xs leading-relaxed shadow-xs break-words relative group ${
                                                            isMe
                                                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white rounded-tr-xs'
                                                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs'
                                                        }`}
                                                    >
                                                        <p className="whitespace-pre-wrap font-medium">{msg.message}</p>

                                                        {/* Attachment in Message */}
                                                        {msg.attachment && (
                                                            <div className="mt-2.5 pt-2.5 border-t border-white/20 dark:border-slate-800">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setPreviewFile({
                                                                            url: msg.attachment!,
                                                                            name: msg.attachment_name || 'Discussion Attachment',
                                                                        })
                                                                    }
                                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                                        isMe
                                                                            ? 'bg-white/20 hover:bg-white/30 text-white'
                                                                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                                                                    }`}
                                                                >
                                                                    <FileText className="size-3.5 shrink-0" />
                                                                    <span className="truncate max-w-[200px]">
                                                                        {msg.attachment_name || 'View Attachment'}
                                                                    </span>
                                                                    <Eye className="size-3 shrink-0 ml-1" />
                                                                </button>
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

                            {/* Reply Composer Form / Unassigned Notice */}
                            {task.assigned_employee ? (
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
                                            placeholder="Type your message, query, or task update... (Press Enter to send, Shift+Enter for new line)"
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
                                                title="Attach File (Images, Documents up to 10MB)"
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
                            ) : (
                                <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/30 flex items-start gap-3">
                                    <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                                            Task Not Assigned to an Employee
                                        </h5>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                                            This task must be assigned to an employee before conversation and team queries can take place.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: TASK DETAILS & STATUS SIDEBAR (1 COL) */}
                    <div className="space-y-5">
                        {/* 1. STATUS & PRIORITY CARD */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                                Status & Priority
                            </h4>

                            {/* Status Selector */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                    Current Task Status
                                </label>
                                {hasPermission(user, 'edit-client-portal-project-tasks') ? (
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
                                ) : (
                                    <div className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center capitalize">
                                        {currentStatus.replace('_', ' ')}
                                    </div>
                                )}
                            </div>

                            {/* Priority Level */}
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

                        {/* 2. ASSIGNED STAFF ASSIGNEE CARD */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
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

                        {/* 3. ASSOCIATED PROJECT WORKSPACE CARD */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                                Project Workspace
                            </h4>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block">
                                        {project.project_code}
                                    </span>
                                    <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                                        {project.project_name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Client: {project.client?.company_name || project.client?.name || client.name}
                                    </p>
                                </div>

                                <Link
                                    href={`/client-portal/projects/${project.id}?tab=tasks`}
                                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <FolderKanban className="size-3.5 text-blue-600" />
                                    <span>Open Project Overview</span>
                                </Link>
                            </div>
                        </div>

                        {/* 4. TASK TIMELINE & DATES */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                                Task Timeline
                            </h4>

                            <div className="space-y-2.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 flex items-center gap-1.5">
                                        <Calendar className="size-3.5" />
                                        <span>Start Date</span>
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {formatDate(task.start_date)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400 flex items-center gap-1.5">
                                        <Clock className="size-3.5" />
                                        <span>Due Date</span>
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {formatDate(task.due_date)}
                                    </span>
                                </div>

                                {task.completed_at && (
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Completed</span>
                                        </span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatDate(task.completed_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DELETE MESSAGE CONFIRMATION MODAL */}
            {messageToDelete && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                        <div className="flex items-center gap-3 text-rose-600">
                            <div className="size-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                                <Trash2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                                    Delete Discussion Entry?
                                </h3>
                                <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            Are you sure you want to permanently remove this message and its attachments from the task thread?
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setMessageToDelete(null)}
                                disabled={isDeletingMessage}
                                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteMessage}
                                disabled={isDeletingMessage}
                                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {isDeletingMessage && <Loader2 className="size-3.5 animate-spin" />}
                                <span>Delete Message</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ATTACHMENT PREVIEW MODAL */}
            {previewFile && (
                <FilePreviewModal
                    isOpen={Boolean(previewFile)}
                    onClose={() => setPreviewFile(null)}
                    fileUrl={previewFile.url}
                    fileName={previewFile.name}
                    fileType={previewFile.type}
                    fileSize={previewFile.size}
                />
            )}
        </ClientPortalLayout>
    );
}
