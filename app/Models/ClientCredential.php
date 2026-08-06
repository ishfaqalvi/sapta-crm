<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientCredential extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'title',
        'type',
        'username',
        'password',
        'url',
        'notes',
    ];

    /**
     * Get the client that owns the credential.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
