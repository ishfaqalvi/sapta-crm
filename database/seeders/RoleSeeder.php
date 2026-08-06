<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $allPermissions = Permission::pluck('name')->toArray();

        // Create Spatie Roles with title case names
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $adminRole      = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $managerRole    = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $employeeRole   = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'web']);
        $clientRole     = Role::firstOrCreate(['name' => 'Client', 'guard_name' => 'web']);

        // Give all permissions to Super Admin role
        $superAdminRole->syncPermissions($allPermissions);

        // Give standard permissions to Admin role (except delete-roles)
        $adminPermissions = array_filter($allPermissions, function ($p) {
            return $p !== 'delete-roles';
        });
        $adminRole->syncPermissions($adminPermissions);

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

        // Give Client Portal permissions to Client Role
        $clientPermissions = [
            'view-client-portal-overview',
            'view-client-portal-projects',
            'create-client-portal-projects',
            'edit-client-portal-projects',
            'delete-client-portal-projects',
            'view-client-portal-tasks',
            'create-client-portal-tasks',
            'edit-client-portal-tasks',
            'view-client-portal-milestones',
            'create-client-portal-milestones',
            'edit-client-portal-milestones',
            'view-client-portal-seo',
            'view-client-portal-seo-payments',
            'view-client-portal-credentials',
            'create-client-portal-credentials',
            'edit-client-portal-credentials',
            'delete-client-portal-credentials',
            'view-client-portal-invoices',
            'download-client-portal-invoices',
            'view-client-portal-profile',
            'edit-client-portal-profile',
        ];
        $clientRole->syncPermissions($clientPermissions);
    }
}
