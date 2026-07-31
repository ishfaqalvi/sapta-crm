<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of system users with pagination & search.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $users = User::with('roles')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('roles', function ($rq) use ($search) {
                            $rq->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(function ($user) {
                $userRoles = $user->getRoleNames()->toArray();
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'roles' => $userRoles,
                    'is_primary_admin' => $user->id === 1,
                    'created_at' => $user->created_at ? $user->created_at->format('Y-m-d H:i') : null,
                ];
            });

        $roles = Role::all()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
            ];
        });

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => [
                'search' => $search ?? '',
            ],
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', 'exists:roles,name'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
        ], [
            'name.required' => 'Full name is required.',
            'email.required' => 'Email address is required.',
            'email.unique' => 'A user with this email address already exists.',
            'password.required' => 'Password is required.',
            'roles.required' => 'Please select at least one role for this user.',
            'roles.min' => 'Please select at least one role for this user.',
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $destinationPath = public_path('uploads/avatars');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationPath, $filename);
            $avatarPath = '/uploads/avatars/' . $filename;
        }

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => trim(strtolower($validated['email'])),
            'password' => Hash::make($validated['password']),
            'avatar' => $avatarPath,
            'email_verified_at' => now(),
        ]);

        // Sync Multiple Spatie Roles
        $user->syncRoles($validated['roles']);

        return redirect()->back()->with('success', 'New user account created successfully!');
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        // Protect Primary Super Admin account (ID 1) from being modified
        if ($user->id === 1) {
            return redirect()->back()->with('error', 'The primary system Super Admin account (ID: 1) is protected and cannot be edited!');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', 'exists:roles,name'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
            'remove_avatar' => ['boolean'],
        ], [
            'name.required' => 'Full name is required.',
            'email.required' => 'Email address is required.',
            'email.unique' => 'A user with this email address already exists.',
            'roles.required' => 'Please select at least one role for this user.',
            'roles.min' => 'Please select at least one role for this user.',
        ]);

        $user->name = trim($validated['name']);
        $user->email = trim(strtolower($validated['email']));

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        // Avatar Management
        if ($request->boolean('remove_avatar')) {
            $user->deleteOldAvatarFile();
            $user->avatar = null;
        } elseif ($request->hasFile('avatar')) {
            $user->deleteOldAvatarFile();
            $file = $request->file('avatar');
            $destinationPath = public_path('uploads/avatars');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move($destinationPath, $filename);
            $user->avatar = '/uploads/avatars/' . $filename;
        }

        $user->save();

        // Sync Multiple Spatie Roles
        $user->syncRoles($validated['roles']);

        return redirect()->back()->with('success', 'User account updated successfully!');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        // Protect Primary Super Admin account (ID 1) from being deleted
        if ($user->id === 1) {
            return redirect()->back()->with('error', 'The primary system Super Admin account (ID: 1) is protected and cannot be deleted!');
        }

        // Prevent logged-in user from deleting themselves
        if ($user->id === $request->user()->id) {
            return redirect()->back()->with('error', 'You cannot delete your own account!');
        }

        // Eloquent booted listener automatically deletes physical avatar file on delete()
        $user->delete();

        return redirect()->back()->with('success', 'User account deleted successfully!');
    }
}
