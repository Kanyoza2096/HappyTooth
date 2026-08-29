'use server';

import { revalidatePath } from 'next/cache';
import {
  createStaffUser,
  changeUserRole,
  toggleUserStatus,
} from '@/server/services/settings-service';
import type { ActionResult, UserRole } from '@/types';

export type StaffFormState = ActionResult & { message?: string };

const ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'dentist',
  'receptionist',
  'accountant',
];

export async function createStaffAction(
  _prev: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const first_name = String(formData.get('first_name') || '');
  const last_name = String(formData.get('last_name') || '');
  const phone = String(formData.get('phone') || '') || null;
  const roleRaw = String(formData.get('role') || 'receptionist') as UserRole;

  if (!ROLES.includes(roleRaw)) {
    return { success: false, error: 'Invalid role selected.' };
  }

  const result = await createStaffUser({
    email,
    password,
    first_name,
    last_name,
    phone,
    role: roleRaw,
  });

  if (!result.success) {
    return { success: false, error: result.error || 'Could not create staff user.' };
  }

  revalidatePath('/settings/users');
  return {
    success: true,
    message: `Account created for ${first_name} ${last_name}. They can sign in with their email and password.`,
  };
}

export async function changeRoleAction(formData: FormData): Promise<void> {
  const userId = String(formData.get('user_id') || '');
  const role = String(formData.get('role') || '') as UserRole;

  if (!userId || !ROLES.includes(role)) {
    throw new Error('Invalid role change request.');
  }

  const result = await changeUserRole(userId, role);
  if (!result.success) {
    throw new Error(result.error || 'Failed to change role.');
  }

  revalidatePath('/settings/users');
}

export async function toggleStatusAction(formData: FormData): Promise<void> {
  const userId = String(formData.get('user_id') || '');
  const isActive = String(formData.get('is_active') || '') === 'true';

  if (!userId) {
    throw new Error('User id required.');
  }

  const result = await toggleUserStatus(userId, isActive);
  if (!result.success) {
    throw new Error(result.error || 'Failed to update status.');
  }

  revalidatePath('/settings/users');
}
