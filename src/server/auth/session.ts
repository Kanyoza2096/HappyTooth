// ============================================================
// HAPPY TOOTH v2 — Authentication Helpers
// ============================================================
// Server-side session and user retrieval.
// Used in Server Components and Server Actions.
// ============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AuthenticatedUser, Profile } from '@/types';

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Get the current Supabase auth session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the current authenticated user with profile and permissions.
 * Returns null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return null;
  }

  // Fetch permissions for this user's role
  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select(`
      permission_id,
      permissions (name)
    `)
    .eq('role', profile.role);

  const permissions = (rolePermissions || [])
    .map((rp) => {
      const record = rp as { permissions?: { name?: string } | { name?: string }[] | null };
      if (Array.isArray(record.permissions)) {
        return record.permissions[0]?.name;
      }
      return record.permissions?.name;
    })
    .filter(Boolean) as string[];

  return {
    ...profile as Profile,
    permissions,
  };
}

/**
 * Require authentication. Throws AuthenticationError if not authenticated.
 * Use at the beginning of Server Actions and Route Handlers.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new AuthenticationError();
  }

  if (!user.is_active) {
    throw new AuthenticationError('Your account has been deactivated');
  }

  return user;
}
