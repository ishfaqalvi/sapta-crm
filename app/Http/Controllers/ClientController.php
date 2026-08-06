<?php

namespace App\Http\Controllers;

use App\Models\{Client, Currency};
use App\Traits\HasActiveClientContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    use HasActiveClientContext;

    /**
     * Display a listing of clients with search, filter, and read-only portal access status.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $currency = $request->query('currency');

        $clients = Client::query()
            ->with([
                'user' => function ($query) {
                    $query->where('type', 'client')->select('id', 'client_id', 'name', 'email', 'type', 'created_at');
                }
            ])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('client_code', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%")
                        ->orWhere('contact_person', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($currency, function ($query, $currency) {
                $query->where('currency', $currency);
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $stats = [
            'total' => Client::count(),
            'active' => Client::where('status', 'active')->count(),
            'inactive' => Client::where('status', 'inactive')->count(),
            'with_portal' => Client::whereHas('user', function ($q) {
                $q->where('type', 'client');
            })->count(),
        ];

        return Inertia::render('clients/index', [
            'clients' => $clients,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'currency' => $currency ?? '',
            ],
        ]);
    }

    /**
     * Show the form for creating a new client.
     */
    public function create(): Response
    {
        return Inertia::render('clients/create', [
            'next_client_code' => Client::generateClientCode(),
            'currencies' => Currency::where('is_active', true)->select('code', 'name', 'symbol')->get(),
        ]);
    }

    /**
     * Set active client context in user profile and redirect to client portal dashboard.
     */
    public function show(Client $client): RedirectResponse
    {
        $this->setActiveClientContext($client->id);

        return redirect()->route('client-portal.overview.index');
    }

    /**
     * Show the form for editing the specified client.
     */
    public function edit(Client $client): Response
    {
        return Inertia::render('clients/edit', [
            'client' => $client,
            'currencies' => Currency::where('is_active', true)->select('code', 'name', 'symbol')->get(),
        ]);
    }

    /**
     * Store a newly created client in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'currency' => ['required', 'string', 'max:10'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $validated['client_code'] = Client::generateClientCode();

        Client::create($validated);

        return redirect()->route('clients.index')->with('success', 'Client created successfully.');
    }

    /**
     * Update the specified client in storage.
     */
    public function update(Request $request, Client $client): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'currency' => ['required', 'string', 'max:10'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $client->update($validated);

        return redirect()->route('clients.index')->with('success', 'Client details updated successfully.');
    }

    /**
     * Remove the specified client from storage.
     */
    public function destroy(Client $client): RedirectResponse
    {
        if ($client->user) {
            $client->user->delete();
        }

        $client->delete();

        return redirect()->route('clients.index')->with('success', 'Client deleted successfully.');
    }
}
