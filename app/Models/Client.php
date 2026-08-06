<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_code',
        'name',
        'company_name',
        'contact_person',
        'email',
        'phone',
        'mobile',
        'city',
        'country',
        'currency',
        'status',
        'notes',
    ];

    /**
     * Helper to generate unique Client Code (e.g. CLI-0001)
     */
    public static function generateClientCode(): string
    {
        $lastClient = static::latest('id')->first();
        $nextId = $lastClient ? ($lastClient->id + 1) : 1;
        return 'CLI-' . str_pad((string) $nextId, 4, '0', STR_PAD_LEFT);
    }

    public function seoRetainers()
    {
        return $this->hasMany(SeoRetainer::class);
    }

    public function seoPayments()
    {
        return $this->hasMany(SeoPayment::class);
    }

    public function websiteProjects()
    {
        return $this->hasMany(WebsiteProject::class);
    }

    public function projectPayments()
    {
        return $this->hasMany(ProjectPayment::class);
    }

    public function credentials()
    {
        return $this->hasMany(ClientCredential::class);
    }

    /**
     * Relationship: Client has one portal User account (type = client).
     */
    public function user()
    {
        return $this->hasOne(User::class, 'client_id')->where('type', 'client');
    }
}
