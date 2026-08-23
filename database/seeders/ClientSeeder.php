<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\ClientService;
use App\Models\ServiceCategory;
use App\Models\ServicePayment;
use App\Services\CurrencyService;
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
                'notes' => 'Paused service during summer off-season.',
            ],
        ];

        foreach ($clientsData as $index => $cData) {
            $client = Client::updateOrCreate(
                ['client_code' => $cData['client_code']],
                $cData
            );
        }
    }
}


