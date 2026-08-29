<?php

namespace App\Traits;

use App\Models\Client;
use App\Models\ClientService;
use App\Models\Employee;
use App\Models\WebsiteProject;
use Illuminate\Support\Facades\Auth;

trait AuthorizesClientPortalAccess
{
    /**
     * Authorize that the authenticated user has the given permission or is an Admin/assigned employee.
     */
    protected function authorizePermission(string $permission, ?WebsiteProject $project = null, ?ClientService $service = null): void
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthenticated Client Portal Access');
        }

        // Admins and Super Admins bypass permission checks
        if ($user->type === 'admin' || $user->hasRole('Super Admin') || $user->hasRole('admin')) {
            return;
        }

        // For employees accessing an assigned project or service
        if ($user->type === 'employee' || $user->employee_id) {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
            $employeeId = $employee ? $employee->id : 0;

            if ($project && $project->tasks()->where('assigned_employee_id', $employeeId)->exists()) {
                return;
            }

            if ($service && $service->tasks()->where('assigned_employee_id', $employeeId)->exists()) {
                return;
            }

            // Also allow general view on client-portal projects/services and task updates for assigned staff
            if (in_array($permission, [
                'view-client-portal-projects',
                'view-client-portal-services',
                'edit-client-portal-project-tasks',
                'edit-client-portal-service-tasks',
                'create-client-portal-project-tasks',
                'create-client-portal-service-tasks',
            ])) {
                return;
            }
        }

        // Check if user model has permission via Spatie or Gate
        if (!$user->hasPermissionTo($permission) && !$user->can($permission)) {
            abort(403, "Unauthorized: Missing Permission [{$permission}]");
        }
    }

    /**
     * Retrieve the active client ID securely, auto-resolving and saving for staff/admin if needed.
     */
    protected function getClientId(?int $fallbackClientId = null): int
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // If fallbackClientId provided (e.g. from a loaded project or service) and user is not a client
        if ($fallbackClientId && $user->type !== 'client') {
            if ($user->client_id !== $fallbackClientId) {
                $user->client_id = $fallbackClientId;
                $user->save();
            }
            return (int) $user->client_id;
        }

        if ($user->client_id) {
            return (int) $user->client_id;
        }

        // For internal staff/admin without active client, auto-resolve to their first relevant client
        if ($user->type !== 'client') {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
            $employeeId = $employee ? $employee->id : 0;

            $client = Client::whereHas('websiteProjects.tasks', function ($q) use ($employeeId) {
                $q->where('assigned_employee_id', $employeeId);
            })->orWhereHas('clientServices.tasks', function ($q) use ($employeeId) {
                $q->where('assigned_employee_id', $employeeId);
            })->first() ?? Client::first();

            if ($client) {
                $user->client_id = $client->id;
                $user->save();
                return (int) $user->client_id;
            }
        }

        abort(403, 'Unauthorized Client Portal Access: No client context selected.');
    }

    /**
     * Retrieve active client model.
     */
    protected function getClientModel(?int $fallbackClientId = null): Client
    {
        return Client::findOrFail($this->getClientId($fallbackClientId));
    }
}
