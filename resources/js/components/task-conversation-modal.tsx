import { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    Paperclip,
    FileText,
    Download,
    Trash2,
    Loader2,
    MessageSquare,
    User,
    Calendar,
    Clock,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Briefcase,
    Globe,
    FolderKanban,
    Layers,
    AlignLeft,
    ExternalLink,
    Tag,
    CheckSquare,
} from 'lucide-react';

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

export interface ConversationTaskInfo {
    id: number;
    task_title: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string | null;
    due_date?: string | null;
    completed_at?: string | null;
    description?: string | null;
    source_type?: 'project' | 'service' | 'general';
    source_id?: number | null;
    source_title?: string | null;
    client?: {
        id?: number;
        name?: string;
        company_name?: string;
        client_code?: string;
    } | null;
    assigned_employee?: {
        id: number;
        name: string;
        employee_code?: string;
        avatar?: string | null;
    } | null;
}

interface TaskConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: ConversationTaskInfo | null;
    currentUserId?: number;
    onMessageCountChange?: (taskId: number, newCount: number) => void;
    onStatusChange?: (taskId: number, newStatus: string) => void;
}

export default function TaskConversationModal({
    isOpen,
    onClose,
    task,
    currentUserId,
    onMessageCountChange,
    onStatusChange,
}: TaskConversationModalProps) {
    const [fullTask, setFullTask] = useState<ConversationTaskInfo | null>(task);
    const [messages, setMessages] = useState<TaskMessageItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<TaskMessageItem | null>(null);
    const [isDeletingMessage, setIsDeletingMessage] = useState(false);
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'details' | 'chat'>('all');

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Fetch conversation messages & updated task metadata
    const fetchMessages = async (showLoading = true) => {
        if (!task) return;
        if (showLoading) setIsLoading(true);
        setErrorMessage(null);

        try {
            const type = task.source_type || 'project';
            const response = await fetch(`/task-messages/${type}/${task.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load task details');
            }

            const data = await response.json();
            if (data.success) {
                if (data.task) {
                    setFullTask((prev) => ({ ...prev, ...data.task }));
                }
                if (Array.isArray(data.messages)) {
                    setMessages(data.messages);
                    if (onMessageCountChange) {
                        onMessageCountChange(task.id, data.messages.length);
                    }
                }
            }
        } catch (err: any) {
            console.error('Error fetching task details & messages:', err);
            setErrorMessage(err.message || 'Failed to load task details & conversation.');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // Load on open or task change
    useEffect(() => {
        if (isOpen && task) {
            setFullTask(task);
            fetchMessages(true);
            setInputText('');
            setSelectedFile(null);
            setErrorMessage(null);
        } else {
            setMessages([]);
            setFullTask(null);
        }
    }, [isOpen, task?.id, task?.source_type]);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Background interval poll every 12 seconds while modal is open
    useEffect(() => {
        if (!isOpen || !task) return;

        const interval = setInterval(() => {
            fetchMessages(false);
        }, 12000);

        return () => clearInterval(interval);
    }, [isOpen, task?.id]);

    if (!isOpen || !task) return null;

    const displayTask = fullTask || task;

    const getCsrfToken = () => {
        const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        if (metaTag && metaTag.content) {
            return metaTag.content;
        }
        const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
        return '';
    };

    // Send Message Handler
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!inputText.trim() && !selectedFile) || isSending) return;

        setIsSending(true);
        setErrorMessage(null);

        const csrfToken = getCsrfToken();
        const formData = new FormData();
        formData.append('task_type', displayTask.source_type || 'project');
        formData.append('task_id', String(displayTask.id));
        formData.append('message', inputText.trim() || '(Attachment uploaded)');
        if (csrfToken) {
            formData.append('_token', csrfToken);
        }
        if (selectedFile) {
            formData.append('attachment', selectedFile);
        }

        try {
            const headers: Record<string, string> = {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
                headers['X-XSRF-TOKEN'] = csrfToken;
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
                const newMessages = [...messages, data.message];
                setMessages(newMessages);
                setInputText('');
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                if (onMessageCountChange) {
                    onMessageCountChange(displayTask.id, newMessages.length);
                }
            }
        } catch (err: any) {
            console.error('Error sending task message:', err);
            setErrorMessage(err.message || 'Could not send your message. Please try again.');
        } finally {
            setIsSending(false);
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    };

    // Delete Message Handler with Modal Confirmation
    const confirmDeleteMessage = async () => {
        if (!messageToDelete || isDeletingMessage) return;

        setIsDeletingMessage(true);
        const messageId = messageToDelete.id;
        const csrfToken = getCsrfToken();
        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };
        if (csrfToken) {
            headers['X-CSRF-TOKEN'] = csrfToken;
            headers['X-XSRF-TOKEN'] = csrfToken;
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

            const newMessages = messages.filter((m) => m.id !== messageId);
            setMessages(newMessages);
            if (onMessageCountChange && displayTask) {
                onMessageCountChange(displayTask.id, newMessages.length);
            }
            setMessageToDelete(null);
        } catch (err: any) {
            console.error('Error deleting message:', err);
            setErrorMessage(err.message || 'Could not delete message.');
        } finally {
            setIsDeletingMessage(false);
        }
    };

    // Format Timestamp
    const formatTimestamp = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (isToday) {
                return `Today at ${timeStr}`;
            }
            return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
        } catch {
            return dateStr;
        }
    };

    const getPriorityBadgeClass = (priority?: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60';
            case 'high':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60';
            case 'medium':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60';
        }
    };

    const getStatusBadgeClass = (status?: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60';
            case 'in_review':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col h-[92vh] max-h-[840px] overflow-hidden transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. TOP HEADER */}
                <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-start justify-between gap-3 shrink-0">
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                                {displayTask.source_type === 'service' ? 'Service Deliverable' : 'Project Task'}
                            </span>

                            {displayTask.priority && (
                                <span
                                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getPriorityBadgeClass(
                                        displayTask.priority
                                    )}`}
                                >
                                    {displayTask.priority}
                                </span>
                            )}

                            {displayTask.status && (
                                <span
                                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeClass(
                                        displayTask.status
                                    )}`}
                                >
                                    {displayTask.status.replace('_', ' ')}
                                </span>
                            )}
                        </div>

                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug break-words">
                            {displayTask.task_title}
                        </h2>
                    </div>

                    {/* Header Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Mobile Tab Switcher */}
                        <div className="lg:hidden flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs font-bold mr-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('details')}
                                className={`px-2.5 py-1 rounded-lg transition-all ${activeTab === 'details'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                Details
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('chat')}
                                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${activeTab === 'chat'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                <MessageSquare className="size-3" />
                                <span>({messages.length})</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchMessages(true)}
                            disabled={isLoading}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Refresh task & conversation"
                        >
                            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Close modal"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* 2. BODY CONTENT (SPLIT LAYOUT ON DESKTOP) */}
                <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
                    {/* LEFT PANEL: TASK DETAILS & DESCRIPTION */}
                    <div
                        className={`w-full lg:w-[45%] border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white dark:bg-slate-900 scrollbar-thin ${activeTab === 'chat' ? 'hidden lg:block' : 'block'
                            }`}
                    >
                        {/* Summary Grid Cards */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            {/* Assigned Employee */}
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                    Assigned To
                                </span>
                                {displayTask.assigned_employee ? (
                                    <div className="flex items-center gap-2 pt-0.5">
                                        {displayTask.assigned_employee.avatar ? (
                                            <img
                                                src={displayTask.assigned_employee.avatar}
                                                alt={displayTask.assigned_employee.name}
                                                className="size-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                            />
                                        ) : (
                                            <div className="size-7 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold flex items-center justify-center text-[10px]">
                                                {displayTask.assigned_employee.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                                {displayTask.assigned_employee.name}
                                            </p>
                                            {displayTask.assigned_employee.employee_code && (
                                                <p className="text-[10px] text-slate-400">
                                                    {displayTask.assigned_employee.employee_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="font-semibold text-slate-400 italic">Unassigned</p>
                                )}
                            </div>

                            {/* Source Project / Service */}
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                    {displayTask.source_type === 'service' ? 'Service' : 'Project'}
                                </span>
                                <div className="space-y-0.5 pt-0.5">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={displayTask.source_title || ''}>
                                        {displayTask.source_title || 'General Workspace'}
                                    </p>
                                    {displayTask.client && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                            <Globe className="size-2.5 text-cyan-500 shrink-0" />
                                            <span>{displayTask.client.company_name || displayTask.client.name}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Start & Due Dates */}
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                    Due Date
                                </span>
                                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold pt-0.5">
                                    <Calendar className="size-3.5 text-blue-500 shrink-0" />
                                    <span>{displayTask.due_date || 'No due date'}</span>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                    Status
                                </span>
                                <div className="pt-0.5">
                                    <span
                                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusBadgeClass(
                                            displayTask.status
                                        )}`}
                                    >
                                        {displayTask.status?.replace('_', ' ') || 'To Do'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Full Description Section */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold text-xs">
                                <AlignLeft className="size-4 text-blue-600 dark:text-blue-400" />
                                <h4>Description & Requirements</h4>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[140px]">
                                {displayTask.description ? (
                                    <p className="whitespace-pre-wrap font-medium">{displayTask.description}</p>
                                ) : (
                                    <p className="text-slate-400 italic">No description provided for this task deliverable.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: LIVE CONVERSATION & DISCUSSION STREAM */}
                    <div
                        className={`w-full lg:w-[55%] flex flex-col bg-slate-50/40 dark:bg-slate-950/40 min-h-0 flex-1 ${activeTab === 'details' ? 'hidden lg:flex' : 'flex'
                            }`}
                    >
                        {/* Section Header */}
                        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                                <MessageSquare className="size-4 text-blue-600 dark:text-blue-400" />
                                <span>Task Discussion & Queries ({messages.length})</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                                Real-time notifications enabled
                            </span>
                        </div>

                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
                            {errorMessage && (
                                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {isLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <Loader2 className="size-8 animate-spin text-blue-600" />
                                    <span className="text-xs font-bold">Loading conversation thread...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                                    <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                                        <MessageSquare className="size-7" />
                                    </div>
                                    <div className="space-y-1 max-w-sm">
                                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                            No Messages Yet
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Post a query, share updates, or reply to queries between Employee and Admin regarding this task.
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
                                            className={`flex gap-3 max-w-[88%] sm:max-w-[84%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
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
                                                        className={`size-7 rounded-full flex items-center justify-center font-bold text-[10px] shadow-2xs ${isSenderAdmin
                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                            }`}
                                                    >
                                                        {msg.user?.name?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Bubble Card */}
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div
                                                    className={`flex items-center gap-1.5 text-[11px] ${isMe ? 'justify-end' : 'justify-start'
                                                        }`}
                                                >
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                        {msg.user?.name || 'Staff User'}
                                                    </span>
                                                    <span
                                                        className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider ${isSenderAdmin
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
                                                    className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs break-words relative group ${isMe
                                                        ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white rounded-tr-xs'
                                                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs'
                                                        }`}
                                                >
                                                    <p className="whitespace-pre-wrap font-medium">{msg.message}</p>

                                                    {/* Attachment */}
                                                    {msg.attachment && (
                                                        <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-800">
                                                            <a
                                                                href={msg.attachment}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isMe
                                                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                                                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                                                                    }`}
                                                            >
                                                                <FileText className="size-3.5 shrink-0" />
                                                                <span className="truncate max-w-[180px]">
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
                                                            className={`absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isMe
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

                        {/* 3. INPUT / REPLY FOOTER */}
                        <form
                            onSubmit={handleSendMessage}
                            className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0"
                        >
                            {/* Hidden File Input */}
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

                            {/* Unified Modern Input Card */}
                            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-2.5 space-y-2">
                                {/* Selected Attachment Preview Chip */}
                                {selectedFile && (
                                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-xs">
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

                                {/* Textarea */}
                                <textarea
                                    ref={textareaRef}
                                    rows={2}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message or query... (Press Enter to send, Shift+Enter for new line)"
                                    className="w-full px-2 py-1 bg-transparent border-0 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-0 resize-none leading-relaxed"
                                />

                                {/* Bottom Action Bar: Attachment on Left, Send Button on Right */}
                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`h-8 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                                            selectedFile
                                                ? 'bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950/60 dark:border-blue-800'
                                                : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-2xs'
                                        }`}
                                        title="Attach File (Images, PDFs, Documents up to 10MB)"
                                    >
                                        <Paperclip className="size-3.5" />
                                        <span className="text-[11px]">{selectedFile ? 'Change File' : 'Attach File'}</span>
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSending || (!inputText.trim() && !selectedFile)}
                                        className="h-8 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:opacity-95 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                        title="Send Message / Reply"
                                    >
                                        {isSending ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Send className="size-3.5" />
                                        )}
                                        <span>Send</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* DELETE MESSAGE CONFIRMATION MODAL */}
            {messageToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
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
}
