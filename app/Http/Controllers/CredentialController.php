<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientCredential;
use App\Models\ClientService;
use App\Models\WebsiteProject;
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
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-credentials') && !$user->can('view-credentials'))) {
            abort(403, 'Unauthorized. You do not have permission to view credentials vault.');
        }

        $search = $request->query('search');
        $type = $request->query('type');
        $clientId = $request->query('client_id');
        $projectId = $request->query('website_project_id') ?? $request->query('project_id');
        $serviceId = $request->query('client_service_id') ?? $request->query('service_id');

        $credentials = ClientCredential::with(['client:id,name,company_name,client_code', 'project:id,project_name', 'service:id,service_name'])
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
                        })
                        ->orWhereHas('service', function ($sq) use ($search) {
                            $sq->where('service_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($clientId, function ($query, $clientId) {
                $query->where('client_id', $clientId);
            })
            ->when($projectId, function ($query, $projectId) {
                $query->where('website_project_id', $projectId);
            })
            ->when($serviceId, function ($query, $serviceId) {
                $query->where('client_service_id', $serviceId);
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

        $clients = Client::select('id', 'name', 'company_name', 'client_code')
            ->with(['websiteProjects:id,client_id,project_name', 'services:id,client_id,service_name'])
            ->orderBy('name')
            ->get();

        $projects = WebsiteProject::select('id', 'client_id', 'project_name')
            ->when($clientId, function ($q) use ($clientId) {
                $q->where('client_id', $clientId);
            })
            ->orderBy('project_name')
            ->get();

        $services = ClientService::select('id', 'client_id', 'service_name')
            ->when($clientId, function ($q) use ($clientId) {
                $q->where('client_id', $clientId);
            })
            ->orderBy('service_name')
            ->get();

        return Inertia::render('credentials/index', [
            'credentials' => $credentials,
            'stats' => $stats,
            'clients' => $clients,
            'projects' => $projects,
            'services' => $services,
            'filters' => [
                'search' => $search ?? '',
                'type' => $type ?? '',
                'client_id' => $clientId ?? '',
                'website_project_id' => $projectId ?? '',
                'client_service_id' => $serviceId ?? '',
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
            'website_project_id' => ['nullable', 'exists:website_projects,id'],
            'client_service_id' => ['nullable', 'exists:client_services,id'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:hosting,cms,database,domain,api,other'],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
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
            'website_project_id' => ['nullable', 'exists:website_projects,id'],
            'client_service_id' => ['nullable', 'exists:client_services,id'],
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:hosting,cms,database,domain,api,other'],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
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
