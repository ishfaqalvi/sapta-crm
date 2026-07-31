<?php

namespace App\Console\Commands;

use App\Models\SeoPayment;
use App\Models\SeoRetainer;
use Illuminate\Console\Command;

class GenerateSeoMonthlyPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seo:generate-monthly-payments {--month= : Target billing month in Y-m format}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically generate monthly billing logs for all active SEO Retainers';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $billingMonth = $this->option('month') ?: date('Y-m');

        $activeRetainers = SeoRetainer::where('status', 'active')->get();
        $generatedCount = 0;

        foreach ($activeRetainers as $retainer) {
            // Check if billing log already exists for this retainer & month
            $exists = SeoPayment::where('seo_retainer_id', $retainer->id)
                ->where('billing_month', $billingMonth)
                ->exists();

            if (!$exists) {
                SeoPayment::create([
                    'seo_retainer_id' => $retainer->id,
                    'client_id' => $retainer->client_id,
                    'billing_month' => $billingMonth,
                    'amount_due' => $retainer->monthly_fee,
                    'amount_paid' => 0.00,
                    'status' => 'due_pending',
                    'notes' => 'Auto-generated monthly billing log for ' . $billingMonth,
                ]);
                $generatedCount++;
            }
        }

        $this->info("Successfully generated {$generatedCount} new SEO payment billing logs for {$billingMonth}.");

        return Command::SUCCESS;
    }
}
