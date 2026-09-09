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
     * Auto-synchronize linked polymorphic items when invoice status is 'paid'.
     */
    public function syncPaidStatusForItems(): void
    {
        foreach ($this->items as $item) {
            if (!$item->invoiceable_type || !$item->invoiceable_id) {
                continue;
            }

            if ($item->invoiceable_type === ProjectPayment::class) {
                $payment = ProjectPayment::find($item->invoiceable_id);
                if ($payment && $payment->status !== 'paid') {
                    $payment->update([
                        'status' => 'paid',
                        'paid_at' => $payment->paid_at ?? now()->toDateString(),
                    ]);
                }
            } elseif ($item->invoiceable_type === ServicePayment::class) {
                $servicePayment = ServicePayment::find($item->invoiceable_id);
                if ($servicePayment && $servicePayment->status !== 'paid') {
                    $servicePayment->update([
                        'status' => 'paid',
                        'payment_date' => $servicePayment->payment_date ?? now()->toDateString(),
                        'amount_paid' => $servicePayment->amount_due ?? $item->amount,
                    ]);
                }
            } elseif ($item->invoiceable_type === ClientService::class) {
                $service = ClientService::find($item->invoiceable_id);
                if ($service && $service->status !== 'active') {
                    $service->update([
                        'status' => 'active',
                    ]);
                }
            } elseif ($item->invoiceable_type === DomainPayment::class) {
                $domainPayment = DomainPayment::find($item->invoiceable_id);
                if ($domainPayment && $domainPayment->status !== 'paid') {
                    $domainPayment->update([
                        'status' => 'paid',
                        'paid_at' => $domainPayment->paid_at ?? now()->toDateString(),
                    ]);

                    // Update parent domain status and advance expiry if renewal
                    if ($domainPayment->domain) {
                        $domain = $domainPayment->domain;
                        $newExpiry = $domain->expiry_date
                            ? \Carbon\Carbon::parse($domain->expiry_date)->addYear()
                            : now()->addYear();

                        $domain->update([
                            'status' => 'active',
                            'expiry_date' => $newExpiry->format('Y-m-d'),
                        ]);
                    }
                }
            } elseif ($item->invoiceable_type === HostingPayment::class) {
                $hostingPayment = HostingPayment::find($item->invoiceable_id);
                if ($hostingPayment && $hostingPayment->status !== 'paid') {
                    $hostingPayment->update([
                        'status' => 'paid',
                        'paid_at' => $hostingPayment->paid_at ?? now()->toDateString(),
                    ]);

                    // Update parent hosting status and advance expiry
                    if ($hostingPayment->hosting) {
                        $hosting = $hostingPayment->hosting;
                        $currentExpiry = $hosting->expiry_date ? \Carbon\Carbon::parse($hosting->expiry_date) : now();
                        $newExpiry = match ($hosting->billing_cycle) {
                            'monthly' => $currentExpiry->addMonth(),
                            'quarterly' => $currentExpiry->addMonths(3),
                            'semi_annual' => $currentExpiry->addMonths(6),
                            'biennial' => $currentExpiry->addYears(2),
                            default => $currentExpiry->addYear(),
                        };

                        $hosting->update([
                            'status' => 'active',
                            'expiry_date' => $newExpiry->format('Y-m-d'),
                        ]);
                    }
                }
            } elseif ($item->invoiceable_type === ClientDomain::class) {
                $domain = ClientDomain::find($item->invoiceable_id);
                if ($domain) {
                    $newExpiry = $domain->expiry_date
                        ? \Carbon\Carbon::parse($domain->expiry_date)->addYear()
                        : now()->addYear();

                    $domain->update([
                        'status' => 'active',
                        'expiry_date' => $newExpiry->format('Y-m-d'),
                    ]);
                }
            } elseif ($item->invoiceable_type === ClientHosting::class) {
                $hosting = ClientHosting::find($item->invoiceable_id);
                if ($hosting) {
                    $currentExpiry = $hosting->expiry_date ? \Carbon\Carbon::parse($hosting->expiry_date) : now();
                    $newExpiry = match ($hosting->billing_cycle) {
                        'monthly' => $currentExpiry->addMonth(),
                        'quarterly' => $currentExpiry->addMonths(3),
                        'semi_annual' => $currentExpiry->addMonths(6),
                        'biennial' => $currentExpiry->addYears(2),
                        default => $currentExpiry->addYear(),
                    };

                    $hosting->update([
                        'status' => 'active',
                        'expiry_date' => $newExpiry->format('Y-m-d'),
                    ]);
                }
            }
        }
    }

    /**
     * Check if all linked items for this invoice are in a paid/active state.
     * If all items are paid, automatically mark the whole invoice as 'paid'.
     */
    public function checkIfFullyPaidAndSync(): bool
    {
        $items = $this->items()->get();
        if ($items->isEmpty()) {
            return false;
        }

        $allPaid = true;
        $hasPayableItems = false;

        foreach ($items as $item) {
            if (!$item->invoiceable_type || !$item->invoiceable_id) {
                continue;
            }

            $hasPayableItems = true;
            $isItemPaid = false;
            $type = $item->invoiceable_type;
            $id = $item->invoiceable_id;

            // Resolve class if short name was used
            if (!class_exists($type)) {
                $namespaced = 'App\\Models\\' . class_basename($type);
                if (class_exists($namespaced)) {
                    $type = $namespaced;
                }
            }

            if (class_exists($type)) {
                $payable = $type::find($id);
                if ($payable) {
                    if (isset($payable->status)) {
                        $isItemPaid = in_array(strtolower((string) $payable->status), ['paid', 'active', 'completed']);
                    } else {
                        $isItemPaid = true;
                    }
                }
            } else {
                $isItemPaid = true;
            }

            if (!$isItemPaid) {
                $allPaid = false;
                break;
            }
        }

        if ($hasPayableItems && $allPaid && $this->status !== 'paid') {
            $this->update(['status' => 'paid']);
            return true;
        }

        return false;
    }

    /**
     * Static helper: When any payable child record is marked as paid,
     * find its linked invoices and verify if all items are fully paid.
     */
    public static function syncItemAndCheckInvoicePaid(Model $record): void
    {
        $recordClass = get_class($record);
        $recordBasename = class_basename($record);
        $morphAlias = $record->getMorphClass();

        $types = array_unique([$recordClass, $recordBasename, $morphAlias, '\\' . $recordClass]);

        $invoiceItems = InvoiceItem::whereIn('invoiceable_type', $types)
            ->where('invoiceable_id', $record->id)
            ->with('invoice')
            ->get();

        foreach ($invoiceItems as $item) {
            if ($item->invoice) {
                $item->invoice->checkIfFullyPaidAndSync();
            }
        }

        if (method_exists($record, 'invoice') && $record->invoice) {
            $record->invoice->checkIfFullyPaidAndSync();
        }
    }

    /**
     * Revert all linked items when an invoice is deleted or cancelled.
     * Restores project payments, service payments, domain payments, hosting payments
     * back to unpaid/due status so they can be invoiced again.
     */
    public function revertLinkedItems(): void
    {
        foreach ($this->items as $item) {
            if (!$item->invoiceable_type || !$item->invoiceable_id) {
                continue;
            }

            $type = $item->invoiceable_type;
            $id = $item->invoiceable_id;

            if (!class_exists($type)) {
                $namespaced = 'App\\Models\\' . class_basename($type);
                if (class_exists($namespaced)) {
                    $type = $namespaced;
                }
            }

            if ($type === ProjectPayment::class || is_a($type, ProjectPayment::class, true)) {
                $payment = ProjectPayment::find($id);
                if ($payment) {
                    $payment->update([
                        'status' => 'pending',
                        'paid_at' => null,
                    ]);
                }
            } elseif ($type === ServicePayment::class || is_a($type, ServicePayment::class, true)) {
                $servicePayment = ServicePayment::find($id);
                if ($servicePayment) {
                    $servicePayment->update([
                        'status' => 'due',
                        'amount_paid' => 0.00,
                        'amount_paid_pkr' => 0.00,
                        'payment_date' => null,
                    ]);
                }
            } elseif ($type === DomainPayment::class || is_a($type, DomainPayment::class, true)) {
                $domainPayment = DomainPayment::find($id);
                if ($domainPayment) {
                    if ($domainPayment->status === 'paid' && $domainPayment->domain && $domainPayment->domain->expiry_date) {
                        $domain = $domainPayment->domain;
                        $revertedExpiry = \Carbon\Carbon::parse($domain->expiry_date)->subYear();
                        $domain->update([
                            'expiry_date' => $revertedExpiry->format('Y-m-d'),
                        ]);
                    }

                    $domainPayment->update([
                        'status' => 'pending',
                        'paid_at' => null,
                    ]);
                }
            } elseif ($type === HostingPayment::class || is_a($type, HostingPayment::class, true)) {
                $hostingPayment = HostingPayment::find($id);
                if ($hostingPayment) {
                    if ($hostingPayment->status === 'paid' && $hostingPayment->hosting && $hostingPayment->hosting->expiry_date) {
                        $hosting = $hostingPayment->hosting;
                        $currentExpiry = \Carbon\Carbon::parse($hosting->expiry_date);
                        $revertedExpiry = match ($hosting->billing_cycle) {
                            'monthly' => $currentExpiry->subMonth(),
                            'quarterly' => $currentExpiry->subMonths(3),
                            'semi_annual' => $currentExpiry->subMonths(6),
                            'biennial' => $currentExpiry->subYears(2),
                            'triennial' => $currentExpiry->subYears(3),
                            default => $currentExpiry->subYear(),
                        };
                        $hosting->update([
                            'expiry_date' => $revertedExpiry->format('Y-m-d'),
                        ]);
                    }

                    $hostingPayment->update([
                        'status' => 'pending',
                        'paid_at' => null,
                    ]);
                }
            } elseif ($type === ClientDomain::class || is_a($type, ClientDomain::class, true)) {
                $domain = ClientDomain::find($id);
                if ($domain && $this->status === 'paid' && $domain->expiry_date) {
                    $revertedExpiry = \Carbon\Carbon::parse($domain->expiry_date)->subYear();
                    $domain->update([
                        'expiry_date' => $revertedExpiry->format('Y-m-d'),
                    ]);
                }
            } elseif ($type === ClientHosting::class || is_a($type, ClientHosting::class, true)) {
                $hosting = ClientHosting::find($id);
                if ($hosting && $this->status === 'paid' && $hosting->expiry_date) {
                    $currentExpiry = \Carbon\Carbon::parse($hosting->expiry_date);
                    $revertedExpiry = match ($hosting->billing_cycle) {
                        'monthly' => $currentExpiry->subMonth(),
                        'quarterly' => $currentExpiry->subMonths(3),
                        'semi_annual' => $currentExpiry->subMonths(6),
                        'biennial' => $currentExpiry->subYears(2),
                        'triennial' => $currentExpiry->subYears(3),
                        default => $currentExpiry->subYear(),
                    };
                    $hosting->update([
                        'expiry_date' => $revertedExpiry->format('Y-m-d'),
                    ]);
                }
            }
        }
    }

    protected static function booted(): void
    {
        static::saved(function (Invoice $invoice) {
            if ($invoice->status === 'paid') {
                $invoice->syncPaidStatusForItems();
            }
        });

        static::deleting(function (Invoice $invoice) {
            $invoice->revertLinkedItems();
            $invoice->items()->delete();
        });
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
