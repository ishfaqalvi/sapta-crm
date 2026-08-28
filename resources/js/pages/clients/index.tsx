import Pagination, { type PaginatedData } from '@/components/pagination';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Client, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    Building,
    CheckCircle2,
    Edit2,
    Eye,
    Layers,
    LoaderCircle,
    Mail,
    MapPin,
    Phone,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserX,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Client Hub',
        href: '/clients',
    },
];

export interface ClientWithUser extends Client {
    user?: {
        id: number;
        email: string;
        type: string;
        created_at: string;
    };
}

interface ClientsIndexProps {
    clients: PaginatedData<ClientWithUser>;
    stats?: {
        total: number;
        active: number;
        inactive: number;
        with_portal?: number;
    };
    filters?: {
        search?: string;
        status?: string;
        currency?: string;
    };
}

export default function ClientsIndex({ clients, stats, filters }: ClientsIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(filters?.status || '');
    const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState(filters?.currency || '');

    // Drawer state for View Client Details
    const [viewingClient, setViewingClient] = useState<ClientWithUser | null>(null);

    // Modal state for Delete confirmation
    const [deletingClient, setDeletingClient] = useState<ClientWithUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter debounce effect
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/clients',
                {
                    search: searchQuery,
                    status: selectedStatusFilter,
                    currency: selectedCurrencyFilter,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatusFilter, selectedCurrencyFilter]);

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingClient || isDeleting) return;
        setIsDeleting(true);
        router.delete(`/clients/${deletingClient.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingClient(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Client Hub" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Client Hub & Directory
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Centralized directory of client accounts, contact records, and billing setups.
                        </p>
                    </div>

                    {hasPermission(user, 'create-clients') && (
                        <Link
                            href="/clients/create"
                            className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add New Client</span>
                        </Link>
                    )}
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by code, name, company, email, or mobile..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive / On-Hold</option>
                        </select>

                        <select
                            value={selectedCurrencyFilter}
                            onChange={(e) => setSelectedCurrencyFilter(e.target.value)}
                            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
                        >
                            <option value="">All Currencies</option>
                            <option value="AED">AED (UAE Dirham)</option>
                            <option value="USD">USD ($)</option>
                            <option value="PKR">PKR (Rs)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="SAR">SAR (Riyal)</option>
                        </select>

                        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">
                            <Building className="size-4 text-blue-600 dark:text-blue-400" />
                            <span>Total Clients: <strong className="text-slate-900 dark:text-white">{clients.total}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Table Grid */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">Client & Company</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Contact Person</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Phone / Location</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Currency</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {clients.data.length > 0 ? (
                                    clients.data.map((client) => (
                                        <tr key={client.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            {/* Client Info & Logo Tile */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative size-10 rounded-xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-white/20">
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>

                                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                                        <Link
                                                            href={`/clients/view/${client.id}`}
                                                            className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                                                        >
                                                            {client.name}
                                                        </Link>
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800 font-mono shrink-0">
                                                            {client.client_code}
                                                        </span>
                                                        {client.company_name ? (
                                                            <span className="text-slate-400 dark:text-slate-500 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap">
                                                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                                                <Link
                                                                    href={`/clients/view/${client.id}`}
                                                                    className="text-slate-600 dark:text-slate-300 font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                                                                >
                                                                    {client.company_name}
                                                                </Link>
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs italic whitespace-nowrap">
                                                                (Individual Client)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact Person & Email */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                                                        {client.contact_person}
                                                    </span>
                                                    {client.email ? (
                                                        <a href={`mailto:${client.email}`} className="text-blue-600 dark:text-blue-400 text-xs flex items-center gap-1 hover:underline">
                                                            <Mail className="size-3" />
                                                            <span>{client.email}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs font-medium">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Phone & Location */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1">
                                                        <Phone className="size-3 text-slate-400" />
                                                        <span>{client.mobile || client.phone || '—'}</span>
                                                    </span>
                                                    {(client.city || client.country) && (
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                                            <MapPin className="size-3 text-slate-400" />
                                                            <span>{[client.city, client.country].filter(Boolean).join(', ')}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Currency Badge */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold font-mono text-[11px] border border-blue-100 dark:border-blue-900/40">
                                                    {client.currency}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${client.status === 'active'
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                    }`}>
                                                    {client.status === 'active' ? (
                                                        <>
                                                            <CheckCircle2 className="size-3" />
                                                            <span>Active</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="size-3" />
                                                            <span>Inactive</span>
                                                        </>
                                                    )}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={`/clients/view/${client.id}`}
                                                        className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="Open Client Portal Workspace"
                                                    >
                                                        <Eye className="size-3.5" />
                                                    </Link>
                                                    {hasPermission(user, 'edit-clients') && (
                                                        <Link
                                                            href={`/clients/${client.id}/edit`}
                                                            className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Edit Client Details"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </Link>
                                                    )}
                                                    {hasPermission(user, 'delete-clients') && (
                                                        <button
                                                            onClick={() => setDeletingClient(client)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                            title="Delete Client Profile"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                                            No client records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={clients} />
                </div>

                {/* Delete Confirmation Modal */}
                {deletingClient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingClient(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Client Profile?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete client <strong className="text-slate-900 dark:text-white">"{deletingClient.name}"</strong> ({deletingClient.client_code})? This action cannot be undone and will permanently remove associated records.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingClient(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                                >
                                    {isDeleting ? (
                                        <>
                                            <LoaderCircle className="size-4 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete Client</span>
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
