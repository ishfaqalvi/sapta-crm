<?php

namespace App\Services;

use App\Models\Currency;
use Illuminate\Support\Facades\Schema;

class CurrencyService
{
    /**
     * Get Exchange Rates relative to 1 PKR for all active currencies from DB.
     */
    public static function getDefaultRates(): array
    {
        try {
            if (Schema::hasTable('currencies')) {
                $rates = Currency::where('is_active', true)->pluck('exchange_rate_to_pkr', 'code')->toArray();
                if (!empty($rates)) {
                    // Ensure float values
                    return array_map('floatval', $rates);
                }
            }
        } catch (\Throwable $e) {
            // Fallback if DB query fails during early bootstrap
        }

        return [
            'PKR' => 1.0000,
            'USD' => 278.5000,
            'EUR' => 300.0000,
            'GBP' => 355.0000,
            'AED' => 75.8000,
        ];
    }

    /**
     * Get active Currency objects list.
     */
    public static function getActiveCurrencies(): array
    {
        try {
            if (Schema::hasTable('currencies')) {
                return Currency::where('is_active', true)->get()->toArray();
            }
        } catch (\Throwable $e) {
        }

        return [];
    }

    /**
     * Get Exchange Rate for a specific currency code relative to PKR.
     */
    public static function getRate(string $currency): float
    {
        $rates = static::getDefaultRates();
        $code = strtoupper(trim($currency));

        return isset($rates[$code]) ? (float) $rates[$code] : 1.0000;
    }

    /**
     * Convert an amount in a given currency to PKR.
     */
    public static function convertToPkr(float $amount, string $currency, ?float $customExchangeRate = null): float
    {
        $rate = ($customExchangeRate && $customExchangeRate > 0) ? $customExchangeRate : static::getRate($currency);
        return round($amount * $rate, 2);
    }
}
