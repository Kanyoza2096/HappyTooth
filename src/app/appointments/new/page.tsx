import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPatients } from '@/server/services/patient-service';
import { getUsers } from '@/server/services/settings-service';
import { bookAppointmentAction } from '@/features/appointments/actions';
import { getAuthenticatedUser } from '@/server/auth/session';
import { getTodayISO } from '@/lib/utils';

interface NewAppointmentPageProps {
  searchParams: Promise<{ patientId?: string }>;
}

export default async function NewAppointmentPage({ searchParams }: NewAppointmentPageProps) {
  const user = await getAuthenticatedUser();
  const { patientId = '' } = await searchParams;

  const [patientsResult, usersResult] = await Promise.all([
    getPatients({ pageSize: 100 }),
    getUsers(),
  ]);

  const patients = patientsResult.data?.data || [];
  const staff = (usersResult.data || []).filter(u => u.role === 'dentist' || u.role === 'admin' || u.role === 'super_admin');
  const today = getTodayISO();

  return (
    <DashboardShell user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/appointments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Book Appointment
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Schedule a dental consultation, treatment, or follow-up with conflict checks.
            </p>
          </div>
        </div>

        <form action={bookAppointmentAction} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Calendar className="h-4 w-4" />
                <CardTitle className="text-base">Appointment Details</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Select patient, attending dentist, and appointment time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  name="patient_id"
                  required
                  defaultValue={patientId}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select a patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.patient_number}) - {p.phone || 'No phone'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Practitioner Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attending Practitioner <span className="text-red-500">*</span>
                </label>
                <select
                  name="practitioner_id"
                  required
                  defaultValue={user?.id}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select practitioner...</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      Dr. {s.first_name} {s.last_name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Appointment Date <span className="text-red-500">*</span>
                  </label>
                  <Input type="date" name="date" required defaultValue={today} min={today} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <Input type="time" name="start_time" required defaultValue="09:00" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <Input type="time" name="end_time" required defaultValue="09:30" />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Visit
                </label>
                <Input name="reason" placeholder="e.g. Toothache on upper molar, Routine checkup" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical / Reception Notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  placeholder="Additional patient notes or requests..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link href="/appointments">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="gap-2 shadow-sm">
              <Save className="h-4 w-4" />
              <span>Confirm & Book Appointment</span>
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
