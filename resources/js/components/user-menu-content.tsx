import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Link } from '@inertiajs/react';
import { LogOut, Settings, ShieldCheck, User as UserIcon } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const getInitials = useInitials();
    const isClientUser = user.type === 'client';

    return (
        <div className="w-full space-y-1">
            {/* Header User Profile Banner */}
            <DropdownMenuLabel className="p-0 font-normal select-none">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="relative size-10 rounded-xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-white/20">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                            ) : (
                                getInitials(user.name)
                            )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                                {user.name}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

            {/* Menu Items Group */}
            <DropdownMenuGroup className="space-y-0.5">
                {/* Profile Edit Link */}
                {isClientUser ? (
                    hasPermission(user, 'view-client-portal-profile') && (
                        <DropdownMenuItem asChild className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-xl cursor-pointer p-2 transition-colors">
                            <Link className="flex items-center gap-3 w-full" href="/client-portal/profile" prefetch onClick={cleanup}>
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                                    <UserIcon className="size-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
                                        My Profile
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-none">
                                        Account details & password
                                    </p>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    )
                ) : (
                    <DropdownMenuItem asChild className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-xl cursor-pointer p-2 transition-colors">
                        <Link className="flex items-center gap-3 w-full" href={route('profile.edit')} prefetch onClick={cleanup}>
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                                <UserIcon className="size-4" />
                            </div>
                            <div className="space-y-0.5">
                                <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
                                    My Profile
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium leading-none">
                                    Account details & password
                                </p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                )}

                {/* Roles & Permissions Link (ADMIN ONLY) */}
                {!isClientUser && (
                    <DropdownMenuItem asChild className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-xl cursor-pointer p-2 transition-colors">
                        <Link className="flex items-center gap-3 w-full" href={route('roles.index')} prefetch onClick={cleanup}>
                            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                                <ShieldCheck className="size-4" />
                            </div>
                            <div className="space-y-0.5">
                                <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
                                    Roles & Access
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium leading-none">
                                    System roles & permissions
                                </p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                )}

                {/* System Settings Link (ADMIN ONLY) */}
                {!isClientUser && (
                    <DropdownMenuItem asChild className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-xl cursor-pointer p-2 transition-colors">
                        <Link className="flex items-center gap-3 w-full" href={route('settings.index')} prefetch onClick={cleanup}>
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                                <Settings className="size-4" />
                            </div>
                            <div className="space-y-0.5">
                                <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-none">
                                    CRM Settings
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium leading-none">
                                    Preferences & system options
                                </p>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

            {/* Logout Link */}
            <DropdownMenuItem asChild className="focus:bg-rose-50 dark:focus:bg-rose-950/40 rounded-xl cursor-pointer p-2 transition-colors">
                <Link
                    className="flex items-center gap-3 w-full text-rose-600 dark:text-rose-400"
                    method="post"
                    href={route('logout')}
                    as="button"
                    onClick={cleanup}
                >
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                        <LogOut className="size-4" />
                    </div>
                    <div className="space-y-0.5 text-left">
                        <div className="text-xs font-extrabold leading-none">
                            Sign Out Account
                        </div>
                        <p className="text-[10px] text-rose-500/70 dark:text-rose-400/70 font-medium leading-none">
                            Safely end session
                        </p>
                    </div>
                </Link>
            </DropdownMenuItem>
        </div>
    );
}
