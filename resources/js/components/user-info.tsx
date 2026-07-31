import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
    const getInitials = useInitials();

    return (
        <div className="flex items-center gap-3 w-full">
            <div className="relative size-9 rounded-xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0 border border-white/20">
                {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="size-full object-cover" />
                ) : (
                    getInitials(user.name)
                )}
            </div>

            <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                <span className="truncate font-extrabold text-slate-900 dark:text-white text-sm">
                    {user.name}
                </span>
                {showEmail && (
                    <span className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {user.email}
                    </span>
                )}
            </div>
        </div>
    );
}
