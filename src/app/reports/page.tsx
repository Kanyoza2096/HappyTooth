import React from 'react';
import { BarChart3, TrendingUp, Users, Calendar, Download } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { getDashboardData } from '@/server/services/dashboard-service';
import { getAuthenticatedUser } from '@/server/auth/session';
import { formatCurrency } from '@/lib/utils';

export default async function ReportsPage() {
  const user = await getAuthenticatedUser();
  const result = await getDashboardData();
  const data = result.data;

  return (
    <DashboardShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Practice Analytics & Reports
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Database-driven reporting on clinical throughput, financial revenue, and receivables.
            </p>
          </div>
        </div>

        {/* Aggregate Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 p-4">
              <CardTitle className="text-xs font-medium text-slate-400">Total Collections (Month)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(data?.stats.revenueThisMonth || 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">All collected payments</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 p-4">
              <CardTitle className="text-xs font-medium text-slate-400">Operating Expenses (Month)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(data?.stats.expensesThisMonth || 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Direct costs and supplies</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 p-4">
              <CardTitle className="text-xs font-medium text-slate-400">Net Operating Margin (Month)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
                {formatCurrency((data?.stats.revenueThisMonth || 0) - (data?.stats.expensesThisMonth || 0))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Collections minus expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <DashboardCharts
          revenueTrends={data?.revenueTrends || []}
          appointmentDistribution={data?.appointmentDistribution || []}
        />
      </div>
    </DashboardShell>
  );
}
