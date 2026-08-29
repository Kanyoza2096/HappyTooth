import React from 'react';
import Link from 'next/link';
import { FileText, PlusCircle, ArrowRight } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { getTreatmentPlans } from '@/server/services/clinical-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TREATMENT_PLAN_STATUS_LABELS } from '@/lib/constants';

export default async function TreatmentPlansPage() {
  const user = await getAuthenticatedUser();
  const result = await getTreatmentPlans();
  const plans = result.data || [];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Treatment Plans
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Multi-step dental treatment plans, planned procedures, and financial estimates.
            </p>
          </div>
          <Link href="/treatment-plans/new">
            <Button className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              New treatment plan
            </Button>
          </Link>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Plan Title</TableHead>
                <TableHead>Attending Dentist</TableHead>
                <TableHead>Estimated Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
                      <FileText className="h-8 w-8" />
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        No treatment plans created yet
                      </p>
                      <p>Formulate a treatment plan from a patient profile.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(p.created_at)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/patients/${p.patient_id}?tab=treatment`}
                        className="font-medium text-sky-600 dark:text-sky-400 hover:underline text-xs"
                      >
                        {p.patient?.first_name} {p.patient?.last_name}
                      </Link>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {p.patient?.patient_number}
                      </p>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {p.title}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      Dr. {p.practitioner?.first_name} {p.practitioner?.last_name}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                      {formatCurrency(p.estimated_total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {TREATMENT_PLAN_STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/patients/${p.patient_id}?tab=treatment`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-sky-600 dark:text-sky-400">
                          <span>View Plan</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
