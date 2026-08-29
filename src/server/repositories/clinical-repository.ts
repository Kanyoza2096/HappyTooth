// ============================================================
// HAPPY TOOTH v2 — Clinical Repository
// ============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  Visit,
  VisitWithDetails,
  ClinicalNote,
  Procedure,
  ProcedureCategory,
  TreatmentPlan,
  TreatmentPlanWithItems,
  TreatmentPlanItem,
  PaginatedResult,
  PaginationParams,
} from '@/types';

// ============================================================
// VISITS
// ============================================================

export async function findVisits(
  params: PaginationParams & {
    patientId?: string;
    practitionerId?: string;
    date?: string;
  }
): Promise<PaginatedResult<VisitWithDetails>> {
  const supabase = await createServerSupabaseClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('visits')
    .select(`
      *,
      patient:patients (id, first_name, last_name, patient_number),
      practitioner:profiles!visits_practitioner_id_fkey (id, first_name, last_name)
    `, { count: 'exact' });

  if (params.patientId) {
    query = query.eq('patient_id', params.patientId);
  }
  if (params.practitionerId) {
    query = query.eq('practitioner_id', params.practitionerId);
  }
  if (params.date) {
    query = query.eq('visit_date', params.date);
  }

  query = query.order('visit_date', { ascending: false }).order('created_at', { ascending: false });
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to fetch visits: ${error.message}`);

  return {
    data: (data ?? []) as unknown as VisitWithDetails[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function findVisitById(id: string): Promise<VisitWithDetails | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      patient:patients (id, first_name, last_name, patient_number),
      practitioner:profiles!visits_practitioner_id_fkey (id, first_name, last_name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const { data: notes } = await supabase
    .from('clinical_notes')
    .select('*')
    .eq('visit_id', id)
    .order('created_at', { ascending: true });

  return {
    ...(data as unknown as VisitWithDetails),
    notes: (notes ?? []) as ClinicalNote[],
  };
}

export async function insertVisit(
  visit: Omit<Visit, 'id' | 'created_at' | 'updated_at' | 'completed_at'>
): Promise<Visit> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('visits')
    .insert(visit)
    .select()
    .single();

  if (error) throw new Error(`Failed to create visit: ${error.message}`);
  return data as Visit;
}

export async function updateVisit(id: string, updates: Partial<Visit>): Promise<Visit> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('visits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update visit: ${error.message}`);
  return data as Visit;
}

// ============================================================
// CLINICAL NOTES
// ============================================================

export async function insertClinicalNote(
  note: Omit<ClinicalNote, 'id' | 'created_at' | 'updated_at'>
): Promise<ClinicalNote> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('clinical_notes')
    .insert(note)
    .select()
    .single();

  if (error) throw new Error(`Failed to create clinical note: ${error.message}`);
  return data as ClinicalNote;
}

// ============================================================
// PROCEDURES & CATEGORIES
// ============================================================

export async function findProcedureCategories(): Promise<ProcedureCategory[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('procedure_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch procedure categories: ${error.message}`);
  return data as ProcedureCategory[];
}

export async function findProcedures(categoryId?: string): Promise<Procedure[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from('procedures').select('*').eq('is_active', true).order('name', { ascending: true });

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch procedures: ${error.message}`);
  return data as Procedure[];
}

export async function insertProcedure(
  proc: Omit<Procedure, 'id' | 'created_at' | 'updated_at'>
): Promise<Procedure> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('procedures')
    .insert(proc)
    .select()
    .single();

  if (error) throw new Error(`Failed to create procedure: ${error.message}`);
  return data as Procedure;
}

// ============================================================
// TREATMENT PLANS
// ============================================================

export async function findTreatmentPlans(patientId?: string): Promise<TreatmentPlanWithItems[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('treatment_plans')
    .select(`
      *,
      patient:patients (id, first_name, last_name, patient_number),
      practitioner:profiles!treatment_plans_practitioner_id_fkey (id, first_name, last_name),
      items:treatment_plan_items (
        *,
        procedure:procedures (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch treatment plans: ${error.message}`);
  return (data ?? []) as unknown as TreatmentPlanWithItems[];
}

export async function findTreatmentPlanById(id: string): Promise<TreatmentPlanWithItems | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('treatment_plans')
    .select(`
      *,
      patient:patients (id, first_name, last_name, patient_number),
      practitioner:profiles!treatment_plans_practitioner_id_fkey (id, first_name, last_name),
      items:treatment_plan_items (
        *,
        procedure:procedures (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as unknown as TreatmentPlanWithItems;
}

export async function insertTreatmentPlan(
  plan: Omit<TreatmentPlan, 'id' | 'created_at' | 'updated_at'>,
  items: Omit<TreatmentPlanItem, 'id' | 'treatment_plan_id' | 'created_at' | 'updated_at'>[]
): Promise<TreatmentPlanWithItems> {
  const supabase = await createServerSupabaseClient();

  const { data: createdPlan, error: planError } = await supabase
    .from('treatment_plans')
    .insert(plan)
    .select()
    .single();

  if (planError || !createdPlan) {
    throw new Error(`Failed to create treatment plan: ${planError?.message}`);
  }

  const planItems = items.map((item, idx) => ({
    ...item,
    treatment_plan_id: createdPlan.id,
    sort_order: idx + 1,
  }));

  const { data: createdItems, error: itemsError } = await supabase
    .from('treatment_plan_items')
    .insert(planItems)
    .select();

  if (itemsError) {
    throw new Error(`Failed to create treatment plan items: ${itemsError.message}`);
  }

  return {
    ...(createdPlan as TreatmentPlan),
    items: (createdItems ?? []) as TreatmentPlanItem[],
  };
}

export async function updateTreatmentPlanItem(
  id: string,
  updates: Partial<TreatmentPlanItem>
): Promise<TreatmentPlanItem> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('treatment_plan_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update item: ${error.message}`);
  return data as TreatmentPlanItem;
}
