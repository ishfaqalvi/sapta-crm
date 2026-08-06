<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Currency;
use App\Models\Invoice;
use App\Models\SystemSetting;
use App\Models\WebsiteProject;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    /**
     * Retrieve the authenticated client ID securely.
     */
    protected function getClientId(): int
    {
        $user = Auth::user();

        if (!$user || !$user->client_id) {
            abort(403, 'Unauthorized Client Portal Access');
        }

        return (int) $user->client_id;
    }

    /**
     * Retrieve client model securely.
     */
    protected function getClientModel(): Client
    {
        return Client::findOrFail($this->getClientId());
    }

    /**
     * Display a listing of Invoices for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = Invoice::where('client_id', $clientId)
            ->with(['websiteProject:id,project_name', 'items']);

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('websiteProject', function ($pq) use ($search) {
                        $pq->where('project_name', 'like', "%{$search}%");
                    })
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->orderBy('issue_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        $allInvoices = Invoice::where('client_id', $clientId)->get();

        $stats = [
            'total' => $allInvoices->count(),
            'paid_total' => $allInvoices->where('status', 'paid')->sum('total_amount'),
            'pending_total' => $allInvoices->whereIn('status', ['draft', 'sent'])->sum('total_amount'),
            'overdue_count' => $allInvoices->where('status', 'overdue')->count(),
        ];

        return Inertia::render('client-portal/invoices/index', [
            'client' => $client,
            'invoices' => $invoices,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new Invoice on a separate page.
     */
    public function create(): Response
    {
        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $projects = WebsiteProject::where('client_id', $clientId)->select('id', 'project_name')->get();
        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('client-portal/invoices/create', [
            'client' => $client,
            'projects' => $projects,
            'currencies' => $currencies,
            'nextInvoiceNumber' => Invoice::generateNextInvoiceNumber(),
            'defaultTaxRate' => (float) SystemSetting::get('default_tax_rate', 0),
        ]);
    }

    /**
     * Store a newly created Invoice for the authenticated client.
     */
    public function store(Request $request): RedirectResponse
    {
        $clientId = $this->getClientId();

        $validated = $request->validate([
            'website_project_id' => 'nullable|exists:website_projects,id',
            'currency_code' => 'required|string|max:10',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'status' => 'required|in:draft,sent,paid,overdue,cancelled',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:3000',
            'terms' => 'nullable|string|max:3000',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $clientId, $request) {
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

            $invoiceNumber = Invoice::generateNextInvoiceNumber();

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'client_id' => $clientId,
                'website_project_id' => $validated['website_project_id'] ?? null,
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

        return redirect()->route('client-portal.invoices.index')->with('success', 'Invoice created successfully.');
    }

    /**
     * Show the form for editing an Invoice on a separate page.
     */
    public function edit(Invoice $invoice): Response
    {
        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to invoice');
        }

        $invoice->load(['websiteProject', 'items']);
        $client = $this->getClientModel();

        $projects = WebsiteProject::where('client_id', $clientId)->select('id', 'project_name')->get();
        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('client-portal/invoices/edit', [
            'client' => $client,
            'invoice' => $invoice,
            'projects' => $projects,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Update an existing invoice.
     */
    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to invoice');
        }

        $validated = $request->validate([
            'website_project_id' => 'nullable|exists:website_projects,id',
            'currency_code' => 'required|string|max:10',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'status' => 'required|in:draft,sent,paid,overdue,cancelled',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:3000',
            'terms' => 'nullable|string|max:3000',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
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
                'website_project_id' => $validated['website_project_id'] ?? null,
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

        return redirect()->route('client-portal.invoices.index')->with('success', 'Invoice updated successfully.');
    }

    /**
     * Remove the specified Invoice.
     */
    public function destroy(Invoice $invoice): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to invoice');
        }

        if ($invoice->status === 'paid') {
            return redirect()->back()->with('error', 'Paid invoices cannot be deleted to preserve financial accounting.');
        }

        $invoice->items()->delete();
        $invoice->delete();

        return redirect()->back()->with('success', 'Invoice deleted successfully.');
    }

    /**
     * Download Invoice as PDF document.
     */
    public function pdf(Invoice $invoice)
    {
        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to invoice.');
        }

        $invoice->load(['client', 'websiteProject', 'items', 'creator']);

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
}
