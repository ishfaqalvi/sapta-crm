<?php

namespace App\Http\Controllers;

use App\Models\SeoPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SeoPaymentController extends Controller
{
    /**
     * Display listing of SEO Retainer Payments.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $month = $request->query('month');

        $payments = SeoPayment::with(['seoRetainer', 'client'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('billing_month', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%")
                                ->orWhere('client_code', 'like', "%{$search}%");
                        })
                        ->orWhereHas('seoRetainer', function ($rq) use ($search) {
                            $rq->where('package_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($month, function ($query, $month) {
                $query->where('billing_month', $month);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total' => SeoPayment::count(),
            'cleared' => SeoPayment::where('status', 'cleared')->count(),
            'pending' => SeoPayment::where('status', 'due_pending')->count(),
            'overdue' => SeoPayment::where('status', 'overdue')->count(),
            'total_cleared_pkr' => SeoPayment::where('status', 'cleared')->sum('amount_paid_pkr'),
        ];

        return Inertia::render('seo/payments/index', [
            'payments' => $payments,
            'stats' => $stats,
            'exchange_rates' => \App\Services\CurrencyService::getDefaultRates(),
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'month' => $month ?? '',
            ],
        ]);
    }

    /**
     * Update payment record status and settlement details.
     */
    public function update(Request $request, SeoPayment $seoPayment): RedirectResponse
    {
        $validated = $request->validate([
            'amount_paid' => ['required', 'numeric', 'min:0'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'payment_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['cleared', 'due_pending', 'overdue'])],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $retainer = $seoPayment->seoRetainer;
        $currency = $retainer ? $retainer->currency : 'PKR';

        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : ($seoPayment->exchange_rate > 0 ? (float) $seoPayment->exchange_rate : \App\Services\CurrencyService::getRate($currency));

        $validated['exchange_rate'] = $rate;
        $validated['amount_paid_pkr'] = round((float) $validated['amount_paid'] * $rate, 2);

        if ($validated['status'] === 'cleared' && empty($validated['payment_date'])) {
            $validated['payment_date'] = date('Y-m-d');
        }

        $seoPayment->update($validated);

        return redirect()->route('seo-payments.index')->with('success', 'SEO Payment status updated successfully.');
    }

    /**
     * Manually trigger billing log generation for a target month.
     */
    public function generateMonthlyBatch(Request $request): RedirectResponse
    {
        $month = $request->input('month', date('Y-m'));
        \Illuminate\Support\Facades\Artisan::call('seo:generate-monthly-payments', ['--month' => $month]);

        return redirect()->route('seo-payments.index')->with('success', "Monthly billing logs generated for {$month}.");
    }
}
