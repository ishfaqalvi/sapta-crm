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

    public function servicePayments()
    {
        return $this->hasMany(ServicePayment::class, 'client_id');
    }

    public function websiteProjects()
    {
        return $this->hasMany(WebsiteProject::class);
    }

    public function services()
    {
        return $this->hasMany(ClientService::class, 'client_id');
    }

    public function clientServices()
    {
        return $this->hasMany(ClientService::class, 'client_id');
    }

    public function projectPayments()
    {
        return $this->hasMany(ProjectPayment::class);
    }

    public function credentials()
    {
        return $this->hasMany(ClientCredential::class);
    }

    public function domains()
    {
        return $this->hasMany(ClientDomain::class);
    }

    public function hostings()
    {
        return $this->hasMany(ClientHosting::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class);
    }

    /**
     * Relationship: Client has one portal User account (type = client).
     */
    public function user()
    {
        return $this->hasOne(User::class, 'client_id')->where('type', 'client');
    }
}
