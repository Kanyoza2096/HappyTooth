'use client';

import React, { useActionState } from 'react';
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createStaffAction, type StaffFormState } from '@/features/settings/user-actions';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';

const initialState: StaffFormState = { success: false };

const CREATABLE_ROLES: UserRole[] = [
  'admin',
  'dentist',
  'receptionist',
  'accountant',
  'super_admin',
];

export function AddStaffForm({ canCreateSuperAdmin }: { canCreateSuperAdmin: boolean }) {
  const [state, formAction, isPending] = useActionState(createStaffAction, initialState);
  const roles = CREATABLE_ROLES.filter(
    (r) => r !== 'super_admin' || canCreateSuperAdmin
  );

  return (
    <Card className="shadow-sm border-sky-100 dark:border-sky-900/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
          <UserPlus className="h-4 w-4" />
          <CardTitle className="text-base">Add staff user</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Creates a login account. The staff member signs in on the login page with this email and
          temporary password. Share credentials securely (not over public chat).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.success && state.message && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}
          {state.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                First name <span className="text-red-500">*</span>
              </label>
              <Input name="first_name" required disabled={isPending} placeholder="Jane" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Last name <span className="text-red-500">*</span>
              </label>
              <Input name="last_name" required disabled={isPending} placeholder="Banda" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Work email <span className="text-red-500">*</span>
              </label>
              <Input
                name="email"
                type="email"
                required
                disabled={isPending}
                placeholder="staff@clinic.mw"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Phone
              </label>
              <Input name="phone" disabled={isPending} placeholder="+265 …" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                required
                defaultValue="receptionist"
                disabled={isPending}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Temporary password <span className="text-red-500">*</span>
              </label>
              <Input
                name="password"
                type="password"
                required
                minLength={8}
                disabled={isPending}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create staff account
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
