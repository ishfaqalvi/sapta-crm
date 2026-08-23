import { LucideIcon } from 'lucide-react';

export interface CrmNotificationItem {
    id: string;
    title: string;
    message: string;
    type: string;
    severity: 'info' | 'success' | 'warning' | 'urgent';
    action_url?: string | null;
    metadata?: Record<string, any>;
    read_at: string | null;
    created_at: string;
}

export interface Auth {
    user: User;
    unread_notifications_count?: number;
    recent_notifications?: CrmNotificationItem[];
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface FlashMessages {
    success?: string;
    error?: string;
    info?: string;
    warning?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash?: FlashMessages;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    roles?: string[];
    permissions?: string[];
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Client {
    id: number;
    client_code: string;
    name: string;
    company_name: string | null;
    contact_person: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    city: string | null;
    country: string | null;
    currency: string;
    status: 'active' | 'inactive';
    notes: string | null;
    created_at: string;
    updated_at: string;
}

