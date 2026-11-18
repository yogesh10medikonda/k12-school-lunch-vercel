/**
 * Permissions barrel — re-exports role types, permission map, and hooks from auth/roles.
 * Import: import { useRole, ROLE_PERMISSIONS } from '@/lib/permissions'
 */
export type { UserRole, UserProfile, Permission } from './auth/roles';
export { ROLE_PERMISSIONS, MOCK_USERS, RoleProvider, useRole } from './auth/roles';
