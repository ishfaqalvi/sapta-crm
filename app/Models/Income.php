<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Income extends Model
{
    use HasFactory;

    protected $fillable = [
        'income_category_id',
        'title',
        'amount',
        'currency',
        'income_date',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'income_date' => 'date:Y-m-d',
    ];

    /**
     * Get the category associated with the income.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(IncomeCategory::class, 'income_category_id');
    }
}
