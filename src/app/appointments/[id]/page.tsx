import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Clock, Stethoscope } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAppointment } from '@/server/services/appointment-service';
import { formatDate, formatTime } from '@/lib/utils';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
} from '@/lib/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AppointmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getAppointment(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const appt = result.data;
  const statusLabel = APPOINTMENT_STATUS_LABELS[appt.status] || appt.status;
  const statusColor = APPOINTMENT_STATUS_COLORS[appt.status] || '';

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/appointments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Appointment
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDate(appt.date)} · {formatTime(appt.start_time)}
            </p>
          </div>
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <User className="h-4 w-4" />
                <CardTitle className="text-sm">Patient</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {appt.patient ? (
                <Link
                  href={`/patients/${appt.patient.id}`}
                  className="text-sm font-semibold text-sky-700 hover:underline dark:text-sky-400"
                >
                  {appt.patient.first_name} {appt.patient.last_name}
                </Link>
              ) : (
                <p className="text-sm text-slate-500">—</p>
              )}
              {appt.patient?.patient_number && (
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {appt.patient.patient_number}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Stethoscope className="h-4 w-4" />
                <CardTitle className="text-sm">Practitioner</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {appt.practitioner
                  ? `${appt.practitioner.first_name} ${appt.practitioner.last_name}`
                  : 'Unassigned'}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Calendar className="h-4 w-4" />
                <CardTitle className="text-sm">Schedule</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <span className="text-slate-500">Date:</span>{' '}
                {formatDate(appt.date)}
              </p>
              <p>
                <span className="text-slate-500">Time:</span>{' '}
                {formatTime(appt.start_time)}
                {appt.end_time ? ` – ${formatTime(appt.end_time)}` : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Clock className="h-4 w-4" />
                <CardTitle className="text-sm">Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <span className="text-slate-500">Reason:</span>{' '}
                {appt.reason || '—'}
              </p>
              <p>
                <span className="text-slate-500">Notes:</span>{' '}
                {appt.notes || '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/visits/new">
            <Button size="sm" className="gap-1.5">
              Start visit
            </Button>
          </Link>
          <Link href="/appointments">
            <Button size="sm" variant="outline">
              Back to schedule
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
