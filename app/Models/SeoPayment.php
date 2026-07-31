<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'seo_retainer_id',
        'client_id',
        'billing_month',
        'amount_due',
        'amount_paid',
        'exchange_rate',
        'amount_paid_pkr',
        'payment_date',
        'status',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_paid_pkr' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function seoRetainer(): BelongsTo
    {
        return $this->belongsTo(SeoRetainer::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
