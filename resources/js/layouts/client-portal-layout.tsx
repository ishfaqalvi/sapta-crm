import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { AppToaster } from '@/components/app-toaster';
import { ClientSidebar } from '@/components/client-sidebar';
import { type BreadcrumbItem } from '@/types';

interface ClientPortalLayoutProps {
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
}

export default function ClientPortalLayout({
    children,
    breadcrumbs = [],
    client,
    activeTab,
}: ClientPortalLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <ClientSidebar client={client} activeTab={activeTab} isPortal={true} />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <AppToaster />
        </AppShell>
    );
}
