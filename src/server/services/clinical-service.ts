// ============================================================
// HAPPY TOOTH v2 — Clinical Service
// ============================================================

import { requireAuth } from '@/server/auth/session';
import { assertPermission, assertClinicalStaff } from '@/server/authorization/rbac';
import { recordAuditLog } from '@/server/services/audit-service';
import {
  findVisits,
  findVisitById,
  insertVisit,
  updateVisit,
  insertClinicalNote,
  findProcedureCategories,
  findProcedures,
  insertProcedure,
  findTreatmentPlans,
  findTreatmentPlanById,
  insertTreatmentPlan,
  updateTreatmentPlanItem,
} from '@/server/repositories/clinical-repository';
import {
  createVisitSchema,
  updateVisitSchema,
  clinicalNoteSchema,
  procedureSchema,
  createTreatmentPlanSchema,
  updateTreatmentPlanItemStatusSchema,
} from '@/lib/validation/schemas';
import type {
  ActionResult,
  Visit,
  VisitWithDetails,
  ClinicalNote,
  Procedure,
  ProcedureCategory,
  TreatmentPlanWithItems,
  TreatmentPlanItem,
  PaginatedResult,
  PaginationParams,
} from '@/types';

// ============================================================
// VISITS
// ============================================================

export async function getVisits(
  params: PaginationParams & { patientId?: string; practitionerId?: string; date?: string }
): Promise<ActionResult<PaginatedResult<VisitWithDetails>>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'visits.view');
    const result = await findVisits(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch visits' };
  }
}

export async function getVisit(id: string): Promise<ActionResult<VisitWithDetails>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'visits.view');
    const visit = await findVisitById(id);
    if (!visit) return { success: false, error: 'Visit not found' };
    return { success: true, data: visit };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch visit' };
  }
}

export async function createVisit(input: unknown): Promise<ActionResult<Visit>> {
  try {
    const user = await requireAuth();
    assertClinicalStaff(user);
    assertPermission(user, 'visits.create');

    const validation = createVisitSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = validation.data;
    const visit = await insertVisit({
      patient_id: data.patient_id,
      appointment_id: data.appointment_id || null,
      practitioner_id: data.practitioner_id,
      status: 'in_progress',
      chief_complaint: data.chief_complaint || null,
      examination_notes: data.examination_notes || null,
      diagnosis: data.diagnosis || null,
      treatment_notes: data.treatment_notes || null,
      visit_date: data.visit_date || new Date().toISOString().split('T')[0],
      created_by: user.id,
    });

    await recordAuditLog({
      actorId: user.id,
      action: 'visit_created',
      entityType: 'visit',
      entityId: visit.id,
      metadata: { patientId: visit.patient_id, date: visit.visit_date },
    });

    return { success: true, data: visit };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create visit' };
  }
}

export async function completeVisit(id: string, input: unknown): Promise<ActionResult<Visit>> {
  try {
    const user = await requireAuth();
    assertClinicalStaff(user);
    assertPermission(user, 'visits.edit');

    const validation = updateVisitSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const updates = validation.data;
    const visit = await updateVisit(id, {
      ...updates,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    await recordAuditLog({
      actorId: user.id,
      action: 'visit_completed',
      entityType: 'visit',
      entityId: id,
    });

    return { success: true, data: visit };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to complete visit' };
  }
}

// ============================================================
// CLINICAL NOTES
// ============================================================

export async function addClinicalNote(input: unknown): Promise<ActionResult<ClinicalNote>> {
  try {
    const user = await requireAuth();
    assertClinicalStaff(user);
    assertPermission(user, 'clinical_notes.create');

    const validation = clinicalNoteSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const note = await insertClinicalNote({
      ...validation.data,
      practitioner_id: user.id,
    });

    await recordAuditLog({
      actorId: user.id,
      action: 'clinical_note_created',
      entityType: 'clinical_note',
      entityId: note.id,
      metadata: { visitId: note.visit_id, type: note.note_type },
    });

    return { success: true, data: note };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add clinical note' };
  }
}

// ============================================================
// PROCEDURES
// ============================================================

export async function getProcedures(categoryId?: string): Promise<ActionResult<Procedure[]>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'procedures.view');
    const procedures = await findProcedures(categoryId);
    return { success: true, data: procedures };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch procedures' };
  }
}

export async function getProcedureCategories(): Promise<ActionResult<ProcedureCategory[]>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'procedures.view');
    const categories = await findProcedureCategories();
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch categories' };
  }
}

export async function createProcedure(input: unknown): Promise<ActionResult<Procedure>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'procedures.manage');

    const validation = procedureSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const proc = await insertProcedure({
      ...validation.data,
      code: validation.data.code || null,
      description: validation.data.description || null,
    });

    await recordAuditLog({
      actorId: user.id,
      action: 'procedure_created',
      entityType: 'procedure',
      entityId: proc.id,
      metadata: { name: proc.name, price: proc.default_price },
    });

    return { success: true, data: proc };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create procedure' };
  }
}

// ============================================================
// TREATMENT PLANS
// ============================================================

export async function getTreatmentPlans(patientId?: string): Promise<ActionResult<TreatmentPlanWithItems[]>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'treatment_plans.view');
    const plans = await findTreatmentPlans(patientId);
    return { success: true, data: plans };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch treatment plans' };
  }
}

export async function getTreatmentPlan(id: string): Promise<ActionResult<TreatmentPlanWithItems>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'treatment_plans.view');
    const plan = await findTreatmentPlanById(id);
    if (!plan) return { success: false, error: 'Treatment plan not found' };
    return { success: true, data: plan };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch treatment plan' };
  }
}

export async function createTreatmentPlan(input: unknown): Promise<ActionResult<TreatmentPlanWithItems>> {
  try {
    const user = await requireAuth();
    assertClinicalStaff(user);
    assertPermission(user, 'treatment_plans.create');

    const validation = createTreatmentPlanSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { items, ...planData } = validation.data;
    const estimatedTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    const plan = await insertTreatmentPlan(
      {
        ...planData,
        status: 'planned',
        estimated_total: estimatedTotal,
        created_by: user.id,
      },
      items.map(item => ({
        ...item,
        status: 'planned' as const,
        completed_date: null,
        sort_order: 0,
      }))
    );

    await recordAuditLog({
      actorId: user.id,
      action: 'treatment_plan_created',
      entityType: 'treatment_plan',
      entityId: plan.id,
      metadata: { patientId: plan.patient_id, total: estimatedTotal, itemCount: items.length },
    });

    return { success: true, data: plan };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create treatment plan' };
  }
}

export async function updateTreatmentItemStatus(input: unknown): Promise<ActionResult<TreatmentPlanItem>> {
  try {
    const user = await requireAuth();
    assertClinicalStaff(user);
    assertPermission(user, 'treatment_plans.edit');

    const validation = updateTreatmentPlanItemStatusSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { id, status, completed_date } = validation.data;
    const item = await updateTreatmentPlanItem(id, {
      status,
      completed_date: status === 'completed' ? (completed_date || new Date().toISOString().split('T')[0]) : null,
    });

    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update treatment item' };
  }
}
