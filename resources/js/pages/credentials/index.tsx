import Pagination, { type PaginatedData } from '@/components/pagination';
import SearchableSelect from '@/components/searchable-select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Building,
    Check,
    Copy,
    FolderKanban,
    Key,
    Lock,
    Search,
    Shield,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
    website_project_id?: number | null;
    title: string;
    type?: string;
    username?: string | null;
    password?: string | null;
    url?: string | null;
    notes?: string | null;
    created_at?: string;
    client?: {
        id: number;
        name: string;
        company_name?: string;
        client_code: string;
    };
    project?: {
        id: number;
        project_name: string;
    };
}

interface CredentialsIndexProps {
    credentials: PaginatedData<AdminCredentialListItem>;
    stats?: {
        total: number;
    };
    clients: Array<{ id: number; name: string; company_name?: string; client_code: string }>;
    filters?: {
        search?: string;
        client_id?: string;
    };
}

export default function CredentialsIndex({ credentials, clients, filters }: CredentialsIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [clientFilter, setClientFilter] = useState(filters?.client_id || '');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Client Filter Options
    const clientSelectOptions = clients.map((c) => ({
        value: String(c.id),
        label: c.name,
        subLabel: `${c.client_code} • ${c.company_name || 'Individual Client'}`,
    }));

    const clientFilterOptions = [
        { value: '', label: 'All Clients', subLabel: 'Show credentials for all clients' },
        ...clientSelectOptions,
    ];

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
                    search: searchQuery || undefined,
                    client_id: clientFilter || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, clientFilter]);

    const handleCopy = (text: string, idStr: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(idStr);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Client Credentials Directory" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                            <Shield className="size-6 text-indigo-600 dark:text-indigo-400" />
                            <span>Client Credentials Directory</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Browse client server logins, cPanel access, databases, domain registries, and API keys.
                        </p>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 z-10" />
                        <input
                            type="text"
                            placeholder="Search by title, login details, or client name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="w-full md:w-72">
                        <SearchableSelect
                            options={clientFilterOptions}
                            value={clientFilter}
                            onChange={(val) => setClientFilter(val)}
                            placeholder="Filter by Client"
                            searchPlaceholder="Type client name..."
                        />
                    </div>
                </div>

                {/* Credentials Cards Grid */}
                {credentials.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {credentials.data.map((cred) => {
                            const fullContent =
                                cred.notes ||
                                [
                                    cred.username ? `Username: ${cred.username}` : '',
                                    cred.password ? `Password: ${cred.password}` : '',
                                    cred.url ? `URL: ${cred.url}` : '',
                                ]
                                    .filter(Boolean)
                                    .join('\n');

                            return (
                                <div
                                    key={cred.id}
                                    className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        {/* Card Top Header */}
                                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                                                    <Key className="size-4" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                                                        {cred.title}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                        {cred.client && (
                                                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800 flex items-center gap-1">
                                                                <Building className="size-3" />
                                                                <span>{cred.client.name}</span>
                                                                <span className="font-mono text-[10px]">({cred.client.client_code})</span>
                                                            </span>
                                                        )}

                                                        {cred.project && (
                                                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold border border-purple-200/80 dark:border-purple-800 flex items-center gap-1">
                                                                <FolderKanban className="size-3" />
                                                                <span className="truncate max-w-[140px]">{cred.project.project_name}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {fullContent && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(fullContent, `cred-${cred.id}`)}
                                                    className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                                                    title="Copy All Credentials"
                                                >
                                                    {copiedId === `cred-${cred.id}` ? (
                                                        <>
                                                            <Check className="size-3.5 text-emerald-400" />
                                                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="size-3.5" />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Credentials Code Block Box (Client Portal Pattern) */}
                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed selection:bg-blue-500 selection:text-white">
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
                    <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                        <Key className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No Credentials Found</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                            No client login credentials found matching your search filter.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {credentials.data.length > 0 && <Pagination meta={credentials} />}
            </div>
        </AppLayout>
    );
}
