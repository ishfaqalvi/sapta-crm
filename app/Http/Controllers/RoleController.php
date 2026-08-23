<?php

namespace App\Http\Controllers;

use App\Constants\PermissionRegistry;
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
            $normalized = strtolower($role->name);
            $isSuperAdmin = in_array($normalized, ['super admin', 'super-admin']);
            $isProtectedFromDelete = in_array($normalized, ['super admin', 'super-admin', 'employee', 'client']);
            $isProtectedFromEdit = $isSuperAdmin;

            return [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'users_count' => $role->users->count(),
                'permissions' => $role->permissions->pluck('name'),
                'is_super_admin' => $isSuperAdmin,
                'is_protected_from_delete' => $isProtectedFromDelete,
                'is_protected_from_edit' => $isProtectedFromEdit,
                'created_at' => $role->created_at ? $role->created_at->format('Y-m-d H:i') : null,
            ];
        });

        $permData = $this->getPermissionGroupsData();

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'permissions' => $permData['permissions'],
            'groupedPermissions' => $permData['groupedPermissions'],
            'permissionGroups' => $permData['permissionGroups'],
        ]);
    }

    /**
     * Render the role creation page.
     */
    public function create(): Response
    {
        $permData = $this->getPermissionGroupsData();

        return Inertia::render('roles/create', [
            'permissions' => $permData['permissions'],
            'groupedPermissions' => $permData['groupedPermissions'],
            'permissionGroups' => $permData['permissionGroups'],
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

        return redirect()->route('roles.index')->with('success', 'New user role created successfully!');
    }

    /**
     * Render the role edit page.
     */
    public function edit(Role $role): Response|RedirectResponse
    {
        $normalized = strtolower($role->name);

        // Protect Super Admin from being modified
        if (in_array($normalized, ['super admin', 'super-admin'])) {
            return redirect()->route('roles.index')->with('error', 'The Super Admin role is protected and cannot be edited!');
        }

        $isCoreRole = in_array($normalized, ['employee', 'client']);

        $role->load('permissions');
        $roleItem = [
            'id' => $role->id,
            'name' => $role->name,
            'guard_name' => $role->guard_name,
            'is_core_role' => $isCoreRole,
            'permissions' => $role->permissions->pluck('name')->toArray(),
        ];

        $permData = $this->getPermissionGroupsData();

        return Inertia::render('roles/edit', [
            'role' => $roleItem,
            'permissions' => $permData['permissions'],
            'groupedPermissions' => $permData['groupedPermissions'],
            'permissionGroups' => $permData['permissionGroups'],
        ]);
    }

    /**
     * Update the specified role and its permissions.
     */
    public function update(Request $request, Role $role): RedirectResponse
    {
        $normalized = strtolower($role->name);

        // Protect Super Admin from being modified
        if (in_array($normalized, ['super admin', 'super-admin'])) {
            return redirect()->route('roles.index')->with('error', 'The Super Admin role is protected and cannot be edited!');
        }

        $isCoreRole = in_array($normalized, ['employee', 'client']);

        $rules = [
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];

        if (!$isCoreRole) {
            $rules['name'] = ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($role->id)];
        }

        $validated = $request->validate($rules, [
            'name.required' => 'The role title is required.',
            'name.unique' => 'A role with this name already exists in the system.',
        ]);

        if (!$isCoreRole && isset($validated['name'])) {
            $role->update([
                'name' => trim($validated['name']),
            ]);
        }

        $role->syncPermissions($validated['permissions'] ?? []);

        // Reset cached permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->route('roles.index')->with('success', "Role '{$role->name}' updated successfully!");
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): RedirectResponse
    {
        $normalized = strtolower($role->name);

        // Core system roles cannot be deleted
        if (in_array($normalized, ['super admin', 'super-admin', 'employee', 'client'])) {
            return redirect()->back()->with('error', "The '{$role->name}' system role is protected and cannot be deleted!");
        }

        if ($role->users()->count() > 0) {
            return redirect()->back()->with('error', "Cannot delete role '{$role->name}' because {$role->users()->count()} user(s) are assigned to it.");
        }

        $role->delete();

        // Reset cached permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', 'User role deleted successfully!');
    }

    /**
     * Helper to prepare categorized permission matrix data.
     */
    private function getPermissionGroupsData(): array
    {
        $adminPermsConfig = PermissionRegistry::getAdminPermissions();
        $portalPermsConfig = PermissionRegistry::getClientPortalPermissions();
        $permissionsByModule = PermissionRegistry::getPermissionsByModule();

        // Ensure all registered permissions exist in the permissions table
        foreach ($permissionsByModule as $module => $permList) {
            foreach ($permList as $permName) {
                Permission::firstOrCreate([
                    'name' => $permName,
                    'guard_name' => 'web',
                ]);
            }
        }

        $allPermissions = Permission::orderBy('name')->get(['id', 'name']);

        // Format grouped permissions for Admin Panel
        $adminModules = [];
        foreach ($adminPermsConfig as $module => $permNames) {
            $matched = $allPermissions->whereIn('name', $permNames)->values();
            if ($matched->isNotEmpty()) {
                $adminModules[$module] = $matched;
            }
        }

        // Format grouped permissions for Client Portal
        $portalModules = [];
        foreach ($portalPermsConfig as $module => $permNames) {
            $matched = $allPermissions->whereIn('name', $permNames)->values();
            if ($matched->isNotEmpty()) {
                $portalModules[$module] = $matched;
            }
        }

        $groupedPermissions = array_merge($adminModules, $portalModules);

        $permissionGroups = [
            'admin' => [
                'key' => 'admin',
                'title' => 'Admin Panel Permissions',
                'description' => 'Granular access controls for internal staff, administration & module operations.',
                'modules' => $adminModules,
                'total_count' => collect($adminModules)->flatten(1)->count(),
            ],
            'portal' => [
                'key' => 'portal',
                'title' => 'Client Portal Permissions',
                'description' => 'Scoped visibility and self-service features for external clients & stakeholders.',
                'modules' => $portalModules,
                'total_count' => collect($portalModules)->flatten(1)->count(),
            ],
        ];

        return [
            'permissions' => $allPermissions,
            'groupedPermissions' => $groupedPermissions,
            'permissionGroups' => $permissionGroups,
        ];
    }
}
