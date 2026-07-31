<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'website_project_id',
        'client_id',
        'milestone_title',
        'amount',
        'exchange_rate',
        'amount_pkr',
        'payment_stage',
        'status',
        'paid_at',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_pkr' => 'decimal:2',
        'paid_at' => 'date',
    ];

    public function websiteProject(): BelongsTo
    {
        return $this->belongsTo(WebsiteProject::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
