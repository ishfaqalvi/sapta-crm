<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClientDomain extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'domain_name',
        'registrar',
        'registration_date',
        'expiry_date',
        'renewal_cost_pkr',
        'client_price_pkr',
        'auto_renew',
        'has_hosting_bundle',
        'nameserver_1',
        'nameserver_2',
        'nameserver_3',
        'nameserver_4',
        'status',
        'notes',
    ];

    protected $casts = [
        'registration_date' => 'date',
        'expiry_date' => 'date',
        'renewal_cost_pkr' => 'decimal:2',
        'client_price_pkr' => 'decimal:2',
        'auto_renew' => 'boolean',
        'has_hosting_bundle' => 'boolean',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function hostings(): HasMany
    {
        return $this->hasMany(ClientHosting::class, 'primary_domain_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(DomainPayment::class, 'client_domain_id');
    }

    public function invoiceItems()
    {
        return $this->morphMany(InvoiceItem::class, 'invoiceable');
    }

    public function invoice(): \Illuminate\Database\Eloquent\Relations\HasOneThrough
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
}
