<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Currency;
use App\Models\SeoPayment;
use App\Models\SeoRetainer;
use App\Services\CurrencyService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SeoPaymentController extends Controller
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
     * Display a listing of SEO Retainer Monthly Payments.
     */
    public function index(Request $request): Response
    {
        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = SeoPayment::where('client_id', $clientId)
            ->with(['seoRetainer']);

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('billing_month', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhere('payment_method', 'like', "%{$search}%")
                    ->orWhereHas('seoRetainer', function ($rq) use ($search) {
                        $rq->where('package_name', 'like', "%{$search}%");
                    });
            });
        }

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Billing Month Filter
        if ($request->filled('month')) {
            $query->where('billing_month', $request->month);
        }

        $payments = $query->orderBy('billing_month', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $allPayments = SeoPayment::where('client_id', $clientId)->get();
        $clearedPayments = $allPayments->whereIn('status', ['cleared', 'paid']);

        $stats = [
            'total' => $allPayments->count(),
            'cleared' => $clearedPayments->count(),
            'pending' => $allPayments->where('status', 'due_pending')->count(),
            'overdue' => $allPayments->where('status', 'overdue')->count(),
            'total_cleared_amount' => $clearedPayments->sum('amount_paid'),
            'total_pending_amount' => $allPayments->where('status', 'due_pending')->sum('amount_due'),
        ];

        $retainers = SeoRetainer::where('client_id', $clientId)
            ->whereIn('status', ['active', 'paused'])
            ->get();

        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();

        return Inertia::render('client-portal/seo-payments/index', [
            'client' => $client,
            'payments' => $payments,
            'retainers' => $retainers,
            'stats' => $stats,
            'currencies' => $currencies,
            'filters' => $request->only(['search', 'status', 'month']),
        ]);
    }

    /**
     * Generate monthly billing logs for a target month (YYYY-MM).
     *
     * Logic:
     * - Retainer's start_date must be <= end of the target month.
     * - If record does NOT exist: Create new payment log (status: due_pending).
     * - If record EXISTS and is UNPAID (due_pending/overdue): Re-generate / update fees & rate.
     * - If record EXISTS and is PAID (cleared/paid): SKIP.
     */
    public function generateMonthlyBatch(Request $request): RedirectResponse
    {
        $clientId = $this->getClientId();

        $request->validate([
            'month' => 'required|date_format:Y-m',
        ]);

        $targetMonth = $request->month;
        $currentMonth = date('Y-m');

        if ($targetMonth > $currentMonth) {
            return redirect()->back()->with('error', 'Future billing months cannot be generated in advance.');
        }

        $endOfMonth = Carbon::parse($targetMonth . '-01')->endOfMonth()->toDateString();

        // Get all active/paused retainers for this client starting on or before end of month
        $retainers = SeoRetainer::where('client_id', $clientId)
            ->whereIn('status', ['active', 'paused'])
            ->where('start_date', '<=', $endOfMonth)
            ->get();

        if ($retainers->isEmpty()) {
            return redirect()->back()->with('error', "No active SEO retainers found starting on or before {$targetMonth}.");
        }

        $createdCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;

        foreach ($retainers as $retainer) {
            $existingPayment = SeoPayment::where('seo_retainer_id', $retainer->id)
                ->where('billing_month', $targetMonth)
                ->first();

            $rate = CurrencyService::getRate($retainer->currency);

            if (!$existingPayment) {
                // Record does NOT exist -> Create new due payment log
                SeoPayment::create([
                    'seo_retainer_id' => $retainer->id,
                    'client_id' => $clientId,
                    'billing_month' => $targetMonth,
                    'amount_due' => $retainer->monthly_fee,
                    'amount_paid' => 0.00,
                    'exchange_rate' => $rate,
                    'amount_paid_pkr' => 0.00,
                    'status' => 'due_pending',
                ]);
                $createdCount++;
            } else {
                // Record ALREADY exists
                if (in_array($existingPayment->status, ['cleared', 'paid'])) {
                    // Paid -> SKIP
                    $skippedCount++;
                } else {
                    // Unpaid -> Re-generate / Update fees & exchange rate
                    $existingPayment->update([
                        'amount_due' => $retainer->monthly_fee,
                        'exchange_rate' => $rate,
                        'status' => 'due_pending',
                    ]);
                    $updatedCount++;
                }
            }
        }

        return redirect()->back()->with(
            'success',
            "SEO billing logs for {$targetMonth} processed: {$createdCount} generated, {$updatedCount} updated (unpaid), {$skippedCount} skipped (paid)."
        );
    }



    /**
     * Update an existing payment log / settlement details.
     */
    public function update(Request $request, SeoPayment $seoPayment): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($seoPayment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to SEO Payment record');
        }

        if (in_array($seoPayment->status, ['cleared', 'paid'])) {
            return redirect()->back()->with('error', 'Paid / cleared payment records are locked and cannot be edited or modified.');
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['cleared', 'paid', 'due_pending', 'overdue'])],
            'amount_paid' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'payment_method' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $retainer = $seoPayment->seoRetainer;
        $currency = $retainer ? $retainer->currency : 'PKR';
        $rate = CurrencyService::getRate($currency);

        $amountPaid = (isset($validated['amount_paid']) && $validated['amount_paid'] !== '')
            ? (float) $validated['amount_paid']
            : (float) $seoPayment->amount_due;

        $validated['amount_paid'] = $amountPaid;
        $validated['exchange_rate'] = $rate;
        $validated['amount_paid_pkr'] = round($amountPaid * $rate, 2);

        if (in_array($validated['status'], ['cleared', 'paid'])) {
            $validated['payment_date'] = !empty($validated['payment_date']) ? $validated['payment_date'] : now()->toDateString();
        }

        $seoPayment->update($validated);

        return redirect()->back()->with('success', 'SEO Payment marked as paid successfully.');
    }

    /**
     * Remove the specified payment log.
     */
    public function destroy(SeoPayment $seoPayment): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($seoPayment->client_id !== $clientId) {
            abort(403, 'Unauthorized access to SEO Payment record');
        }

        if (in_array($seoPayment->status, ['cleared', 'paid'])) {
            return redirect()->back()->with('error', 'Paid / cleared SEO payment logs cannot be deleted to preserve financial calculations.');
        }

        $seoPayment->delete();

        return redirect()->back()->with('success', 'SEO Payment record deleted successfully.');
    }
}
