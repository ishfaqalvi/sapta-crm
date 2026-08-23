<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Traits\AuthorizesClientPortalAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OverviewController extends Controller
{
    use AuthorizesClientPortalAccess;

    /**
     * Retrieve the authenticated client model securely from session.
     */
    protected function getAuthenticatedClient(bool $withRelations = true): Client
    {
        $user = Auth::user();

        if (!$user || !$user->client_id) {
            abort(403, 'Unauthorized Client Portal Access');
        }

        $client = Client::findOrFail($user->client_id);

        if (!$withRelations) {
            return $client;
        }

        return $client->load([
            'websiteProjects' => function ($q) {
                $q->with(['payments', 'tasks.assignedEmployee'])->latest();
            },
            'clientServices' => function ($q) {
                $q->with(['category', 'payments'])->latest();
            },
            'projectPayments' => function ($q) {
                $q->with('websiteProject')->latest();
            },
            'domains' => function ($q) {
                $q->with('payments')->latest();
            },
            'hostings' => function ($q) {
                $q->with('payments')->latest();
            },
            'credentials' => function ($q) {
                $q->latest();
            },
        ]);
    }

    /**
     * Client Portal Dashboard & Overview
     */
    public function index(): Response
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $canViewOverview = $user->hasRole('Super Admin')
            || ($user->hasPermissionTo('view-client-portal-overview') || $user->can('view-client-portal-overview'));

        $client = $this->getAuthenticatedClient($canViewOverview);

        $invoices = [];
        if ($canViewOverview && $client->id) {
            $invoices = \App\Models\Invoice::where('client_id', $client->id)
                ->with('items')
                ->latest()
                ->take(15)
                ->get();
        }

        return Inertia::render('client-portal/overview/index', [
            'client' => $client,
            'invoices' => $invoices,
            'canViewOverview' => $canViewOverview,
        ]);
    }
}
