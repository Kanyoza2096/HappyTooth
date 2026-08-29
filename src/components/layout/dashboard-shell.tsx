'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { logoutAction } from '@/features/auth/actions';
import type { AuthenticatedUser } from '@/types';
import type { ClinicProfile } from '@/lib/clinic-profile';

interface DashboardShellProps {
  user?: AuthenticatedUser | null;
  clinic?: ClinicProfile | null;
  children: React.ReactNode;
}

export function DashboardShell({ user, clinic, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:block">
        <Sidebar
          userPermissions={user?.permissions}
          userRole={user?.role}
          clinic={clinic}
        />
      </div>

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        userPermissions={user?.permissions}
        userRole={user?.role}
        clinic={clinic}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          clinic={clinic}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onLogout={async () => {
            await logoutAction();
          }}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
