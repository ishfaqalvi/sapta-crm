<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Employee Salaries & Wages', 'is_active' => true],
            ['name' => 'Office Rent & Lease', 'is_active' => true],
            ['name' => 'Software & SaaS Subscriptions', 'is_active' => true],
            ['name' => 'Cloud Servers & Hosting Infrastructure', 'is_active' => true],
            ['name' => 'Office Utilities (Electricity, Internet, Water)', 'is_active' => true],
            ['name' => 'Hardware & IT Equipment', 'is_active' => true],
            ['name' => 'Marketing & Advertising', 'is_active' => true],
            ['name' => 'Office Supplies & Maintenance', 'is_active' => true],
            ['name' => 'Legal & Accounting Professional Fees', 'is_active' => true],
            ['name' => 'Travel & Entertainment', 'is_active' => true],
        ];

        foreach ($categories as $cat) {
            ExpenseCategory::firstOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
