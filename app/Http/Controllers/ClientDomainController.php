<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientDomain;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClientDomainController extends Controller
{
    /**
     * Display listing of client domains.
     */
    public function index(Request $request): Response
    {
        $query = ClientDomain::with(['client', 'invoiceItems.invoice']);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('domain_name', 'like', "%{$search}%")
                    ->orWhere('registrar', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->query('client_id'));
        }

        if ($request->filled('registrar')) {
            $query->where('registrar', $request->query('registrar'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('expiry_filter')) {
            $ef = $request->query('expiry_filter');
            if ($ef === 'expiring_30') {
                $query->whereBetween('expiry_date', [now(), now()->addDays(30)]);
            } elseif ($ef === 'expired') {
                $query->where('expiry_date', '<', now());
            }
        }

        $domains = $query->latest('id')->paginate(15)->withQueryString();

        $stats = [
            'total' => ClientDomain::count(),
            'active' => ClientDomain::where('status', 'active')->count(),
            'expiring_soon' => ClientDomain::whereBetween('expiry_date', [now(), now()->addDays(30)])->count(),
            'expired' => ClientDomain::where('expiry_date', '<', now())->count(),
            'total_revenue_pkr' => (float) ClientDomain::where('status', 'active')->sum('client_price_pkr'),
        ];

        $clients = Client::orderBy('name', 'asc')->get(['id', 'name', 'company_name', 'client_code']);
        $registrars = ClientDomain::distinct()->whereNotNull('registrar')->pluck('registrar')->toArray();

        return Inertia::render('client-domains/index', [
            'domains' => $domains,
            'stats' => $stats,
            'clients' => $clients,
            'registrars' => array_values(array_unique(array_merge(['Namecheap', 'GoDaddy', 'Cloudflare', 'Hostinger', 'Google Domains', 'Porkbun'], $registrars))),
            'filters' => $request->only(['search', 'client_id', 'registrar', 'status', 'expiry_filter']),
        ]);
    }

    /**
     * Show creation form.
     */
    public function create(Request $request): Response
    {
        $clients = Client::orderBy('name', 'asc')->get(['id', 'name', 'company_name', 'client_code']);
        $preselectedClientId = $request->query('client_id', '');

        return Inertia::render('client-domains/create', [
            'clients' => $clients,
            'preselected_client_id' => $preselectedClientId,
        ]);
    }

    /**
     * Store new client domain.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'domain_name' => ['required', 'string', 'max:255'],
            'registrar' => ['required', 'string', 'max:100'],
            'registration_date' => ['nullable', 'date'],
            'expiry_date' => ['required', 'date'],
            'renewal_cost_pkr' => ['nullable', 'numeric', 'min:0'],
            'client_price_pkr' => ['required', 'numeric', 'min:0'],
            'auto_renew' => ['boolean'],
            'has_hosting_bundle' => ['boolean'],
            'nameserver_1' => ['nullable', 'string', 'max:255'],
            'nameserver_2' => ['nullable', 'string', 'max:255'],
            'nameserver_3' => ['nullable', 'string', 'max:255'],
            'nameserver_4' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active', 'pending_renewal', 'expired', 'transferred'])],
            'notes' => ['nullable', 'string'],
        ]);

        ClientDomain::create($validated);

        return redirect()->route('client-domains.index')->with('success', 'Client domain created successfully!');
    }

    /**
     * Show edit form.
     */
    public function edit(ClientDomain $clientDomain): Response
    {
        $clientDomain->load('client');
        $clients = Client::orderBy('name', 'asc')->get(['id', 'name', 'company_name', 'client_code']);

        return Inertia::render('client-domains/edit', [
            'domain' => $clientDomain,
            'clients' => $clients,
        ]);
    }

    /**
     * Update client domain.
     */
    public function update(Request $request, ClientDomain $clientDomain): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'domain_name' => ['required', 'string', 'max:255'],
            'registrar' => ['required', 'string', 'max:100'],
            'registration_date' => ['nullable', 'date'],
            'expiry_date' => ['required', 'date'],
            'renewal_cost_pkr' => ['nullable', 'numeric', 'min:0'],
            'client_price_pkr' => ['required', 'numeric', 'min:0'],
            'auto_renew' => ['boolean'],
            'has_hosting_bundle' => ['boolean'],
            'nameserver_1' => ['nullable', 'string', 'max:255'],
            'nameserver_2' => ['nullable', 'string', 'max:255'],
            'nameserver_3' => ['nullable', 'string', 'max:255'],
            'nameserver_4' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active', 'pending_renewal', 'expired', 'transferred'])],
            'notes' => ['nullable', 'string'],
        ]);

        $clientDomain->update($validated);

        return redirect()->route('client-domains.index')->with('success', 'Client domain updated successfully!');
    }

    /**
     * Quick status update.
     */
    public function updateStatus(Request $request, ClientDomain $clientDomain): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'pending_renewal', 'expired', 'transferred'])],
        ]);

        $clientDomain->update($validated);

        return redirect()->back()->with('success', 'Domain status updated successfully!');
    }

    /**
     * Delete client domain.
     */
    public function destroy(ClientDomain $clientDomain): RedirectResponse
    {
        $clientDomain->delete();

        return redirect()->route('client-domains.index')->with('success', 'Client domain deleted successfully!');
    }
}
