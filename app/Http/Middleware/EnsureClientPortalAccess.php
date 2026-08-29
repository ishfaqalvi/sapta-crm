<?php

namespace App\Http\Middleware;

use App\Models\Client;
use App\Models\ClientCredential;
use App\Models\ClientDomain;
use App\Models\ClientHosting;
use App\Models\ClientService;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\WebsiteProject;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureClientPortalAccess
{
    /**
     * Determine if current request user has client portal access.
     */
    public function check(): bool
    {
        return Auth::check();
    }

    /**
     * Handle an incoming request for Client Portal routes.
     * Both Client users and internal Admin/Employee users are permitted.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();

        // If the logged-in user is NOT a client (e.g. employee or admin), automatically resolve & sync active client_id
        if ($user && $user->type !== 'client') {
            $this->syncClientContextForInternalUser($user, $request);
        }

        return $next($request);
    }

    /**
     * Synchronize the user's active client_id based on route entity or assigned tasks.
     */
    protected function syncClientContextForInternalUser($user, Request $request): void
    {
        $clientId = null;

        // 1. Check if route has a project
        $project = $request->route('project');
        if ($project instanceof WebsiteProject) {
            $clientId = $project->client_id;
        } elseif (is_numeric($project)) {
            $clientId = WebsiteProject::where('id', $project)->value('client_id');
        }

        // 2. Check if route has a service
        if (!$clientId) {
            $service = $request->route('service');
            if ($service instanceof ClientService) {
                $clientId = $service->client_id;
            } elseif (is_numeric($service)) {
                $clientId = ClientService::where('id', $service)->value('client_id');
            }
        }

        // 3. Check if route has a domain
        if (!$clientId) {
            $domain = $request->route('domain');
            if ($domain instanceof ClientDomain) {
                $clientId = $domain->client_id;
            } elseif (is_numeric($domain)) {
                $clientId = ClientDomain::where('id', $domain)->value('client_id');
            }
        }

        // 4. Check if route has a hosting
        if (!$clientId) {
            $hosting = $request->route('hosting');
            if ($hosting instanceof ClientHosting) {
                $clientId = $hosting->client_id;
            } elseif (is_numeric($hosting)) {
                $clientId = ClientHosting::where('id', $hosting)->value('client_id');
            }
        }

        // 5. Check if route has an invoice
        if (!$clientId) {
            $invoice = $request->route('invoice');
            if ($invoice instanceof Invoice) {
                $clientId = $invoice->client_id;
            } elseif (is_numeric($invoice)) {
                $clientId = Invoice::where('id', $invoice)->value('client_id');
            }
        }

        // 6. Check if route has a credential
        if (!$clientId) {
            $credential = $request->route('credential');
            if ($credential instanceof ClientCredential) {
                $clientId = $credential->client_id;
            } elseif (is_numeric($credential)) {
                $clientId = ClientCredential::where('id', $credential)->value('client_id');
            }
        }

        // 7. Check if request body / query contains website_project_id or client_service_id
        if (!$clientId && $request->filled('website_project_id')) {
            $clientId = WebsiteProject::where('id', $request->website_project_id)->value('client_id');
        }
        if (!$clientId && $request->filled('client_service_id')) {
            $clientId = ClientService::where('id', $request->client_service_id)->value('client_id');
        }

        // If target client ID resolved from route / payload, sync it!
        if ($clientId) {
            if ($user->client_id !== (int) $clientId) {
                $user->client_id = (int) $clientId;
                $user->save();
            }
            return;
        }

        // 8. If no specific entity in route and user has no client_id (or current client_id is invalid)
        if (!$user->client_id || !Client::where('id', $user->client_id)->exists()) {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
            $employeeId = $employee ? $employee->id : 0;

            $fallbackClient = Client::whereHas('websiteProjects.tasks', function ($q) use ($employeeId) {
                $q->where('assigned_employee_id', $employeeId);
            })->orWhereHas('clientServices.tasks', function ($q) use ($employeeId) {
                $q->where('assigned_employee_id', $employeeId);
            })->first() ?? Client::first();

            if ($fallbackClient) {
                $user->client_id = $fallbackClient->id;
                $user->save();
            }
        }
    }
}
