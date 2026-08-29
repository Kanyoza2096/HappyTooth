// ============================================================
// HAPPY TOOTH v2 — Appointment Repository
// ============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  Appointment,
  AppointmentWithDetails,
  AppointmentStatus,
  PaginatedResult,
  PaginationParams,
} from '@/types';

export async function findAppointments(
  params: PaginationParams & {
    date?: string;
    startDate?: string;
    endDate?: string;
    practitionerId?: string;
    patientId?: string;
    status?: AppointmentStatus;
  }
): Promise<PaginatedResult<AppointmentWithDetails>> {
  const supabase = await createServerSupabaseClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:patients (id, first_name, last_name, phone, patient_number),
      practitioner:profiles!appointments_practitioner_id_fkey (id, first_name, last_name, role)
    `, { count: 'exact' });

  if (params.date) {
    query = query.eq('date', params.date);
  }
  if (params.startDate) {
    query = query.gte('date', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('date', params.endDate);
  }
  if (params.practitionerId) {
    query = query.eq('practitioner_id', params.practitionerId);
  }
  if (params.patientId) {
    query = query.eq('patient_id', params.patientId);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }

  const sortBy = params.sortBy ?? 'date';
  const sortOrder = params.sortOrder ?? 'asc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  if (sortBy === 'date') {
    query = query.order('start_time', { ascending: true });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch appointments: ${error.message}`);
  }

  return {
    data: (data ?? []) as unknown as AppointmentWithDetails[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function findAppointmentById(id: string): Promise<AppointmentWithDetails | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients (id, first_name, last_name, phone, patient_number),
      practitioner:profiles!appointments_practitioner_id_fkey (id, first_name, last_name, role)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as unknown as AppointmentWithDetails;
}

export async function checkPractitionerConflict(
  practitionerId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('appointments')
    .select('id')
    .eq('practitioner_id', practitionerId)
    .eq('date', date)
    .not('status', 'in', '("cancelled","no_show")')
    .lt('start_time', endTime)
    .gt('end_time', startTime);

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Conflict check failed: ${error.message}`);

  return (data?.length ?? 0) > 0;
}

export async function insertAppointment(
  appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'cancelled_at' | 'cancellation_reason'>
): Promise<Appointment> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('appointments')
    .insert(appointment)
    .select()
    .single();

  if (error) throw new Error(`Failed to create appointment: ${error.message}`);
  return data as Appointment;
}

export async function updateAppointment(
  id: string,
  updates: Partial<Appointment>
): Promise<Appointment> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update appointment: ${error.message}`);
  return data as Appointment;
}
