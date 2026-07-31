<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CurrencyController extends Controller
{
    /**
     * Display a listing of Currencies.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $currencies = Currency::when($search, function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('symbol', 'like', "%{$search}%");
            });
        })
        ->orderBy('is_base', 'desc')
        ->latest('updated_at')
        ->paginate(15)
        ->withQueryString();

        $stats = [
            'total' => Currency::count(),
            'active' => Currency::where('is_active', true)->count(),
            'base' => Currency::where('is_base', true)->first()?->code ?? 'PKR',
        ];

        return Inertia::render('currencies/index', [
            'currencies' => $currencies,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created currency in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'uppercase', 'unique:currencies,code'],
            'name' => ['required', 'string', 'max:100'],
            'symbol' => ['required', 'string', 'max:10'],
            'exchange_rate_to_pkr' => ['required', 'numeric', 'min:0.0001'],
            'is_active' => ['required', 'boolean'],
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['is_base'] = ($validated['code'] === 'PKR');

        Currency::create($validated);

        return redirect()->back()->with('success', "Currency {$validated['code']} created successfully.");
    }

    /**
     * Update specified currency exchange rate or details.
     */
    public function update(Request $request, Currency $currency): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10', 'uppercase', Rule::unique('currencies', 'code')->ignore($currency->id)],
            'name' => ['required', 'string', 'max:100'],
            'symbol' => ['required', 'string', 'max:10'],
            'exchange_rate_to_pkr' => ['required', 'numeric', 'min:0.0001'],
            'is_active' => ['required', 'boolean'],
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        
        // Base currency (PKR) rate must always remain 1.0000
        if ($currency->is_base || $validated['code'] === 'PKR') {
            $validated['exchange_rate_to_pkr'] = 1.0000;
            $validated['is_active'] = true;
        }

        $currency->update($validated);

        return redirect()->back()->with('success', "Currency {$currency->code} updated successfully.");
    }

    /**
     * Delete specified currency.
     */
    public function destroy(Currency $currency): RedirectResponse
    {
        if ($currency->is_base || $currency->code === 'PKR') {
            return redirect()->back()->with('error', 'Base currency (PKR) cannot be deleted.');
        }

        $code = $currency->code;
        $currency->delete();

        return redirect()->back()->with('success', "Currency {$code} deleted successfully.");
    }
}
