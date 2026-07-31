import { type User } from '@/types';

/**
 * Check if the user has a specific permission or Super Admin role.
 */
export function hasPermission(user: User | null | undefined, permission: string): boolean {
    if (!user) return false;

    // Super Admin role bypasses all permission checks
    if (user.roles?.includes('Super Admin') || user.roles?.includes('admin')) {
        return true;
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
        return false;
    }

    return user.permissions.includes(permission);
}

/**
 * Check if the user has AT LEAST ONE of the specified permissions.
 */
export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
    if (!user) return false;

    if (user.roles?.includes('Super Admin') || user.roles?.includes('admin')) {
        return true;
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
        return false;
    }

    return permissions.some((permission) => user.permissions?.includes(permission));
}
