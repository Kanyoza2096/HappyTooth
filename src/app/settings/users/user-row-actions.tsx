'use client';

import React, { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { changeRoleAction, toggleStatusAction } from '@/features/settings/user-actions';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';

const ROLE_OPTIONS: UserRole[] = [
  'super_admin',
  'admin',
  'dentist',
  'receptionist',
  'accountant',
];

export function RoleSelect({
  userId,
  currentRole,
  allowSuperAdmin,
}: {
  userId: string;
  currentRole: UserRole;
  allowSuperAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      name="role"
      defaultValue={currentRole}
      disabled={pending}
      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950 disabled:opacity-60"
      onChange={(e) => {
        const role = e.target.value;
        const fd = new FormData();
        fd.set('user_id', userId);
        fd.set('role', role);
        startTransition(async () => {
          try {
            await changeRoleAction(fd);
          } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to change role');
            e.target.value = currentRole;
          }
        });
      }}
    >
      {ROLE_OPTIONS.filter(
        (r) => r !== 'super_admin' || allowSuperAdmin || currentRole === 'super_admin'
      ).map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}

export function ToggleStatusButton({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? 'outline' : 'default'}
      className="text-xs"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set('user_id', userId);
        fd.set('is_active', isActive ? 'false' : 'true');
        startTransition(async () => {
          try {
            await toggleStatusAction(fd);
          } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update status');
          }
        });
      }}
    >
      {pending ? '…' : isActive ? 'Deactivate' : 'Activate'}
    </Button>
  );
}
