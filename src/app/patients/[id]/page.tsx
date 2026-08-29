import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Calendar,
  CreditCard,
  HeartPulse,
  PlusCircle,
  FileText,
  ShieldAlert,
  AlertTriangle,
  Receipt,
  Stethoscope,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPatient } from '@/server/services/patient-service';
import { getAppointments } from '@/server/services/appointment-service';
import { getVisits, getTreatmentPlans } from '@/server/services/clinical-service';
import { getInvoices, getReceipts } from '@/server/services/financial-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatDate, formatTime, formatCurrency, getFullName } from '@/lib/utils';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from '@/lib/constants';

interface PatientProfilePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function PatientProfilePage({ params, searchParams }: PatientProfilePageProps) {
  const user = await getAuthenticatedUser();
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;

  const patientResult = await getPatient(id);
  if (!patientResult.success || !patientResult.data) {
    notFound();
  }

  const patient = patientResult.data;

  // Fetch related records in parallel
  const [apptsResult, visitsResult, plansResult, invoicesResult, receiptsResult] =
    await Promise.all([
      getAppointments({ patientId: id, pageSize: 10 }),
      getVisits({ patientId: id, pageSize: 10 }),
      getTreatmentPlans(id),
      getInvoices({ patientId: id, pageSize: 10 }),
      getReceipts({ patientId: id, pageSize: 10 }),
    ]);

