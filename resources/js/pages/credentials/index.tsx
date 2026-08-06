import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Copy,
    Database,
    Edit2,
    Eye,
    EyeOff,
    ExternalLink,
    Globe,
    Key,
    KeyRound,
    LoaderCircle,
    Plus,
    Search,
    Shield,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Credentials & Logins',
        href: '/credentials',
    },
];

export interface AdminCredentialListItem {
    id: number;
    client_id: number;
    title: string;
    type: 'hosting' | 'cms' | 'database' | 'domain' | 'api' | 'other';
    username: string;
    password?: string;
    url?: string;
    notes?: string;
    created_at?: string;
    client?: {
        id: number;
        name: string;
        company_name?: string;
        client_code: string;
    };
}

interface CredentialsIndexProps {
    credentials: PaginatedData<AdminCredentialListItem>;
    stats: {
        total: number;
        hosting: number;
        cms: number;
        database: number;
        domain: number;
        api: number;
        other: number;
    };
    clients: Array<{ id: number; name: string; company_name?: string; client_code: string }>;
    filters: {
        search?: string;
        type?: string;
        client_id?: string;
    };
}

export default function CredentialsIndex({ credentials, stats, clients, filters }: CredentialsIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [clientFilter, setClientFilter] = useState(filters.client_id || '');

    // Visible password toggles
    const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({});
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCredential, setEditingCredential] = useState<AdminCredentialListItem | null>(null);
    const [deletingCredential, setDeletingCredential] = useState<AdminCredentialListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form options for SearchableSelect
    const clientSelectOptions = clients.map((c) => ({
        value: String(c.id),
        label: c.name,
        subLabel: `${c.client_code} • ${c.company_name || 'Individual Client'}`,
    }));

    const clientFilterOptions = [
        { value: '', label: 'All Clients', subLabel: 'Show credentials for all clients' },
        ...clientSelectOptions,
    ];

    // Forms
    const createForm = useForm({
        client_id: clients[0]?.id ? String(clients[0].id) : '',
        title: '',
        type: 'cms' as AdminCredentialListItem['type'],
        username: '',
        password: '',
        url: '',
        notes: '',
    });

    const editForm = useForm({
        client_id: '',
        title: '',
        type: 'cms' as AdminCredentialListItem['type'],
        username: '',
        password: '',
        url: '',
        notes: '',
    });

    // Debounced Search & Filter
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/credentials',
                {
                    search: searchQuery,
                    type: typeFilter,
                    client_id: clientFilter,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, typeFilter, clientFilter]);

    const toggleShowPassword = (id: number) => {
        setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/credentials', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditOpen = (cred: AdminCredentialListItem) => {
        setEditingCredential(cred);
        editForm.setData({
            client_id: String(cred.client_id),
            title: cred.title,
            type: cred.type,
            username: cred.username,
            password: cred.password || '',
            url: cred.url || '',
            notes: cred.notes || '',
        });
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingCredential) return;
        editForm.put(`/credentials/${editingCredential.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCredential(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteSubmit = () => {
        if (!deletingCredential) return;
        setIsDeleting(true);
        router.delete(`/credentials/${deletingCredential.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingCredential(null);
            },
        });
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'hosting':
                return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case 'cms':
                return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'database':
                return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            case 'domain':
                return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'api':
                return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
            default:
                return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Client Credentials & Access Vault" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Top Banner Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Client Credentials Vault & Logins
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Centralized password vault for server logins, CMS dashboards, databases, domain registries, and API keys.
                        </p>
                    </div>

                    {hasPermission(user, 'create-credentials') && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add New Credential</span>
                        </button>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Vault</p>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{stats.total} Logins</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <KeyRound className="size-4" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Hosting & cPanel</p>
                            <h3 className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">{stats.hosting}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                            <Globe className="size-4" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">CMS & Admin</p>
                            <h3 className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.cms}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <Shield className="size-4" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Databases</p>
                            <h3 className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.database}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                            <Database className="size-4" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Domains</p>
                            <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.domain}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <Globe className="size-4" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">API Keys</p>
                            <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.api}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            <Key className="size-4" />
                        </div>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 z-10" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search title, username, URL, client..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Searchable Client Filter Dropdown */}
                        <div className="w-full md:w-64">
                            <SearchableSelect
                                options={clientFilterOptions}
                                value={clientFilter}
                                onChange={(val) => setClientFilter(val)}
                                placeholder="Filter by Client"
                                searchPlaceholder="Type client name..."
                            />
                        </div>

                        {/* Category Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white px-3 focus:outline-none focus:border-blue-600 transition-all"
                        >
                            <option value="">All Categories</option>
                            <option value="hosting">Hosting / cPanel</option>
                            <option value="cms">CMS Dashboard</option>
                            <option value="database">Database</option>
                            <option value="domain">Domain Registrar</option>
                            <option value="api">API / Secret Key</option>
                            <option value="other">Other Access</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Title & Type</th>
                                    <th className="px-6 py-4">Username / Identity</th>
                                    <th className="px-6 py-4">Password & Access</th>
                                    <th className="px-6 py-4">Login URL</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {credentials.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No credentials found matching your filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    credentials.data.map((cred) => (
                                        <tr key={cred.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Client Column (Plain Badge & Details, no hyperlink) */}
                                            <td className="px-6 py-4">
                                                {cred.client ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0 border border-white/20">
                                                            {cred.client.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 space-y-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-extrabold text-slate-900 dark:text-white truncate block">
                                                                    {cred.client.name}
                                                                </span>
                                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shrink-0">
                                                                    {cred.client.client_code}
                                                                </span>
                                                            </div>
                                                            {cred.client.company_name && (
                                                                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                                                                    {cred.client.company_name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs font-medium">Unassigned Client</span>
                                                )}
                                            </td>

                                            {/* Title & Type */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className="font-bold text-slate-900 dark:text-white block">{cred.title}</span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border inline-block ${getTypeBadgeClass(
                                                            cred.type
                                                        )}`}
                                                    >
                                                        {cred.type}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Username */}
                                            <td className="px-6 py-4 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                                                {cred.username}
                                            </td>

                                            {/* Password */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs">
                                                        {showPassword[cred.id] ? cred.password : '••••••••••••'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleShowPassword(cred.id)}
                                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                                        title={showPassword[cred.id] ? 'Hide Password' : 'Show Password'}
                                                    >
                                                        {showPassword[cred.id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                                    </button>
                                                    {cred.password && (
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(cred.password!, cred.id)}
                                                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-1 cursor-pointer"
                                                            title="Copy Password"
                                                        >
                                                            {copiedId === cred.id ? (
                                                                <CheckCircle2 className="size-3.5 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="size-3.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* URL */}
                                            <td className="px-6 py-4">
                                                {cred.url ? (
                                                    <a
                                                        href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1 max-w-[160px] truncate"
                                                    >
                                                        <span className="truncate">{cred.url}</span>
                                                        <ExternalLink className="size-3 shrink-0" />
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px]">—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {hasPermission(user, 'edit-credentials') && (
                                                        <button
                                                            onClick={() => handleEditOpen(cred)}
                                                            className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Edit Credential"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </button>
                                                    )}

                                                    {hasPermission(user, 'delete-credentials') && (
                                                        <button
                                                            onClick={() => setDeletingCredential(cred)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Delete Credential"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={credentials} />
                </div>

                {/* CREATE CREDENTIAL MODAL (Standard Admin Modal UI) */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <KeyRound className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Add Client Credential
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Store secure server, cPanel, CMS, or API credentials.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} noValidate className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_client_id" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Select Target Client *
                                    </Label>
                                    <SearchableSelect
                                        options={clientSelectOptions}
                                        value={createForm.data.client_id}
                                        onChange={(val) => createForm.setData('client_id', val)}
                                        placeholder="Search & select client..."
                                        searchPlaceholder="Type client name, code, or company..."
                                        required
                                    />
                                    {createForm.errors.client_id && (
                                        <p className="text-xs font-semibold text-rose-500">{createForm.errors.client_id}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create_title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Title / Label *
                                        </Label>
                                        <Input
                                            id="create_title"
                                            value={createForm.data.title}
                                            onChange={(e) => createForm.setData('title', e.target.value)}
                                            placeholder="e.g. Production cPanel"
                                            required
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                        />
                                        {createForm.errors.title && (
                                            <p className="text-xs font-semibold text-rose-500">{createForm.errors.title}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="create_type" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Access Category *
                                        </Label>
                                        <select
                                            id="create_type"
                                            value={createForm.data.type}
                                            onChange={(e) => createForm.setData('type', e.target.value as any)}
                                            required
                                            className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                        >
                                            <option value="hosting">Hosting / cPanel</option>
                                            <option value="cms">CMS Dashboard</option>
                                            <option value="database">Database</option>
                                            <option value="domain">Domain Registrar</option>
                                            <option value="api">API / Secret Key</option>
                                            <option value="other">Other Access</option>
                                        </select>
                                        {createForm.errors.type && (
                                            <p className="text-xs font-semibold text-rose-500">{createForm.errors.type}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="create_username" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Username / Email *
                                        </Label>
                                        <Input
                                            id="create_username"
                                            value={createForm.data.username}
                                            onChange={(e) => createForm.setData('username', e.target.value)}
                                            placeholder="admin@example.com"
                                            required
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                        />
                                        {createForm.errors.username && (
                                            <p className="text-xs font-semibold text-rose-500">{createForm.errors.username}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="create_password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Password / Key *
                                        </Label>
                                        <Input
                                            id="create_password"
                                            value={createForm.data.password}
                                            onChange={(e) => createForm.setData('password', e.target.value)}
                                            placeholder="Secret Password"
                                            required
                                            className="h-11 rounded-xl font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                        />
                                        {createForm.errors.password && (
                                            <p className="text-xs font-semibold text-rose-500">{createForm.errors.password}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create_url" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Login URL (Optional)
                                    </Label>
                                    <Input
                                        id="create_url"
                                        type="url"
                                        value={createForm.data.url}
                                        onChange={(e) => createForm.setData('url', e.target.value)}
                                        placeholder="https://example.com/wp-admin"
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    />
                                    {createForm.errors.url && (
                                        <p className="text-xs font-semibold text-rose-500">{createForm.errors.url}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create_notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Notes (Optional)
                                    </Label>
                                    <textarea
                                        id="create_notes"
                                        value={createForm.data.notes}
                                        onChange={(e) => createForm.setData('notes', e.target.value)}
                                        rows={2}
                                        placeholder="Additional instructions or port numbers..."
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="h-11 px-5 rounded-xl text-xs font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer"
                                    >
                                        {createForm.processing ? 'Saving...' : 'Save Credential'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT CREDENTIAL MODAL (Standard Admin Modal UI) */}
                {editingCredential && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                        <Edit2 className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Edit Client Credential
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Update username, password, or login URL details.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingCredential(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} noValidate className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_client_id" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Select Target Client *
                                    </Label>
                                    <SearchableSelect
                                        options={clientSelectOptions}
                                        value={editForm.data.client_id}
                                        onChange={(val) => editForm.setData('client_id', val)}
                                        placeholder="Search & select client..."
                                        searchPlaceholder="Type client name, code, or company..."
                                        required
                                    />
                                    {editForm.errors.client_id && (
                                        <p className="text-xs font-semibold text-rose-500">{editForm.errors.client_id}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Title / Label *
                                        </Label>
                                        <Input
                                            id="edit_title"
                                            value={editForm.data.title}
                                            onChange={(e) => editForm.setData('title', e.target.value)}
                                            required
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                        />
                                        {editForm.errors.title && (
                                            <p className="text-xs font-semibold text-rose-500">{editForm.errors.title}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_type" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Access Category *
                                        </Label>
                                        <select
                                            id="edit_type"
                                            value={editForm.data.type}
                                            onChange={(e) => editForm.setData('type', e.target.value as any)}
                                            required
                                            className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                        >
                                            <option value="hosting">Hosting / cPanel</option>
                                            <option value="cms">CMS Dashboard</option>
                                            <option value="database">Database</option>
                                            <option value="domain">Domain Registrar</option>
                                            <option value="api">API / Secret Key</option>
                                            <option value="other">Other Access</option>
                                        </select>
                                        {editForm.errors.type && (
                                            <p className="text-xs font-semibold text-rose-500">{editForm.errors.type}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_username" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Username / Email *
                                        </Label>
                                        <Input
                                            id="edit_username"
                                            value={editForm.data.username}
                                            onChange={(e) => editForm.setData('username', e.target.value)}
                                            required
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                        />
                                        {editForm.errors.username && (
                                            <p className="text-xs font-semibold text-rose-500">{editForm.errors.username}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit_password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Password / Key *
                                        </Label>
                                        <Input
                                            id="edit_password"
                                            value={editForm.data.password}
                                            onChange={(e) => editForm.setData('password', e.target.value)}
                                            required
                                            className="h-11 rounded-xl font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                        />
                                        {editForm.errors.password && (
                                            <p className="text-xs font-semibold text-rose-500">{editForm.errors.password}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_url" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Login URL (Optional)
                                    </Label>
                                    <Input
                                        id="edit_url"
                                        type="url"
                                        value={editForm.data.url}
                                        onChange={(e) => editForm.setData('url', e.target.value)}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    />
                                    {editForm.errors.url && (
                                        <p className="text-xs font-semibold text-rose-500">{editForm.errors.url}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Notes (Optional)
                                    </Label>
                                    <textarea
                                        id="edit_notes"
                                        value={editForm.data.notes}
                                        onChange={(e) => editForm.setData('notes', e.target.value)}
                                        rows={2}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingCredential(null)}
                                        className="h-11 px-5 rounded-xl text-xs font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="h-11 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {editForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <span>Update Credential</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {deletingCredential && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <Trash2 className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Credential?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to permanently delete credential <strong>"{deletingCredential.title}"</strong> for{' '}
                                    <strong>{deletingCredential.client?.name}</strong>?
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeletingCredential(null)}
                                    disabled={isDeleting}
                                    className="h-11 px-5 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleDeleteSubmit}
                                    disabled={isDeleting}
                                    className="h-11 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Credential</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
