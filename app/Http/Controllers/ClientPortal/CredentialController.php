<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientCredential;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CredentialController extends Controller
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
     * Display a listing of credentials for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $query = ClientCredential::where('client_id', $clientId);

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('url', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Category / Type Filter
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $credentials = $query->orderBy('created_at', 'desc')
            ->paginate(12)
            ->withQueryString();

        $allCredentials = ClientCredential::where('client_id', $clientId)->get();

        $stats = [
            'total' => $allCredentials->count(),
            'hosting' => $allCredentials->where('type', 'hosting')->count(),
            'cms' => $allCredentials->where('type', 'cms')->count(),
            'database' => $allCredentials->where('type', 'database')->count(),
            'domain' => $allCredentials->where('type', 'domain')->count(),
            'api' => $allCredentials->where('type', 'api')->count(),
            'other' => $allCredentials->where('type', 'other')->count(),
        ];

        return Inertia::render('client-portal/credentials/index', [
            'client' => $client,
            'credentials' => $credentials,
            'stats' => $stats,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    /**
     * Store a newly created credential for the authenticated client.
     */
    public function store(Request $request): RedirectResponse
    {
        $clientId = $this->getClientId();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => ['required', Rule::in(['hosting', 'cms', 'database', 'domain', 'api', 'other'])],
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:2000',
            'url' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:3000',
        ]);

        $validated['client_id'] = $clientId;

        ClientCredential::create($validated);

        return redirect()->back()->with('success', 'Credential created successfully.');
    }

    /**
     * Update an existing credential.
     */
    public function update(Request $request, ClientCredential $credential): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($credential->client_id !== $clientId) {
            abort(403, 'Unauthorized access to credential');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => ['required', Rule::in(['hosting', 'cms', 'database', 'domain', 'api', 'other'])],
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:2000',
            'url' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:3000',
        ]);

        $credential->update($validated);

        return redirect()->back()->with('success', 'Credential updated successfully.');
    }

    /**
     * Remove the specified credential.
     */
    public function destroy(ClientCredential $credential): RedirectResponse
    {
        $clientId = $this->getClientId();

        if ($credential->client_id !== $clientId) {
            abort(403, 'Unauthorized access to credential');
        }

        $credential->delete();

        return redirect()->back()->with('success', 'Credential deleted successfully.');
    }
}
