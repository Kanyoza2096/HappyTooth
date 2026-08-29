// ============================================================
// HAPPY TOOTH v2 — Appointment Service
// ============================================================

import { requireAuth } from '@/server/auth/session';
import { assertPermission } from '@/server/authorization/rbac';
import { recordAuditLog } from '@/server/services/audit-service';
import {
  findAppointments,
  findAppointmentById,
  checkPractitionerConflict,
  insertAppointment,
  updateAppointment,
} from '@/server/repositories/appointment-repository';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from '@/lib/validation/schemas';
import { APPOINTMENT_STATUS_TRANSITIONS } from '@/lib/constants';
import type {
  ActionResult,
  Appointment,
  AppointmentWithDetails,
  AppointmentStatus,
  PaginatedResult,
  PaginationParams,
} from '@/types';

export async function getAppointments(
  params: PaginationParams & {
    date?: string;
    startDate?: string;
    endDate?: string;
    practitionerId?: string;
    patientId?: string;
    status?: AppointmentStatus;
  }
): Promise<ActionResult<PaginatedResult<AppointmentWithDetails>>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'appointments.view');

    const result = await findAppointments(params);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch appointments',
    };
  }
}

export async function getAppointment(id: string): Promise<ActionResult<AppointmentWithDetails>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'appointments.view');

    const appointment = await findAppointmentById(id);
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    return { success: true, data: appointment };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch appointment',
    };
  }
}

export async function createAppointment(input: unknown): Promise<ActionResult<Appointment>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'appointments.create');

    const validation = createAppointmentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = validation.data;

    // Check for practitioner conflict
    const hasConflict = await checkPractitionerConflict(
      data.practitioner_id,
      data.date,
      data.start_time,
      data.end_time
    );

    if (hasConflict) {
      return {
        success: false,
        error: 'The practitioner has a scheduling conflict during this time slot.',
      };
    }

    const appointment = await insertAppointment({
      ...data,
      status: 'scheduled',
      created_by: user.id,
      updated_by: user.id,
    });

    await recordAuditLog({
      actorId: user.id,
      action: 'appointment_created',
      entityType: 'appointment',
      entityId: appointment.id,
      metadata: {
        date: appointment.date,
        time: `${appointment.start_time} - ${appointment.end_time}`,
        patientId: appointment.patient_id,
        practitionerId: appointment.practitioner_id,
      },
    });

    return { success: true, data: appointment };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create appointment',
    };
  }
}

export async function updateAppointmentDetails(input: unknown): Promise<ActionResult<Appointment>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'appointments.edit');

    const validation = updateAppointmentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { id, ...updates } = validation.data;
    const existing = await findAppointmentById(id);
    if (!existing) {
      return { success: false, error: 'Appointment not found' };
    }

    // If date/time/practitioner changed, check conflict
    const practitionerId = updates.practitioner_id || existing.practitioner_id;
    const date = updates.date || existing.date;
    const startTime = updates.start_time || existing.start_time;
    const endTime = updates.end_time || existing.end_time;

    if (
      updates.practitioner_id ||
      updates.date ||
      updates.start_time ||
      updates.end_time
    ) {
      const hasConflict = await checkPractitionerConflict(
        practitionerId,
        date,
        startTime,
        endTime,
        id
      );

      if (hasConflict) {
        return {
          success: false,
          error: 'The practitioner has a scheduling conflict during this time slot.',
        };
      }
    }

    const updated = await updateAppointment(id, {
      ...updates,
      updated_by: user.id,
    });

    await recordAuditLog({
      actorId: user.id,
      action: 'appointment_updated',
      entityType: 'appointment',
      entityId: id,
      metadata: { updates },
    });

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update appointment',
    };
  }
}

export async function changeAppointmentStatus(input: unknown): Promise<ActionResult<Appointment>> {
  try {
    const user = await requireAuth();
    const validation = updateAppointmentStatusSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { id, status, cancellation_reason } = validation.data;
    const existing = await findAppointmentById(id);
    if (!existing) {
      return { success: false, error: 'Appointment not found' };
    }

    // Permission check based on target status
    if (status === 'cancelled') {
      assertPermission(user, 'appointments.cancel');
    } else {
      assertPermission(user, 'appointments.edit');
    }

    // Check state transition validity
    const allowedTransitions = APPOINTMENT_STATUS_TRANSITIONS[existing.status] || [];
    if (!allowedTransitions.includes(status) && existing.status !== status) {
      return {
        success: false,
        error: `Cannot transition appointment from ${existing.status} to ${status}.`,
      };
    }

    const updates: Partial<Appointment> = {
      status,
      updated_by: user.id,
    };

    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = cancellation_reason || null;
    }

    const updated = await updateAppointment(id, updates);

    await recordAuditLog({
      actorId: user.id,
      action: status === 'cancelled' ? 'appointment_cancelled' : 'appointment_updated',
      entityType: 'appointment',
      entityId: id,
      metadata: {
        from: existing.status,
        to: status,
        reason: cancellation_reason,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change appointment status',
    };
  }
}
