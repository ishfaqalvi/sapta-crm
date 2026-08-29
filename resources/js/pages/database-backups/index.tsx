import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Clock,
    Database,
    Download,
    FileArchive,
    HardDrive,
    HardDriveDownload,
    Info,
    Loader2,
    LoaderCircle,
    Plus,
    RefreshCw,
    Search,
    Server,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'System & Administration', href: '/settings' },
    { title: 'Database Backups', href: '/database-backups' },
];

export interface BackupItem {
    filename: string;
    size_bytes: number;
    size_human: string;
    created_at: string;
    created_at_human: string;
    extension: string;
}

interface DatabaseBackupsIndexProps {
    backups: BackupItem[];
    stats: {
        total_backups: number;
        total_storage_bytes: number;
        total_storage_human: string;
        last_backup_at: string | null;
        database_name: string;
        database_size_bytes: number;
        database_size_human: string;
        total_tables: number;
        total_rows_estimate: number;
        mysql_version: string;
    };
}

export default function DatabaseBackupsIndex({ backups = [], stats }: DatabaseBackupsIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [deletingBackup, setDeletingBackup] = useState<BackupItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const canCreate = hasPermission(user, 'create-database-backups');
    const canDownload = hasPermission(user, 'download-database-backups');
    const canDelete = hasPermission(user, 'delete-database-backups');

    const filteredBackups = backups.filter((b) =>
        b.filename.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const handleCreateBackup = () => {
        if (isCreating) return;

        setIsCreating(true);
        router.post(
            '/database-backups/create',
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsCreating(false);
                },
            }
        );
    };

    const handleDeleteBackup = () => {
        if (!deletingBackup || isDeleting) return;

        setIsDeleting(true);
        router.delete(`/database-backups/destroy/${encodeURIComponent(deletingBackup.filename)}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingBackup(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '—';
        const d = new Date(isoString);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Database Backups & Disaster Recovery" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Banner */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Database Backups
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Protected
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Create, download, and manage full SQL database snapshots for offline backups and disaster recovery.
                        </p>
                    </div>

                    {canCreate && (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleCreateBackup}
                                disabled={isCreating}
                                className="h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border-0"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Generating SQL Dump...</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        <span>Generate Backup Now</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* KPI / Statistics Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Stat 1: Total Backups */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Total Backups
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                <FileArchive className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                {stats.total_backups}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">snapshots</span>
                        </div>
                    </div>

                    {/* Stat 2: Storage Used */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Backup Storage
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <HardDrive className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                {stats.total_storage_human}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">on disk</span>
                        </div>
                    </div>

                    {/* Stat 3: Live Database Size */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Live Database
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <Server className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                {stats.database_size_human}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                ({stats.total_tables} tables)
                            </span>
                        </div>
                    </div>

                    {/* Stat 4: Last Backup Date */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Last Backup
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                {stats.last_backup_at ? formatDate(stats.last_backup_at) : 'No backups yet'}
                            </span>
                            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                DB: {stats.database_name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Informational Guidance Box */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="text-xs leading-relaxed sm:text-sm">
                        <span className="font-semibold">Automatic Full SQL Export: </span>
                        Each backup generates a self-contained SQL dump containing all table schemas, transactional data, foreign keys, views, and character encoding (<code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs dark:bg-blue-900/60">utf8mb4</code>). You can safely download these files for local offsite retention or migration.
                    </div>
                </div>

                {/* Backups List & Filter Section */}
                <div className="rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col gap-4 border-b border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                Available Snapshots
                            </h2>
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                {filteredBackups.length}
                            </span>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                            <Input
                                type="text"
                                placeholder="Search by filename..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                <tr>
                                    <th className="px-5 py-3.5">Backup File</th>
                                    <th className="px-5 py-3.5">Format</th>
                                    <th className="px-5 py-3.5">File Size</th>
                                    <th className="px-5 py-3.5">Created Date & Time</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {filteredBackups.length > 0 ? (
                                    filteredBackups.map((backup) => (
                                        <tr
                                            key={backup.filename}
                                            className="transition-colors hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                        <Database className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                            {backup.filename}
                                                        </span>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            {backup.created_at_human}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                    {backup.extension.toUpperCase()}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {backup.size_human}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-neutral-600 dark:text-neutral-400">
                                                {formatDate(backup.created_at)}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canDownload && (
                                                        <a
                                                            href={`/database-backups/download/${encodeURIComponent(backup.filename)}`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-xs transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
                                                            title="Download SQL Snapshot"
                                                        >
                                                            <HardDriveDownload className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                            <span>Download</span>
                                                        </a>
                                                    )}

                                                    {canDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setDeletingBackup(backup)}
                                                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
                                                            title="Delete Snapshot"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                                                    <Database className="h-6 w-6" />
                                                </div>
                                                <h3 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {searchQuery ? 'No matching backups found' : 'No backups created yet'}
                                                </h3>
                                                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                                    {searchQuery
                                                        ? `No backup files match "${searchQuery}"`
                                                        : 'Take your first database backup to protect your system data.'}
                                                </p>
                                                {!searchQuery && canCreate && (
                                                    <Button
                                                        onClick={handleCreateBackup}
                                                        disabled={isCreating}
                                                        size="sm"
                                                        className="mt-4 h-9 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-[0.99] inline-flex items-center gap-1.5 cursor-pointer border-0"
                                                    >
                                                        {isCreating ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Plus className="h-3.5 w-3.5" />
                                                        )}
                                                        <span>Take First Backup</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Backup Confirmation Modal */}
            {deletingBackup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                        <button
                            type="button"
                            onClick={() => setDeletingBackup(null)}
                            className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                            <AlertTriangle className="size-6" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                Delete Backup Snapshot?
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Are you sure you want to permanently delete backup <strong className="text-slate-900 dark:text-white font-mono">"{deletingBackup.filename}"</strong> ({deletingBackup.size_human})? This action cannot be undone and will permanently remove this database snapshot.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingBackup(null)}
                                disabled={isDeleting}
                                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteBackup}
                                disabled={isDeleting}
                                className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                            >
                                {isDeleting ? (
                                    <>
                                        <LoaderCircle className="size-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete Backup</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
