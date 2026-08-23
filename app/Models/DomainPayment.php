<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class DomainPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_domain_id',
        'client_id',
        'title',
        'amount',
        'exchange_rate',
        'amount_pkr',
        'payment_type',
        'status',
        'due_date',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_pkr' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'date',
    ];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(ClientDomain::class, 'client_domain_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
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
