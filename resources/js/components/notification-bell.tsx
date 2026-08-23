import { CrmNotificationItem, SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
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
    FileText,
    Globe,
    Info,
    Server,
    ShieldAlert,
    Trash2,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type: string, severity: string) {
    if (severity === 'urgent') {
        return <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />;
    }
    if (type.includes('domain')) {
        return <Globe className="size-4 text-blue-600 dark:text-blue-400" />;
    }
    if (type.includes('hosting')) {
        return <Server className="size-4 text-purple-600 dark:text-purple-400" />;
    }
    if (type.includes('invoice') || type.includes('payment') || type.includes('payroll')) {
        return <CreditCard className="size-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (type.includes('task')) {
        return <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />;
    }
    if (severity === 'warning') {
        return <Clock className="size-4 text-amber-600 dark:text-amber-400" />;
    }
    return <Info className="size-4 text-blue-600 dark:text-blue-400" />;
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

export default function NotificationBell() {
    const { auth } = usePage<SharedData>().props;
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = auth?.unread_notifications_count ?? 0;
    const notifications: CrmNotificationItem[] = auth?.recent_notifications ?? [];

    // Filter notifications based on tab
    const filteredNotifications = notifications.filter((n) => {
        if (activeTab === 'unread') return !n.read_at;
        return true;
    });

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = (notification: CrmNotificationItem) => {
        if (!notification.read_at) {
            router.post(
                `/notifications/${notification.id}/read`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (notification.action_url) {
                            setIsOpen(false);
                            router.visit(notification.action_url);
                        }
                    },
                }
            );
        } else if (notification.action_url) {
            setIsOpen(false);
            router.visit(notification.action_url);
        }
    };

    const handleMarkAllRead = () => {
        router.post(
            '/notifications/mark-all-read',
            {},
            {
                preserveScroll: true,
            }
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isOpen
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title="Notifications"
                aria-label="View notifications"
            >
                <Bell className="size-4.5" />

                {/* Live Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-in zoom-in-50">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2.5 w-[360px] sm:w-[410px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400">
                                    {unreadCount} new
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    Up to date
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllRead}
                                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <CheckCheck className="size-3.5" />
                                <span>Mark all as read</span>
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-xs">
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                activeTab === 'all'
                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('unread')}
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                activeTab === 'unread'
                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-8 text-center space-y-2">
                                <div className="size-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Bell className="size-5" />
                                </div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No notifications found</p>
                                <p className="text-[11px] text-slate-400">You are completely caught up with all tasks and alerts!</p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => {
                                const isUnread = !notification.read_at;
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left group ${
                                            isUnread
                                                ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/40'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        {/* Icon */}
                                        <div
                                            className={`p-2 rounded-xl border shrink-0 mt-0.5 ${getIconBg(
                                                notification.severity
                                            )}`}
                                        >
                                            {getNotificationIcon(notification.type, notification.severity)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p
                                                    className={`text-xs font-bold truncate ${
                                                        isUnread
                                                            ? 'text-slate-900 dark:text-white'
                                                            : 'text-slate-700 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {notification.title}
                                                </p>
                                                {isUnread && (
                                                    <span className="size-2 rounded-full bg-blue-600 shrink-0" />
                                                )}
                                            </div>

                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                    {timeAgo(notification.created_at)}
                                                </span>
                                                {notification.action_url && (
                                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:underline">
                                                        <span>View Details</span>
                                                        <ExternalLink className="size-2.5" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 text-center">
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1.5"
                        >
                            <span>Open Notification Center</span>
                            <ExternalLink className="size-3" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
