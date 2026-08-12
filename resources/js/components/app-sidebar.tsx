import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Link, usePage } from '@inertiajs/react';
import {
    Banknote,
    Briefcase,
    Building,
    Building2,
    Coins,
    FileText,
    FolderKanban,
    Globe,
    Key,
    Layers,
    LayoutGrid,
    LineChart,
    Settings,
    ShieldCheck,
    User as UserIcon,
    UserCog,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

interface PermissionNavItem {
    title: string;
    url: string;
    icon?: any;
    permission?: string;
}

interface PermissionNavGroup {
    title: string;
    items: PermissionNavItem[];
}

const rawNavGroups: PermissionNavGroup[] = [
    {
        title: 'Main Navigation',
        items: [
            {
                title: 'Dashboard',
                url: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Client Hub',
                url: '/clients',
                icon: Building,
                permission: 'view-clients',
            },
        ],
    },
    {
        title: 'Client Operations',
        items: [
            {
                title: 'Projects',
                url: '/website-projects',
                icon: Globe,
                permission: 'view-website-projects',
            },
            {
                title: 'Services',
                url: '/services',
                icon: LineChart,
                permission: 'view-services',
            },
            {
                title: 'Invoices',
                url: '/invoices',
                icon: FileText,
                permission: 'view-invoices',
            },
            {
                title: 'Credentials',
                url: '/credentials',
                icon: Key,
                permission: 'view-credentials',
            },
        ],
    },
    {
        title: 'HR & Payroll',
        items: [
            {
                title: 'Employees Directory',
                url: '/employees',
                icon: Users,
                permission: 'view-employees',
            },
            {
                title: 'Monthly Payroll',
                url: '/payroll',
                icon: Banknote,
                permission: 'view-payroll',
            },
        ],
    },
    {
        title: 'Master Data',
        items: [
            {
                title: 'Project Categories',
                url: '/project-categories',
                icon: FolderKanban,
                permission: 'view-project-categories',
            },
            {
                title: 'Service Categories',
                url: '/service-categories',
                icon: Layers,
                permission: 'view-service-categories',
            },
            {
                title: 'Departments',
                url: '/departments',
                icon: Building2,
                permission: 'view-departments',
            },
            {
                title: 'Job Designations',
                url: '/designations',
                icon: Briefcase,
                permission: 'view-designations',
            },
            {
                title: 'Currencies',
                url: '/currencies',
                icon: Coins,
                permission: 'view-currencies',
            },
        ],
    },
    {
        title: 'System & Administration',
        items: [
            {
                title: 'User Accounts',
                url: '/users',
                icon: UserCog,
                permission: 'view-users',
            },
            {
                title: 'Roles & Access',
                url: '/roles',
                icon: ShieldCheck,
                permission: 'view-roles',
            },
            {
                title: 'My Profile',
                url: '/profile',
                icon: UserIcon,
            },
            {
                title: 'CRM Settings',
                url: '/settings',
                icon: Settings,
                permission: 'view-settings',
            },
        ],
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    // Dynamically filter navigation groups and items based on permissions
    const filteredNavGroups: NavGroup[] = rawNavGroups
        .map((group) => {
            const allowedItems = group.items.filter((item) => {
                if (!item.permission) return true;
                return hasPermission(user, item.permission);
            });

            return {
                title: group.title,
                items: allowedItems,
            };
        })
        .filter((group) => group.items.length > 0);

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl">
            <SidebarHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl transition-all">
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-1">
                <NavMain groups={filteredNavGroups} />
            </SidebarContent>

            <SidebarFooter className="p-3 border-t border-slate-100 dark:border-slate-800">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
