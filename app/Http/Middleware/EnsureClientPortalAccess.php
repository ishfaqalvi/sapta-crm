<?php

namespace App\Http\Middleware;

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
     * Both Client users and Admin users are permitted.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        return $next($request);
    }
}
