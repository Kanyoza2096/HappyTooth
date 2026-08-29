import React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { getClinicProfile } from '@/server/services/settings-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { ClinicSettingsForm } from './clinic-settings-form';
import { mapSettingsToProfile } from '@/lib/clinic-profile';
import { getClinicSettings } from '@/server/services/settings-service';

export default async function ClinicSettingsPage() {
  const user = await getAuthenticatedUser();
  const profile = await getClinicProfile();
  // Prefer full settings map when permitted; otherwise profile defaults
  const settingsResult = await getClinicSettings();
  const formProfile = settingsResult.success && settingsResult.data
    ? mapSettingsToProfile(settingsResult.data)
    : profile;

  return (
    <DashboardShell user={user} clinic={profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Clinic profile & configuration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Practice identity, logo, currency, hours, and document footers. Changes apply across the app.
          </p>
        </div>

        <ClinicSettingsForm profile={formProfile} />
      </div>
    </DashboardShell>
  );
}
