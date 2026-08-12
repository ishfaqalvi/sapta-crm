<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;

trait AuthorizesClientPortalAccess
{
    /**
     * Authorize that the authenticated user has the given permission or is an Admin.
     */
    protected function authorizePermission(string $permission): void
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthenticated Client Portal Access');
        }

        // Admins and Super Admins bypass permission checks
        if ($user->type === 'admin' || $user->hasRole('Super Admin') || $user->hasRole('admin')) {
            return;
        }

        // Check if user model has permission via Spatie or Gate
        if (!$user->hasPermissionTo($permission) && !$user->can($permission)) {
            abort(403, "Unauthorized: Missing Permission [{$permission}]");
        }
    }
}
