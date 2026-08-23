<?php

namespace App\Console\Commands;

use App\Models\ClientService;
use App\Models\ServicePayment;
use App\Services\CurrencyService;
use Illuminate\Console\Command;

class GenerateSeoMonthlyPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'services:generate-monthly-payments {--month= : Target billing month in Y-m format}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically generate monthly billing logs for all active Client Services';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $billingMonth = $this->option('month') ?: date('Y-m');

        $activeServices = ClientService::where('status', 'active')->get();
        $generatedCount = 0;

        foreach ($activeServices as $service) {
            // Check if billing log already exists for this service & month
            $exists = ServicePayment::where('client_service_id', $service->id)
                ->where('billing_month', $billingMonth)
                ->exists();

            if (!$exists) {
                $rate = CurrencyService::getRate($service->currency);
                ServicePayment::create([
                    'client_service_id' => $service->id,
                    'client_id' => $service->client_id,
                    'billing_month' => $billingMonth,
                    'amount_due' => $service->monthly_fee,
                    'amount_paid' => 0.00,
                    'exchange_rate' => $rate,
                    'amount_paid_pkr' => 0.00,
                    'status' => 'due_pending',
                    'notes' => 'Auto-generated monthly billing log for ' . $billingMonth,
                ]);
                $generatedCount++;
            }
        }

        $this->info("Successfully generated {$generatedCount} new service payment billing logs for {$billingMonth}.");

        return Command::SUCCESS;
    }
}

