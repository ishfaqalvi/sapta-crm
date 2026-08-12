import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { hasPermission } from '@/utils/permissions';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    Edit3,
    FileText,
    Globe,
    Key,
    LayoutDashboard,
    LineChart,
    LogOut,
    Sparkles,
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

    const navItems = [
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
            title: 'Projects',
            icon: Globe,
            description: 'Overview & Milestones',
            href: '/client-portal/projects',
            permission: 'view-client-portal-projects',
        },
        {
            id: 'services',
            title: 'Services',
            icon: LineChart,
            description: 'Active Subscriptions',
            href: '/client-portal/services',
            permission: 'view-client-portal-services',
        },
        {
            id: 'payments',
            title: 'Invoices & Billing',
            icon: FileText,
            description: 'Financial Statements',
            href: '/client-portal/invoices',
            permission: 'view-client-portal-invoices',
        },
        {
            id: 'reports',
            title: 'Reports & Logs',
            icon: BarChart3,
            description: 'Analytics & Financial Logs',
            href: '/client-portal/reports',
            permission: 'view-client-portal-reports',
        },
        {
            id: 'credentials',
            title: 'Credentials & Keys',
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
    ];

    const filteredItems = navItems.filter(
        (item) => !item.permission || hasPermission(authUser, item.permission)
    );

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
            {/* Header: Frosted Glass Client Card */}
            <SidebarHeader className="p-3">
                <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md shadow-2xs space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="relative size-10 rounded-xl bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0 border border-white/20">
                            {client.name.charAt(0).toUpperCase()}
                            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate tracking-tight">
                                {client.name}
                            </h2>
                            <div className="flex items-center gap-1.5 truncate">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                                    {client.client_code}
                                </span>
                                <span className="text-[11px] text-slate-400 truncate font-medium">
                                    {client.company_name || 'Client Workspace'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            {/* Navigation Body (Glassy Items) */}
            <SidebarContent className="p-3 space-y-1">
                <nav className="space-y-1.5">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab ? activeTab === item.id : currentUrl.startsWith(item.href);

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${isActive
                                    ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-2xs backdrop-blur-md font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white border border-transparent'
                                    }`}
                            >
                                {/* Left Active Glow Bar */}
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full shadow-xs" />
                                )}

                                <div
                                    className={`p-2 rounded-xl shrink-0 transition-all ${isActive
                                        ? 'bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white shadow-xs'
                                        : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                        }`}
                                >
                                    <Icon className="size-4" />
                                </div>

                                <div className="min-w-0 flex-1 space-y-0.5">
                                    <span className="text-xs font-bold tracking-tight block truncate leading-snug">{item.title}</span>
                                    <p
                                        className={`text-[10px] font-medium truncate leading-none ${isActive
                                            ? 'text-blue-600/80 dark:text-blue-400/80'
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
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2">
                {isAdmin ? (
                    <Link
                        href="/clients"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Return to CRM Hub</span>
                    </Link>
                ) : (
                    <Link
                        href="/profile/logout"
                        method="post"
                        as="button"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100/80 text-xs font-bold transition-all border border-rose-200/50 dark:border-rose-900/40 cursor-pointer"
                    >
                        <LogOut className="size-4" />
                        <span>Sign Out</span>
                    </Link>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
