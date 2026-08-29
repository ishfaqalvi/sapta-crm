<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientDomain;
use App\Models\DomainPayment;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\User;
use App\Notifications\CrmNotification;
use App\Services\CurrencyService;
use App\Traits\AuthorizesClientPortalAccess;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DomainController extends Controller
{
    use AuthorizesClientPortalAccess;

    public function index(Request $request): Response
    {
        $this->authorizePermission('view-client-portal-domains');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = ClientDomain::where('client_id', $clientId)->with(['invoice', 'invoiceItems.invoice']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('domain_name', 'like', "%{$search}%")
                    ->orWhere('registrar', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $domains = $query->latest('id')->paginate(12)->withQueryString();

        $stats = [
            'total' => ClientDomain::where('client_id', $clientId)->count(),
            'active' => ClientDomain::where('client_id', $clientId)->where('status', 'active')->count(),
            'expiring_soon' => ClientDomain::where('client_id', $clientId)->whereBetween('expiry_date', [now(), now()->addDays(30)])->count(),
        ];

        return Inertia::render('client-portal/domains/index', [
            'client' => $client,
            'domains' => $domains,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(ClientDomain $domain): Response
    {
        $this->authorizePermission('view-client-portal-domains');

        $clientId = $this->getClientId($domain->client_id);
        if ((int) $domain->client_id !== $clientId) {
            abort(403, 'Unauthorized access to domain record');
        }

        $client = $this->getClientModel($domain->client_id);

        // If domain has no payments yet, auto-create the initial registration payment
        if ($domain->payments()->count() === 0) {
            $regYear = $domain->registration_date ? Carbon::parse($domain->registration_date)->format('Y') : Carbon::now()->format('Y');
            $expYear = $domain->expiry_date ? Carbon::parse($domain->expiry_date)->format('Y') : Carbon::now()->addYear()->format('Y');
            $currency = $client->currency ?? 'USD';
            $rate = CurrencyService::getRate($currency);

            DomainPayment::create([
                'client_domain_id' => $domain->id,
                'client_id' => $clientId,
                'title' => "Domain Initial Registration ({$regYear} - {$expYear})",
                'amount' => $domain->client_price_pkr,
                'exchange_rate' => $rate,
                'amount_pkr' => round((float) $domain->client_price_pkr * $rate, 2),
                'payment_type' => 'registration',
                'status' => 'pending',
                'due_date' => $domain->registration_date ?? now()->toDateString(),
                'notes' => 'Auto-generated registration payment record.',
            ]);
        }

        $domain->load([
            'client',
            'hostings',
            'payments.invoice',
            'payments.invoiceItems.invoice',
            'invoiceItems.invoice',
            'invoice',
        ]);

        return Inertia::render('client-portal/domains/show', [
            'client' => $client,
            'domain' => $domain,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-domains');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $validated = $request->validate([
            'domain_name' => ['required', 'string', 'max:255'],
            'registrar' => ['required', 'string', 'max:100'],
            'registration_date' => ['nullable', 'date'],
            'expiry_date' => ['required', 'date'],
            'client_price_pkr' => ['required', 'numeric', 'min:0'],
            'auto_renew' => ['boolean'],
            'nameserver_1' => ['nullable', 'string', 'max:255'],
            'nameserver_2' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['client_id'] = $clientId;
        $validated['status'] = 'active';

        $domain = ClientDomain::create($validated);

        // Auto-create initial DomainPayment record
        $regYear = $domain->registration_date ? Carbon::parse($domain->registration_date)->format('Y') : Carbon::now()->format('Y');
        $expYear = $domain->expiry_date ? Carbon::parse($domain->expiry_date)->format('Y') : Carbon::now()->addYear()->format('Y');
        $currency = $client->currency ?? 'USD';
        $rate = CurrencyService::getRate($currency);

        DomainPayment::create([
            'client_domain_id' => $domain->id,
            'client_id' => $clientId,
            'title' => "Domain Initial Registration ({$regYear} - {$expYear})",
            'amount' => $domain->client_price_pkr,
            'exchange_rate' => $rate,
            'amount_pkr' => round((float) $domain->client_price_pkr * $rate, 2),
            'payment_type' => 'registration',
            'status' => 'pending',
            'due_date' => $domain->registration_date ?? now()->toDateString(),
            'notes' => 'Auto-generated registration payment record.',
        ]);

        // Notify Client Portal User
        $clientUser = $client->user ?: User::where('type', 'client')->where('client_id', $clientId)->first();
        if ($clientUser) {
            $clientUser->notify(new CrmNotification(
                "New Domain Registered: {$domain->domain_name}",
                "Domain '{$domain->domain_name}' has been registered in your client portal (Expires: {$domain->expiry_date}).",
                'domain_created',
                'info',
                "/client-portal/domains",
                [
                    'domain_id' => $domain->id,
                    'domain_name' => $domain->domain_name,
                    'client_id' => $clientId,
                ]
            ));
        }

        return redirect()->back()->with('success', 'Domain record added successfully!');
    }

    public function update(Request $request, ClientDomain $domain): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-domains');

        $clientId = $this->getClientId();
        if ((int) $domain->client_id !== $clientId) {
            abort(403, 'Unauthorized operation');
        }

        $validated = $request->validate([
            'domain_name' => ['required', 'string', 'max:255'],
            'registrar' => ['required', 'string', 'max:100'],
            'registration_date' => ['nullable', 'date'],
            'expiry_date' => ['required', 'date'],
            'client_price_pkr' => ['required', 'numeric', 'min:0'],
            'auto_renew' => ['boolean'],
            'nameserver_1' => ['nullable', 'string', 'max:255'],
            'nameserver_2' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $domain->update($validated);

        return redirect()->back()->with('success', 'Domain record updated successfully!');
    }

    public function destroy(ClientDomain $domain): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-domains');

        $clientId = $this->getClientId();
        if ((int) $domain->client_id !== $clientId) {
            abort(403, 'Unauthorized operation');
        }

        if ($domain->invoice()->exists() || $domain->payments()->whereHas('invoice')->exists()) {
            return redirect()->back()->with('error', 'Domain records with a generated invoice cannot be deleted.');
        }

        $domain->delete();

        return redirect()->back()->with('success', 'Domain record deleted successfully!');
    }

    /*
    |--------------------------------------------------------------------------
    | Domain Payments & Renewals (Aligned with Projects Flow)
    |--------------------------------------------------------------------------
    */
    public function storePayment(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-domain-payments');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'client_domain_id' => [
                'required',
                Rule::exists('client_domains', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'payment_type' => ['required', Rule::in(['registration', 'renewal', 'transfer', 'other'])],
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $client = $this->getClientModel();
        $currency = $client->currency ?? 'USD';
        $rate = CurrencyService::getRate($currency);

        $validated['client_id'] = $clientId;
        $validated['status'] = 'pending';
        $validated['paid_at'] = null;
        $validated['exchange_rate'] = $rate;
        $validated['amount_pkr'] = round((float) $validated['amount'] * $rate, 2);

        DomainPayment::create($validated);

        return redirect()->back()->with('success', 'Domain payment/renewal record added successfully.');
    }

    public function updatePayment(Request $request, DomainPayment $payment): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-domain-payments');

        $clientId = $this->getClientId();

        if ((int) $payment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to payment record');
        }

        if ($payment->invoice()->exists() || $payment->status === 'paid') {
            return redirect()->back()->with('error', 'Payments with a generated invoice or paid status cannot be edited.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'payment_type' => ['required', Rule::in(['registration', 'renewal', 'transfer', 'other'])],
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $client = $this->getClientModel();
        $currency = $client->currency ?? 'USD';
        $rate = CurrencyService::getRate($currency);

        $validated['exchange_rate'] = $rate;
        $validated['amount_pkr'] = round((float) $validated['amount'] * $rate, 2);

        $payment->update($validated);

        return redirect()->back()->with('success', 'Domain payment record updated successfully.');
    }

    public function destroyPayment(DomainPayment $payment): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-domain-payments');

        $clientId = $this->getClientId();

        if ((int) $payment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to payment record');
        }

        if ($payment->invoice()->exists() || $payment->status === 'paid') {
            return redirect()->back()->with('error', 'Payments with a generated invoice or paid status cannot be deleted.');
        }

        $payment->delete();

        return redirect()->back()->with('success', 'Domain payment record deleted successfully.');
    }

    public function generatePaymentInvoice(DomainPayment $payment): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-invoices');

        $clientId = $this->getClientId();

        if ((int) $payment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to payment record');
        }

        if ($payment->invoice()->exists()) {
            return redirect()->back()->with('error', 'An invoice has already been generated for this payment.');
        }

        $client = $this->getClientModel();
        $domain = $payment->domain;
        $currency = $client->currency ?? 'USD';
        $rate = CurrencyService::getRate($currency);
        $amount = (float) $payment->amount;

        $invoiceNumber = Invoice::generateNextInvoiceNumber();

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'client_id' => $clientId,
            'currency_code' => $currency,
            'exchange_rate_to_pkr' => $rate,
            'subtotal' => $amount,
            'tax_rate' => 0.00,
            'tax_amount' => 0.00,
            'discount' => 0.00,
            'total_amount' => $amount,
            'total_amount_pkr' => round($amount * $rate, 2),
            'issue_date' => now()->toDateString(),
            'due_date' => $payment->due_date ? $payment->due_date->toDateString() : ($domain && $domain->expiry_date ? $domain->expiry_date->toDateString() : now()->addDays(7)->toDateString()),
            'status' => 'due',
            'notes' => 'Invoice generated for ' . ($domain->domain_name ?? 'Domain') . ': ' . $payment->title,
            'created_by' => Auth::id(),
        ]);

        $startDate = $payment->due_date ?? $domain?->registration_date ?? now();
        $endDate = $domain?->expiry_date ?? ($startDate ? Carbon::parse($startDate)->addYear() : null);
        $durationText = ($startDate && $endDate)
            ? ' (Duration: ' . Carbon::parse($startDate)->format('d M Y') . ' to ' . Carbon::parse($endDate)->format('d M Y') . ')'
            : '';

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'description' => 'Domain: ' . ($domain->domain_name ?? 'Domain') . ' - ' . $payment->title . $durationText,
            'quantity' => 1.00,
            'unit_price' => $amount,
            'amount' => $amount,
            'invoiceable_type' => DomainPayment::class,
            'invoiceable_id' => $payment->id,
        ]);

        return redirect()->back()->with('success', "Invoice {$invoiceNumber} generated successfully.");
    }

    public function markPaymentAsPaid(DomainPayment $payment): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-domain-payments');

        $clientId = $this->getClientId();

        if ((int) $payment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to payment record');
        }

        if (!$payment->invoice()->exists()) {
            return redirect()->back()->with('error', 'Please generate an invoice before marking this payment as paid.');
        }

        $payment->update([
            'status' => 'paid',
            'paid_at' => $payment->paid_at ?? now()->toDateString(),
        ]);

        // Update parent domain status & advance expiry if renewal
        if ($payment->domain) {
            $domain = $payment->domain;
            $newExpiry = $domain->expiry_date
                ? Carbon::parse($domain->expiry_date)->addYear()
                : now()->addYear();

            $domain->update([
                'status' => 'active',
                'expiry_date' => $newExpiry->format('Y-m-d'),
            ]);
        }

        Invoice::syncItemAndCheckInvoicePaid($payment);

        return redirect()->back()->with('success', "Domain payment '{$payment->title}' marked as Paid successfully.");
    }

    /**
     * Legacy direct domain invoice generation (fallback support).
     */
    public function generateInvoice(ClientDomain $domain): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-invoices');

        $clientId = $this->getClientId();
        if ((int) $domain->client_id !== $clientId) {
            abort(403, 'Unauthorized access to domain record');
        }

        if ($domain->invoice()->exists()) {
            return redirect()->back()->with('error', 'An invoice has already been generated for this domain record.');
        }

        $client = $this->getClientModel();
        $currency = $client->currency ?? 'USD';
        $rate = CurrencyService::getRate($currency);
        $amount = (float) $domain->client_price_pkr;

        $invoiceNumber = Invoice::generateNextInvoiceNumber();

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'client_id' => $domain->client_id,
            'currency_code' => $currency,
            'exchange_rate_to_pkr' => $rate,
            'subtotal' => $amount,
            'tax_rate' => 0.00,
            'tax_amount' => 0.00,
            'discount' => 0.00,
            'total_amount' => $amount,
            'total_amount_pkr' => round($amount * $rate, 2),
            'issue_date' => now()->toDateString(),
            'due_date' => $domain->expiry_date ? $domain->expiry_date->toDateString() : now()->addDays(7)->toDateString(),
            'status' => 'due',
            'notes' => 'Invoice generated for domain registration / renewal: ' . $domain->domain_name,
            'created_by' => Auth::id(),
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'description' => 'Domain Registration / Renewal: ' . $domain->domain_name . ' (' . ($domain->registrar ?? 'Domain') . ')',
            'quantity' => 1.00,
            'unit_price' => $amount,
            'amount' => $amount,
            'invoiceable_type' => ClientDomain::class,
            'invoiceable_id' => $domain->id,
        ]);

        return redirect()->back()->with('success', "Invoice {$invoiceNumber} generated successfully for domain.");
    }
}
