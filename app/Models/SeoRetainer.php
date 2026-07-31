<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SeoRetainer extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'package_name',
        'monthly_fee',
        'currency',
        'exchange_rate',
        'monthly_fee_pkr',
        'start_date',
        'billing_day',
        'status',
        'notes',
    ];

    protected $casts = [
        'monthly_fee' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'monthly_fee_pkr' => 'decimal:2',
        'billing_day' => 'integer',
        'start_date' => 'date',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SeoPayment::class);
    }
}
