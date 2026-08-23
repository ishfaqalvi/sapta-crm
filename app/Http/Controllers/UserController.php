<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Employee;
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
        $type = $request->query('type');
        $status = $request->query('status');
        $role = $request->query('role');

        $users = User::with(['roles', 'client', 'employee'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%")
                        ->orWhereHas('roles', function ($rq) use ($search) {
                            $rq->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('client', function ($cq) use ($search) {
                            $cq->where('name', 'like', "%{$search}%")
                                ->orWhere('company_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('employee', function ($eq) use ($search) {
                            $eq->where('name', 'like', "%{$search}%")
                                ->orWhere('employee_code', 'like', "%{$search}%");
                        });
                });
            })
            ->when($type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($status !== null && $status !== '', function ($query) use ($status) {
                if ($status === 'active') {
                    $query->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->when($role, function ($query, $role) {
                $query->whereHas('roles', function ($rq) use ($role) {
                    $rq->where('name', $role);
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(function ($user) {
                $userRoles = $user->getRoleNames()->toArray();
                $userType = $user->type ?? 'admin';
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'type' => $userType,
                    'is_active' => (bool) ($user->is_active ?? true),
                    'client_id' => $user->client_id,
                    'client_name' => $user->client ? ($user->client->company_name ?: $user->client->name) : null,
                    'employee_id' => $user->employee_id,
                    'employee_name' => $user->employee ? "{$user->employee->name} ({$user->employee->employee_code})" : null,
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

        $clients = Client::select('id', 'name', 'company_name', 'client_code')
            ->orderBy('name')
            ->get();

        $employees = Employee::select('id', 'name', 'employee_code', 'email')
            ->orderBy('name')
            ->get();

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'clients' => $clients,
            'employees' => $employees,
            'filters' => [
                'search' => $search ?? '',
                'type' => $type ?? '',
                'status' => $status ?? '',
                'role' => $role ?? '',
            ],
        ]);
    }

    /**
     * Render separate User creation page.
     */
    public function create(): Response
    {
        $roles = Role::all()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
            ];
        });

        // Get list of existing user client_ids & employee_ids to prevent duplicates
        $linkedClientIds = User::whereNotNull('client_id')->pluck('client_id')->toArray();
        $linkedEmployeeIds = User::whereNotNull('employee_id')->pluck('employee_id')->toArray();

        $clients = Client::select('id', 'name', 'company_name', 'client_code')
            ->orderBy('name')
            ->get()
            ->map(function ($c) use ($linkedClientIds) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'company_name' => $c->company_name,
                    'client_code' => $c->client_code,
                    'has_user' => in_array($c->id, $linkedClientIds),
                ];
            });

        $employees = Employee::select('id', 'name', 'employee_code', 'email', 'user_id')
            ->orderBy('name')
            ->get()
            ->map(function ($e) use ($linkedEmployeeIds) {
                return [
                    'id' => $e->id,
                    'name' => $e->name,
                    'employee_code' => $e->employee_code,
                    'email' => $e->email,
                    'has_user' => in_array($e->id, $linkedEmployeeIds) || !empty($e->user_id),
                ];
            });

        return Inertia::render('users/create', [
            'roles' => $roles,
            'clients' => $clients,
            'employees' => $employees,
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
            'type' => ['required', Rule::in(['admin', 'client', 'employee'])],
            'is_active' => ['boolean'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'employee_id' => ['nullable', 'exists:employees,id'],
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

        $employeeId = $validated['type'] === 'employee' ? ($validated['employee_id'] ?? null) : null;
        $clientId = $validated['type'] === 'client' ? ($validated['client_id'] ?? null) : null;

        // Prevent duplicate user creation for an employee who already has a user account
        if ($employeeId) {
            $alreadyHasUser = User::where('employee_id', $employeeId)->exists()
                || Employee::where('id', $employeeId)->whereNotNull('user_id')->exists();
            if ($alreadyHasUser) {
                return redirect()->back()->withErrors([
                    'employee_id' => 'This employee already has an active user login account. Please edit their existing user account instead of creating a duplicate.',
                ])->withInput();
            }
        }

        // Prevent duplicate user creation for a client who already has a user account
        if ($clientId) {
            $alreadyHasUser = User::where('client_id', $clientId)->exists();
            if ($alreadyHasUser) {
                return redirect()->back()->withErrors([
                    'client_id' => 'This client already has an active portal user account. Please edit their existing user account instead of creating a duplicate.',
                ])->withInput();
            }
        }

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
            'type' => $validated['type'],
            'is_active' => $request->boolean('is_active', true),
            'client_id' => $clientId,
            'employee_id' => $employeeId,
            'avatar' => $avatarPath,
            'email_verified_at' => now(),
        ]);

        // Bi-directional link with employee if created for employee
        if ($user->employee_id) {
            Employee::where('id', $user->employee_id)->update(['user_id' => $user->id]);
        }

        // Sync Multiple Spatie Roles
        $user->syncRoles($validated['roles']);

        return redirect()->route('users.index')->with('success', 'New user account created successfully!');
    }

    /**
     * Render separate User edit page.
     */
    public function edit(User $user): Response|RedirectResponse
    {
        if ($user->id === 1) {
            return redirect()->route('users.index')->with('error', 'The primary system Super Admin account (ID: 1) is protected and cannot be edited!');
        }

        $roles = Role::all()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
            ];
        });

        // Get list of existing user client_ids & employee_ids linked to OTHER users
        $linkedClientIds = User::where('id', '!=', $user->id)->whereNotNull('client_id')->pluck('client_id')->toArray();
        $linkedEmployeeIds = User::where('id', '!=', $user->id)->whereNotNull('employee_id')->pluck('employee_id')->toArray();

        $clients = Client::select('id', 'name', 'company_name', 'client_code')
            ->orderBy('name')
            ->get()
            ->map(function ($c) use ($linkedClientIds) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'company_name' => $c->company_name,
                    'client_code' => $c->client_code,
                    'has_user' => in_array($c->id, $linkedClientIds),
                ];
            });

        $employees = Employee::select('id', 'name', 'employee_code', 'email', 'user_id')
            ->orderBy('name')
            ->get()
            ->map(function ($e) use ($linkedEmployeeIds, $user) {
                return [
                    'id' => $e->id,
                    'name' => $e->name,
                    'employee_code' => $e->employee_code,
                    'email' => $e->email,
                    'has_user' => in_array($e->id, $linkedEmployeeIds) || ($e->user_id && $e->user_id !== $user->id),
                ];
            });

        $user->load(['roles', 'client', 'employee']);

        return Inertia::render('users/edit', [
            'userItem' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'type' => $user->type ?? 'admin',
                'is_active' => (bool) ($user->is_active ?? true),
                'client_id' => $user->client_id,
                'employee_id' => $user->employee_id,
                'roles' => $user->getRoleNames()->toArray(),
            ],
            'roles' => $roles,
            'clients' => $clients,
            'employees' => $employees,
        ]);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        // Protect Primary Super Admin account (ID 1) from being modified
        if ($user->id === 1) {
            return redirect()->route('users.index')->with('error', 'The primary system Super Admin account (ID: 1) is protected and cannot be edited!');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'type' => ['required', Rule::in(['admin', 'client', 'employee'])],
            'is_active' => ['boolean'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'employee_id' => ['nullable', 'exists:employees,id'],
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

        $newEmployeeId = $validated['type'] === 'employee' ? ($validated['employee_id'] ?? null) : null;
        $newClientId = $validated['type'] === 'client' ? ($validated['client_id'] ?? null) : null;

        // Prevent duplicate user assignment for employee only when changing to a DIFFERENT employee
        if ($newEmployeeId && $newEmployeeId != $user->employee_id) {
            $alreadyHasUser = User::where('employee_id', $newEmployeeId)
                ->where('id', '!=', $user->id)
                ->exists()
                || Employee::where('id', $newEmployeeId)->whereNotNull('user_id')->where('user_id', '!=', $user->id)->exists();

            if ($alreadyHasUser) {
                return redirect()->back()->withErrors([
                    'employee_id' => 'This employee is already linked to another system user account.',
                ])->withInput();
            }
        }

        // Prevent duplicate user assignment for client only when changing to a DIFFERENT client
        if ($newClientId && $newClientId != $user->client_id) {
            $alreadyHasUser = User::where('client_id', $newClientId)
                ->where('id', '!=', $user->id)
                ->exists();

            if ($alreadyHasUser) {
                return redirect()->back()->withErrors([
                    'client_id' => 'This client is already linked to another portal user account.',
                ])->withInput();
            }
        }

        // If employee link changed or removed, clean up old employee user_id
        if ($user->employee_id && $user->employee_id != $newEmployeeId) {
            Employee::where('id', $user->employee_id)->update(['user_id' => null]);
        }

        $user->name = trim($validated['name']);
        $user->email = trim(strtolower($validated['email']));
        $user->type = $validated['type'];
        $user->is_active = $request->boolean('is_active', true);
        $user->client_id = $newClientId;
        $user->employee_id = $newEmployeeId;

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

        if ($user->employee_id) {
            Employee::where('id', $user->employee_id)->update(['user_id' => $user->id]);
        }

        // Sync Multiple Spatie Roles
        $user->syncRoles($validated['roles']);

        return redirect()->route('users.index')->with('success', 'User account updated successfully!');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        // Protect Primary Super Admin account (ID 1) from being deleted
        if ($user->id === 1) {
            return redirect()->route('users.index')->with('error', 'The primary system Super Admin account (ID: 1) is protected and cannot be deleted!');
        }

        // Prevent logged-in user from deleting themselves
        if ($user->id === $request->user()->id) {
            return redirect()->route('users.index')->with('error', 'You cannot delete your own account!');
        }

        // Unlink employee if linked
        if ($user->employee_id) {
            Employee::where('user_id', $user->id)->update(['user_id' => null]);
        }

        // Eloquent booted listener automatically deletes physical avatar file on delete()
        $user->delete();

        return redirect()->route('users.index')->with('success', 'User account deleted successfully!');
    }
}
