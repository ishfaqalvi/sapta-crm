<?php

namespace Database\Seeders;

use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class ServiceCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Search Engine Optimization (SEO)',
            'Pay-Per-Click Advertising (PPC)',
            'Social Media Marketing (SMM)',
            'Content Marketing & Copywriting',
            'Website Maintenance & Support',
            'Branding & Creative Services',
        ];

        foreach ($categories as $name) {
            ServiceCategory::firstOrCreate(['name' => $name], ['is_active' => true]);
        }
    }
}
