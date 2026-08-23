import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
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
            <div className="space-y-4 py-2">
                {groups.map((group) => (
                    <SidebarGroup key={group.title} className="px-2 py-0">
                        <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-1 flex items-center gap-1.5 select-none">
                            <span>{group.title}</span>
                        </SidebarGroupLabel>
                        <SidebarMenu className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive =
                                    page.url === item.url ||
                                    (item.url !== '/dashboard' && page.url.startsWith(item.url));

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <Link
                                            ref={isActive ? activeRef : null}
                                            href={item.url}
                                            prefetch
                                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                                                isActive
                                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold shadow-sm border border-blue-400/30'
                                                    : 'text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-blue-600 dark:hover:text-white'
                                            }`}
                                        >
                                            {item.icon && (
                                                <item.icon
                                                    className={`size-4 shrink-0 ${
                                                        isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                                                    }`}
                                                />
                                            )}
                                            <span className="truncate">{item.title}</span>
                                        </Link>
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
        <SidebarGroup className="px-2 py-1.5">
            <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-1.5">
                CRM Modules
            </SidebarGroupLabel>
            <SidebarMenu className="space-y-1">
                {items.map((item) => {
                    const isActive = page.url === item.url || (item.url === '/dashboard' && page.url === '/dashboard');
                    return (
                        <SidebarMenuItem key={item.title}>
                            <Link
                                ref={isActive ? activeRef : null}
                                href={item.url}
                                prefetch
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-bold shadow-md shadow-blue-600/25 border border-blue-400/30'
                                        : 'text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-white'
                                }`}
                            >
                                {item.icon && (
                                    <item.icon className={`size-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                                )}
                                <span className="truncate">{item.title}</span>
                            </Link>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
