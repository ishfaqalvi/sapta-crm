<?php

namespace App\Constants;

class PermissionRegistry
{
    /**
     * Get all Admin Panel permissions grouped by module.
     */
    public static function getAdminPermissions(): array
    {
        return [
            // 1. Core & Operations
            'Executive Dashboard' => [
                'view-dashboard',
            ],
            'Client Hub' => [
                'view-clients',
                'create-clients',
                'edit-clients',
                'delete-clients',
            ],
            'Credentials Vault' => [
                'view-credentials',
            ],
            'General Tasks' => [
                'view-tasks',
                'create-tasks',
                'edit-tasks',
                'delete-tasks',
            ],

            // 2. Finance & Billing
            'Invoices & Billing' => [
                'view-invoices',
            ],
            'Financial Reports & Ledger' => [
                'view-reports',
                'download-reports',
            ],
            'Income Tracker' => [
                'view-incomes',
                'create-incomes',
                'edit-incomes',
                'delete-incomes',
            ],
            'Expense Tracker' => [
                'view-expenses',
                'create-expenses',
                'edit-expenses',
                'delete-expenses',
            ],

            // 3. HR & Workforce
            'Employees Directory' => [
                'view-employees',
                'create-employees',
                'edit-employees',
                'delete-employees',
            ],
            'Monthly Payroll' => [
                'view-payroll',
                'generate-payroll',
                'edit-payroll',
                'manage-payroll-status',
                'print-payslips',
                'delete-payroll',
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

            // 4. Master Categories
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
            'Task Categories' => [
                'view-task-categories',
                'create-task-categories',
                'edit-task-categories',
                'delete-task-categories',
            ],
            'Income Categories' => [
                'view-income-categories',
                'create-income-categories',
                'edit-income-categories',
                'delete-income-categories',
            ],
            'Expense Categories' => [
                'view-expense-categories',
                'create-expense-categories',
                'edit-expense-categories',
                'delete-expense-categories',
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
        ];
    }

    /**
     * Get all Client Portal permissions grouped by module and tabs/actions.
     */
    public static function getClientPortalPermissions(): array
    {
        return [
            // 1. Overview
            'Portal Overview' => [
                'view-client-portal-overview',
            ],

            // 2. Projects & Sub-tabs
            'Projects Directory' => [
                'view-client-portal-projects',
                'create-client-portal-projects',
                'edit-client-portal-projects',
                'delete-client-portal-projects',
                'view-client-portal-project-budget',
            ],
            'Project Milestones & Billing' => [
                'view-client-portal-project-milestones',
                'create-client-portal-project-milestones',
                'edit-client-portal-project-milestones',
                'delete-client-portal-project-milestones',
            ],
            'Project Tasks & Timeline' => [
                'view-client-portal-project-tasks',
                'create-client-portal-project-tasks',
                'edit-client-portal-project-tasks',
                'delete-client-portal-project-tasks',
            ],
            'Project Credentials' => [
                'view-client-portal-project-credentials',
                'create-client-portal-project-credentials',
                'edit-client-portal-project-credentials',
                'delete-client-portal-project-credentials',
            ],
            'Project Documents' => [
                'view-client-portal-project-documents',
                'create-client-portal-project-documents',
                'delete-client-portal-project-documents',
            ],

            // 5. Services & Sub-tabs
            'Services Directory' => [
                'view-client-portal-services',
                'create-client-portal-services',
                'edit-client-portal-services',
                'delete-client-portal-services',
                'view-client-portal-service-budget',
            ],
            'Service Credentials' => [
                'view-client-portal-service-credentials',
                'create-client-portal-service-credentials',
                'edit-client-portal-service-credentials',
                'delete-client-portal-service-credentials',
            ],
            'Service Payments & Retainers' => [
                'view-client-portal-service-payments',
                'create-client-portal-service-payments',
                'edit-client-portal-service-payments',
                'delete-client-portal-service-payments',
            ],
            'Service Documents' => [
                'view-client-portal-service-documents',
                'create-client-portal-service-documents',
                'delete-client-portal-service-documents',
            ],

            // 3. Domains & Sub-tabs
            'Domains Directory' => [
                'view-client-portal-domains',
                'create-client-portal-domains',
                'edit-client-portal-domains',
                'delete-client-portal-domains',
            ],
            'Domain Payments & Renewals' => [
                'view-client-portal-domain-payments',
                'create-client-portal-domain-payments',
                'edit-client-portal-domain-payments',
                'delete-client-portal-domain-payments',
            ],

            // 4. Web Hosting & Sub-tabs
            'Web Hosting Directory' => [
                'view-client-portal-hostings',
                'create-client-portal-hostings',
                'edit-client-portal-hostings',
                'delete-client-portal-hostings',
            ],
            'Hosting Payments & Renewals' => [
                'view-client-portal-hosting-payments',
                'create-client-portal-hosting-payments',
                'edit-client-portal-hosting-payments',
                'delete-client-portal-hosting-payments',
            ],

            // 6. Invoices & Billing
            'Invoices & Statements' => [
                'view-client-portal-invoices',
                'create-client-portal-invoices',
                'edit-client-portal-invoices',
                'delete-client-portal-invoices',
                'print-client-portal-invoices',
            ],

            // 7. General Logins & Credentials Vault
            'General Credentials Vault' => [
                'view-client-portal-credentials',
                'create-client-portal-credentials',
                'edit-client-portal-credentials',
                'delete-client-portal-credentials',
            ],

            // 8. Reports & Account Settings
            'Reports & Analytics' => [
                'view-client-portal-reports',
            ],
            'Account Profile & Security' => [
                'view-client-portal-profile',
                'edit-client-portal-profile',
                'manage-client-portal-account',
            ],
        ];
    }

    /**
     * Get two high-level groups (Admin Panel vs Client Portal) with their submodules.
     */
    public static function getPermissionsGrouped(): array
    {
        return [
            'admin' => [
                'key' => 'admin',
                'title' => 'Admin Panel Permissions',
                'description' => 'Permissions governing the backoffice CRM administration area.',
                'modules' => self::getAdminPermissions(),
            ],
            'portal' => [
                'key' => 'portal',
                'title' => 'Client Portal Permissions',
                'description' => 'Granular permissions for customer portal workspaces, tabs, and actions.',
                'modules' => self::getClientPortalPermissions(),
            ],
        ];
    }

    /**
     * Single source of truth list of all module permissions combined.
     */
    public static function getPermissionsByModule(): array
    {
        return array_merge(self::getAdminPermissions(), self::getClientPortalPermissions());
    }

    /**
     * Get flat list of all permission slug strings.
     */
    public static function getAllPermissions(): array
    {
        $all = [];
        foreach (self::getPermissionsByModule() as $perms) {
            foreach ($perms as $p) {
                $all[] = $p;
            }
        }
        return array_values(array_unique($all));
    }
}
