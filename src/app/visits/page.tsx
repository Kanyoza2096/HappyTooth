import React from 'react';
import Link from 'next/link';
import { Stethoscope, PlusCircle, User, Calendar, ArrowRight } from 'lucide-react';
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
import { getVisits } from '@/server/services/clinical-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatDate } from '@/lib/utils';

export default async function VisitsPage() {
  const user = await getAuthenticatedUser();
  const result = await getVisits({ pageSize: 50 });
  const visits = result.data?.data || [];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Clinical Visits
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Chairside patient encounters, diagnostic examinations, and treatment notes.
            </p>
          </div>

          <Link href="/visits/new">
            <Button className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>Start Clinical Visit</span>
            </Button>
          </Link>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Visit Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Attending Dentist</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        No clinical visits recorded yet
                      </p>
                      <p className="text-xs text-slate-500">
                        Start a clinical encounter to document dental treatments.
                      </p>
                      <Link href="/visits/new" className="pt-2">
                        <Button size="sm" variant="outline">
                          Start First Visit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visits.map((v) => (
                  <TableRow key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatDate(v.visit_date)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/patients/${v.patient_id}?tab=clinical`}
                        className="font-medium text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {v.patient?.first_name} {v.patient?.last_name}
                      </Link>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {v.patient?.patient_number}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      Dr. {v.practitioner?.first_name} {v.practitioner?.last_name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {v.chief_complaint || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.status === 'completed' ? 'success' : 'warning'}>
                        {v.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/patients/${v.patient_id}?tab=clinical`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-sky-600 dark:text-sky-400">
                          <span>View Details</span>
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
