<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientCredential;
use App\Traits\AuthorizesClientPortalAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CredentialController extends Controller
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
     * Display a listing of general credentials (where website_project_id is null) for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $this->authorizePermission('view-client-portal-credentials');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = ClientCredential::where('client_id', $clientId)
            ->whereNull('website_project_id');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('url', 'like', "%{$search}%");
            });
        }

        $credentials = $query->latest('id')
            ->paginate(12)
            ->withQueryString();

        $stats = [
            'total' => ClientCredential::where('client_id', $clientId)->whereNull('website_project_id')->count(),
        ];

        return Inertia::render('client-portal/credentials/index', [
            'client' => $client,
            'credentials' => $credentials,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created general credential for the authenticated client.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-credentials');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'nullable|string|max:50',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:500',
            'url' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:5000',
        ]);

        $validated['client_id'] = $clientId;
        $validated['website_project_id'] = null;
        $validated['type'] = $validated['type'] ?? 'other';

        ClientCredential::create($validated);

        return redirect()->back()->with('success', 'Credential stored successfully.');
    }

    /**
     * Update an existing credential.
     */
    public function update(Request $request, ClientCredential $credential): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-credentials');

        $clientId = $this->getClientId();

        if ($credential->client_id !== $clientId) {
            abort(403, 'Unauthorized access to credential');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'nullable|string|max:50',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:500',
            'url' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:5000',
        ]);

        $validated['type'] = $validated['type'] ?? 'other';

        $credential->update($validated);

        return redirect()->back()->with('success', 'Credential updated successfully.');
    }

    /**
     * Remove the specified credential.
     */
    public function destroy(ClientCredential $credential): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-credentials');

        $clientId = $this->getClientId();

        if ($credential->client_id !== $clientId) {
            abort(403, 'Unauthorized access to credential');
        }

        $credential->delete();

        return redirect()->back()->with('success', 'Credential deleted successfully.');
    }
}
