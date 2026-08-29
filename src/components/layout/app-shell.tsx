import { DashboardShell } from '@/components/layout/dashboard-shell';
import { getAuthenticatedUser } from '@/server/auth/session';
import { getClinicProfile } from '@/server/services/settings-service';

/**
 * Server-side shell that loads the current user and clinic branding.
 * Prefer this over DashboardShell directly so logo/name stay in sync with Settings.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const [user, clinic] = await Promise.all([
    getAuthenticatedUser(),
    getClinicProfile(),
  ]);

  return (
    <DashboardShell user={user} clinic={clinic}>
      {children}
    </DashboardShell>
  );
}
