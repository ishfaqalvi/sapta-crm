<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // System Permissions grouped by module
        $permissionsByModule = [
            'Clients & Hub' => [
                'view-clients',
                'create-clients',
                'edit-clients',
                'delete-clients',
            ],
            'Website Projects' => [
                'view-website-projects',
                'create-website-projects',
                'edit-website-projects',
                'delete-website-projects',
            ],
            'Project Tasks' => [
                'view-project-tasks',
                'create-project-tasks',
                'edit-project-tasks',
                'delete-project-tasks',
            ],
            'Website Payments' => [
                'view-website-payments',
                'create-website-payments',
                'edit-website-payments',
                'delete-website-payments',
            ],
            'Invoices & Billing' => [
                'view-invoices',
                'create-invoices',
                'edit-invoices',
                'delete-invoices',
            ],
            'SEO Retainers' => [
                'view-seo-retainers',
                'create-seo-retainers',
                'edit-seo-retainers',
                'delete-seo-retainers',
            ],
            'SEO Payments' => [
                'view-seo-payments',
                'create-seo-payments',
                'edit-seo-payments',
                'delete-seo-payments',
            ],
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
            'Currency Management' => [
                'view-currencies',
                'create-currencies',
                'edit-currencies',
                'delete-currencies',
            ],
            'Credentials & Logins' => [
                'view-credentials',
                'create-credentials',
                'edit-credentials',
                'delete-credentials',
            ],
            'System Settings' => [
                'view-settings',
                'edit-settings',
            ],

            // Client Portal Permissions
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
            'Client Portal SEO' => [
                'view-client-portal-seo',
                'create-client-portal-seo',
                'edit-client-portal-seo',
                'delete-client-portal-seo',
                'view-client-portal-seo-payments',
                'create-client-portal-seo-payments',
                'edit-client-portal-seo-payments',
                'delete-client-portal-seo-payments',
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
        ];

        foreach ($permissionsByModule as $module => $permissions) {
            foreach ($permissions as $permissionName) {
                Permission::firstOrCreate([
                    'name' => $permissionName,
                    'guard_name' => 'web',
                ]);
            }
        }
    }
}