  const appointments = apptsResult.data?.data || [];
  const visits = visitsResult.data?.data || [];
  const treatmentPlans = plansResult.data || [];
  const invoices = invoicesResult.data?.data || [];
  const receipts = receiptsResult.data?.data || [];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/patients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  {patient.first_name} {patient.last_name}
                </h1>
                <Badge variant={patient.is_active ? 'success' : 'secondary'}>
                  {patient.patient_number}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Registered on {formatDate(patient.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/appointments/new?patientId=${patient.id}`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Book Visit</span>
              </Button>
            </Link>
            <Link href={`/invoices/new?patientId=${patient.id}`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Receipt className="h-4 w-4" />
                <span>Create Invoice</span>
              </Button>
            </Link>
            <Link href={`/patients/${patient.id}/edit`}>
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Highlight Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Primary Contact</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {patient.phone || 'No phone recorded'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Blood Group</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {patient.medical_profile?.blood_type || 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Outstanding Balance</p>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatCurrency(patient.outstanding_balance || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'appointments', label: `Appointments (${appointments.length})` },
            { key: 'clinical', label: `Visits & Clinical (${visits.length})` },
            { key: 'treatment', label: `Treatment Plans (${treatmentPlans.length})` },
            { key: 'billing', label: `Invoices & Receipts (${invoices.length})` },
          ].map((t) => (
            <Link
              key={t.key}
              href={`/patients/${patient.id}?tab=${t.key}`}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Demographics Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Demographic Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Date of Birth:</span>
                  <span className="font-medium">{formatDate(patient.date_of_birth)}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Gender:</span>
                  <span className="font-medium capitalize">{patient.gender || '—'}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-medium">{patient.email || '—'}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">City / Town:</span>
                  <span className="font-medium">{patient.city || '—'}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Residential Address:</span>
                  <span className="font-medium">{patient.address || '—'}</span>
                </div>
                <div className="grid grid-cols-2 py-1.5">
                  <span className="text-slate-400">National ID:</span>
                  <span className="font-medium">{patient.national_id || '—'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Medical Alerts Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  <CardTitle className="text-base">Medical Alerts & Allergies</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <p className="text-slate-400 font-medium mb-1.5">Known Allergies:</p>
                  {patient.medical_profile?.allergies && patient.medical_profile.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.medical_profile.allergies.map((allergy, i) => (
                        <span key={i} className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-md font-medium">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No known allergies recorded</p>
                  )}
                </div>

                <div>
                  <p className="text-slate-400 font-medium mb-1.5">Chronic Medical Conditions:</p>
                  {patient.medical_profile?.chronic_conditions && patient.medical_profile.chronic_conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.medical_profile.chronic_conditions.map((cond, i) => (
                        <span key={i} className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md font-medium">
                          {cond}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No chronic conditions recorded</p>
                  )}
                </div>

                <div>
                  <p className="text-slate-400 font-medium mb-1.5">Emergency Contacts:</p>
                  {patient.contacts && patient.contacts.length > 0 ? (
                    <div className="space-y-2">
                      {patient.contacts.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                            <p className="text-[11px] text-slate-500">{c.relationship}</p>
                          </div>
                          <span className="font-mono text-xs text-sky-600 dark:text-sky-400">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No emergency contact registered</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: Appointments */}
        {tab === 'appointments' && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Appointment History</CardTitle>
              <Link href={`/appointments/new?patientId=${patient.id}`}>
                <Button size="sm" className="gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  <span>Book Appointment</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No appointments scheduled for this patient yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatDate(appt.date)}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">{appt.reason || 'Routine Dental Checkup'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${APPOINTMENT_STATUS_COLORS[appt.status]}`}>
                        {APPOINTMENT_STATUS_LABELS[appt.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Clinical Visits */}
        {tab === 'clinical' && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Clinical Visits & Treatment Notes</CardTitle>
              <Link href={`/visits/new?patientId=${patient.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Stethoscope className="h-4 w-4" />
                  <span>Start Clinical Visit</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {visits.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No clinical visits recorded for this patient yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.map((v) => (
                    <div key={v.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          Visit on {formatDate(v.visit_date)}
                        </span>
                        <Badge variant={v.status === 'completed' ? 'success' : 'warning'}>
                          {v.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                      {v.chief_complaint && (
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Chief Complaint:</span> {v.chief_complaint}
                        </div>
                      )}
                      {v.diagnosis && (
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Diagnosis:</span> {v.diagnosis}
                        </div>
                      )}
                      {v.treatment_notes && (
                        <div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Treatment Rendered:</span> {v.treatment_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 4: Treatment Plans */}
        {tab === 'treatment' && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Treatment Plans</CardTitle>
              <Link href={`/treatment-plans/new?patientId=${patient.id}`}>
                <Button size="sm" className="gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Plan</span>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {treatmentPlans.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No treatment plans created for this patient yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {treatmentPlans.map((plan) => (
                    <div key={plan.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.title}</h4>
                          <p className="text-xs text-slate-400">{plan.description || 'Dental treatment procedure sequence'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-sky-600 dark:text-sky-400">
                            Est. {formatCurrency(plan.estimated_total)}
                          </p>
                          <Badge variant="outline" className="text-[10px] capitalize mt-1">
                            {plan.status}
                          </Badge>
                        </div>
                      </div>

                      {plan.items && plan.items.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1.5 text-xs">
                          {plan.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                              <span>
                                {item.description} {item.tooth_number ? `(Tooth #${item.tooth_number})` : ''}
                              </span>
                              <span className="font-medium font-mono">{formatCurrency(item.unit_price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab 5: Invoices & Billing */}
        {tab === 'billing' && (
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Invoices History</CardTitle>
                <Link href={`/invoices/new?patientId=${patient.id}`}>
                  <Button size="sm" className="gap-1.5">
                    <PlusCircle className="h-4 w-4" />
                    <span>New Invoice</span>
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No invoices generated for this patient yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                              {inv.invoice_number}
                            </span>
                            <span className="text-slate-400">{formatDate(inv.created_at)}</span>
                          </div>
                          <p className="text-slate-500 mt-0.5">
                            Total: {formatCurrency(inv.total)} • Paid: {formatCurrency(inv.amount_paid)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${INVOICE_STATUS_COLORS[inv.status]}`}>
                            {INVOICE_STATUS_LABELS[inv.status]}
                          </span>
                          <Link href={`/invoices/${inv.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Receipts History */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                {receipts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No payment receipts issued for this patient yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {receipts.map((rec) => (
                      <div key={rec.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {rec.receipt_number}
                          </span>
                          <p className="text-slate-400 mt-0.5">
                            {formatDate(rec.created_at)} • Method: <span className="capitalize">{rec.method.replace('_', ' ')}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {formatCurrency(rec.amount)}
                          </span>
                          <Link href={`/receipts/${rec.id}`}>
                            <Button size="sm" variant="ghost">Print</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
