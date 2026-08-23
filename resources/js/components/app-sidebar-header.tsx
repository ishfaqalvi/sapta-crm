import NotificationBell from '@/components/notification-bell';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronDown, Search } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage<any>().props;
    const user = auth?.user;

    const roles = user?.roles || [];
    const primaryRole = roles[0] || (user?.type === 'admin' ? 'Super Admin' : 'Client Account');
    const userRoleDisplay = primaryRole;

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/70 px-4 sm:px-6 backdrop-blur-xl transition-all">
            {/* Left: Sidebar Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors" />
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Right: Search, Notifications, Dark Mode & User Dropdown */}
            <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative hidden md:block w-64">
                    <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search CRM..."
                        className="w-full h-9 pl-9 pr-4 text-xs rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:bg-white dark:focus:bg-slate-950 transition-all"
                    />
                </div>

                {/* Theme Toggle (Light / Dark Mode) */}
                <AppearanceToggleDropdown />

                {/* Dynamic Notification Bell */}
                <NotificationBell />

                {/* User Dropdown Button */}
                {user && (
                    <div className="pl-1 border-l border-slate-200 dark:border-slate-800">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2.5 p-1.5 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer outline-none group">
                                <div className="relative size-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#003796] to-[#0052D4] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                                    ) : (
                                        user.name?.charAt(0) || 'A'
                                    )}
                                </div>
                                <div className="hidden lg:flex flex-col text-left">
                                    <span className="text-xs font-bold text-slate-800 dark:text-white leading-none">{user.name}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{userRoleDisplay}</span>
                                </div>
                                <ChevronDown className="size-3.5 text-slate-400 ml-1 hidden sm:block" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border border-slate-200 dark:border-slate-800">
                                <UserMenuContent user={user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </header>
    );
}
