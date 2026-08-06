<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OverviewController extends Controller
{
    /**
     * Retrieve the authenticated client model securely from session.
     */
    protected function getAuthenticatedClient(): Client
    {
        $user = Auth::user();

        if (!$user || !$user->client_id) {
            abort(403, 'Unauthorized Client Portal Access');
        }

        $client = Client::findOrFail($user->client_id);

        return $client->load([
            'websiteProjects' => function ($q) {
                $q->with(['payments', 'tasks.assignedEmployee'])->latest();
            },
            'seoRetainers' => function ($q) {
                $q->with('payments')->latest();
            },
            'projectPayments' => function ($q) {
                $q->with('websiteProject')->latest();
            },
            'seoPayments' => function ($q) {
                $q->with('seoRetainer')->latest();
            },
        ]);
    }

    /**
     * Client Portal Dashboard & Overview
     */
    public function index(): Response
    {
        $client = $this->getAuthenticatedClient();

        return Inertia::render('client-portal/overview/index', [
            'client' => $client,
        ]);
    }
}
