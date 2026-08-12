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
            [
                'name' => 'Web Application',
                'description' => 'SaaS, custom web platforms, portals, and web app dashboards',
                'color' => 'blue',
                'is_active' => true,
            ],
            [
                'name' => 'Mobile App',
                'description' => 'iOS, Android, and cross-platform Flutter/React Native apps',
                'color' => 'purple',
                'is_active' => true,
            ],
            [
                'name' => 'E-Commerce Store',
                'description' => 'Shopify, WooCommerce, and custom online shopping platforms',
                'color' => 'emerald',
                'is_active' => true,
            ],
            [
                'name' => 'Custom Software / CRM',
                'description' => 'Enterprise CRM systems, ERPs, and internal business tools',
                'color' => 'indigo',
                'is_active' => true,
            ],
            [
                'name' => 'WordPress / CMS',
                'description' => 'Corporate websites, blogs, and content-managed portals',
                'color' => 'amber',
                'is_active' => true,
            ],
            [
                'name' => 'UI/UX Design',
                'description' => 'Figma prototypes, branding, design systems, and wireframes',
                'color' => 'rose',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $cat) {
            ProjectCategory::firstOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
