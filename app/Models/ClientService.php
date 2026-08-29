<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClientService extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'category_id',
        'service_name',
        'monthly_fee',
        'contract_months',
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
        'contract_months' => 'integer',
        'exchange_rate' => 'decimal:4',
        'monthly_fee_pkr' => 'decimal:2',
        'billing_day' => 'integer',
        'start_date' => 'date',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'category_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ServicePayment::class, 'client_service_id');
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(ClientCredential::class, 'client_service_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ClientDocument::class, 'client_service_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ServiceTask::class, 'client_service_id');
    }
}
