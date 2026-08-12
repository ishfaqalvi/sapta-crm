<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Currency;
use App\Models\Invoice;
use App\Models\SystemSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    /**
     * Display a listing of Invoices.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $clientId = $request->query('client_id');

        $invoices = Invoice::with(['client'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%")
                                ->orWhere('company_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($clientId, function ($query, $clientId) {
                $query->where('client_id', $clientId);
            })
            ->latest('issue_date')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total_invoiced_pkr' => Invoice::sum('total_amount_pkr'),
            'total_paid_pkr' => Invoice::where('status', 'paid')->sum('total_amount_pkr'),
            'total_pending_pkr' => Invoice::whereIn('status', ['draft', 'sent'])->sum('total_amount_pkr'),
            'overdue_count' => Invoice::where('status', 'overdue')->count(),
        ];

        $clients = Client::select('id', 'name', 'company_name')->orderBy('name')->get();

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
            'stats' => $stats,
            'clients' => $clients,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'client_id' => $clientId ?? '',
            ],
        ]);
    }

    /**
     * Show the form for creating a new Invoice.
     */
    public function create(Request $request): Response
    {
        $prefillClientId = $request->query('client_id');

        $clients = Client::select('id', 'name', 'company_name', 'currency')->orderBy('name')->get();
        $currencies = Currency::where('is_active', true)->get();
        $baseCurrency = SystemSetting::get('base_currency', 'PKR');

        $nextInvoiceNumber = Invoice::generateNextInvoiceNumber();
        $defaultTaxRate = (float) SystemSetting::get('default_tax_rate', 0);

        return Inertia::render('invoices/create', [
            'clients' => $clients,
            'currencies' => $currencies,
            'baseCurrency' => $baseCurrency,
            'nextInvoiceNumber' => $nextInvoiceNumber,
            'defaultTaxRate' => $defaultTaxRate,
            'prefill' => [
                'client_id' => $prefillClientId ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created Invoice in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_number' => ['required', 'string', 'max:50', 'unique:invoices,invoice_number'],
            'client_id' => ['required', 'exists:clients,id'],
            'currency_code' => ['required', 'string', 'max:10'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'status' => ['required', 'in:draft,sent,paid,overdue,cancelled'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $currencyCode = strtoupper($validated['currency_code']);
            $currencyObj = Currency::where('code', $currencyCode)->first();
            $exchangeRate = $currencyObj ? (float) $currencyObj->exchange_rate_to_pkr : 1.0000;

            $subtotal = 0;
            $itemsData = [];
            foreach ($validated['items'] as $item) {
                $qty = (float) $item['quantity'];
                $price = (float) $item['unit_price'];
                $amount = round($qty * $price, 2);
                $subtotal += $amount;

                $itemsData[] = [
                    'description' => $item['description'],
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'amount' => $amount,
                ];
            }

            $taxRate = (float) ($validated['tax_rate'] ?? 0);
            $taxAmount = round(($subtotal * $taxRate) / 100, 2);
            $discount = (float) ($validated['discount'] ?? 0);
            $totalAmount = round($subtotal + $taxAmount - $discount, 2);
            $totalAmountPkr = round($totalAmount * $exchangeRate, 2);

            $invoice = Invoice::create([
                'invoice_number' => $validated['invoice_number'],
                'client_id' => $validated['client_id'],
                'currency_code' => $currencyCode,
                'exchange_rate_to_pkr' => $exchangeRate,
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'discount' => $discount,
                'total_amount' => $totalAmount,
                'total_amount_pkr' => $totalAmountPkr,
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            foreach ($itemsData as $itemData) {
                $invoice->items()->create($itemData);
            }
        });

        return redirect()->route('invoices.index')->with('success', 'Invoice created successfully.');
    }

    /**
     * Display the specified Invoice.
     */
    public function show(Invoice $invoice): Response
    {
        $invoice->load(['client', 'items', 'creator']);

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Office #402, Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
        ];

        return Inertia::render('invoices/show', [
            'invoice' => $invoice,
            'company' => $companySettings,
        ]);
    }

    /**
     * Show the form for editing the specified Invoice.
     */
    public function edit(Invoice $invoice): Response
    {
        $invoice->load(['client', 'items']);

        $clients = Client::select('id', 'name', 'company_name', 'currency')->orderBy('name')->get();
        $currencies = Currency::where('is_active', true)->get();

        return Inertia::render('invoices/edit', [
            'invoice' => $invoice,
            'clients' => $clients,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Update the specified Invoice in storage.
     */
    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'currency_code' => ['required', 'string', 'max:10'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'status' => ['required', 'in:draft,sent,paid,overdue,cancelled'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated, $invoice) {
            $currencyCode = strtoupper($validated['currency_code']);
            $currencyObj = Currency::where('code', $currencyCode)->first();
            $exchangeRate = $currencyObj ? (float) $currencyObj->exchange_rate_to_pkr : 1.0000;

            $subtotal = 0;
            $itemsData = [];
            foreach ($validated['items'] as $item) {
                $qty = (float) $item['quantity'];
                $price = (float) $item['unit_price'];
                $amount = round($qty * $price, 2);
                $subtotal += $amount;

                $itemsData[] = [
                    'description' => $item['description'],
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'amount' => $amount,
                ];
            }

            $taxRate = (float) ($validated['tax_rate'] ?? 0);
            $taxAmount = round(($subtotal * $taxRate) / 100, 2);
            $discount = (float) ($validated['discount'] ?? 0);
            $totalAmount = round($subtotal + $taxAmount - $discount, 2);
            $totalAmountPkr = round($totalAmount * $exchangeRate, 2);

            $invoice->update([
                'client_id' => $validated['client_id'],
                'currency_code' => $currencyCode,
                'exchange_rate_to_pkr' => $exchangeRate,
                'subtotal' => $subtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'discount' => $discount,
                'total_amount' => $totalAmount,
                'total_amount_pkr' => $totalAmountPkr,
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
            ]);

            $invoice->items()->delete();
            foreach ($itemsData as $itemData) {
                $invoice->items()->create($itemData);
            }
        });

        return redirect()->route('invoices.show', $invoice->id)->with('success', 'Invoice updated successfully.');
    }

    /**
     * Remove the specified Invoice from storage.
     */
    public function destroy(Invoice $invoice): RedirectResponse
    {
        $number = $invoice->invoice_number;
        $invoice->delete();

        return redirect()->route('invoices.index')->with('success', "Invoice {$number} deleted successfully.");
    }

    /**
     * Generate & Download PDF document for Invoice.
     */
    public function pdf(Invoice $invoice)
    {
        $invoice->load(['client', 'items', 'creator']);

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Office #402, Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
        ];

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'company' => $companySettings,
        ]);

        $fileName = "Invoice-{$invoice->invoice_number}.pdf";

        return $pdf->download($fileName);
    }

    /**
     * Quick status update to Paid.
     */
    public function markPaid(Invoice $invoice): RedirectResponse
    {
        $invoice->update(['status' => 'paid']);

        return redirect()->back()->with('success', "Invoice {$invoice->invoice_number} marked as Paid.");
    }
}
