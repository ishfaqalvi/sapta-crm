<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WebsiteProject extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'category_id',
        'project_name',
        'total_budget',
        'currency',
        'exchange_rate',
        'total_budget_pkr',
        'start_date',
        'deadline',
        'status',
        'progress_percentage',
        'notes',
    ];

    protected $casts = [
        'total_budget' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'total_budget_pkr' => 'decimal:2',
        'start_date' => 'date',
        'deadline' => 'date',
        'progress_percentage' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProjectCategory::class, 'category_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ProjectPayment::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'website_project_id');
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(ClientCredential::class, 'website_project_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ClientDocument::class, 'website_project_id');
    }
}
