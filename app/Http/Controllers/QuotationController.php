<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use App\Models\Quotation;
use App\Models\QuotationItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    /**
     * Check if current user has permission or is Super Admin.
     */
    protected function authorizePermission(string $permission): void
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo($permission) && !$user->can($permission))) {
            abort(403, "Unauthorized. You do not have permission to {$permission}.");
        }
    }

    /**
     * Ensure the quotation is a General Quotation (no client_id).
     */
    protected function ensureIsGeneralQuotation(Quotation $quotation): void
    {
        if ($quotation->client_id !== null) {
            abort(404, 'General quotation not found.');
        }
    }

    /**
     * Display a listing of General Quotations only (walk-in / non-client customers).
     */
    public function index(Request $request): Response
    {
        $this->authorizePermission('view-quotations');

        // Strictly General Quotations (walk-in customers without registered client)
        $query = Quotation::whereNull('client_id')->with(['items']);

        // Search Filter (Quotation #, Subject, Customer Name, Company Name, Item description)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('quotation_number', 'like', "%{$search}%")
                    ->orWhere('subject', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhereHas('items', function ($iq) use ($search) {
                        $iq->where('description', 'like', "%{$search}%");
                    });
            });
        }

        // Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $quotations = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(12)
            ->withQueryString();

        $allGeneralQuotations = Quotation::whereNull('client_id')->get();

        $stats = [
            'total' => $allGeneralQuotations->count(),
            'accepted_total' => (float) $allGeneralQuotations->whereIn('status', ['accepted', 'paid'])->sum('total_amount'),
            'paid_total' => (float) $allGeneralQuotations->where('status', 'paid')->sum('total_amount'),
            'pending_total' => (float) $allGeneralQuotations->whereIn('status', ['draft', 'sent'])->sum('total_amount'),
            'accepted_count' => $allGeneralQuotations->where('status', 'accepted')->count(),
            'paid_count' => $allGeneralQuotations->where('status', 'paid')->count(),
            'sent_count' => $allGeneralQuotations->where('status', 'sent')->count(),
            'draft_count' => $allGeneralQuotations->where('status', 'draft')->count(),
        ];

        return Inertia::render('quotations/index', [
            'quotations' => $quotations,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new Quotation.
     */
    public function create(): Response
    {
        $this->authorizePermission('create-quotations');

        $currencies = Currency::where('is_active', true)
            ->select('code', 'name', 'symbol', 'exchange_rate_to_pkr')
            ->get();


        // Generate auto next quote number (e.g. Quote-1, Quote-2)
        $latestQuote = Quotation::latest('id')->first();
        $nextId = $latestQuote ? ($latestQuote->id + 1) : 1;
        $suggestedNumber = 'Quote-' . $nextId;

        return Inertia::render('quotations/create', [
            'currencies' => $currencies,
            'suggestedNumber' => $suggestedNumber,
        ]);
    }

    /**
     * Store a newly created Quotation.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-quotations');

        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'quotation_number' => 'required|string|max:50|unique:quotations,quotation_number',
            'currency_code' => 'nullable|string|max:10',
            'exchange_rate_to_pkr' => 'nullable|numeric|min:0.0001',
            'subject' => 'nullable|string|max:255',
            'customer_prefix' => 'nullable|string|max:50',
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:100',
            'customer_address' => 'nullable|string|max:1000',
            'company_name' => 'nullable|string|max:255',
            'company_phone' => 'nullable|string|max:100',
            'company_address' => 'nullable|string|max:1000',
            'company_email' => 'nullable|email|max:255',
            'company_whatsapp' => 'nullable|string|max:100',
            'company_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'existing_company_logo' => 'nullable|string|max:500',
            'greeting' => 'nullable|string|max:255',
            'opening_text' => 'nullable|string|max:2000',
            'closing_text' => 'nullable|string|max:2000',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'date' => 'required|date',
            'expiry_date' => 'nullable|date|after_or_equal:date',
            'status' => 'required|in:draft,sent,accepted,paid,rejected,expired',
            'notes' => 'nullable|string|max:3000',
            'terms' => 'nullable|string|max:3000',
            'authorized_by_text' => 'nullable|string|max:255',
            'signature_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'existing_signature_image' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:1000',
            'items.*.amount' => 'nullable|numeric|min:0',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'nullable|numeric',
        ], [
            'quotation_number.required' => 'Quotation number is required.',
            'quotation_number.unique' => 'This quotation number has already been taken.',
            'customer_email.email' => 'Please enter a valid customer email address.',
            'company_email.email' => 'Please enter a valid company email address.',
            'date.required' => 'Quotation issue date is required.',
            'date.date' => 'Please enter a valid quotation date.',
            'expiry_date.after_or_equal' => 'Valid Until / Expiry date must be on or after the quotation date.',
            'status.required' => 'Quotation status is required.',
            'status.in' => 'Invalid quotation status selected.',
            'items.required' => 'Please add at least one line item to the quotation.',
            'items.min' => 'Please add at least one line item to the quotation.',
            'items.*.description.required' => 'Item description is required.',
        ]);

        DB::beginTransaction();
        try {
            $clientId = null;

            $currencyCode = strtoupper($validated['currency_code'] ?? 'AED');
            $currencyObj = Currency::where('code', $currencyCode)->first();
            $exchangeRate = (float) ($validated['exchange_rate_to_pkr'] ?? ($currencyObj ? $currencyObj->exchange_rate_to_pkr : 1.0));
            if ($exchangeRate <= 0) {
                $exchangeRate = 1.0;
            }

            // Calculate Subtotal from Items
            $subtotal = 0;
            foreach ($validated['items'] as $itemData) {
                $itemAmount = isset($itemData['amount']) && $itemData['amount'] !== '' ? (float) $itemData['amount'] : (float) ($itemData['unit_price'] ?? 0);
                $subtotal += $itemAmount;
            }

            $taxRate = (float) ($validated['tax_rate'] ?? 0);
            $taxAmount = ($subtotal * $taxRate) / 100;
            $discount = (float) ($validated['discount'] ?? 0);
            $totalAmount = max(0, ($subtotal + $taxAmount) - $discount);
            $totalAmountPkr = $totalAmount * $exchangeRate;

            $quotation = new Quotation([
                'quotation_number' => $validated['quotation_number'],
                'client_id' => $clientId,
                'currency_code' => $currencyCode,
                'exchange_rate_to_pkr' => $exchangeRate,
                'subject' => $validated['subject'] ?? null,
                'customer_prefix' => $validated['customer_prefix'] ?? null,
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'customer_address' => $validated['customer_address'] ?? null,
                'company_name' => $validated['company_name'] ?? null,
                'company_phone' => $validated['company_phone'] ?? null,
                'company_address' => $validated['company_address'] ?? null,
                'company_email' => $validated['company_email'] ?? null,
                'company_whatsapp' => $validated['company_whatsapp'] ?? null,
                'greeting' => $validated['greeting'] ?? null,
                'opening_text' => $validated['opening_text'] ?? null,
                'closing_text' => $validated['closing_text'] ?? null,
                'subtotal' => round($subtotal, 2),
                'tax_rate' => round($taxRate, 2),
                'tax_amount' => round($taxAmount, 2),
                'discount' => round($discount, 2),
                'total_amount' => round($totalAmount, 2),
                'total_amount_pkr' => round($totalAmountPkr, 2),
                'date' => $validated['date'],
                'expiry_date' => $validated['expiry_date'] ?? null,
                'status' => $validated['status'] ?? 'draft',
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'authorized_by_text' => $validated['authorized_by_text'] ?? null,
                'created_by' => Auth::id(),
            ]);

            if ($request->hasFile('company_logo')) {
                $quotation->company_logo = $request->file('company_logo');
            } elseif ($request->filled('existing_company_logo')) {
                $quotation->company_logo = $request->input('existing_company_logo');
            }

            if ($request->hasFile('signature_image')) {
                $quotation->signature_image = $request->file('signature_image');
            } elseif ($request->filled('existing_signature_image')) {
                $quotation->signature_image = $request->input('existing_signature_image');
            }

            $quotation->save();

            foreach ($validated['items'] as $index => $itemData) {
                $itemAmount = isset($itemData['amount']) && $itemData['amount'] !== '' ? (float) $itemData['amount'] : (float) ($itemData['unit_price'] ?? 0);
                $cleanAmount = round($itemAmount, 2);

                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'description' => $itemData['description'],
                    'quantity' => 1.00,
                    'unit_price' => $cleanAmount,
                    'amount' => $cleanAmount,
                    'sort_order' => $index + 1,
                ]);
            }

            DB::commit();

            return redirect()->route('quotations.show', $quotation->id)
                ->with('success', "Quotation {$quotation->quotation_number} has been created successfully.");
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Failed to create quotation: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified Quotation.
     */
    public function show(Quotation $quotation): Response
    {
        $this->authorizePermission('view-quotations');
        $this->ensureIsGeneralQuotation($quotation);

        $quotation->load(['items', 'creator']);

        return Inertia::render('quotations/show', [
            'quotation' => $quotation,
        ]);
    }

    /**
     * Show the form for editing the specified Quotation.
     */
    public function edit(Quotation $quotation): Response
    {
        $this->authorizePermission('edit-quotations');
        $this->ensureIsGeneralQuotation($quotation);

        $quotation->load(['items']);

        $currencies = Currency::where('is_active', true)
            ->select('code', 'name', 'symbol', 'exchange_rate_to_pkr')
            ->get();

        return Inertia::render('quotations/edit', [
            'quotation' => $quotation,
            'currencies' => $currencies,
        ]);
    }

    /**
     * Update the specified Quotation.
     */
    public function update(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizePermission('edit-quotations');
        $this->ensureIsGeneralQuotation($quotation);

        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'quotation_number' => 'required|string|max:50|unique:quotations,quotation_number,' . $quotation->id,
            'currency_code' => 'nullable|string|max:10',
            'exchange_rate_to_pkr' => 'nullable|numeric|min:0.0001',
            'subject' => 'nullable|string|max:255',
            'customer_prefix' => 'nullable|string|max:50',
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'nullable|string|max:100',
            'customer_address' => 'nullable|string|max:1000',
            'company_name' => 'nullable|string|max:255',
            'company_phone' => 'nullable|string|max:100',
            'company_address' => 'nullable|string|max:1000',
            'company_email' => 'nullable|email|max:255',
            'company_whatsapp' => 'nullable|string|max:100',
            'company_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'remove_company_logo' => 'nullable|boolean',
            'greeting' => 'nullable|string|max:255',
            'opening_text' => 'nullable|string|max:2000',
            'closing_text' => 'nullable|string|max:2000',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount' => 'nullable|numeric|min:0',
            'date' => 'required|date',
            'expiry_date' => 'nullable|date|after_or_equal:date',
            'status' => 'required|in:draft,sent,accepted,paid,rejected,expired',
            'notes' => 'nullable|string|max:3000',
            'terms' => 'nullable|string|max:3000',
            'authorized_by_text' => 'nullable|string|max:255',
            'signature_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'remove_signature_image' => 'nullable|boolean',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:1000',
            'items.*.amount' => 'nullable|numeric|min:0',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.quantity' => 'nullable|numeric',
        ], [
            'quotation_number.required' => 'Quotation number is required.',
            'quotation_number.unique' => 'This quotation number has already been taken.',
            'customer_email.email' => 'Please enter a valid customer email address.',
            'company_email.email' => 'Please enter a valid company email address.',
            'date.required' => 'Quotation issue date is required.',
            'date.date' => 'Please enter a valid quotation date.',
            'expiry_date.after_or_equal' => 'Valid Until / Expiry date must be on or after the quotation date.',
            'status.required' => 'Quotation status is required.',
            'status.in' => 'Invalid quotation status selected.',
            'items.required' => 'Please add at least one line item to the quotation.',
            'items.min' => 'Please add at least one line item to the quotation.',
            'items.*.description.required' => 'Item description is required.',
        ]);

        DB::beginTransaction();
        try {
            $clientId = null;

            $currencyCode = strtoupper($validated['currency_code'] ?? ($quotation->currency_code ?: 'AED'));
            $currencyObj = Currency::where('code', $currencyCode)->first();
            $exchangeRate = (float) ($validated['exchange_rate_to_pkr'] ?? ($currencyObj ? $currencyObj->exchange_rate_to_pkr : $quotation->exchange_rate_to_pkr));
            if ($exchangeRate <= 0) {
                $exchangeRate = 1.0;
            }

            // Calculate Subtotal from Items
            $subtotal = 0;
            foreach ($validated['items'] as $itemData) {
                $itemAmount = isset($itemData['amount']) && $itemData['amount'] !== '' ? (float) $itemData['amount'] : (float) ($itemData['unit_price'] ?? 0);
                $subtotal += $itemAmount;
            }

            $taxRate = (float) ($validated['tax_rate'] ?? 0);
            $taxAmount = ($subtotal * $taxRate) / 100;
            $discount = (float) ($validated['discount'] ?? 0);
            $totalAmount = max(0, ($subtotal + $taxAmount) - $discount);
            $totalAmountPkr = $totalAmount * $exchangeRate;

            $quotation->fill([
                'client_id' => $clientId,
                'quotation_number' => $validated['quotation_number'],
                'currency_code' => $currencyCode,
                'exchange_rate_to_pkr' => $exchangeRate,
                'subject' => $validated['subject'] ?? null,
                'customer_prefix' => $validated['customer_prefix'] ?? null,
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'customer_address' => $validated['customer_address'] ?? null,
                'company_name' => $validated['company_name'] ?? null,
                'company_phone' => $validated['company_phone'] ?? null,
                'company_address' => $validated['company_address'] ?? null,
                'company_email' => $validated['company_email'] ?? null,
                'company_whatsapp' => $validated['company_whatsapp'] ?? null,
                'greeting' => $validated['greeting'] ?? null,
                'opening_text' => $validated['opening_text'] ?? null,
                'closing_text' => $validated['closing_text'] ?? null,
                'subtotal' => round($subtotal, 2),
                'tax_rate' => round($taxRate, 2),
                'tax_amount' => round($taxAmount, 2),
                'discount' => round($discount, 2),
                'total_amount' => round($totalAmount, 2),
                'total_amount_pkr' => round($totalAmountPkr, 2),
                'date' => $validated['date'],
                'expiry_date' => $validated['expiry_date'] ?? null,
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
                'authorized_by_text' => $validated['authorized_by_text'] ?? null,
            ]);

            if ($request->hasFile('company_logo')) {
                $quotation->company_logo = $request->file('company_logo');
            } elseif ($request->boolean('remove_company_logo')) {
                $quotation->company_logo = null;
            }

            if ($request->hasFile('signature_image')) {
                $quotation->signature_image = $request->file('signature_image');
            } elseif ($request->boolean('remove_signature_image')) {
                $quotation->signature_image = null;
            }

            $quotation->save();

            // Sync items
            $quotation->items()->delete();
            foreach ($validated['items'] as $index => $itemData) {
                $itemAmount = isset($itemData['amount']) && $itemData['amount'] !== '' ? (float) $itemData['amount'] : (float) ($itemData['unit_price'] ?? 0);
                $cleanAmount = round($itemAmount, 2);

                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'description' => $itemData['description'],
                    'quantity' => 1.00,
                    'unit_price' => $cleanAmount,
                    'amount' => $cleanAmount,
                    'sort_order' => $index + 1,
                ]);
            }

            DB::commit();

            return redirect()->route('quotations.show', $quotation->id)
                ->with('success', "Quotation {$quotation->quotation_number} updated successfully.");
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withInput()->with('error', 'Failed to update quotation: ' . $e->getMessage());
        }
    }

    /**
     * Update quotation status directly.
     */
    public function updateStatus(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizePermission('edit-quotations');
        $this->ensureIsGeneralQuotation($quotation);

        $validated = $request->validate([
            'status' => 'required|in:draft,sent,accepted,paid,rejected,expired',
        ]);

        $quotation->update(['status' => $validated['status']]);

        return back()->with('success', "Quotation status updated to " . ucfirst($validated['status']));
    }

    /**
     * Remove the specified Quotation.
     */
    public function destroy(Quotation $quotation): RedirectResponse
    {
        $this->authorizePermission('delete-quotations');
        $this->ensureIsGeneralQuotation($quotation);

        $quoteNum = $quotation->quotation_number;
        $quotation->delete();

        return redirect()->route('quotations.index')
            ->with('success', "Quotation {$quoteNum} was deleted successfully.");
    }

    /**
     * Generate / Stream downloadable PDF of the Quotation.
     */
    public function pdf(Quotation $quotation)
    {
        $this->authorizePermission('print-quotations');
        $this->ensureIsGeneralQuotation($quotation);

        $quotation->load(['items']);

        $pdf = Pdf::loadView('pdf.quotation', [
            'quotation' => $quotation,
            'client' => null,
        ]);

        $pdf->setPaper('a4', 'portrait');

        $isInvoice = in_array($quotation->status, ['accepted', 'paid']);
        $docPrefix = $isInvoice ? 'Invoice-' : 'Quotation-';
        $filename = $docPrefix . str_replace(' ', '_', $quotation->quotation_number) . '.pdf';
        return $pdf->stream($filename);
    }

    /**
     * Display a clean, dedicated standalone print page for the Quotation.
     */
    public function print(Quotation $quotation)
    {
        $this->authorizePermission('print-quotations');
        $this->ensureIsGeneralQuotation($quotation);

        $quotation->load(['items']);

        return view('pdf.quotation-print', [
            'quotation' => $quotation,
            'client' => null,
        ]);
    }
}
