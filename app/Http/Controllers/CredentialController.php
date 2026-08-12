<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientCredential;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CredentialController extends Controller
{
    /**
     * Display a listing of client credentials across all clients.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $type = $request->query('type');
        $clientId = $request->query('client_id');

        $credentials = ClientCredential::with(['client:id,name,company_name,client_code', 'project:id,project_name'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('url', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%")
                                ->orWhere('company_name', 'like', "%{$search}%")
                                ->orWhere('client_code', 'like', "%{$search}%");
                        })
                        ->orWhereHas('project', function ($pq) use ($search) {
                            $pq->where('project_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($clientId, function ($query, $clientId) {
                $query->where('client_id', $clientId);
            })
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        $stats = [
            'total' => ClientCredential::count(),
            'hosting' => ClientCredential::where('type', 'hosting')->count(),
            'cms' => ClientCredential::where('type', 'cms')->count(),
            'database' => ClientCredential::where('type', 'database')->count(),
            'domain' => ClientCredential::where('type', 'domain')->count(),
            'api' => ClientCredential::where('type', 'api')->count(),
            'other' => ClientCredential::where('type', 'other')->count(),
        ];

        $clients = Client::select('id', 'name', 'company_name', 'client_code')->orderBy('name')->get();

        return Inertia::render('credentials/index', [
            'credentials' => $credentials,
            'stats' => $stats,
            'clients' => $clients,
            'filters' => [
                'search' => $search ?? '',
                'type' => $type ?? '',
                'client_id' => $clientId ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created credential.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:hosting,cms,database,domain,api,other'],
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        ClientCredential::create($validated);

        return redirect()->back()->with('success', 'Client login credential created successfully.');
    }

    /**
     * Update the specified credential.
     */
    public function update(Request $request, ClientCredential $credential): RedirectResponse
    {
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:hosting,cms,database,domain,api,other'],
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $credential->update($validated);

        return redirect()->back()->with('success', 'Credential updated successfully.');
    }

    /**
     * Remove the specified credential.
     */
    public function destroy(ClientCredential $credential): RedirectResponse
    {
        $credential->delete();

        return redirect()->back()->with('success', 'Credential deleted successfully.');
    }
}
