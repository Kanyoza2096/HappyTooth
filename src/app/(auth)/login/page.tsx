import React, { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoginForm } from './login-form';
import { DEFAULT_CLINIC_PROFILE, clinicInitials } from '@/lib/clinic-profile';
import { ShieldCheck, Users } from 'lucide-react';

export default function LoginPage() {
  const clinic = DEFAULT_CLINIC_PROFILE;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/25 text-lg font-bold">
            {clinic.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinic.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              clinicInitials(clinic.clinic_name)
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {clinic.clinic_name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {clinic.clinic_tagline || 'Dental Practice Management System'}
          </p>
        </div>

        <Card className="shadow-xl border-slate-200/80 dark:border-slate-800 backdrop-blur-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Staff sign in</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Sign in with the email and password provided by your administrator. New accounts are
              created only under <span className="font-medium">Settings → Users</span> — there is no
              public registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              }
            >
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
            <span>Accounts are issued by clinic admins only.</span>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
            <span>Sessions are encrypted; deactivated users cannot sign in.</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          For authorized medical and administrative personnel only.
        </p>
      </div>
    </div>
  );
}
