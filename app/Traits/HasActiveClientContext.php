<?php

namespace App\Traits;

use App\Models\Client;
use Illuminate\Support\Facades\Auth;

trait HasActiveClientContext
{
    /**
     * Resolve the active client ID from authenticated user or session.
     */
    protected function getActiveClientId(): ?int
    {
        $user = Auth::user();

        if ($user && $user->client_id) {
            return (int) $user->client_id;
        }

        return null;
    }

    /**
     * Set active client context in user profile table.
     */
    protected function setActiveClientContext(int $clientId): void
    {
        $user = Auth::user();
        if ($user) {
            $user->client_id = $clientId;
            $user->save();
        }
    }

    /**
     * Resolve the active client model with loaded workspace relations.
     */
    protected function getActiveClient(): Client
    {
        $clientId = $this->getActiveClientId();

        if (!$clientId) {
            abort(404, 'No clients registered in system.');
        }

        $client = Client::findOrFail($clientId);

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
}
