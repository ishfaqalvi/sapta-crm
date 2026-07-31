<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('system');
            $table->timestamps();
        });

        // Insert initial default system settings
        $defaults = [
            // Company Profile
            ['key' => 'company_name', 'value' => 'Sapta Technologies', 'group' => 'company'],
            ['key' => 'company_email', 'value' => 'contact@saptatechnologies.com', 'group' => 'company'],
            ['key' => 'company_phone', 'value' => '+92 300 1234567', 'group' => 'company'],
            ['key' => 'company_address', 'value' => 'Office #402, Software Technology Park, Lahore, Pakistan', 'group' => 'company'],
            ['key' => 'company_tax_id', 'value' => 'NTN-892415-0', 'group' => 'company'],

            // Finance & Currency
            ['key' => 'base_currency', 'value' => 'PKR', 'group' => 'finance'],
            ['key' => 'invoice_prefix', 'value' => 'SAPTA-INV-', 'group' => 'finance'],
            ['key' => 'default_tax_rate', 'value' => '0', 'group' => 'finance'],
            ['key' => 'auto_exchange_rates', 'value' => '1', 'group' => 'finance'],

            // Operations & HR Defaults
            ['key' => 'default_project_deadline_days', 'value' => '30', 'group' => 'operations'],
            ['key' => 'monthly_working_days', 'value' => '26', 'group' => 'operations'],
            ['key' => 'default_paid_leaves', 'value' => '1.5', 'group' => 'operations'],

            // Notifications & Control
            ['key' => 'email_notifications', 'value' => '1', 'group' => 'system'],
            ['key' => 'overdue_payment_alerts', 'value' => '1', 'group' => 'system'],
            ['key' => 'maintenance_mode', 'value' => '0', 'group' => 'system'],
        ];

        foreach ($defaults as $item) {
            DB::table('system_settings')->insert([
                'key' => $item['key'],
                'value' => $item['value'],
                'group' => $item['group'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
