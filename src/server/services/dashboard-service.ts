// ============================================================
// HAPPY TOOTH v2 — Dashboard & Reports Service
// ============================================================

import { requireAuth } from '@/server/auth/session';
import {
  getDashboardMetrics,
  getRevenueTrends,
  getAppointmentStatusDistribution,
} from '@/server/repositories/dashboard-repository';
import type {
  ActionResult,
  DashboardStats,
  RevenueByMonth,
  AppointmentStatusCount,
} from '@/types';

export async function getDashboardData(): Promise<
  ActionResult<{
    stats: DashboardStats;
    revenueTrends: RevenueByMonth[];
    appointmentDistribution: AppointmentStatusCount[];
  }>
> {
  try {
    await requireAuth();

    const [stats, revenueTrends, appointmentDistribution] = await Promise.all([
      getDashboardMetrics(),
      getRevenueTrends(6),
      getAppointmentStatusDistribution(),
    ]);

    return {
      success: true,
      data: {
        stats,
        revenueTrends,
        appointmentDistribution,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
    };
  }
}
