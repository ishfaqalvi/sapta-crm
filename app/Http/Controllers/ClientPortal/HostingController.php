<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientDomain;
use App\Models\ClientHosting;
use App\Models\HostingPayment;
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

class HostingController extends Controller
{
    use AuthorizesClientPortalAccess;

    public function index(Request $request): Response
    {
        $this->authorizePermission('view-client-portal-hostings');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = ClientHosting::where('client_id', $clientId)->with(['primaryDomain', 'invoice', 'invoiceItems.invoice', 'payments.invoice']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('hosting_title', 'like', "%{$search}%")
                    ->orWhere('provider', 'like', "%{$search}%")
                    ->orWhere('server_ip', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $hostings = $query->latest('id')->paginate(12)->withQueryString();

        $stats = [
            'total' => ClientHosting::where('client_id', $clientId)->count(),
            'active' => ClientHosting::where('client_id', $clientId)->where('status', 'active')->count(),
            'expiring_soon' => ClientHosting::where('client_id', $clientId)->whereBetween('expiry_date', [now(), now()->addDays(30)])->count(),
        ];

        $domains = ClientDomain::where('client_id', $clientId)->get(['id', 'domain_name']);

        return Inertia::render('client-portal/hostings/index', [
            'client' => $client,
            'hostings' => $hostings,
            'domains' => $domains,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(ClientHosting $hosting): Response
    {
        $this->authorizePermission('view-client-portal-hostings');

        $clientId = $this->getClientId($hosting->client_id);
        if ((int) $hosting->client_id !== $clientId) {
            abort(403, 'Unauthorized access to hosting record');
        }

        $client = $this->getClientModel($hosting->client_id);

        // If hosting has no payments yet, auto-create initial setup/subscription payment
        if ($hosting->payments()->count() === 0) {
            $cycle = ucfirst(str_replace('_', ' ', $hosting->billing_cycle));
            $currency = $client->currency ?? 'USD';
            $rate = CurrencyService::getRate($currency);

            HostingPayment::create([
                'client_hosting_id' => $hosting->id,
                'client_id' => $clientId,
                'title' => "Hosting Initial Subscription ({$cycle} Plan)",
                'amount' => $hosting->client_price_pkr,
                'exchange_rate' => $rate,
                'amount_pkr' => round((float) $hosting->client_price_pkr * $rate, 2),
                'payment_type' => 'initial_setup',
                'status' => 'pending',
                'due_date' => $hosting->setup_date ?? now()->toDateString(),
                'notes' => 'Auto-generated hosting subscription record.',
            ]);
        }

        $hosting->load([
            'client',
            'primaryDomain',
            'payments.invoice',
            'payments.invoiceItems.invoice',
            'invoiceItems.invoice',
            'invoice',
        ]);

        $domains = ClientDomain::where('client_id', $clientId)->get(['id', 'domain_name']);

        return Inertia::render('client-portal/hostings/show', [
            'client' => $client,
            'hosting' => $hosting,
            'domains' => $domains,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-hostings');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $validated = $request->validate([
            'hosting_title' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', 'max:100'],
            'server_ip' => ['nullable', 'string', 'max:45'],
            'server_type' => ['nullable', 'string', 'max:100'],
            'billing_cycle' => ['required', Rule::in(['monthly', 'quarterly', 'semi_annual', 'annual', 'biennial'])],
            'expiry_date' => ['required', 'date'],
            'client_price_pkr' => ['required', 'numeric', 'min:0'],
            'primary_domain_id' => ['nullable', 'exists:client_domains,id'],
            'disk_space' => ['nullable', 'string', 'max:100'],
            'bandwidth' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['client_id'] = $clientId;
        $validated['status'] = 'active';

        $hosting = ClientHosting::create($validated);

        // Auto-create initial HostingPayment record
        $cycle = ucfirst(str_replace('_', ' ', $hosting->billing_cycle));
        $currency = $client->currency ?? 'USD';
        $rate = CurrencyService::getRate($currency);

        HostingPayment::create([
            'client_hosting_id' => $hosting->id,
            'client_id' => $clientId,
            'title' => "Hosting Initial Subscription ({$cycle} Plan)",
            'amount' => $hosting->client_price_pkr,
            'exchange_rate' => $rate,
            'amount_pkr' => round((float) $hosting->client_price_pkr * $rate, 2),
            'payment_type' => 'initial_setup',
            'status' => 'pending',
            'due_date' => $hosting->setup_date ?? now()->toDateString(),
            'notes' => 'Auto-generated hosting subscription record.',
        ]);

        // Notify Client Portal User
        $clientUser = $client->user ?: User::where('type', 'client')->where('client_id', $clientId)->first();
        if ($clientUser) {
            $clientUser->notify(new CrmNotification(
                "New Hosting Registered: {$hosting->hosting_title}",
                "Hosting plan '{$hosting->hosting_title}' ({$hosting->provider}) has been registered in your client portal (Expires: {$hosting->expiry_date}).",
                'hosting_created',
                'info',
                "/client-portal/hostings",
                [
                    'hosting_id' => $hosting->id,
                    'hosting_title' => $hosting->hosting_title,
                    'client_id' => $clientId,
                ]
            ));
        }

        return redirect()->back()->with('success', 'Hosting package added successfully!');
    }

    public function update(Request $request, ClientHosting $hosting): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-hostings');

        $clientId = $this->getClientId();
        if ((int) $hosting->client_id !== $clientId) {
            abort(403, 'Unauthorized operation');
        }

        $validated = $request->validate([
            'hosting_title' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', 'max:100'],
            'server_ip' => ['nullable', 'string', 'max:45'],
            'server_type' => ['nullable', 'string', 'max:100'],
            'billing_cycle' => ['required', Rule::in(['monthly', 'quarterly', 'semi_annual', 'annual', 'biennial'])],
            'expiry_date' => ['required', 'date'],
            'client_price_pkr' => ['required', 'numeric', 'min:0'],
            'primary_domain_id' => ['nullable', 'exists:client_domains,id'],
            'disk_space' => ['nullable', 'string', 'max:100'],
            'bandwidth' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $hosting->update($validated);

        return redirect()->back()->with('success', 'Hosting package updated successfully!');
    }

    public function destroy(ClientHosting $hosting): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-hostings');

        $clientId = $this->getClientId();
        if ((int) $hosting->client_id !== $clientId) {
            abort(403, 'Unauthorized operation');
        }

        if ($hosting->invoice()->exists() || $hosting->payments()->whereHas('invoice')->exists()) {
            return redirect()->back()->with('error', 'Hosting packages with a generated invoice cannot be deleted.');
        }

        $hosting->delete();

        return redirect()->back()->with('success', 'Hosting package deleted successfully!');
    }

    /*
    |--------------------------------------------------------------------------
    | Hosting Payments & Renewals (Aligned with Projects & Domains)
    |--------------------------------------------------------------------------
    */
    public function storePayment(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-hosting-payments');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'client_hosting_id' => [
                'required',
                Rule::exists('client_hostings', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'payment_type' => ['required', Rule::in(['initial_setup', 'renewal', 'upgrade', 'other'])],
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

        HostingPayment::create($validated);

        return redirect()->back()->with('success', 'Hosting payment/renewal record added successfully.');
    }

    public function updatePayment(Request $request, HostingPayment $payment): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-hosting-payments');

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
            'payment_type' => ['required', Rule::in(['initial_setup', 'renewal', 'upgrade', 'other'])],
            'due_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $client = $this->getClientModel();
        $currency = $client->currency ?? 'USD';
        $rate = CurrencyService::getRate($currency);

        $validated['exchange_rate'] = $rate;
        $validated['amount_pkr'] = round((float) $validated['amount'] * $rate, 2);

        $payment->update($validated);

        return redirect()->back()->with('success', 'Hosting payment record updated successfully.');
    }

    public function destroyPayment(HostingPayment $payment): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-hosting-payments');

        $clientId = $this->getClientId();

        if ((int) $payment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to payment record');
        }

        if ($payment->invoice()->exists() || $payment->status === 'paid') {
            return redirect()->back()->with('error', 'Payments with a generated invoice or paid status cannot be deleted.');
        }

        $payment->delete();

        return redirect()->back()->with('success', 'Hosting payment record deleted successfully.');
    }

    public function generatePaymentInvoice(HostingPayment $payment): RedirectResponse
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
        $hosting = $payment->hosting;
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
            'due_date' => $payment->due_date ? $payment->due_date->toDateString() : ($hosting && $hosting->expiry_date ? $hosting->expiry_date->toDateString() : now()->addDays(7)->toDateString()),
            'status' => 'due',
            'notes' => 'Invoice generated for ' . ($hosting->hosting_title ?? 'Hosting') . ': ' . $payment->title,
            'created_by' => Auth::id(),
        ]);

        $startDate = $payment->due_date ?? $hosting?->setup_date ?? now();
        $endDate = $hosting?->expiry_date;
        if (!$endDate && $startDate) {
            $cycle = strtolower($hosting?->billing_cycle ?? 'annual');
            $endDate = match ($cycle) {
                'monthly' => Carbon::parse($startDate)->addMonth(),
                'quarterly' => Carbon::parse($startDate)->addMonths(3),
                'semi_annual' => Carbon::parse($startDate)->addMonths(6),
                'biennial' => Carbon::parse($startDate)->addYears(2),
                'triennial' => Carbon::parse($startDate)->addYears(3),
                default => Carbon::parse($startDate)->addYear(),
            };
        }
        $durationText = ($startDate && $endDate)
            ? ' (Duration: ' . Carbon::parse($startDate)->format('d M Y') . ' to ' . Carbon::parse($endDate)->format('d M Y') . ')'
            : '';

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'description' => 'Hosting: ' . ($hosting->hosting_title ?? 'Hosting') . ' - ' . $payment->title . $durationText,
            'quantity' => 1.00,
            'unit_price' => $amount,
            'amount' => $amount,
            'invoiceable_type' => HostingPayment::class,
            'invoiceable_id' => $payment->id,
        ]);

        return redirect()->back()->with('success', "Invoice {$invoiceNumber} generated successfully.");
    }

    public function markPaymentAsPaid(HostingPayment $payment): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-hosting-payments');

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

        // Update parent hosting status & advance expiry
        if ($payment->hosting) {
            $hosting = $payment->hosting;
            $currentExpiry = $hosting->expiry_date ? Carbon::parse($hosting->expiry_date) : now();
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

        Invoice::syncItemAndCheckInvoicePaid($payment);

        return redirect()->back()->with('success', "Hosting payment '{$payment->title}' marked as Paid successfully.");
    }

    /**
     * Legacy direct hosting invoice generation (fallback support).
     */
    public function generateInvoice(ClientHosting $hosting): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-invoices');

        $clientId = $this->getClientId();
        if ((int) $hosting->client_id !== $clientId) {
            abort(403, 'Unauthorized access to hosting record');
        }

        if ($hosting->invoice()->exists()) {
            return redirect()->back()->with('error', 'An invoice has already been generated for this hosting package.');
        }

        $client = $this->getClientModel();
        $currency = $client->currency ?? 'USD';
        $rate = CurrencyService::getRate($currency);
        $amount = (float) $hosting->client_price_pkr;

        $invoiceNumber = Invoice::generateNextInvoiceNumber();

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'client_id' => $hosting->client_id,
            'currency_code' => $currency,
            'exchange_rate_to_pkr' => $rate,
            'subtotal' => $amount,
            'tax_rate' => 0.00,
            'tax_amount' => 0.00,
            'discount' => 0.00,
            'total_amount' => $amount,
            'total_amount_pkr' => round($amount * $rate, 2),
            'issue_date' => now()->toDateString(),
            'due_date' => $hosting->expiry_date ? $hosting->expiry_date->toDateString() : now()->addDays(7)->toDateString(),
            'status' => 'due',
            'notes' => 'Invoice generated for web hosting package: ' . $hosting->hosting_title,
            'created_by' => Auth::id(),
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'description' => 'Web Hosting Package: ' . $hosting->hosting_title . ' (' . ucfirst(str_replace('_', ' ', $hosting->billing_cycle)) . ' Cycle)',
            'quantity' => 1.00,
            'unit_price' => $amount,
            'amount' => $amount,
            'invoiceable_type' => ClientHosting::class,
            'invoiceable_id' => $hosting->id,
        ]);

        return redirect()->back()->with('success', "Invoice {$invoiceNumber} generated successfully for hosting package.");
    }
}
