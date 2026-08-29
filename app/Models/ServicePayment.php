<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class ServicePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_service_id',
        'client_id',
        'parent_id',
        'billing_month',
        'split_title',
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

    public function service(): BelongsTo
    {
        return $this->belongsTo(ClientService::class, 'client_service_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ServicePayment::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(ServicePayment::class, 'parent_id');
    }

    public function invoice(): HasOneThrough
    {
        return $this->hasOneThrough(
            Invoice::class,
            InvoiceItem::class,
            'invoiceable_id',
            'id',
            'id',
            'invoice_id'
        )->where('invoice_items.invoiceable_type', static::class);
    }

    public function invoiceItems()
    {
        return $this->morphMany(InvoiceItem::class, 'invoiceable');
    }
}
