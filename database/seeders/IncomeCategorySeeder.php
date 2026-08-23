<?php

namespace Database\Seeders;

use App\Models\IncomeCategory;
use Illuminate\Database\Seeder;

class IncomeCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Client Project Payments', 'is_active' => true],
            ['name' => 'Monthly Retainer Fees', 'is_active' => true],
            ['name' => 'Software Maintenance & Support', 'is_active' => true],
            ['name' => 'Web Hosting & Domain Reselling', 'is_active' => true],
            ['name' => 'Consulting & Technical Advisory', 'is_active' => true],
            ['name' => 'Digital Marketing & SEO Services', 'is_active' => true],
            ['name' => 'API & Custom Integration Services', 'is_active' => true],
            ['name' => 'Miscellaneous Income', 'is_active' => true],
        ];

        foreach ($categories as $cat) {
            IncomeCategory::firstOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
