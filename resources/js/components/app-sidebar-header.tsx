import { Breadcrumbs } from '@/components/breadcrumbs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';
import { Bell, ChevronDown, Coins, Search } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth } = usePage<any>().props;
    const user = auth?.user;

    const roles = user?.roles || [];
    const primaryRole = roles[0] || 'Super Admin';
    const userRoleDisplay = primaryRole;

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md transition-all">
            {/* Left: Sidebar Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors" />
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Right: Search, Notifications & User Dropdown */}
            <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative hidden md:block w-64">
                    <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search CRM..."
                        className="w-full h-9 pl-9 pr-4 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                    />
                </div>

                {/* Live Currency Status Pill */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex size-2 rounded-full bg-blue-600"></span>
                    </span>
                    <Coins className="size-3 text-amber-500" />
                    <span>Multi-Currency (PKR)</span>
                </div>

                {/* Notification Bell */}
                <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                    <Bell className="size-4" />
                    <span className="absolute top-2 right-2 size-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-950" />
                </button>

                {/* User Dropdown Button */}
                {user && (
                    <div className="pl-1 border-l border-slate-200 dark:border-slate-800">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2.5 p-1.5 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer outline-none">
                                <div className="size-8 rounded-full overflow-hidden bg-gradient-to-br from-[#003796] to-[#0052D4] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
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
