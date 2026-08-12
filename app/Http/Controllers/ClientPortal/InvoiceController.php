<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Currency;
use App\Models\Invoice;
use App\Models\SystemSetting;
use App\Traits\AuthorizesClientPortalAccess;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    use AuthorizesClientPortalAccess;

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
        $this->authorizePermission('view-client-portal-invoices');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = Invoice::where('client_id', $clientId)
            ->with(['items']);

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
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
        $this->authorizePermission('create-client-portal-invoices');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('client-portal/invoices/create', [
            'client' => $client,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Display specified Invoice detail page in Client Portal.
     */
    public function show(Invoice $invoice): Response
    {
        $this->authorizePermission('view-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        $client = $this->getClientModel();

        $invoice->load(['client', 'items', 'websiteProject']);

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Office #402, Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
            'logo' => SystemSetting::get('company_logo', '/app-logo-icon.png'),
        ];

        return Inertia::render('client-portal/invoices/show', [
            'client' => $client,
            'invoice' => $invoice,
            'company' => $companySettings,
        ]);
    }

    /**
     * Show the form for editing an existing Invoice.
     */
    public function edit(Invoice $invoice): Response
    {
        $this->authorizePermission('edit-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        $client = $this->getClientModel();
        $invoice->load('items');
        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('client-portal/invoices/edit', [
            'client' => $client,
            'invoice' => $invoice,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Store a newly created Invoice in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-invoices');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'invoice_number' => 'required|string|max:100|unique:invoices,invoice_number',
            'website_project_id' => 'nullable|exists:website_projects,id',
            'issue_date' => 'required|date',
            'due_date' => 'required|date',
            'currency' => 'required|string|max:10',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'required|in:draft,sent,paid,overdue,cancelled',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:500',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $clientId) {
            $invoice = Invoice::create([
                'client_id' => $clientId,
                'website_project_id' => $validated['website_project_id'] ?? null,
                'invoice_number' => $validated['invoice_number'],
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'currency' => $validated['currency'],
                'subtotal' => $validated['subtotal'],
                'tax_amount' => $validated['tax_amount'] ?? 0,
                'total_amount' => $validated['total_amount'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $invoice->items()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                ]);
            }
        });

        return redirect()->route('client-portal.invoices.index')->with('success', 'Invoice created successfully.');
    }

    /**
     * Update the specified Invoice in storage.
     */
    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        $validated = $request->validate([
            'invoice_number' => 'required|string|max:100|unique:invoices,invoice_number,' . $invoice->id,
            'website_project_id' => 'nullable|exists:website_projects,id',
            'issue_date' => 'required|date',
            'due_date' => 'required|date',
            'currency' => 'required|string|max:10',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'required|in:draft,sent,paid,overdue,cancelled',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:500',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $invoice) {
            $invoice->update([
                'website_project_id' => $validated['website_project_id'] ?? null,
                'invoice_number' => $validated['invoice_number'],
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'currency' => $validated['currency'],
                'subtotal' => $validated['subtotal'],
                'tax_amount' => $validated['tax_amount'] ?? 0,
                'total_amount' => $validated['total_amount'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $invoice->items()->delete();
            foreach ($validated['items'] as $item) {
                $invoice->items()->create([
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                ]);
            }
        });

        return redirect()->route('client-portal.invoices.index')->with('success', 'Invoice updated successfully.');
    }

    /**
     * Remove the specified Invoice from storage.
     */
    public function destroy(Invoice $invoice): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        $invoice->items()->delete();
        $invoice->delete();

        return redirect()->route('client-portal.invoices.index')->with('success', 'Invoice deleted successfully.');
    }

    /**
     * Download or stream Invoice PDF.
     */
    public function pdf(Invoice $invoice)
    {
        $this->authorizePermission('download-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($invoice->client_id !== $clientId) {
            abort(403, 'Unauthorized access to Invoice');
        }

        $invoice->load(['client', 'items', 'websiteProject']);

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Office #402, Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
            'logo' => SystemSetting::get('company_logo', '/app-logo-icon.png'),
        ];

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'company' => $companySettings,
        ]);

        return $pdf->download("Invoice-{$invoice->invoice_number}.pdf");
    }
}
