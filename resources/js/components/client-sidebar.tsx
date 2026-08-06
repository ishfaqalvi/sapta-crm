import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { hasPermission } from '@/utils/permissions';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckSquare,
    Edit3,
    FileText,
    Globe,
    Key,
    LayoutDashboard,
    LineChart,
    LogOut,
    Receipt,
} from 'lucide-react';

interface ClientSidebarProps {
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    activeTab?: string;
    isPortal?: boolean;
}

export function ClientSidebar({ client, activeTab }: ClientSidebarProps) {
    const page = usePage();
    const currentUrl = page.url;
    const authUser = (page.props.auth as any)?.user;
    const isAdmin = authUser?.type === 'admin';

    const navSections = [
        {
            title: 'Portal Overview',
            items: [
                {
                    id: 'overview',
                    title: 'Client Overview',
                    icon: LayoutDashboard,
                    description: 'Financials & Summary',
                    href: '/client-portal/overview',
                    permission: 'view-client-portal-overview',
                },
                {
                    id: 'projects',
                    title: 'Website Projects',
                    icon: Globe,
                    description: 'Overview & Progress',
                    href: '/client-portal/projects',
                    permission: 'view-client-portal-projects',
                },
                {
                    id: 'tasks',
                    title: 'Project Tasks',
                    icon: CheckSquare,
                    description: 'Deliverables & Backlog',
                    href: '/client-portal/tasks',
                    permission: 'view-client-portal-tasks',
                },
                {
                    id: 'milestones',
                    title: 'Project Milestones',
                    icon: Receipt,
                    description: 'Milestones & Settlements',
                    href: '/client-portal/milestones',
                    permission: 'view-client-portal-milestones',
                },
            ],
        },
        {
            title: 'Subscriptions & Billing',
            items: [
                {
                    id: 'seo',
                    title: 'SEO Retainers',
                    icon: LineChart,
                    description: 'Active Subscriptions',
                    href: '/client-portal/seo',
                    permission: 'view-client-portal-seo',
                },
                {
                    id: 'seo-payments',
                    title: 'SEO Payments',
                    icon: Receipt,
                    description: 'Monthly Billing Logs',
                    href: '/client-portal/seo-payments',
                    permission: 'view-client-portal-seo-payments',
                },
                {
                    id: 'payments',
                    title: 'Invoices & Billing',
                    icon: FileText,
                    description: 'Financial Statements',
                    href: '/client-portal/invoices',
                    permission: 'view-client-portal-invoices',
                },
            ],
        },
        {
            title: 'Security & Profile',
            items: [
                {
                    id: 'credentials',
                    title: 'Credentials & Logins',
                    icon: Key,
                    description: 'Logins & Access Keys',
                    href: '/client-portal/credentials',
                    permission: 'view-client-portal-credentials',
                },
                {
                    id: 'settings',
                    title: 'Account Profile',
                    icon: Edit3,
                    description: 'Contact & Security',
                    href: '/client-portal/profile',
                    permission: 'view-client-portal-profile',
                },
            ],
        },
    ];

    // Filter sections and their inner items based on permissions
    const filteredSections = navSections
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => !item.permission || hasPermission(authUser, item.permission)),
        }))
        .filter((section) => section.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950">
            {/* Header: Client Identity & Status */}
            <SidebarHeader className="p-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="relative size-10 rounded-xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0 border border-white/20">
                        {client.name.charAt(0).toUpperCase()}
                        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <h2 className="text-xs font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
                            {client.name}
                        </h2>
                        <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shrink-0">
                                {client.client_code}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate font-medium">
                                {client.company_name || 'Client Workspace'}
                            </span>
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            {/* Navigation Body */}
            <SidebarContent className="p-3 space-y-4">
                {filteredSections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        <div className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {section.title}
                        </div>

                        <nav className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab ? activeTab === item.id : currentUrl.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group relative ${
                                            isActive
                                                ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-500/20'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <div
                                            className={`p-2 rounded-xl shrink-0 transition-all ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                            }`}
                                        >
                                            <Icon className="size-4" />
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <span className="text-xs font-bold tracking-tight block truncate leading-snug">{item.title}</span>
                                            <p
                                                className={`text-[10px] font-medium truncate leading-none ${
                                                    isActive
                                                        ? 'text-blue-100/90'
                                                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'
                                                }`}
                                            >
                                                {item.description}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                ))}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {isAdmin ? (
                    <Link
                        href="/clients"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all shadow-2xs"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Return to CRM Hub</span>
                    </Link>
                ) : (
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
                    >
                        <LogOut className="size-4" />
                        <span>Sign Out</span>
                    </Link>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
