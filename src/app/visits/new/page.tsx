import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Stethoscope, User, FileText, ClipboardList } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPatients } from '@/server/services/patient-service';
import { getUsers } from '@/server/services/settings-service';
import { createVisitAction } from '@/features/clinical/actions';
import { getAuthenticatedUser } from '@/server/auth/session';
import { getTodayISO } from '@/lib/utils';

interface NewVisitPageProps {
  searchParams: Promise<{ patientId?: string; appointmentId?: string }>;
}

export default async function NewVisitPage({ searchParams }: NewVisitPageProps) {
  const user = await getAuthenticatedUser();
  const { patientId = '', appointmentId = '' } = await searchParams;

  const [patientsResult, usersResult] = await Promise.all([
    getPatients({ pageSize: 100 }),
    getUsers(),
  ]);

  const patients = patientsResult.data?.data || [];
  const staff = (usersResult.data || []).filter(u => u.role === 'dentist' || u.role === 'admin' || u.role === 'super_admin');
  const today = getTodayISO();

  return (
    <DashboardShell user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/visits">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Start Clinical Encounter
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Record chairside examination, clinical diagnosis, and treatments rendered.
            </p>
          </div>
        </div>

        <form action={createVisitAction} className="space-y-6">
          <input type="hidden" name="appointment_id" value={appointmentId} />

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Stethoscope className="h-4 w-4" />
                <CardTitle className="text-base">Visit Header</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.patient_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attending Dentist <span className="text-red-500">*</span>
                </label>
                <select
                  name="practitioner_id"
                  required
                  defaultValue={user?.id}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select doctor...</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      Dr. {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Encounter Date <span className="text-red-500">*</span>
                </label>
                <Input type="date" name="visit_date" required defaultValue={today} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <ClipboardList className="h-4 w-4" />
                <CardTitle className="text-base">Clinical Notes & Findings</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Document subjective symptoms, objective clinical findings, assessment, and treatment plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chief Complaint (Patient&apos;s Words)
                </label>
                <Input name="chief_complaint" placeholder="e.g. Sharp pain when drinking cold water in lower right jaw for 3 days" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Oral Examination Findings
                </label>
                <textarea
                  name="examination_notes"
                  rows={3}
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  placeholder="e.g. Deep occlusal caries on tooth #46, sensitive to cold test, percussion negative..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Diagnosis / Assessment
                </label>
                <Input name="diagnosis" placeholder="e.g. Reversible pulpitis secondary to dental caries #46" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Treatment Performed / Notes
                </label>
                <textarea
                  name="treatment_notes"
                  rows={3}
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  placeholder="e.g. Caries excavation under local anaesthesia (Lidocaine 2%), composite restoration placed, occlusion verified."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link href="/visits">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="gap-2 shadow-sm">
              <Save className="h-4 w-4" />
              <span>Save Clinical Visit Record</span>
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
