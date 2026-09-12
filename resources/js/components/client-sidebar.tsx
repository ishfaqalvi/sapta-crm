import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { hasPermission } from '@/utils/permissions';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import {
    ArrowLeft,
    BarChart3,
    Edit3,
    FileSpreadsheet,
    FileText,
    Globe,
    Key,
    LayoutDashboard,
    LineChart,
    LogOut,
    Server,
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
    const isStaff =
        authUser?.type === 'admin' ||
        authUser?.type === 'employee' ||
        Boolean(authUser?.employee_id) ||
        authUser?.roles?.some((r: string) => ['admin', 'super admin', 'employee', 'manager', 'hr', 'staff'].includes(String(r).toLowerCase())) ||
        (authUser?.type && authUser.type !== 'client');

    const activeRef = useRef<HTMLAnchorElement | null>(null);

    useEffect(() => {
        if (activeRef.current) {
            const timer = setTimeout(() => {
                activeRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest',
                });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [currentUrl, activeTab]);

    const navItems = [
        {
            id: 'overview',
            title: 'Client Overview',
            icon: LayoutDashboard,
            description: 'Financials & Summary',
            href: '/client-portal/overview',
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
            id: 'domains',
            title: 'Domains & DNS',
            icon: Globe,
            description: 'Registrations & Expiries',
            href: '/client-portal/domains',
            permission: 'view-client-portal-domains',
        },
        {
            id: 'hostings',
            title: 'Web Hosting',
            icon: Server,
            description: 'Servers & Specs',
            href: '/client-portal/hostings',
            permission: 'view-client-portal-hostings',
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
            id: 'quotations',
            title: 'Quotations',
            icon: FileSpreadsheet,
            description: 'Estimates & Proposals',
            href: '/client-portal/quotations',
            permission: 'view-client-portal-quotations',
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
            <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2 border-b border-slate-100/80 dark:border-slate-800/80 transition-all">
                <div className="p-3 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-none rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md shadow-2xs">
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center">
                        <div
                            title={client.name}
                            className="relative size-10 rounded-xl bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0 border border-white/20 mx-auto"
                        >
                            {client.name.charAt(0).toUpperCase()}
                            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5 group-data-[collapsible=icon]:hidden">
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
            <SidebarContent className="p-3 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:px-1.5 space-y-1">
                <SidebarMenu className="space-y-1.5 group-data-[collapsible=icon]:space-y-1">
                    {filteredItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab ? activeTab === item.id : currentUrl.startsWith(item.href);

                        return (
                            <SidebarMenuItem key={item.id}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={isActive}
                                    className={`h-auto p-2.5 rounded-xl transition-all group relative group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto ${isActive
                                        ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] !text-white font-bold shadow-md shadow-blue-600/25 border border-blue-400/30'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white border border-transparent'
                                        }`}
                                >
                                    <Link
                                        ref={isActive ? activeRef : null}
                                        href={item.href}
                                        className={`flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 ${
                                            isActive ? '!text-white' : ''
                                        }`}
                                    >
                                        {/* Left Active Glow Bar */}
                                        {isActive && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-300 rounded-r-full shadow-xs group-data-[collapsible=icon]:hidden" />
                                        )}

                                        <div
                                            className={`p-2 rounded-xl shrink-0 transition-all ${isActive
                                                ? 'bg-white/20 text-white shadow-xs border border-white/20'
                                                : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/60 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                }`}
                                        >
                                            <Icon className={`size-4 shrink-0 ${isActive ? '!text-white' : ''}`} />
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-0.5 group-data-[collapsible=icon]:hidden text-left">
                                            <span className={`text-xs font-bold tracking-tight block truncate leading-snug ${isActive ? '!text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {item.title}
                                            </span>
                                            <p
                                                className={`text-[10px] font-medium truncate leading-none ${isActive
                                                    ? 'text-blue-100 dark:text-blue-200'
                                                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400'
                                                    }`}
                                            >
                                                {item.description}
                                            </p>
                                        </div>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2 transition-all">
                <SidebarMenu>
                    <SidebarMenuItem>
                        {isStaff ? (
                            <SidebarMenuButton
                                asChild
                                tooltip="Return to CRM Hub"
                                className="h-10 py-2.5 px-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto"
                            >
                                <Link
                                    href="/dashboard"
                                    className="flex items-center justify-center gap-2 w-full group-data-[collapsible=icon]:gap-0"
                                >
                                    <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span className="group-data-[collapsible=icon]:hidden">Return to CRM Hub</span>
                                </Link>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                tooltip="Sign Out"
                                className="h-10 py-2.5 px-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100/80 text-xs font-bold transition-all border border-rose-200/50 dark:border-rose-900/40 cursor-pointer group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto"
                            >
                                <Link
                                    href="/profile/logout"
                                    method="post"
                                    as="button"
                                    className="flex items-center justify-center gap-2 w-full group-data-[collapsible=icon]:gap-0"
                                >
                                    <LogOut className="size-4 shrink-0" />
                                    <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
                                </Link>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
