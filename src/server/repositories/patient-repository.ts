// ============================================================
// HAPPY TOOTH v2 — Patient Repository (Data Access Layer)
// ============================================================
// All Supabase queries for patient data live here.
// This layer is called by the Patient Service, never directly
// from UI components or Server Actions.
// ============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  Patient,
  PatientWithDetails,
  PatientContact,
  PatientMedicalProfile,
  PaginatedResult,
  PaginationParams,
} from '@/types';

// ============================================================
// PATIENT QUERIES
// ============================================================

export async function findPatients(
  params: PaginationParams & {
    isActive?: boolean;
  }
): Promise<PaginatedResult<Patient>> {
  const supabase = await createServerSupabaseClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  // Filter by active status
  if (params.isActive !== undefined) {
    query = query.eq('is_active', params.isActive);
  }

  // Search by name, phone, patient number
  if (params.search) {
    const search = `%${params.search}%`;
    query = query.or(
      `first_name.ilike.${search},last_name.ilike.${search},phone.ilike.${search},patient_number.ilike.${search}`
    );
  }

  // Sorting
  const sortBy = params.sortBy ?? 'created_at';
  const sortOrder = params.sortOrder ?? 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch patients: ${error.message}`);
  }

  return {
    data: (data ?? []) as Patient[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function findPatientById(id: string): Promise<PatientWithDetails | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return null;
  }

  // Fetch contacts
  const { data: contacts } = await supabase
    .from('patient_contacts')
    .select('*')
    .eq('patient_id', id)
    .order('is_emergency', { ascending: false });

  // Fetch medical profile
  const { data: medicalProfile } = await supabase
    .from('patient_medical_profiles')
    .select('*')
    .eq('patient_id', id)
    .single();

  // Calculate outstanding balance from invoices
  const { data: balanceData } = await supabase
    .from('invoices')
    .select('outstanding_balance')
    .eq('patient_id', id)
    .in('status', ['sent', 'partially_paid']);

  const outstandingBalance = (balanceData ?? []).reduce(
    (sum, inv) => sum + Number(inv.outstanding_balance),
    0
  );

  return {
    ...(data as Patient),
    contacts: (contacts ?? []) as PatientContact[],
    medical_profile: medicalProfile as PatientMedicalProfile | null,
    outstanding_balance: outstandingBalance,
  };
}

export async function findPatientByNumber(patientNumber: string): Promise<Patient | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('patient_number', patientNumber)
    .is('deleted_at', null)
    .single();

  if (error || !data) return null;
  return data as Patient;
}

// ============================================================
// PATIENT MUTATIONS
// ============================================================

export async function insertPatient(
  patient: Omit<Patient, 'id' | 'patient_number' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Patient> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('patients')
    .insert(patient)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create patient: ${error.message}`);
  }

  return data as Patient;
}

export async function updatePatient(
  id: string,
  updates: Partial<Patient>
): Promise<Patient> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update patient: ${error.message}`);
  }

  return data as Patient;
}

export async function softDeletePatient(id: string, deletedBy: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('patients')
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      updated_by: deletedBy,
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete patient: ${error.message}`);
  }
}

// ============================================================
// PATIENT CONTACTS
// ============================================================

export async function insertPatientContact(
  contact: Omit<PatientContact, 'id' | 'created_at' | 'updated_at'>
): Promise<PatientContact> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('patient_contacts')
    .insert(contact)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add contact: ${error.message}`);
  }

  return data as PatientContact;
}

export async function updatePatientContact(
  id: string,
  updates: Partial<PatientContact>
): Promise<PatientContact> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('patient_contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update contact: ${error.message}`);
  }

  return data as PatientContact;
}

export async function deletePatientContact(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('patient_contacts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete contact: ${error.message}`);
  }
}

// ============================================================
// PATIENT MEDICAL PROFILES
// ============================================================

export async function upsertMedicalProfile(
  profile: Omit<PatientMedicalProfile, 'id' | 'created_at' | 'updated_at'>
): Promise<PatientMedicalProfile> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('patient_medical_profiles')
    .upsert(profile, { onConflict: 'patient_id' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save medical profile: ${error.message}`);
  }

  return data as PatientMedicalProfile;
}

// ============================================================
// PATIENT STATISTICS
// ============================================================

export async function getPatientCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to count patients: ${error.message}`);
  }

  return count ?? 0;
}

export async function getNewPatientCount(since: string): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', since);

  if (error) {
    throw new Error(`Failed to count new patients: ${error.message}`);
  }

  return count ?? 0;
}
