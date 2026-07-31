import AppLogoIcon from './app-logo-icon';
import { HTMLAttributes } from 'react';

export default function AppLogo({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`} {...props}>
            <AppLogoIcon className="h-8 w-auto" />
            <div className="flex flex-col text-left">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                    SAPTA <span className="text-blue-600 dark:text-blue-400">CRM</span>
                </span>
                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase mt-0.5">
                    Technologies
                </span>
            </div>
        </div>
    );
}
