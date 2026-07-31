<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Delete obsolete permissions
        Permission::whereIn('name', ['view-rates', 'manage-rates', 'view-deals', 'create-deals', 'edit-deals', 'delete-deals'])->delete();

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
            'System Settings' => [
                'view-settings',
                'edit-settings',
            ],
        ];

        $allPermissions = [];
        foreach ($permissionsByModule as $module => $permissions) {
            foreach ($permissions as $permissionName) {
                $permission = Permission::firstOrCreate([
                    'name' => $permissionName,
                    'guard_name' => 'web',
                ]);
                $allPermissions[] = $permission->name;
            }
        }

        // Roles Creation
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $managerRole = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $employeeRole = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'web']);

        // Give all permissions to Super Admin
        $superAdminRole->syncPermissions($allPermissions);

        // Give Manager subset permissions
        $managerPermissions = array_filter($allPermissions, function ($p) {
            return !in_array($p, ['delete-users', 'delete-roles', 'edit-settings']);
        });
        $managerRole->syncPermissions($managerPermissions);

        // Give Employee basic view & task edit permissions
        $employeePermissions = [
            'view-clients',
            'view-website-projects',
            'view-project-tasks',
            'edit-project-tasks',
            'view-seo-retainers',
            'view-employees',
        ];
        $employeeRole->syncPermissions($employeePermissions);

        // Ensure user ID 1 (first admin user) has Super Admin role assigned
        $firstUser = User::first();
        if ($firstUser && !$firstUser->hasRole('Super Admin')) {
            $firstUser->assignRole('Super Admin');
        }
    }
}
