import React from 'react';
import { UserCog } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { getUsers, getClinicProfile } from '@/server/services/settings-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';
import { AddStaffForm } from './add-staff-form';
import { RoleSelect, ToggleStatusButton } from './user-row-actions';

export default async function UsersSettingsPage() {
  const user = await getAuthenticatedUser();
  const clinic = await getClinicProfile();
  const result = await getUsers();
  const users = result.data || [];
  const canManage =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    Boolean(user?.permissions?.includes('settings.users'));

  return (
    <DashboardShell user={user} clinic={clinic}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Staff &amp; user management
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Only administrators add users here. Staff sign in on the login page with the email
                and password you set. There is no public self-registration.
              </p>
            </div>
          </div>
        </div>

        {canManage ? (
          <AddStaffForm canCreateSuperAdmin={user?.role === 'super_admin'} />
        ) : (
          <Card className="p-4 text-sm text-slate-500">
            You can view the staff directory. Ask an administrator to add or change accounts.
          </Card>
        )}

        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Staff name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 6 : 5}
                    className="h-40 text-center text-xs text-slate-400"
                  >
                    No staff accounts yet. Use <strong>Add staff user</strong> above after your own
                    admin account exists in Supabase Auth + profiles.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isSelf = user?.id === u.id;
                  return (
                    <TableRow
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    >
                      <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {u.first_name} {u.last_name}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-normal text-sky-600">(you)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        {canManage && !isSelf ? (
                          <RoleSelect
                            userId={u.id}
                            currentRole={u.role}
                            allowSuperAdmin={user?.role === 'super_admin'}
                          />
                        ) : (
                          <Badge variant="outline" className="text-xs capitalize font-medium">
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? 'success' : 'secondary'}>
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(u.created_at)}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          {!isSelf && (
                            <ToggleStatusButton userId={u.id} isActive={u.is_active} />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
