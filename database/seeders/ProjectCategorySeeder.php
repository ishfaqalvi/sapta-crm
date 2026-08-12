<?php

namespace Database\Seeders;

use App\Models\ProjectCategory;
use Illuminate\Database\Seeder;

class ProjectCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Web Application', 'is_active' => true],
            ['name' => 'Mobile App', 'is_active' => true],
            ['name' => 'E-Commerce Store', 'is_active' => true],
            ['name' => 'Custom Software / CRM', 'is_active' => true],
            ['name' => 'WordPress / CMS', 'is_active' => true],
            ['name' => 'UI/UX Design', 'is_active' => true],
        ];

        foreach ($categories as $cat) {
            ProjectCategory::firstOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
