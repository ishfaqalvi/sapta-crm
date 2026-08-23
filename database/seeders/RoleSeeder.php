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

        // Delete any extra legacy / unwanted roles (keep only core 3 roles)
        $allowedRoles = ['Super Admin', 'Employee', 'Client'];
        $unwantedRoles = Role::whereNotIn('name', $allowedRoles)->get();
        foreach ($unwantedRoles as $unwantedRole) {
            // Reassign any users of unwanted roles to Employee before deleting
            $employeeRole = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'web']);
            foreach ($unwantedRole->users as $user) {
                $user->assignRole($employeeRole);
            }
            $unwantedRole->syncPermissions([]);
            $unwantedRole->delete();
        }

        // Create the 3 Standard Spatie Roles
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $employeeRole = Role::firstOrCreate(['name' => 'Employee', 'guard_name' => 'web']);
        $clientRole = Role::firstOrCreate(['name' => 'Client', 'guard_name' => 'web']);

        // 1. Give all permissions to Super Admin role
        $superAdminRole->syncPermissions($allPermissions);

        // 2. Give Employee basic view & directory permissions
        $employeePermissions = array_filter($allPermissions, function ($p) {
            return str_starts_with($p, 'view-') && !str_contains($p, 'client-portal-') && !in_array($p, ['view-users', 'view-roles', 'view-settings']);
        });
        $employeeRole->syncPermissions($employeePermissions);

        // 3. Give only View permissions to Client Role
        $clientPermissions = array_filter($allPermissions, function ($p) {
            return str_starts_with($p, 'view-client-portal-');
        });
        $clientRole->syncPermissions($clientPermissions);

        // Clear cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
