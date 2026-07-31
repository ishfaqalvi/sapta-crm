<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'client_id',
        'website_project_id',
        'project_payment_id',
        'currency_code',
        'exchange_rate_to_pkr',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'discount',
        'total_amount',
        'total_amount_pkr',
        'issue_date',
        'due_date',
        'status',
        'notes',
        'terms',
        'created_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'exchange_rate_to_pkr' => 'float',
        'subtotal' => 'float',
        'tax_rate' => 'float',
        'tax_amount' => 'float',
        'discount' => 'float',
        'total_amount' => 'float',
        'total_amount_pkr' => 'float',
    ];

    /**
     * Relationship: Invoice belongs to a Client.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Relationship: Invoice belongs to a Website Project.
     */
    public function websiteProject(): BelongsTo
    {
        return $this->belongsTo(WebsiteProject::class, 'website_project_id');
    }

    /**
     * Relationship: Invoice belongs to a Project Payment (Milestone).
     */
    public function milestonePayment(): BelongsTo
    {
        return $this->belongsTo(ProjectPayment::class, 'project_payment_id');
    }

    /**
     * Relationship: Invoice has many line items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    /**
     * Relationship: Invoice created by User.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Generate next sequential Invoice Number.
     */
    public static function generateNextInvoiceNumber(): string
    {
        $prefix = SystemSetting::get('invoice_prefix', 'SAPTA-INV-');
        $year = date('Y');
        $lastInvoice = static::whereYear('created_at', $year)->orderBy('id', 'desc')->first();

        if (!$lastInvoice) {
            $number = 1;
        } else {
            // Extract trailing number
            preg_match('/(\d+)$/', $lastInvoice->invoice_number, $matches);
            $number = isset($matches[1]) ? ((int) $matches[1] + 1) : ($lastInvoice->id + 1);
        }

        return sprintf('%s%s-%04d', $prefix, $year, $number);
    }
}
