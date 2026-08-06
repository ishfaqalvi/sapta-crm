import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { AppToaster } from '@/components/app-toaster';
import { ClientSidebar } from '@/components/client-sidebar';
import { type BreadcrumbItem } from '@/types';

interface ClientLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    client: {
        id: number;
        client_code: string;
        name: string;
        company_name?: string;
        status: 'active' | 'inactive';
        currency: string;
    };
    activeTab?: string;
    isPortal?: boolean;
}

export default function ClientLayout({
    children,
    breadcrumbs = [],
    client,
    activeTab,
    isPortal = false,
}: ClientLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <ClientSidebar client={client} activeTab={activeTab} isPortal={isPortal} />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <AppToaster />
        </AppShell>
    );
}
