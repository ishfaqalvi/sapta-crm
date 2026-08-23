import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Bell,
    Check,
    CheckCheck,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    Filter,
    Globe,
    Info,
    LoaderCircle,
    RefreshCw,
    Search,
    Server,
    ShieldAlert,
    Trash2,
    X,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

interface NotificationRecord {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: {
        title?: string;
        message?: string;
        type?: string;
        severity?: 'info' | 'success' | 'warning' | 'urgent';
        action_url?: string;
        metadata?: Record<string, any>;
        created_at?: string;
    };
    read_at: string | null;
    created_at: string;
}

interface NotificationsIndexProps {
    notifications: PaginatedData<NotificationRecord>;
    unreadCount: number;
    totalCount: number;
    filters: {
        filter?: string;
        search?: string;
    };
}

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getNotificationIcon(type: string, severity: string) {
    if (severity === 'urgent') {
        return <AlertTriangle className="size-5 text-rose-600 dark:text-rose-400" />;
    }
    if (type?.includes('domain')) {
        return <Globe className="size-5 text-blue-600 dark:text-blue-400" />;
    }
    if (type?.includes('hosting')) {
        return <Server className="size-5 text-purple-600 dark:text-purple-400" />;
    }
    if (type?.includes('invoice') || type?.includes('payment') || type?.includes('payroll')) {
        return <CreditCard className="size-5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (type?.includes('task')) {
        return <CheckCircle2 className="size-5 text-amber-600 dark:text-amber-400" />;
    }
    if (severity === 'warning') {
        return <Clock className="size-5 text-amber-600 dark:text-amber-400" />;
    }
    return <Info className="size-5 text-blue-600 dark:text-blue-400" />;
}

function getIconBg(severity: string) {
    switch (severity) {
        case 'urgent':
            return 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/50';
        case 'warning':
            return 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/50';
        case 'success':
            return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/50';
        default:
            return 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/50';
    }
}

function getSeverityBadge(severity: string) {
    switch (severity) {
        case 'urgent':
            return (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Urgent Alert
                </span>
            );
        case 'warning':
            return (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Warning
                </span>
            );
        case 'success':
            return (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Completed
                </span>
            );
        default:
            return (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Information
                </span>
            );
    }
}

