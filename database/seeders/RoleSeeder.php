<?php

namespace Database\Seeders;

use App\Constants\PermissionRegistry;
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

        // Get single source of truth permission list from PermissionRegistry
        $permissionsByModule = PermissionRegistry::getPermissionsByModule();
        $allPermissions = array_merge(...array_values($permissionsByModule));

        // Ensure all registered permissions exist in Spatie Permission table
        foreach ($allPermissions as $permName) {
            Permission::firstOrCreate([
                'name' => $permName,
                'guard_name' => 'web',
            ]);
        }

        // Create Spatie Roles with title case names
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $adminRole      = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $managerRole    = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $employeeRole   = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'web']);
        $clientRole     = Role::firstOrCreate(['name' => 'Client', 'guard_name' => 'web']);

        // 1. Give all permissions to Super Admin role
        $superAdminRole->syncPermissions($allPermissions);

        // 2. Give standard permissions to Admin role (except delete-roles)
        $adminPermissions = array_filter($allPermissions, function ($p) {
            return $p !== 'delete-roles';
        });
        $adminRole->syncPermissions($adminPermissions);

        // 3. Give Manager subset permissions
        $managerPermissions = array_filter($allPermissions, function ($p) {
            return !in_array($p, ['delete-users', 'delete-roles', 'edit-settings']);
        });
        $managerRole->syncPermissions($managerPermissions);

        // 4. Give Employee basic view & directory permissions
        $employeePermissions = array_filter($allPermissions, function ($p) {
            return str_starts_with($p, 'view-') && !str_contains($p, 'client-portal-') && !in_array($p, ['view-users', 'view-roles', 'view-settings']);
        });
        $employeeRole->syncPermissions($employeePermissions);

        // 5. Give Client Portal permissions to Client Role
        $clientPermissions = array_filter($allPermissions, function ($p) {
            return str_contains($p, 'client-portal-');
        });
        $clientRole->syncPermissions($clientPermissions);
    }
}
