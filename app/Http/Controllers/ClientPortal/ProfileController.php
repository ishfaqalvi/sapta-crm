<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\{Client, User, Currency};
use App\Traits\AuthorizesClientPortalAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    use AuthorizesClientPortalAccess;

    /**
     * Retrieve the active client ID from session context or authenticated user.
     */
    protected function getClientId(): int
    {
        $user = Auth::user();

        if ($user && $user->type === 'admin') {
            $activeClientId = session('active_client_id');
            if ($activeClientId) {
                return (int) $activeClientId;
            }
        }

        if ($user && $user->client_id) {
            return (int) $user->client_id;
        }

        abort(403, 'Unauthorized Client Portal Access');
    }

    /**
     * Display Client Portal Profile & Account Settings Page.
     */
    public function index(): Response
    {
        $this->authorizePermission('view-client-portal-profile');

        $clientId = $this->getClientId();
        $client = Client::with('user:id,client_id,name,email,avatar,type,created_at')->findOrFail($clientId);

        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();
        $isAdmin = Auth::user()?->type === 'admin';

        return Inertia::render('client-portal/profile/index', [
            'client' => $client,
            'currencies' => $currencies,
            'isAdmin' => $isAdmin,
        ]);
    }

    /**
     * Update Client Organization Profile Details.
     */
    public function updateProfile(Request $request): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-profile');

        $clientId = $this->getClientId();
        $client = Client::findOrFail($clientId);

        $validated = $request->validate([
            'company_name' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'mobile' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'currency' => ['required', 'string', 'max:10'],
        ]);

        $client->update($validated);

        return redirect()->back()->with('success', 'Organization profile updated successfully.');
    }

    /**
     * Update Client Portal Login Password (for Client self-service).
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-profile');

        $user = Auth::user();

        if (!$user) {
            abort(403);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->back()->with('success', 'Portal account password updated successfully.');
    }

    /**
     * Update or Remove Client Portal User Avatar Image.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-profile');

        $user = Auth::user();
        $clientId = $this->getClientId();
        $client = Client::with('user')->findOrFail($clientId);

        $targetUser = ($user && $user->type === 'client') ? $user : ($client->user ?? $user);

        if (!$targetUser) {
            return redirect()->back()->with('error', 'No user account found to update profile picture.');
        }

        if ($request->boolean('remove_avatar')) {
            $targetUser->deleteOldAvatarFile();
            $targetUser->avatar = null;
            $targetUser->save();
            return redirect()->back()->with('success', 'Profile picture removed successfully.');
        }

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
        ], [
            'avatar.required' => 'Please select an image file to upload.',
            'avatar.image' => 'The file must be a valid image.',
            'avatar.mimes' => 'Allowed image formats are JPG, JPEG, PNG, GIF, and WEBP.',
            'avatar.max' => 'Maximum allowed image size is 4MB.',
        ]);

        $file = $request->file('avatar');
        $destinationPath = public_path('uploads/avatars');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move($destinationPath, $filename);

        $targetUser->avatar = '/uploads/avatars/' . $filename;
        $targetUser->save();

        return redirect()->back()->with('success', 'Profile picture updated successfully.');
    }

    /**
     * Create Client Portal User Account (Admin action in Client Portal).
     */
    public function createAccount(Request $request): RedirectResponse
    {
        $this->authorizePermission('manage-client-portal-account');

        $clientId = $this->getClientId();
        $client = Client::findOrFail($clientId);

        if ($client->user) {
            return redirect()->back()->with('error', 'Portal account already exists for this client.');
        }

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name' => $client->name,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'type' => 'client',
            'client_id' => $client->id,
        ]);

        $clientRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Client', 'guard_name' => 'web']);
        $user->assignRole($clientRole);

        return redirect()->back()->with('success', "Portal login account created for {$client->name}.");
    }

    /**
     * Reset Client Portal Password (Admin action in Client Portal).
     */
    public function resetPassword(Request $request): RedirectResponse
    {
        $this->authorizePermission('manage-client-portal-account');

        $clientId = $this->getClientId();
        $client = Client::with('user')->findOrFail($clientId);

        if (!$client->user) {
            return redirect()->back()->with('error', 'No portal user account exists for this client.');
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:6'],
        ]);

        $client->user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->back()->with('success', "Portal password reset successfully for {$client->name}.");
    }

    /**
     * Revoke / Remove Client Portal Account (Admin action in Client Portal).
     */
    public function revokeAccount(): RedirectResponse
    {
        $this->authorizePermission('manage-client-portal-account');

        $clientId = $this->getClientId();
        $client = Client::with('user')->findOrFail($clientId);

        if ($client->user) {
            $client->user->delete();
        }

        return redirect()->back()->with('success', "Portal login account revoked for {$client->name}.");
    }
}
