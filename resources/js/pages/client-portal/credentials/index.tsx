import Pagination, { type PaginatedData } from '@/components/pagination';
import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    Code2,
    Copy,
    Database,
    Edit2,
    ExternalLink,
    Eye,
    EyeOff,
    Globe,
    Key,
    Layers,
    LoaderCircle,
    Plus,
    Search,
    Server,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

export interface CredentialItem {
    id: number;
    client_id: number;
    title: string;
    type: 'hosting' | 'cms' | 'database' | 'domain' | 'api' | 'other';
    username: string | null;
    password: string | null;
    url: string | null;
    notes: string | null;
    created_at: string;
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
    credentials: PaginatedData<CredentialItem>;
    stats: {
        total: number;
        hosting: number;
        cms: number;
        database: number;
        domain: number;
        api: number;
        other: number;
    };
    filters?: {
        search?: string;
        type?: string;
    };
}

const CATEGORY_CONFIG: Record<
    CredentialItem['type'],
    { label: string; icon: any; color: string; badgeBg: string }
> = {
    hosting: {
        label: 'Hosting & Server',
        icon: Server,
        color: 'text-indigo-600 dark:text-indigo-400',
        badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60',
    },
    cms: {
        label: 'CMS / Admin',
        icon: Layers,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60',
    },
    database: {
        label: 'Database',
        icon: Database,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60',
    },
    domain: {
        label: 'Domain Registrar',
        icon: Globe,
        color: 'text-teal-600 dark:text-teal-400',
        badgeBg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/60',
    },
    api: {
        label: 'API Key / Token',
        icon: Code2,
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60',
    },
    other: {
        label: 'Other Login',
        icon: Key,
        color: 'text-slate-600 dark:text-slate-400',
        badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    },
};

