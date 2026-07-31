<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'symbol',
        'exchange_rate_to_pkr',
        'is_base',
        'is_active',
    ];

    protected $casts = [
        'exchange_rate_to_pkr' => 'decimal:4',
        'is_base' => 'boolean',
        'is_active' => 'boolean',
    ];
}
