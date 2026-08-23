<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page on home route /
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = Auth::user();
        if ($user) {
            if ($user->type === 'client') {
                return redirect()->route('client-portal.overview.index');
            }
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->ensureIsNotRateLimited();

        $user = User::with(['client', 'employee'])->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($request->throttleKey());
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // 1. Check if user account itself is marked active
        if (isset($user->is_active) && !$user->is_active) {
            RateLimiter::hit($request->throttleKey());
            throw ValidationException::withMessages([
                'email' => 'Your user account is inactive. Please contact the system administrator.',
            ]);
        }

        // 2. Check Client account status if user type is client
        if ($user->type === 'client' && $user->client && $user->client->status !== 'active') {
            RateLimiter::hit($request->throttleKey());
            throw ValidationException::withMessages([
                'email' => 'Your client account is currently inactive. Please contact support.',
            ]);
        }

        // 3. Check Employee account status if user type is employee
        if ($user->type === 'employee' && $user->employee && $user->employee->status !== 'active') {
            RateLimiter::hit($request->throttleKey());
            throw ValidationException::withMessages([
                'email' => 'Your employee account is currently inactive or resigned. Please contact HR.',
            ]);
        }

        RateLimiter::clear($request->throttleKey());

        $remember = $request->boolean('remember');

        Auth::login($user, $remember);
        $request->session()->regenerate();

        // Redirect based on user->type ('client' vs 'admin'/'employee')
        if ($user->type === 'client') {
            return redirect()->route('client-portal.overview.index');
        }

        return redirect()->route('dashboard');
    }
}