export default function ClientPortalCredentialsIndex({
    client,
    credentials,
    stats,
    filters,
}: ClientPortalCredentialsIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: 'Credentials & Logins', href: '/client-portal/credentials' },
    ];

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedType, setSelectedType] = useState(filters?.type || '');

    // Password visibility state
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    // Toast copy state
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Modal state for Create / Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState<CredentialItem | null>(null);

    // Delete modal state
    const [deletingCredential, setDeletingCredential] = useState<CredentialItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isFirstRender = useRef(true);

    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string, fieldKey: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Inertia Form Hook
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        title: '',
        type: 'other' as CredentialItem['type'],
        username: '',
        password: '',
        url: '',
        notes: '',
    });

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            router.get(
                '/client-portal/credentials',
                {
                    search: searchQuery,
                    type: selectedType,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedType]);

    const openCreateModal = () => {
        setEditingCredential(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (item: CredentialItem) => {
        setEditingCredential(item);
        clearErrors();
        setData({
            title: item.title,
            type: item.type,
            username: item.username || '',
            password: item.password || '',
            url: item.url || '',
            notes: item.notes || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCredential(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (editingCredential) {
            put(`/client-portal/credentials/update/${editingCredential.id}`, {
                onSuccess: () => closeModal(),
            });
        } else {
            post('/client-portal/credentials/store', {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (item: CredentialItem) => {
        setDeletingCredential(item);
    };

    const handleDelete = () => {
        if (!deletingCredential) return;
        setIsDeleting(true);
        router.delete(`/client-portal/credentials/destroy/${deletingCredential.id}`, {
            onSuccess: () => {
                setDeletingCredential(null);
                setIsDeleting(false);
            },
            onError: () => setIsDeleting(false),
        });
    };

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="credentials">
            <Head title={`Credentials & Logins | ${client.name}`} />

            <div className="p-6 md:p-6 w-full space-y-6">
                {/* Header Title & Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Credentials & Access Keys
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Securely view and manage logins, hosting access, database, and API keys for {client.name}.
                        </p>
                    </div>

                    {hasPermission(user, 'create-client-portal-credentials') && (
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add Credential</span>
                        </button>
                    )}
                </div>

                {/* Toast Feedback */}
                {copiedField && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xl animate-bounce">
                        <CheckCircle2 className="size-4" />
                        <span>Copied to clipboard!</span>
                    </div>
                )}

                {/* KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Logins</p>
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Key className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hosting & Server</p>
                            <h3 className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.hosting}</h3>
                        </div>
                        <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Server className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CMS & Database</p>
                            <h3 className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                                {stats.cms + stats.database}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <Database className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">API Keys & Other</p>
                            <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                {stats.api + stats.domain + stats.other}
                            </h3>
                        </div>
                        <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Code2 className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full lg:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title, username, URL, or notes..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Categories ({stats.total})</option>
                            {(Object.keys(CATEGORY_CONFIG) as Array<CredentialItem['type']>).map((typeKey) => (
                                <option key={typeKey} value={typeKey}>
                                    {CATEGORY_CONFIG[typeKey].label} ({stats[typeKey] || 0})
                                </option>
                            ))}
                        </select>

                        {(searchQuery || selectedType) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedType('');
                                }}
                                className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Credentials Grid */}
                {credentials.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {credentials.data.map((item) => {
                            const categoryCfg = CATEGORY_CONFIG[item.type] || CATEGORY_CONFIG.other;
                            const CategoryIcon = categoryCfg.icon;
                            const isPasswordShown = !!visiblePasswords[item.id];

                            return (
                                <div
                                    key={item.id}
                                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                                >
                                    {/* Header: Badge & Actions */}
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${categoryCfg.badgeBg}`}
                                            >
                                                <CategoryIcon className="size-3.5" />
                                                {categoryCfg.label}
                                            </span>

                                            <div className="flex items-center gap-1">
                                                {hasPermission(user, 'edit-client-portal-credentials') && (
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                                                        title="Edit Credential"
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </button>
                                                )}
                                                {hasPermission(user, 'delete-client-portal-credentials') && (
                                                    <button
                                                        onClick={() => confirmDelete(item)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                                        title="Delete Credential"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-3 leading-snug">
                                            {item.title}
                                        </h3>

                                        {item.url ? (
                                            <a
                                                href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1 break-all"
                                            >
                                                <span className="truncate max-w-[220px]">{item.url}</span>
                                                <ExternalLink className="size-3 shrink-0" />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic mt-1 block">No URL provided</span>
                                        )}
                                    </div>

                                    {/* Credential Details Box */}
                                    <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                                        {/* Username */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                                    Username / Email
                                                </div>
                                                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                                                    {item.username || <span className="text-slate-400 font-sans italic font-normal">N/A</span>}
                                                </div>
                                            </div>
                                            {item.username && (
                                                <button
                                                    onClick={() => copyToClipboard(item.username!, `user_${item.id}`)}
                                                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-blue-600 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors shrink-0 cursor-pointer"
                                                    title="Copy Username"
                                                >
                                                    {copiedField === `user_${item.id}` ? (
                                                        <Check className="size-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-200/60 dark:border-slate-800" />

                                        {/* Password */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                                    Password / Key
                                                </div>
                                                <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                                                    {item.password ? (
                                                        isPasswordShown ? (
                                                            item.password
                                                        ) : (
                                                            '••••••••••••'
                                                        )
                                                    ) : (
                                                        <span className="text-slate-400 font-sans italic font-normal">N/A</span>
                                                    )}
                                                </div>
                                            </div>

                                            {item.password && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => togglePasswordVisibility(item.id)}
                                                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-blue-600 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors cursor-pointer"
                                                        title={isPasswordShown ? 'Hide Password' : 'Show Password'}
                                                    >
                                                        {isPasswordShown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(item.password!, `pass_${item.id}`)}
                                                        className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-500 hover:text-blue-600 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors cursor-pointer"
                                                        title="Copy Password"
                                                    >
                                                        {copiedField === `pass_${item.id}` ? (
                                                            <Check className="size-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="size-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Additional Notes */}
                                    {item.notes && (
                                        <div className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 leading-relaxed font-normal whitespace-pre-line">
                                            <div className="font-extrabold text-[10px] text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                                                Additional Notes:
                                            </div>
                                            {item.notes}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
                        <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                            <Key className="size-6" />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-4">
                            No credentials found
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                            {searchQuery || selectedType
                                ? 'No login credentials match your search criteria. Try clearing filters.'
                                : 'Save your hosting, cPanel, database, or API keys securely in the client portal.'}
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            {searchQuery || selectedType ? (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedType('');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
                                >
                                    Clear Filters
                                </button>
                            ) : (
                                hasPermission(user, 'create-client-portal-credentials') && (
                                    <button
                                        onClick={openCreateModal}
                                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Plus className="size-4" />
                                        <span>Add First Credential</span>
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {credentials.data.length > 0 && <Pagination meta={credentials} />}
            </div>

            {/* Create / Edit Credential Modal (Matching Project Modal Standard) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <Key className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                                        {editingCredential ? 'Edit Credential' : 'Add New Credential'}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium">Store login details, access links, and keys securely.</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Form without HTML browser validation (server side validation) */}
                        <form noValidate onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Title (Full Width) */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Title / Service Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        placeholder="e.g. WordPress Admin, cPanel Login, AWS DB"
                                        className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                            errors.title
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {errors.title && <p className="text-rose-500 text-xs font-medium mt-1">{errors.title}</p>}
                                </div>

                                {/* Category / Type */}
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Category / Type <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value as CredentialItem['type'])}
                                        className={`w-full h-10 px-3 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none transition-all ${
                                            errors.type
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600'
                                        }`}
                                    >
                                        {(Object.keys(CATEGORY_CONFIG) as Array<CredentialItem['type']>).map((typeKey) => (
                                            <option key={typeKey} value={typeKey}>
                                                {CATEGORY_CONFIG[typeKey].label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.type && <p className="text-rose-500 text-xs font-medium mt-1">{errors.type}</p>}
                                </div>

                                {/* Login URL */}
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Login / Portal URL
                                    </label>
                                    <input
                                        type="text"
                                        value={data.url}
                                        onChange={(e) => setData('url', e.target.value)}
                                        placeholder="e.g. https://example.com/wp-admin"
                                        className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                            errors.url
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {errors.url && <p className="text-rose-500 text-xs font-medium mt-1">{errors.url}</p>}
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Username / Email
                                    </label>
                                    <input
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        placeholder="e.g. admin@domain.com or root"
                                        className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                            errors.username
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {errors.username && <p className="text-rose-500 text-xs font-medium mt-1">{errors.username}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Password / Key
                                    </label>
                                    <input
                                        type="text"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="e.g. P@ssw0rd123! or sk_live_xxx"
                                        className={`w-full h-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                            errors.password
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {errors.password && <p className="text-rose-500 text-xs font-medium mt-1">{errors.password}</p>}
                                </div>

                                {/* Additional Notes (Full Width) */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Additional Notes & Instructions
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Add port numbers, SSH key info, or server IP details..."
                                        className={`w-full p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                                            errors.notes
                                                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {errors.notes && <p className="text-rose-500 text-xs font-medium mt-1">{errors.notes}</p>}
                                </div>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>{editingCredential ? 'Update Credential' : 'Save Credential'}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingCredential && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 text-center">
                        <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200/60 dark:border-rose-800 flex items-center justify-center mx-auto">
                            <AlertTriangle className="size-6" />
                        </div>

                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Credential?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingCredential.title}</strong>? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setDeletingCredential(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                {isDeleting && <LoaderCircle className="size-4 animate-spin" />}
                                <span>Confirm Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ClientPortalLayout>
    );
}
