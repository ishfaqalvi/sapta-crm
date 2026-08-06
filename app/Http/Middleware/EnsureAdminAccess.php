<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminAccess
{
    /**
     * Determine if current request user has admin access.
     */
    public function check(): bool
    {
        $user = Auth::user();
        return $user && $user->type === 'admin';
    }

    /**
     * Handle an incoming request for Admin CRM routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // If logged in user is a client type, block access to admin dashboard
        if ($user->type === 'client') {
            return redirect()->route('client-portal.overview.index')->with('error', 'Client account cannot access admin dashboard.');
        }

        return $next($request);
    }
}
