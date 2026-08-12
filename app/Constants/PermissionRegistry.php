<?php

namespace App\Constants;

class PermissionRegistry
{
    /**
     * Get all system permissions grouped by module.
     * Single source of truth for Seeders, Controllers, and Role Management UI.
     * Aligned with the Admin Sidebar navigation hierarchy.
     */
    public static function getPermissionsByModule(): array
    {
        return [
            // 1. Main Navigation
            'Client Hub' => [
                'view-clients',
                'create-clients',
                'edit-clients',
                'delete-clients',
            ],

            // 2. Client Operations
            'Projects Directory' => [
                'view-website-projects',
            ],
            'Services Hub' => [
                'view-services',
            ],
            'Invoices & Billing' => [
                'view-invoices',
            ],
            'Credentials Vault' => [
                'view-credentials',
            ],

            // 3. HR & Payroll
            'Employees Directory' => [
                'view-employees',
                'create-employees',
                'edit-employees',
                'delete-employees',
            ],
            'Monthly Payroll' => [
                'view-payroll',
                'manage-payroll',
            ],

            // 4. Master Data
            'Project Categories' => [
                'view-project-categories',
                'create-project-categories',
                'edit-project-categories',
                'delete-project-categories',
            ],
            'Service Categories' => [
                'view-service-categories',
                'create-service-categories',
                'edit-service-categories',
                'delete-service-categories',
            ],
            'Departments' => [
                'view-departments',
                'create-departments',
                'edit-departments',
                'delete-departments',
            ],
            'Job Designations' => [
                'view-designations',
                'create-designations',
                'edit-designations',
                'delete-designations',
            ],
            'Currencies' => [
                'view-currencies',
                'create-currencies',
                'edit-currencies',
                'delete-currencies',
            ],

            // 5. System & Administration
            'User Accounts' => [
                'view-users',
                'create-users',
                'edit-users',
                'delete-users',
            ],
            'Roles & Access' => [
                'view-roles',
                'create-roles',
                'edit-roles',
                'delete-roles',
            ],
            'CRM Settings' => [
                'view-settings',
                'edit-settings',
            ],

            // 6. Client Portal Workspace
            'Client Portal Overview' => [
                'view-client-portal-overview',
            ],
            'Client Portal Projects' => [
                'view-client-portal-projects',
                'create-client-portal-projects',
                'edit-client-portal-projects',
                'delete-client-portal-projects',
            ],
            'Client Portal Tasks' => [
                'view-client-portal-tasks',
                'create-client-portal-tasks',
                'edit-client-portal-tasks',
                'delete-client-portal-tasks',
            ],
            'Client Portal Milestones' => [
                'view-client-portal-milestones',
                'create-client-portal-milestones',
                'edit-client-portal-milestones',
                'delete-client-portal-milestones',
            ],
            'Client Portal Services' => [
                'view-client-portal-services',
                'create-client-portal-services',
                'edit-client-portal-services',
                'delete-client-portal-services',
            ],
            'Client Portal Credentials' => [
                'view-client-portal-credentials',
                'create-client-portal-credentials',
                'edit-client-portal-credentials',
                'delete-client-portal-credentials',
            ],
            'Client Portal Invoices' => [
                'view-client-portal-invoices',
                'create-client-portal-invoices',
                'edit-client-portal-invoices',
                'delete-client-portal-invoices',
                'download-client-portal-invoices',
            ],
            'Client Portal Profile' => [
                'view-client-portal-profile',
                'edit-client-portal-profile',
                'manage-client-portal-account',
            ],
            'Client Portal Reports' => [
                'view-client-portal-reports',
            ],
        ];
    }
}
