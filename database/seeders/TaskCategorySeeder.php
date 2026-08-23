<?php

namespace Database\Seeders;

use App\Models\TaskCategory;
use Illuminate\Database\Seeder;

class TaskCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Graphic Design', 'is_active' => true],
            ['name' => 'Web Development', 'is_active' => true],
            ['name' => 'Server & Hosting Maintenance', 'is_active' => true],
            ['name' => 'SEO & Digital Marketing', 'is_active' => true],
            ['name' => 'Content & Copywriting', 'is_active' => true],
            ['name' => 'Client Technical Support', 'is_active' => true],
            ['name' => 'General Administration', 'is_active' => true],
        ];

        foreach ($categories as $cat) {
            TaskCategory::firstOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
