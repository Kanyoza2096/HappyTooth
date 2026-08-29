// ============================================================
// HAPPY TOOTH v2 — Dashboard & Reports Repository
// ============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  DashboardStats,
  RevenueByMonth,
  AppointmentStatusCount,
  AppointmentStatus,
} from '@/types';

export async function getDashboardMetrics(): Promise<DashboardStats> {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // 1. Total active patients
  const { count: patientCount, error: pError } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  if (pError) throw new Error(`Dashboard patients query failed: ${pError.message}`);

  // 2. Today's appointments
  const { count: apptCount, error: aError } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  if (aError) throw new Error(`Dashboard appointments query failed: ${aError.message}`);

  // 3. Completed visits this month
  const { count: visitCount, error: vError } = await supabase
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .gte('visit_date', startOfMonth)
    .eq('status', 'completed');

  if (vError) throw new Error(`Dashboard visits query failed: ${vError.message}`);

  // 4. Revenue this month (sum of payments)
  const { data: paymentsData, error: payError } = await supabase
    .from('payments')
    .select('amount')
    .gte('created_at', startOfMonth);

  if (payError) throw new Error(`Dashboard revenue query failed: ${payError.message}`);
  const revenueThisMonth = (paymentsData ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  // 5. Total outstanding balance across all invoices
  const { data: invoicesData, error: invError } = await supabase
    .from('invoices')
    .select('outstanding_balance')
    .in('status', ['sent', 'partially_paid']);

  if (invError) throw new Error(`Dashboard outstanding balance query failed: ${invError.message}`);
  const outstandingBalances = (invoicesData ?? []).reduce((sum, i) => sum + Number(i.outstanding_balance), 0);

  // 6. Expenses this month
  const { data: expensesData, error: expError } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', startOfMonth)
    .is('deleted_at', null);

  if (expError) throw new Error(`Dashboard expenses query failed: ${expError.message}`);
  const expensesThisMonth = (expensesData ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    totalPatients: patientCount ?? 0,
    todaysAppointments: apptCount ?? 0,
    completedVisitsThisMonth: visitCount ?? 0,
    revenueThisMonth,
    outstandingBalances,
    expensesThisMonth,
  };
}

export async function getRevenueTrends(months: number = 6): Promise<RevenueByMonth[]> {
  const supabase = await createServerSupabaseClient();
  const result: RevenueByMonth[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.toISOString().split('T')[0];
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthEnd = nextMonth.toISOString().split('T')[0];
    const monthLabel = d.toLocaleString('en-US', { month: 'short' });

    // Revenue
    const { data: payData } = await supabase
      .from('payments')
      .select('amount')
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd);

    const revenue = (payData ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

    // Expenses
    const { data: expData } = await supabase
      .from('expenses')
      .select('amount')
      .gte('date', monthStart)
      .lt('date', monthEnd)
      .is('deleted_at', null);

    const expenses = (expData ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

    result.push({
      month: monthLabel,
      revenue,
      expenses,
    });
  }

  return result;
}

export async function getAppointmentStatusDistribution(): Promise<AppointmentStatusCount[]> {
  const supabase = await createServerSupabaseClient();
  const statuses: AppointmentStatus[] = [
    'scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'
  ];

  const results: AppointmentStatusCount[] = [];
  for (const status of statuses) {
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    results.push({
      status,
      count: count ?? 0,
    });
  }

  return results;
}
