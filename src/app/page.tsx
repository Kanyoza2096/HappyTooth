import React from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  ClipboardCheck,
  CreditCard,
  AlertCircle,
  TrendingDown,
  PlusCircle,
  ArrowUpRight,
  Database,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { getDashboardData } from '@/server/services/dashboard-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  const result = await getDashboardData();

  const isConnected = result.success && result.data;
  const stats = result.data?.stats;
  const revenueTrends = result.data?.revenueTrends || [];
  const appointmentDistribution = result.data?.appointmentDistribution || [];

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Practice Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back{user ? `, ${user.first_name}` : ''}. Here is your clinical and financial overview.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/patients/new">
              <Button size="sm" className="gap-2 shadow-sm">
                <PlusCircle className="h-4 w-4" />
                <span>New Patient</span>
              </Button>
            </Link>
            <Link href="/appointments/new">
              <Button size="sm" variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span>Book Appointment</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Database Connection Notice if Supabase not configured */}
        {!isConnected && (
          <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-start gap-3">
              <Database className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold text-sm">Supabase Project Connection Ready</p>
                <p className="mt-1">
                  Connect your live Supabase database credentials in <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded font-mono">.env.local</code> to populate live database metrics. All tables, RLS policies, and triggers are ready in the <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded font-mono">supabase/migrations</code> folder.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Total Patients */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Patients
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isConnected && stats ? stats.totalPatients : '0'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                Active records
              </p>
            </CardContent>
          </Card>

          {/* Today's Appointments */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Today&apos;s Schedule
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isConnected && stats ? stats.todaysAppointments : '0'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Appointments today
              </p>
            </CardContent>
          </Card>

          {/* Completed Visits This Month */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Visits (Month)
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {isConnected && stats ? stats.completedVisitsThisMonth : '0'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Completed visits
              </p>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Revenue (Month)
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {isConnected && stats ? formatCurrency(stats.revenueThisMonth) : 'MK 0.00'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Payments collected
              </p>
            </CardContent>
          </Card>

          {/* Monthly Expenses */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Expenses (Month)
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {isConnected && stats ? formatCurrency(stats.expensesThisMonth) : 'MK 0.00'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Operating costs
              </p>
            </CardContent>
          </Card>

          {/* Outstanding Balances */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
              <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Receivables
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {isConnected && stats ? formatCurrency(stats.outstandingBalances) : 'MK 0.00'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Unpaid invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Charts */}
        <DashboardCharts
          revenueTrends={revenueTrends}
          appointmentDistribution={appointmentDistribution}
        />

        {/* Quick Access Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm hover:border-sky-300 dark:hover:border-sky-800 transition-colors">
            <CardHeader className="p-5">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Patient Management</span>
                <Users className="h-4 w-4 text-sky-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-slate-500 dark:text-slate-400">
              <p>Register new patients, maintain medical histories, record emergency contacts, and inspect billing balances.</p>
              <Link href="/patients" className="mt-4 inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium hover:underline">
                <span>View Patient Directory</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:border-sky-300 dark:hover:border-sky-800 transition-colors">
            <CardHeader className="p-5">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Clinical & Treatment</span>
                <ClipboardCheck className="h-4 w-4 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-slate-500 dark:text-slate-400">
              <p>Conduct clinical visits, document examination notes, formulate treatment plans, and track procedures.</p>
              <Link href="/visits" className="mt-4 inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium hover:underline">
                <span>Open Clinical Workflow</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:border-sky-300 dark:hover:border-sky-800 transition-colors">
            <CardHeader className="p-5">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Billing & Receipts</span>
                <CreditCard className="h-4 w-4 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-slate-500 dark:text-slate-400">
              <p>Generate transactionally consistent invoices, collect payments, and produce collision-safe receipts.</p>
              <Link href="/invoices" className="mt-4 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                <span>Manage Financials</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
