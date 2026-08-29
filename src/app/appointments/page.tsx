import React from 'react';
import Link from 'next/link';
import { PlusCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { getAppointments } from '@/server/services/appointment-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatDate, formatTime, getTodayISO } from '@/lib/utils';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
} from '@/lib/constants';
import type { AppointmentStatus } from '@/types';

interface AppointmentsPageProps {
  searchParams: Promise<{
    date?: string;
    status?: string;
  }>;
}

export default async function AppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const user = await getAuthenticatedUser();
  const { date = '', status = '' } = await searchParams;
  const today = getTodayISO();
  const selectedDate = date || today;

  const result = await getAppointments({
    date: selectedDate,
    status: status ? (status as AppointmentStatus) : undefined,
    pageSize: 50,
  });

  const appointments = result.data?.data || [];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Appointments Schedule
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Daily chairside scheduling, patient check-ins, and conflict-free booking.
            </p>
          </div>

          <Link href="/appointments/new">
            <Button className="gap-2 shadow-sm">
              <PlusCircle className="h-4 w-4" />
              <span>Book Appointment</span>
            </Button>
          </Link>
        </div>

        {/* Date Selector & Status Filter */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <form method="GET" className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <select
                name="status"
                defaultValue={status}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="waiting">Waiting Room</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>

              <Button type="submit" variant="secondary" size="sm">
                Filter Schedule
              </Button>

              {selectedDate !== today && (
                <Link href="/appointments">
                  <Button variant="ghost" size="sm">
                    Today
                  </Button>
                </Link>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Schedule List */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-4">
            <CardTitle className="text-sm font-semibold">
              Schedule for {formatDate(selectedDate)} ({appointments.length} appointments)
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Practitioner</TableHead>
                <TableHead>Reason / Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Clock className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        No appointments for {formatDate(selectedDate)}
                      </p>
                      <Link href="/appointments/new" className="pt-1">
                        <Button size="sm" variant="outline">
                          Book Appointment
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appt) => (
                  <TableRow key={appt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/patients/${appt.patient_id}`}
                        className="font-medium text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {appt.patient?.first_name} {appt.patient?.last_name}
                      </Link>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {appt.patient?.patient_number}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                      Dr. {appt.practitioner?.first_name} {appt.practitioner?.last_name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {appt.reason || 'Routine Dental Care'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          APPOINTMENT_STATUS_COLORS[appt.status]
                        }`}
                      >
                        {APPOINTMENT_STATUS_LABELS[appt.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/appointments/${appt.id}`}>
                          <Button size="sm" variant="ghost" className="text-xs">
                            View
                          </Button>
                        </Link>
                        {appt.status === 'scheduled' || appt.status === 'confirmed' ? (
                          <Link href={`/visits/new?appointmentId=${appt.id}&patientId=${appt.patient_id}`}>
                            <Button size="sm" variant="outline" className="text-xs text-purple-600 dark:text-purple-400">
                              Check In
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/patients/${appt.patient_id}`}>
                            <Button size="sm" variant="ghost" className="text-xs">
                              Patient
                            </Button>
                          </Link>
                        )}
                      </div>
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
