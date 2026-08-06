<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds for Admin Users.
     */
    public function run(): void
    {
        // 1. Primary Super Admin User
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@sapta.com'],
            [
                'name' => 'Super Admin',
                'type' => 'admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $superAdmin->syncRoles(['Super Admin']);

        // 2. Standard Admin User
        $adminUser = User::updateOrCreate(
            ['email' => 'admin.user@sapta.com'],
            [
                'name' => 'Agency Administrator',
                'type' => 'admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $adminUser->syncRoles(['Admin']);

        // 3. Manager User
        $managerUser = User::updateOrCreate(
            ['email' => 'manager@sapta.com'],
            [
                'name' => 'Operations Manager',
                'type' => 'admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $managerUser->syncRoles(['Manager']);
    }
}
