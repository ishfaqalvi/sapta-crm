<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientDomain;
use App\Models\ClientHosting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClientHostingController extends Controller
{
    /**
     * Display listing of client hostings.
     */
    public function index(Request $request): Response
    {
        $query = ClientHosting::with(['client', 'primaryDomain', 'invoiceItems.invoice']);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('hosting_title', 'like', "%{$search}%")
                    ->orWhere('provider', 'like', "%{$search}%")
                    ->orWhere('server_ip', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->query('client_id'));
        }

        if ($request->filled('provider')) {
            $query->where('provider', $request->query('provider'));
        }

        if ($request->filled('billing_cycle')) {
            $query->where('billing_cycle', $request->query('billing_cycle'));
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

        $hostings = $query->latest('id')->paginate(15)->withQueryString();

        $stats = [
            'total' => ClientHosting::count(),
            'active' => ClientHosting::where('status', 'active')->count(),
            'expiring_soon' => ClientHosting::whereBetween('expiry_date', [now(), now()->addDays(30)])->count(),
            'expired' => ClientHosting::where('expiry_date', '<', now())->orWhere('status', 'suspended')->count(),
            'total_revenue_pkr' => (float) ClientHosting::where('status', 'active')->sum('client_price_pkr'),
        ];

        $clients = Client::orderBy('name', 'asc')->get(['id', 'name', 'company_name', 'client_code']);
        $providers = ClientHosting::distinct()->whereNotNull('provider')->pluck('provider')->toArray();

        return Inertia::render('client-hostings/index', [
            'hostings' => $hostings,
            'stats' => $stats,
            'clients' => $clients,
            'providers' => array_values(array_unique(array_merge(['Hetzner', 'AWS', 'DigitalOcean', 'Namecheap', 'Hostinger', 'Vultr', 'Linode', 'cPanel Hosting'], $providers))),
            'filters' => $request->only(['search', 'client_id', 'provider', 'billing_cycle', 'status', 'expiry_filter']),
        ]);
    }

    /**
     * Show creation form.
     */
    public function create(Request $request): Response
    {
        $clients = Client::orderBy('name', 'asc')->get(['id', 'name', 'company_name', 'client_code']);
        $domains = ClientDomain::orderBy('domain_name', 'asc')->get(['id', 'domain_name', 'client_id']);
        $preselectedClientId = $request->query('client_id', '');

        return Inertia::render('client-hostings/create', [
            'clients' => $clients,
            'domains' => $domains,
            'preselected_client_id' => $preselectedClientId,
        ]);
    }

    /**
     * Store new client hosting.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'hosting_title' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', 'max:100'],
            'server_ip' => ['nullable', 'string', 'max:45'],
            'server_type' => ['nullable', 'string', 'max:100'],
            'billing_cycle' => ['required', Rule::in(['monthly', 'quarterly', 'semi_annual', 'annual', 'biennial'])],
            'setup_date' => ['nullable', 'date'],
            'expiry_date' => ['required', 'date'],
            'cost_pkr' => ['nullable', 'numeric', 'min:0'],
            'client_price_pkr' => ['required', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['active', 'suspended', 'cancelled', 'expired'])],
            'primary_domain_id' => ['nullable', 'exists:client_domains,id'],
            'disk_space' => ['nullable', 'string', 'max:100'],
            'bandwidth' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        ClientHosting::create($validated);

        return redirect()->route('client-hostings.index')->with('success', 'Client hosting package created successfully!');
    }

    /**
     * Show edit form.
     */
    public function edit(ClientHosting $clientHosting): Response
    {
        $clientHosting->load(['client', 'primaryDomain']);
        $clients = Client::orderBy('name', 'asc')->get(['id', 'name', 'company_name', 'client_code']);
        $domains = ClientDomain::orderBy('domain_name', 'asc')->get(['id', 'domain_name', 'client_id']);

        return Inertia::render('client-hostings/edit', [
            'hosting' => $clientHosting,
            'clients' => $clients,
            'domains' => $domains,
        ]);
    }

    /**
     * Update client hosting.
     */
    public function update(Request $request, ClientHosting $clientHosting): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'hosting_title' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', 'max:100'],
            'server_ip' => ['nullable', 'string', 'max:45'],
            'server_type' => ['nullable', 'string', 'max:100'],
            'billing_cycle' => ['required', Rule::in(['monthly', 'quarterly', 'semi_annual', 'annual', 'biennial'])],
            'setup_date' => ['nullable', 'date'],
            'expiry_date' => ['required', 'date'],
            'cost_pkr' => ['nullable', 'numeric', 'min:0'],
            'client_price_pkr' => ['required', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['active', 'suspended', 'cancelled', 'expired'])],
            'primary_domain_id' => ['nullable', 'exists:client_domains,id'],
            'disk_space' => ['nullable', 'string', 'max:100'],
            'bandwidth' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $clientHosting->update($validated);

        return redirect()->route('client-hostings.index')->with('success', 'Client hosting package updated successfully!');
    }

    /**
     * Quick status update.
     */
    public function updateStatus(Request $request, ClientHosting $clientHosting): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'suspended', 'cancelled', 'expired'])],
        ]);

        $clientHosting->update($validated);

        return redirect()->back()->with('success', 'Hosting status updated successfully!');
    }

    /**
     * Delete client hosting.
     */
    public function destroy(ClientHosting $clientHosting): RedirectResponse
    {
        $clientHosting->delete();

        return redirect()->route('client-hostings.index')->with('success', 'Client hosting package deleted successfully!');
    }
}
