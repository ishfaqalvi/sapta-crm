import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavGroup, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

interface NavMainProps {
    groups?: NavGroup[];
    items?: NavItem[];
}

export function NavMain({ groups = [], items = [] }: NavMainProps) {
    const page = usePage();
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
    }, [page.url]);

    if (groups && groups.length > 0) {
        return (
            <div className="space-y-4 group-data-[collapsible=icon]:space-y-1.5 py-2">
                {groups.map((group) => (
                    <SidebarGroup key={group.title} className="px-2 py-0 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-0.5">
                        <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-1 flex items-center gap-1.5 select-none group-data-[collapsible=icon]:hidden">
                            <span>{group.title}</span>
                        </SidebarGroupLabel>
                        <SidebarMenu className="space-y-0.5 group-data-[collapsible=icon]:space-y-1">
                            {group.items.map((item) => {
                                const isActive =
                                    page.url === item.url ||
                                    (item.url !== '/dashboard' && page.url.startsWith(item.url));

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            isActive={isActive}
                                            className={`h-9 px-3 rounded-xl text-xs transition-all group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] !text-white font-extrabold shadow-sm border border-blue-400/30'
                                                    : 'text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-white'
                                            }`}
                                        >
                                            <Link
                                                ref={isActive ? activeRef : null}
                                                href={item.url}
                                                prefetch
                                                className={`flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 ${
                                                    isActive ? '!text-white' : ''
                                                }`}
                                            >
                                                {item.icon && (
                                                    <item.icon
                                                        className={`size-4 shrink-0 ${
                                                            isActive ? '!text-white' : 'text-slate-400 dark:text-slate-500'
                                                        }`}
                                                    />
                                                )}
                                                <span className={`truncate group-data-[collapsible=icon]:hidden ${isActive ? '!text-white' : ''}`}>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </div>
        );
    }

    return (
        <SidebarGroup className="px-2 py-1.5 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-0.5">
            <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-1.5 group-data-[collapsible=icon]:hidden">
                CRM Modules
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
                {items.map((item) => {
                    const isActive = page.url === item.url || (item.url === '/dashboard' && page.url === '/dashboard');
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.title}
                                isActive={isActive}
                                className={`h-9 px-3.5 rounded-xl text-xs sm:text-sm transition-all group-data-[collapsible=icon]:!size-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto ${
                                    isActive
                                        ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] !text-white font-bold shadow-md shadow-blue-600/25 border border-blue-400/30'
                                        : 'text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-white'
                                }`}
                            >
                                <Link
                                    ref={isActive ? activeRef : null}
                                    href={item.url}
                                    prefetch
                                    className={`flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 ${
                                        isActive ? '!text-white' : ''
                                    }`}
                                >
                                    {item.icon && (
                                        <item.icon className={`size-4.5 shrink-0 ${isActive ? '!text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                                    )}
                                    <span className={`truncate group-data-[collapsible=icon]:hidden ${isActive ? '!text-white' : ''}`}>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
