<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\SeoPayment;
use App\Models\SeoRetainer;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clientsData = [
            [
                'client_code' => 'CLI-0001',
                'name' => 'Al Madina Motors',
                'company_name' => 'Al Madina Auto Trading LLC',
                'contact_person' => 'Tariq Al-Mansoor',
                'email' => 'tariq@almadinamotors.ae',
                'phone' => '+971 4 332 9876',
                'mobile' => '+971 50 123 4567',
                'city' => 'Dubai',
                'country' => 'United Arab Emirates',
                'currency' => 'AED',
                'status' => 'active',
                'notes' => 'VIP SEO & Website Client. Invoice sent on 5th of each month.',
                'retainer' => [
                    'package_name' => 'Automotive Enterprise SEO Retainer',
                    'monthly_fee' => 4500.00,
                    'billing_day' => 5,
                    'status' => 'active',
                    'start_date' => '2026-01-15',
                    'notes' => '25 Target Keywords, 6 Blog Posts/mo, Local GMB Optimization',
                ],
            ],
            [
                'client_code' => 'CLI-0002',
                'name' => 'TechVentures Global',
                'company_name' => 'TechVentures FZ-LLC',
                'contact_person' => 'Sarah Jenkins',
                'email' => 'sarah.j@techventures.io',
                'phone' => '+1 415 890 1234',
                'mobile' => '+1 415 555 9821',
                'city' => 'San Francisco',
                'country' => 'United States',
                'currency' => 'USD',
                'status' => 'active',
                'notes' => 'Enterprise SaaS platform SEO and Web Development contract.',
                'retainer' => [
                    'package_name' => 'SaaS Global Rank Growth Package',
                    'monthly_fee' => 2500.00,
                    'billing_day' => 1,
                    'status' => 'active',
                    'start_date' => '2026-02-01',
                    'notes' => 'Global Technical SEO, Backlink Building, Technical Audits',
                ],
            ],
            [
                'client_code' => 'CLI-0003',
                'name' => 'Gulf Healthcare Group',
                'company_name' => 'Gulf Medical Supplies WLL',
                'contact_person' => 'Dr. Faisal Al-Sabah',
                'email' => 'faisal@gulfhealth.com',
                'phone' => '+965 2 244 5566',
                'mobile' => '+965 9 876 5432',
                'city' => 'Kuwait City',
                'country' => 'Kuwait',
                'currency' => 'SAR',
                'status' => 'active',
                'notes' => 'Healthcare portal SEO & medical content strategy.',
                'retainer' => [
                    'package_name' => 'Medical & Clinic Regional SEO',
                    'monthly_fee' => 6000.00,
                    'billing_day' => 10,
                    'status' => 'active',
                    'start_date' => '2026-03-01',
                    'notes' => 'Arabic & English Content Optimization',
                ],
            ],
            [
                'client_code' => 'CLI-0004',
                'name' => 'Karachi Logistics Co',
                'company_name' => 'Karachi Cargo & Freight Pvt Ltd',
                'contact_person' => 'Hamza Raza',
                'email' => 'hamza@kclogistics.pk',
                'phone' => '+92 21 3456 7890',
                'mobile' => '+92 300 4455 667',
                'city' => 'Karachi',
                'country' => 'Pakistan',
                'currency' => 'PKR',
                'status' => 'active',
                'notes' => 'Freight & Logistics Local SEO & Google Maps management.',
                'retainer' => [
                    'package_name' => 'Freight & Logistics Local SEO',
                    'monthly_fee' => 120000.00,
                    'billing_day' => 15,
                    'status' => 'active',
                    'start_date' => '2026-04-10',
                    'notes' => 'GMB Optimization & Local Citation Building',
                ],
            ],
            [
                'client_code' => 'CLI-0005',
                'name' => 'Apex Real Estate Agency',
                'company_name' => 'Apex Properties Dubai',
                'contact_person' => 'Rashid Siddiqui',
                'email' => 'rashid@apexproperties.ae',
                'phone' => '+971 4 555 1212',
                'mobile' => '+971 52 998 7766',
                'city' => 'Dubai',
                'country' => 'United Arab Emirates',
                'currency' => 'AED',
                'status' => 'active',
                'notes' => 'Luxury property SEO & lead generation campaigns.',
                'retainer' => [
                    'package_name' => 'Real Estate Dominance SEO Retainer',
                    'monthly_fee' => 5000.00,
                    'billing_day' => 1,
                    'status' => 'active',
                    'start_date' => '2026-01-01',
                    'notes' => 'Property Listing SEO, Off-Page Link Building',
                ],
            ],
            [
                'client_code' => 'CLI-0006',
                'name' => 'BlueSky Travel & Tourism',
                'company_name' => 'BlueSky Tours FZCO',
                'contact_person' => 'Elena Rostova',
                'email' => 'elena@blueskytours.com',
                'phone' => '+971 4 223 9988',
                'mobile' => '+971 55 667 8899',
                'city' => 'Abu Dhabi',
                'country' => 'United Arab Emirates',
                'currency' => 'AED',
                'status' => 'inactive',
                'notes' => 'Paused retainer during summer off-season.',
                'retainer' => [
                    'package_name' => 'Tourism & Safari SEO Package',
                    'monthly_fee' => 3000.00,
                    'billing_day' => 20,
                    'status' => 'paused',
                    'start_date' => '2025-11-01',
                    'notes' => 'Temporarily paused per client request',
                ],
            ],
        ];

        foreach ($clientsData as $cData) {
            $retainerData = $cData['retainer'];
            unset($cData['retainer']);

            $client = Client::updateOrCreate(
                ['client_code' => $cData['client_code']],
                $cData
            );

            // Create SEO Retainer for client
            $retainer = SeoRetainer::updateOrCreate(
                [
                    'client_id' => $client->id,
                    'package_name' => $retainerData['package_name'],
                ],
                [
                    'monthly_fee' => $retainerData['monthly_fee'],
                    'currency' => $client->currency,
                    'billing_day' => $retainerData['billing_day'],
                    'status' => $retainerData['status'],
                    'start_date' => $retainerData['start_date'],
                    'notes' => $retainerData['notes'],
                ]
            );

            // Create sample billing logs for current month and previous month
            SeoPayment::updateOrCreate(
                [
                    'seo_retainer_id' => $retainer->id,
                    'billing_month' => '2026-07',
                ],
                [
                    'client_id' => $client->id,
                    'amount_due' => $retainer->monthly_fee,
                    'amount_paid' => $retainer->status === 'active' ? $retainer->monthly_fee : 0.00,
                    'payment_date' => $retainer->status === 'active' ? '2026-07-05' : null,
                    'status' => $retainer->status === 'active' ? 'cleared' : 'due_pending',
                    'payment_method' => $retainer->status === 'active' ? 'Bank Transfer' : null,
                    'notes' => $retainer->status === 'active' ? 'Cleared via Emirates NBD transfer' : 'Pending client approval',
                ]
            );

            // Create sample Website Project for client
            $project = \App\Models\WebsiteProject::updateOrCreate(
                [
                    'client_id' => $client->id,
                    'project_name' => $client->name . ' Custom Portal Development',
                ],
                [
                    'category_id' => ($index % 4) + 1,
                    'total_budget' => 15000.00,
                    'currency' => $client->currency,
                    'start_date' => '2026-06-01',
                    'deadline' => '2026-09-30',
                    'status' => 'in_progress',
                    'progress_percentage' => 65,
                    'notes' => 'Custom Laravel + React Frontend, Payment Gateway Integration & Admin Panel',
                ]
            );

            // Milestone 1: Advance
            \App\Models\ProjectPayment::updateOrCreate(
                [
                    'website_project_id' => $project->id,
                    'milestone_title' => '50% Contract Signing Advance',
                ],
                [
                    'client_id' => $client->id,
                    'amount' => 7500.00,
                    'payment_stage' => 'advance',
                    'status' => 'paid',
                    'paid_at' => '2026-06-05',
                    'payment_method' => 'Bank Transfer',
                    'notes' => 'Advance received prior to design sprint',
                ]
            );

            // Milestone 2: UI Design & Staging Approval
            \App\Models\ProjectPayment::updateOrCreate(
                [
                    'website_project_id' => $project->id,
                    'milestone_title' => '25% Design & Staging Milestone',
                ],
                [
                    'client_id' => $client->id,
                    'amount' => 3750.00,
                    'payment_stage' => 'partial',
                    'status' => 'pending',
                    'paid_at' => null,
                    'payment_method' => null,
                    'notes' => 'Due upon staging site sign-off',
                ]
            );
        }
    }
}