export default function NotificationsIndex({
    notifications,
    unreadCount,
    totalCount,
    filters,
}: NotificationsIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const currentFilter = filters.filter || 'all';

    // Delete Confirmation Modal State
    const [deletingNotification, setDeletingNotification] = useState<NotificationRecord | null>(null);
    const [isDeletingSingle, setIsDeletingSingle] = useState(false);

    // Clear All Confirmation Modal State
    const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
    const [isClearingAll, setIsClearingAll] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/notifications',
            {
                filter: currentFilter,
                search: searchTerm,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleFilterChange = (newFilter: string) => {
        router.get(
            '/notifications',
            {
                filter: newFilter,
                search: searchTerm,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleMarkAsRead = (id: string) => {
        router.post(`/notifications/${id}/read`, {}, { preserveScroll: true });
    };

    const handleMarkAllRead = () => {
        router.post('/notifications/mark-all-read', {}, { preserveScroll: true });
    };

    const handleConfirmDeleteSingle = () => {
        if (!deletingNotification) return;
        setIsDeletingSingle(true);
        router.delete(`/notifications/${deletingNotification.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeletingSingle(false);
                setDeletingNotification(null);
            },
        });
    };

    const handleConfirmClearAll = () => {
        setIsClearingAll(true);
        router.delete('/notifications/clear-all', {
            preserveScroll: true,
            onFinish: () => {
                setIsClearingAll(false);
                setIsClearAllModalOpen(false);
            },
        });
    };

    const readCount = Math.max(0, totalCount - unreadCount);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification Center" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <span>Notification Center</span>
                            {unreadCount > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                                    {unreadCount} Unread
                                </span>
                            )}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Real-time system alerts, automated domain & hosting renewal reminders, invoice notices, and task deadlines.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
                        {unreadCount > 0 && (
                            <Button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="h-10 px-4 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                            >
                                <CheckCheck className="size-4" />
                                <span>Mark All as Read</span>
                            </Button>
                        )}

                        {totalCount > 0 && (
                            <Button
                                type="button"
                                onClick={() => setIsClearAllModalOpen(true)}
                                variant="outline"
                                className="h-10 px-3.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                                <Trash2 className="size-4" />
                                <span>Clear History</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* KPI Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Alerts</span>
                            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalCount}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <Bell className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Unread Pending</span>
                            <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{unreadCount}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Read & Archived</span>
                            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{readCount}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <button
                            type="button"
                            onClick={() => handleFilterChange('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                currentFilter === 'all'
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            All Alerts ({totalCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('unread')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                currentFilter === 'unread'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('read')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                currentFilter === 'read'
                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Archived / Read ({readCount})
                        </button>
                    </div>

                    {/* Search Input */}
                    <form onSubmit={handleSearch} className="relative w-full md:w-80">
                        <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search alerts by title or content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 pl-9 pr-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:bg-white transition-all font-medium"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm('');
                                    router.get('/notifications', { filter: currentFilter });
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </form>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {notifications.data.length === 0 ? (
                        <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                            <div className="size-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Bell className="size-7" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">No notifications found</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                There are no notifications matching your current filter criteria. You are all caught up!
                            </p>
                        </div>
                    ) : (
                        notifications.data.map((item) => {
                            const isUnread = !item.read_at;
                            const title = item.data.title || 'System Notification';
                            const message = item.data.message || '';
                            const severity = item.data.severity || 'info';
                            const actionUrl = item.data.action_url;
                            const type = item.data.type || 'general';

                            return (
                                <div
                                    key={item.id}
                                    className={`p-4 sm:p-5 rounded-xl border transition-all ${
                                        isUnread
                                            ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs ring-1 ring-blue-500/10'
                                            : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3.5 min-w-0">
                                            {/* Severity Icon */}
                                            <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${getIconBg(severity)}`}>
                                                {getNotificationIcon(type, severity)}
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <h3
                                                        className={`text-sm font-bold truncate ${
                                                            isUnread
                                                                ? 'text-slate-900 dark:text-white'
                                                                : 'text-slate-800 dark:text-slate-200'
                                                        }`}
                                                    >
                                                        {title}
                                                    </h3>
                                                    {getSeverityBadge(severity)}
                                                    {isUnread && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                                            Unread
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                                                    {message}
                                                </p>

                                                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Clock className="size-3" />
                                                        <span>{timeAgo(item.created_at)}</span>
                                                    </span>
                                                    <span>•</span>
                                                    <span>{new Date(item.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Controls */}
                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
                                            {actionUrl && (
                                                <Link
                                                    href={actionUrl}
                                                    onClick={() => {
                                                        if (isUnread) handleMarkAsRead(item.id);
                                                    }}
                                                    className="h-8.5 px-3.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                >
                                                    <span>View Resource</span>
                                                    <ExternalLink className="size-3" />
                                                </Link>
                                            )}

                                            {isUnread && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkAsRead(item.id)}
                                                    className="h-8.5 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                                                    title="Mark as read"
                                                >
                                                    <Check className="size-3.5" />
                                                    <span className="hidden md:inline">Mark Read</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setDeletingNotification(item)}
                                                className="h-8.5 w-8.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 transition-colors cursor-pointer inline-flex items-center justify-center"
                                                title="Delete notification"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {notifications.total > notifications.per_page && (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <Pagination meta={notifications} />
                    </div>
                )}

                {/* SINGLE NOTIFICATION DELETE CONFIRMATION MODAL */}
                {deletingNotification && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingNotification(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <Trash2 className="size-6" />
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Notification?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete this alert{' '}
                                    <strong className="text-slate-900 dark:text-white">
                                        "{deletingNotification.data.title || 'System Notification'}"
                                    </strong>
                                    ? This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingNotification(null)}
                                    disabled={isDeletingSingle}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDeleteSingle}
                                    disabled={isDeletingSingle}
                                    className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isDeletingSingle ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Notification</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CLEAR ALL NOTIFICATIONS CONFIRMATION MODAL */}
                {isClearAllModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setIsClearAllModalOpen(false)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Clear All Notification History?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to permanently clear all <strong className="text-slate-900 dark:text-white">{totalCount}</strong> notification records? All alerts and history will be deleted. This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsClearAllModalOpen(false)}
                                    disabled={isClearingAll}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmClearAll}
                                    disabled={isClearingAll}
                                    className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isClearingAll ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Clearing History...</span>
                                        </>
                                    ) : (
                                        <span>Yes, Clear All</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
