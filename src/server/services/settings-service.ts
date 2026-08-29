// ============================================================
// HAPPY TOOTH v2 — Settings & Administration Service
// ============================================================

import { requireAuth } from '@/server/auth/session';
import { assertAdmin, assertPermission } from '@/server/authorization/rbac';
import { recordAuditLog } from '@/server/services/audit-service';
import {
  findClinicSettings,
  updateClinicSetting,
  findUsers,
  updateUserRole,
  updateUserActiveStatus,
  findAuditLogs,
} from '@/server/repositories/settings-repository';
import type {
  ActionResult,
  Profile,
  AuditLogWithActor,
  PaginatedResult,
  PaginationParams,
  UserRole,
} from '@/types';
import {
  mapSettingsToProfile,
  DEFAULT_CLINIC_PROFILE,
  type ClinicProfile,
} from '@/lib/clinic-profile';

async function loadSettingsMap(): Promise<Record<string, string>> {
  const settings = await findClinicSettings();
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value ?? '';
  }
  return map;
}

/**
 * Branding profile for UI (sidebar, header, receipts).
 * Any authenticated staff member can read; falls back to defaults.
 */
export async function getClinicProfile(): Promise<ClinicProfile> {
  try {
    await requireAuth();
    const map = await loadSettingsMap();
    return mapSettingsToProfile(map);
  } catch {
    return { ...DEFAULT_CLINIC_PROFILE };
  }
}

export async function getClinicSettings(): Promise<ActionResult<Record<string, string>>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'settings.view');

    const map = await loadSettingsMap();
    return { success: true, data: map };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch settings',
    };
  }
}

export async function updateClinicSettings(
  settings: Record<string, string>
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    assertAdmin(user);
    assertPermission(user, 'settings.edit');

    for (const [key, value] of Object.entries(settings)) {
      await updateClinicSetting(key, value, user.id);
    }

    await recordAuditLog({
      actorId: user.id,
      action: 'settings_changed',
      entityType: 'settings',
      metadata: { keys: Object.keys(settings) },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    };
  }
}

export async function getUsers(): Promise<ActionResult<Profile[]>> {
  try {
    const user = await requireAuth();
    assertAdmin(user);
    assertPermission(user, 'settings.users');

    const users = await findUsers();
    return { success: true, data: users };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    };
  }
}

export async function changeUserRole(
  targetUserId: string,
  newRole: UserRole
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    assertAdmin(user);
    assertPermission(user, 'settings.users');

    if (user.id === targetUserId && newRole !== 'super_admin') {
      return {
        success: false,
        error: 'You cannot demote your own administrator account.',
      };
    }

    await updateUserRole(targetUserId, newRole);

    await recordAuditLog({
      actorId: user.id,
      action: 'role_changed',
      entityType: 'user',
      entityId: targetUserId,
      metadata: { newRole },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role',
    };
  }
}

export async function toggleUserStatus(
  targetUserId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    assertAdmin(user);
    assertPermission(user, 'settings.users');

    if (user.id === targetUserId) {
      return { success: false, error: 'You cannot deactivate your own account.' };
    }

    await updateUserActiveStatus(targetUserId, isActive);

    await recordAuditLog({
      actorId: user.id,
      action: isActive ? 'user_updated' : 'user_deactivated',
      entityType: 'user',
      entityId: targetUserId,
      metadata: { isActive },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle status',
    };
  }
}


/**
 * Create a staff account (Supabase Auth + profiles row).
 * Admin-only. User can sign in immediately with the given password.
 */
export async function createStaffUser(input: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string | null;
}): Promise<ActionResult<Profile>> {
  try {
    const actor = await requireAuth();
    assertAdmin(actor);
    assertPermission(actor, 'settings.users');

    const email = input.email.trim().toLowerCase();
    const firstName = input.first_name.trim();
    const lastName = input.last_name.trim();
    const password = input.password;

    if (!email || !firstName || !lastName) {
      return { success: false, error: 'Email, first name, and last name are required.' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }

    const allowedRoles: UserRole[] = [
      'super_admin',
      'admin',
      'dentist',
      'receptionist',
      'accountant',
    ];
    if (!allowedRoles.includes(input.role)) {
      return { success: false, error: 'Invalid role.' };
    }

    if (input.role === 'super_admin' && actor.role !== 'super_admin') {
      return { success: false, error: 'Only a super admin can create another super admin.' };
    }

    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: input.role,
      },
    });

    if (authError || !authData.user) {
      const msg = authError?.message || 'Failed to create auth user';
      if (/already|registered|exists/i.test(msg)) {
        return { success: false, error: 'A user with this email already exists.' };
      }
      return { success: false, error: msg };
    }

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone: input.phone?.trim() || null,
          role: input.role,
          is_active: true,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileError || !profile) {
      try {
        await admin.auth.admin.deleteUser(userId);
      } catch {
        // ignore
      }
      return {
        success: false,
        error: profileError?.message || 'Failed to create staff profile.',
      };
    }

    await recordAuditLog({
      actorId: actor.id,
      action: 'user_created',
      entityType: 'user',
      entityId: userId,
      metadata: { email, role: input.role },
    });

    return { success: true, data: profile as Profile };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create staff user',
    };
  }
}

export async function getAuditLogs(
  params: PaginationParams & { entityType?: string; actorId?: string }
): Promise<ActionResult<PaginatedResult<AuditLogWithActor>>> {
  try {
    const user = await requireAuth();
    assertAdmin(user);
    assertPermission(user, 'settings.audit');

    const logs = await findAuditLogs(params);
    return { success: true, data: logs };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch audit logs',
    };
  }
}
