<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            AdminUserSeeder::class,
            EmployeeSeeder::class,
            ProjectCategorySeeder::class,
            TaskCategorySeeder::class,
            ServiceCategorySeeder::class,
            IncomeCategorySeeder::class,
            ExpenseCategorySeeder::class,
            ClientSeeder::class,
            ClientUserSeeder::class,
        ]);
    }
}
