import Pagination, { type PaginatedData } from '@/components/pagination';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Check,
    Copy,
    Edit2,
    Key,
    Lock,
    Plus,
    Search,
    Shield,
    Trash2,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

export interface ClientPortalCredentialItem {
    id: number;
    client_id: number;
    website_project_id: number | null;
    title: string;
    type?: string;
    username?: string | null;
    password?: string | null;
    url?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

interface ClientPortalCredentialsIndexProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    credentials: PaginatedData<ClientPortalCredentialItem>;
    stats: {
        total: number;
    };
    filters?: {
        search?: string;
    };
}

export default function ClientPortalCredentialsIndex({
    client,
    credentials,
    stats,
    filters,
}: ClientPortalCredentialsIndexProps) {
    const user = (usePage().props.auth as any)?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Credentials & Logins', href: '/client-portal/credentials' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCred, setEditingCred] = useState<ClientPortalCredentialItem | null>(null);
    const [deletingCred, setDeletingCred] = useState<ClientPortalCredentialItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        title: '',
        notes: '',
    });

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/client-portal/credentials',
                { search: searchQuery },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleCopy = (text: string, idStr: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idStr);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const openCreateModal = () => {
        setEditingCred(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (cred: ClientPortalCredentialItem) => {
        setEditingCred(cred);
        clearErrors();
        const fullNotes = cred.notes || [
            cred.username ? `Username: ${cred.username}` : '',
            cred.password ? `Password: ${cred.password}` : '',
            cred.url ? `URL: ${cred.url}` : '',
        ].filter(Boolean).join('\n');

        setData({
            title: cred.title,
            notes: fullNotes,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCred(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingCred) {
            put(`/client-portal/credentials/update/${editingCred.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/client-portal/credentials/store', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = () => {
        if (!deletingCred) return;
        setIsDeleting(true);
        router.delete(`/client-portal/credentials/destroy/${deletingCred.id}`, {
            onSuccess: () => {
                setDeletingCred(null);
                setIsDeleting(false);
            },
            onError: () => setIsDeleting(false),
        });
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs}>
            <Head title="Credentials & Logins" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Shield className="size-5 text-indigo-600 dark:text-indigo-400" />
                            General Credentials & Logins
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Manage company-wide server, cPanel, database, or API credentials (non-project specific).
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-credentials') && (
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:opacity-95 transition-all cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add Credential</span>
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by title or credential text..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Credentials Cards Grid */}
                {credentials.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {credentials.data.map((cred) => {
                            const fullContent = cred.notes || [
                                cred.username ? `Username: ${cred.username}` : '',
                                cred.password ? `Password: ${cred.password}` : '',
                                cred.url ? `URL: ${cred.url}` : '',
                            ].filter(Boolean).join('\n');

                            return (
                                <div
                                    key={cred.id}
                                    className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
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
                                                {hasPermission(user, 'edit-client-portal-credentials') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(cred)}
                                                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                                                        title="Edit Credential"
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </button>
                                                )}
                                                {hasPermission(user, 'delete-client-portal-credentials') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingCred(cred)}
                                                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all cursor-pointer"
                                                        title="Delete Credential"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                            {fullContent || (
                                                <span className="text-slate-400 italic font-sans">No credentials text stored.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                        <Key className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No General Credentials Found</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                            No general credentials stored yet. Click "Add Credential" above to paste logins.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {credentials.data.length > 0 && <Pagination meta={credentials} />}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="w-full max-w-lg max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <Lock className="size-4 text-indigo-600" />
                                {editingCred ? 'Edit General Credential' : 'Add New General Credential'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Credential Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. cPanel & Database Logins / Master Server Keys"
                                    className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                {errors.title && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.title}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Credentials Details / Copy-Paste Text
                                </label>
                                <textarea
                                    rows={8}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder={`Paste all credentials here...\ne.g.\nURL: https://example.com/cpanel\nUsername: admin\nPassword: supersecretpass\nDatabase: db_name`}
                                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                />
                                {errors.notes && <p className="text-[11px] font-bold text-rose-500 mt-1">{errors.notes}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-11 px-5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : editingCred ? 'Update Credential' : 'Save Credential'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingCred && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="w-full max-w-sm max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4 text-center">
                        <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                            <Trash2 className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Credential?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{deletingCred.title}</strong>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setDeletingCred(null)}
                                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ClientPortalLayout>
    );
}
