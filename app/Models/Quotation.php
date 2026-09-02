<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\UploadedFile;

class Quotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_number',
        'client_id',
        'currency_code',
        'exchange_rate_to_pkr',
        'subject',
        'customer_prefix',
        'customer_name',
        'customer_email',
        'customer_phone',
        'customer_address',
        'company_name',
        'company_phone',
        'company_address',
        'company_email',
        'company_whatsapp',
        'company_logo',
        'greeting',
        'opening_text',
        'closing_text',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'discount',
        'total_amount',
        'total_amount_pkr',
        'date',
        'expiry_date',
        'status',
        'notes',
        'terms',
        'authorized_by_text',
        'signature_image',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'expiry_date' => 'date',
        'exchange_rate_to_pkr' => 'float',
        'subtotal' => 'float',
        'tax_rate' => 'float',
        'tax_amount' => 'float',
        'discount' => 'float',
        'total_amount' => 'float',
        'total_amount_pkr' => 'float',
    ];

    protected static function booted(): void
    {
        static::deleting(function (Quotation $quotation) {
            $quotation->deleteOldCompanyLogoFile();
        });
    }

    /**
     * Relationship: Quotation belongs to a Client.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Relationship: Quotation has many line items.
     */
    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Relationship: Quotation created by User.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Mutator for company_logo attribute.
     */
    public function setCompanyLogoAttribute($value): void
    {
        if (is_null($value) || $value === '') {
            $this->deleteOldCompanyLogoFile();
            $this->attributes['company_logo'] = null;
            return;
        }

        if ($value instanceof UploadedFile && $value->isValid()) {
            $this->deleteOldCompanyLogoFile();

            $destinationPath = public_path('uploads/quotations');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $filename = 'logo_' . time() . '_' . uniqid() . '.' . $value->getClientOriginalExtension();
            $value->move($destinationPath, $filename);

            $this->attributes['company_logo'] = '/uploads/quotations/' . $filename;
            return;
        }

        if (is_string($value)) {
            if (str_contains($value, 'Temp') || str_contains($value, '.tmp')) {
                return;
            }
            $this->attributes['company_logo'] = $value;
        }
    }

    public function deleteOldCompanyLogoFile(): void
    {
        $oldPath = $this->getRawOriginal('company_logo');
        if ($oldPath && !str_contains($oldPath, '.tmp') && file_exists(public_path($oldPath))) {
            @unlink(public_path($oldPath));
        }
    }

    /**
     * Helper to recalculate all totals from items.
     */
    public function recalculateTotals(): void
    {
        $subtotal = 0;
        foreach ($this->items as $item) {
            $subtotal += ($item->quantity * $item->unit_price);
        }

        $taxRate = (float) ($this->tax_rate ?? 0);
        $discount = (float) ($this->discount ?? 0);
        $taxAmount = ($subtotal * $taxRate) / 100;
        $totalAmount = max(0, ($subtotal + $taxAmount) - $discount);
        $rateToPkr = (float) ($this->exchange_rate_to_pkr ?: 1.0);
        $totalPkr = $totalAmount * $rateToPkr;

        $this->update([
            'subtotal' => round($subtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total_amount' => round($totalAmount, 2),
            'total_amount_pkr' => round($totalPkr, 2),
        ]);
    }
}
