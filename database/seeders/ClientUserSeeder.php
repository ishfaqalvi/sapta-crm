<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClientUserSeeder extends Seeder
{
    /**
     * Run the database seeds for Client Users.
     */
    public function run(): void
    {
        $clients = Client::take(2)->get();

        if ($clients->isEmpty()) {
            return;
        }

        // 1. Primary Client User (Al Madina Motors)
        $firstClient = $clients->first();
        $clientUser1 = User::updateOrCreate(
            ['email' => 'client@almadina.ae'],
            [
                'name' => $firstClient->contact_person ?? 'Tariq Al-Mansoor',
                'type' => 'client',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'client_id' => $firstClient->id,
            ]
        );
        $clientUser1->syncRoles(['Client']);

        // 2. Secondary Client User (TechVentures Global if available)
        if ($clients->count() > 1) {
            $secondClient = $clients->get(1);
            $clientUser2 = User::updateOrCreate(
                ['email' => 'sarah.j@techventures.io'],
                [
                    'name' => $secondClient->contact_person ?? 'Sarah Jenkins',
                    'type' => 'client',
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'client_id' => $secondClient->id,
                ]
            );
            $clientUser2->syncRoles(['Client']);
        }
    }
}
