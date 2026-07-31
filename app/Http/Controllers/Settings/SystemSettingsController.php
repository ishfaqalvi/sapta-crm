<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingsController extends Controller
{
    /**
     * Display the System Settings page.
     */
    public function index(Request $request): Response
    {
        $dbSettings = SystemSetting::getAllMap();
        $currencies = Currency::where('is_active', true)->get();

        $settings = array_merge([
            'company_name' => 'Sapta Technologies',
            'company_email' => 'contact@saptatechnologies.com',
            'company_phone' => '+92 300 1234567',
            'company_address' => 'Office #402, Software Technology Park, Lahore, Pakistan',
            'company_tax_id' => 'NTN-892415-0',
            'base_currency' => 'PKR',
            'invoice_prefix' => 'SAPTA-INV-',
            'default_tax_rate' => '0',
            'auto_exchange_rates' => '1',
            'default_project_deadline_days' => '30',
            'monthly_working_days' => '26',
            'default_paid_leaves' => '1.5',
            'email_notifications' => '1',
            'overdue_payment_alerts' => '1',
            'maintenance_mode' => '0',
        ], $dbSettings);

        // Convert boolean flags for React switch inputs
        $settings['auto_exchange_rates'] = (bool) ($settings['auto_exchange_rates'] ?? true);
        $settings['email_notifications'] = (bool) ($settings['email_notifications'] ?? true);
        $settings['overdue_payment_alerts'] = (bool) ($settings['overdue_payment_alerts'] ?? true);
        $settings['maintenance_mode'] = (bool) ($settings['maintenance_mode'] ?? false);

        return Inertia::render('settings/system', [
            'settings' => $settings,
            'currencies' => $currencies,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the System Settings in database.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'company_email' => ['required', 'email', 'max:255'],
            'company_phone' => ['nullable', 'string', 'max:50'],
            'company_address' => ['nullable', 'string', 'max:500'],
            'company_tax_id' => ['nullable', 'string', 'max:100'],
            'base_currency' => ['required', 'string', 'max:10'],
            'invoice_prefix' => ['required', 'string', 'max:50'],
            'default_tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'auto_exchange_rates' => ['nullable', 'boolean'],
            'default_project_deadline_days' => ['required', 'integer', 'min:1', 'max:365'],
            'monthly_working_days' => ['required', 'integer', 'min:1', 'max:31'],
            'default_paid_leaves' => ['required', 'numeric', 'min:0', 'max:15'],
            'email_notifications' => ['nullable', 'boolean'],
            'overdue_payment_alerts' => ['nullable', 'boolean'],
            'maintenance_mode' => ['nullable', 'boolean'],
        ]);

        foreach ($validated as $key => $value) {
            $group = match ($key) {
                'company_name', 'company_email', 'company_phone', 'company_address', 'company_tax_id' => 'company',
                'base_currency', 'invoice_prefix', 'default_tax_rate', 'auto_exchange_rates' => 'finance',
                'default_project_deadline_days', 'monthly_working_days', 'default_paid_leaves' => 'operations',
                default => 'system',
            };

            SystemSetting::set($key, is_bool($value) ? ($value ? '1' : '0') : $value, $group);
        }

        return redirect()->back()->with('success', 'System configuration saved successfully.');
    }
}
