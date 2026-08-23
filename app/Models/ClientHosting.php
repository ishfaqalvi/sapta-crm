<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientHosting extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'hosting_title',
        'provider',
        'server_ip',
        'server_type',
        'billing_cycle',
        'setup_date',
        'expiry_date',
        'cost_pkr',
        'client_price_pkr',
        'status',
        'primary_domain_id',
        'disk_space',
        'bandwidth',
        'notes',
    ];

    protected $casts = [
        'setup_date' => 'date',
        'expiry_date' => 'date',
        'cost_pkr' => 'decimal:2',
        'client_price_pkr' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function primaryDomain(): BelongsTo
    {
        return $this->belongsTo(ClientDomain::class, 'primary_domain_id');
    }

    public function payments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(HostingPayment::class, 'client_hosting_id');
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
