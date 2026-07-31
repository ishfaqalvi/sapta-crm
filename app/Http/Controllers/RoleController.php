<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of roles and permissions.
     */
    public function index(): Response
    {
        $roles = Role::with(['permissions', 'users'])->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'users_count' => $role->users->count(),
                'permissions' => $role->permissions->pluck('name'),
                'created_at' => $role->created_at ? $role->created_at->format('Y-m-d H:i') : null,
            ];
        });

        $permissions = Permission::all()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
            ];
        });

        // Group permissions by module prefix
        $groupedPermissions = [
            'Clients & Hub' => $permissions->filter(fn($p) => str_contains($p['name'], 'clients'))->values(),
            'Website Projects' => $permissions->filter(fn($p) => str_contains($p['name'], 'website-projects'))->values(),
            'Project Tasks' => $permissions->filter(fn($p) => str_contains($p['name'], 'project-tasks'))->values(),
            'Website Payments' => $permissions->filter(fn($p) => str_contains($p['name'], 'website-payments'))->values(),
            'Invoices & Billing' => $permissions->filter(fn($p) => str_contains($p['name'], 'invoices'))->values(),
            'SEO Retainers' => $permissions->filter(fn($p) => str_contains($p['name'], 'seo-retainers'))->values(),
            'SEO Payments' => $permissions->filter(fn($p) => str_contains($p['name'], 'seo-payments'))->values(),
            'Employees Directory' => $permissions->filter(fn($p) => str_contains($p['name'], 'employees'))->values(),
            'Monthly Payroll' => $permissions->filter(fn($p) => str_contains($p['name'], 'payroll'))->values(),
            'Departments' => $permissions->filter(fn($p) => str_contains($p['name'], 'departments'))->values(),
            'Job Designations' => $permissions->filter(fn($p) => str_contains($p['name'], 'designations'))->values(),
            'User Accounts' => $permissions->filter(fn($p) => str_contains($p['name'], 'users'))->values(),
            'Roles & Access' => $permissions->filter(fn($p) => str_contains($p['name'], 'roles'))->values(),
            'Currency Management' => $permissions->filter(fn($p) => str_contains($p['name'], 'currencies'))->values(),
            'System Settings' => $permissions->filter(fn($p) => str_contains($p['name'], 'settings'))->values(),
        ];

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
            'groupedPermissions' => $groupedPermissions,
        ]);
    }

    /**
     * Store a newly created role with selected permissions.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ], [
            'name.required' => 'The role title is required.',
            'name.unique' => 'A role with this name already exists in the system.',
        ]);

        $role = Role::create([
            'name' => trim($validated['name']),
            'guard_name' => 'web',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        // Reset cached permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', 'New user role created successfully!');
    }

    /**
     * Update the specified role and its permissions.
     */
    public function update(Request $request, Role $role): RedirectResponse
    {
        // Protect Super Admin from being modified
        if (in_array(strtolower($role->name), ['super admin', 'super-admin'])) {
            return redirect()->back()->with('error', 'The Super Admin role is protected and cannot be edited!');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role->id)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ], [
            'name.required' => 'The role title is required.',
            'name.unique' => 'A role with this name already exists in the system.',
        ]);

        $role->update([
            'name' => trim($validated['name']),
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        // Reset cached permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', 'Role and permissions updated successfully!');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): RedirectResponse
    {
        if (in_array(strtolower($role->name), ['super admin', 'super-admin'])) {
            return redirect()->back()->with('error', 'The Super Admin role is protected and cannot be deleted!');
        }

        $role->delete();

        // Reset cached permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', 'User role deleted successfully!');
    }
}
