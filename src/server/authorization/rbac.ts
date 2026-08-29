// ============================================================
// HAPPY TOOTH v2 — RBAC Authorization Service
// ============================================================
// Server-side role and permission checks.
// This works WITH RLS, not as a replacement.
// ============================================================

import type { AuthenticatedUser, UserRole } from '@/types';
import { ADMIN_ROLES, CLINICAL_ROLES, BILLING_ROLES } from '@/lib/constants';

export class AuthorizationError extends Error {
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// ============================================================
// PERMISSION CHECKS
// ============================================================

/**
 * Check if user has a specific permission.
 */
export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  return user.permissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions.
 */
export function hasAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.some(p => user.permissions.includes(p));
}

/**
 * Check if user has ALL of the specified permissions.
 */
export function hasAllPermissions(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.every(p => user.permissions.includes(p));
}

// ============================================================
// ROLE CHECKS
// ============================================================

/**
 * Check if user has a specific role.
 */
export function hasRole(user: AuthenticatedUser, role: UserRole): boolean {
  return user.role === role;
}

/**
 * Check if user has any of the specified roles.
 */
export function hasAnyRole(user: AuthenticatedUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if user is an admin (super_admin or admin).
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return hasAnyRole(user, ADMIN_ROLES);
}

/**
 * Check if user is clinical staff (super_admin, admin, or dentist).
 */
export function isClinicalStaff(user: AuthenticatedUser): boolean {
  return hasAnyRole(user, CLINICAL_ROLES);
}

/**
 * Check if user has billing access.
 */
export function hasBillingAccess(user: AuthenticatedUser): boolean {
  return hasAnyRole(user, BILLING_ROLES);
}

// ============================================================
// ASSERTION FUNCTIONS (throw on failure)
// ============================================================

/**
 * Assert that user has a specific permission. Throws AuthorizationError.
 */
export function assertPermission(user: AuthenticatedUser, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new AuthorizationError(
      `Missing required permission: ${permission}`
    );
  }
}

/**
 * Assert that user has any of the specified permissions.
 */
export function assertAnyPermission(user: AuthenticatedUser, permissions: string[]): void {
  if (!hasAnyPermission(user, permissions)) {
    throw new AuthorizationError(
      `Missing required permissions: ${permissions.join(', ')}`
    );
  }
}

/**
 * Assert that user has a specific role.
 */
export function assertRole(user: AuthenticatedUser, role: UserRole): void {
  if (!hasRole(user, role)) {
    throw new AuthorizationError(`Required role: ${role}`);
  }
}

/**
 * Assert that user has any of the specified roles.
 */
export function assertAnyRole(user: AuthenticatedUser, roles: UserRole[]): void {
  if (!hasAnyRole(user, roles)) {
    throw new AuthorizationError(`Required roles: ${roles.join(', ')}`);
  }
}

/**
 * Assert that user is an admin.
 */
export function assertAdmin(user: AuthenticatedUser): void {
  if (!isAdmin(user)) {
    throw new AuthorizationError('Administrator access required');
  }
}

/**
 * Assert that user is clinical staff.
 */
export function assertClinicalStaff(user: AuthenticatedUser): void {
  if (!isClinicalStaff(user)) {
    throw new AuthorizationError('Clinical staff access required');
  }
}

/**
 * Assert that user has billing access.
 */
export function assertBillingAccess(user: AuthenticatedUser): void {
  if (!hasBillingAccess(user)) {
    throw new AuthorizationError('Billing access required');
  }
}
