import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getPatients } from '@/server/services/patient-service';
import { createTreatmentPlanFormAction } from '@/features/clinical/actions';

export default async function NewTreatmentPlanPage() {
  const patientsResult = await getPatients({ page: 1, pageSize: 200, isActive: true });
  const patients = patientsResult.data?.data || [];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/treatment-plans">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              New treatment plan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Outline procedures and estimated cost for a patient.
            </p>
          </div>
        </div>

        <form action={createTreatmentPlanFormAction} className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <FileText className="h-4 w-4" />
                <CardTitle className="text-base">Plan details</CardTitle>
              </div>
              <CardDescription className="text-xs">
                You can add individual procedures after the plan is created.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select
                  name="patient_id"
                  required
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.patient_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input name="title" required placeholder="e.g. Full mouth restoration" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes
                </label>
                <Textarea name="notes" rows={3} placeholder="Clinical rationale, sequencing…" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estimated total (optional)
                </label>
                <Input name="estimated_total" type="number" min={0} step="0.01" placeholder="0.00" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Link href="/treatment-plans">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Create plan
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
