import React from 'react';
import Link from 'next/link';
import { Building, UserCog, Shield, ChevronRight, Settings } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { getAuthenticatedUser } from '@/server/auth/session';
import { getClinicProfile } from '@/server/services/settings-service';

const LINKS = [
  {
    href: '/settings/clinic',
    title: 'Clinic profile',
    description: 'Name, logo, address, currency, working hours, and receipt footers.',
    icon: Building,
    permission: 'settings.view',
  },
  {
    href: '/settings/users',
    title: 'User management',
    description: 'Staff accounts, roles, and activation status.',
    icon: UserCog,
    permission: 'settings.users',
  },
  {
    href: '/settings/audit',
    title: 'Audit trail',
    description: 'Immutable log of clinical and financial changes.',
    icon: Shield,
    permission: 'settings.audit',
  },
];

export default async function SettingsIndexPage() {
  const user = await getAuthenticatedUser();
  const clinic = await getClinicProfile();
  const permissions = user?.permissions || [];

  const visible = LINKS.filter(
    (l) => !l.permission || permissions.includes(l.permission) || user?.role === 'super_admin'
  );

  return (
    <DashboardShell user={user} clinic={clinic}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configure {clinic.clinic_name}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="shadow-sm transition hover:border-sky-300 dark:hover:border-sky-700">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
