<?php

namespace Database\Seeders;

use App\Constants\PermissionRegistry;
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

        // Clean up legacy SEO permissions from database
        Permission::where('name', 'like', '%seo%')->delete();

        // Fetch single source of truth permissions
        $permissionsByModule = PermissionRegistry::getPermissionsByModule();

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
