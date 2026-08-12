import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { AppToaster } from '@/components/app-toaster';
import { type BreadcrumbItem } from '@/types';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: { children: React.ReactNode; breadcrumbs?: BreadcrumbItem[] }) {
    return (
        <div className="relative min-h-screen bg-slate-100/70 dark:bg-slate-950 font-sans overflow-x-hidden">
            {/* Global Ambient Soft Multi-Color Gradient Mesh Blobs across Admin Panel */}
            <div className="fixed -top-32 -left-32 size-[500px] rounded-full bg-blue-300/35 dark:bg-blue-600/15 blur-[120px] pointer-events-none z-0" />
            <div className="fixed top-1/4 -right-32 size-[550px] rounded-full bg-rose-200/35 dark:bg-rose-600/15 blur-[140px] pointer-events-none z-0" />
            <div className="fixed -bottom-32 left-1/3 size-[500px] rounded-full bg-indigo-200/30 dark:bg-indigo-600/15 blur-[130px] pointer-events-none z-0" />

            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent variant="sidebar" className="!bg-transparent relative z-10 min-w-0 max-w-full">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    <div className="flex-1 w-full min-w-0 overflow-x-auto">{children}</div>
                </AppContent>
                <AppToaster />
            </AppShell>
        </div>
    );
}
