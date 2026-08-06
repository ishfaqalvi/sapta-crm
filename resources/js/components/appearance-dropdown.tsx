import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

export default function AppearanceToggleDropdown({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const getCurrentIcon = () => {
        switch (appearance) {
            case 'dark':
                return <Moon className="size-4 text-blue-400" />;
            case 'light':
                return <Sun className="size-4 text-amber-500" />;
            default:
                return <Monitor className="size-4 text-slate-500 dark:text-slate-400" />;
        }
    };

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                        {getCurrentIcon()}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl p-1 shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <DropdownMenuItem
                        onClick={() => updateAppearance('light')}
                        className={`rounded-lg cursor-pointer flex items-center justify-between text-xs font-semibold px-2.5 py-2 ${
                            appearance === 'light' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : ''
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Sun className="size-4 text-amber-500" />
                            Light
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => updateAppearance('dark')}
                        className={`rounded-lg cursor-pointer flex items-center justify-between text-xs font-semibold px-2.5 py-2 ${
                            appearance === 'dark' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : ''
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Moon className="size-4 text-blue-400" />
                            Dark
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => updateAppearance('system')}
                        className={`rounded-lg cursor-pointer flex items-center justify-between text-xs font-semibold px-2.5 py-2 ${
                            appearance === 'system' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : ''
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Monitor className="size-4 text-slate-500 dark:text-slate-400" />
                            System
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
