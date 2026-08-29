// ============================================================
// HAPPY TOOTH v2 — Patient Service (Business Logic Layer)
// ============================================================
// Orchestrates authentication, authorization, validation,
// data access, and audit logging for patient operations.
//
// Flow: Server Action → Service → Repository → Supabase
// ============================================================

import { requireAuth } from '@/server/auth/session';
import { assertPermission } from '@/server/authorization/rbac';
import { recordAuditLog } from '@/server/services/audit-service';
import {
  findPatients,
  findPatientById,
  insertPatient,
  updatePatient,
  softDeletePatient,
  insertPatientContact,
  updatePatientContact,
  deletePatientContact,
  upsertMedicalProfile,
} from '@/server/repositories/patient-repository';
import {
  createPatientSchema,
  updatePatientSchema,
  patientContactSchema,
  patientMedicalProfileSchema,
} from '@/lib/validation/schemas';
import type {
  ActionResult,
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

export async function getPatients(
  params: PaginationParams & { isActive?: boolean }
): Promise<ActionResult<PaginatedResult<Patient>>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'patients.view');

    const result = await findPatients(params);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch patients',
    };
  }
}

export async function getPatient(id: string): Promise<ActionResult<PatientWithDetails>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'patients.view');

    const patient = await findPatientById(id);

    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    return { success: true, data: patient };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch patient',
    };
  }
}

// ============================================================
// PATIENT MUTATIONS
// ============================================================

export async function createPatient(
  input: unknown
): Promise<ActionResult<Patient>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'patients.create');

    // Validate input
    const validation = createPatientSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Create patient
    const patient = await insertPatient({
      ...validation.data,
      is_active: true,
      created_by: user.id,
      updated_by: user.id,
    });

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      action: 'patient_created',
      entityType: 'patient',
      entityId: patient.id,
      metadata: {
        patient_number: patient.patient_number,
        name: `${patient.first_name} ${patient.last_name}`,
      },
    });

    return { success: true, data: patient };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create patient',
    };
  }
}

export async function editPatient(
  input: unknown
): Promise<ActionResult<Patient>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'patients.edit');

    // Validate input
    const validation = updatePatientSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { id, ...updates } = validation.data;

    // Verify patient exists
    const existing = await findPatientById(id);
    if (!existing) {
      return { success: false, error: 'Patient not found' };
    }

    // Update patient
    const patient = await updatePatient(id, {
      ...updates,
      updated_by: user.id,
    });

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      action: 'patient_updated',
      entityType: 'patient',
      entityId: patient.id,
      metadata: {
        updated_fields: Object.keys(updates),
      },
    });

    return { success: true, data: patient };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update patient',
    };
  }
}

export async function removePatient(
  id: string
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'patients.delete');

    // Verify patient exists
    const existing = await findPatientById(id);
    if (!existing) {
      return { success: false, error: 'Patient not found' };
    }

    // Soft delete
    await softDeletePatient(id, user.id);

    // Audit log
    await recordAuditLog({
      actorId: user.id,
      action: 'patient_deleted',
      entityType: 'patient',
      entityId: id,
      metadata: {
        patient_number: existing.patient_number,
        name: `${existing.first_name} ${existing.last_name}`,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete patient',
    };
  }
}

// ============================================================
// PATIENT CONTACT OPERATIONS
// ============================================================

export async function addPatientContact(
  input: unknown
): Promise<ActionResult<PatientContact>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'patients.edit');

    const validation = patientContactSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const contact = await insertPatientContact(validation.data);

    return { success: true, data: contact };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add contact',
    };
  }
}

export async function editPatientContact(
  id: string,
  input: unknown
): Promise<ActionResult<PatientContact>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'patients.edit');

    const validation = patientContactSchema.partial().safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const contact = await updatePatientContact(id, validation.data);

    return { success: true, data: contact };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact',
    };
  }
}

export async function removePatientContact(
  id: string
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'patients.edit');

    await deletePatientContact(id);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contact',
    };
  }
}

// ============================================================
// MEDICAL PROFILE OPERATIONS
// ============================================================

export async function saveMedicalProfile(
  input: unknown
): Promise<ActionResult<PatientMedicalProfile>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'patients.medical.edit');

    const validation = patientMedicalProfileSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const profile = await upsertMedicalProfile(validation.data);

    return { success: true, data: profile };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save medical profile',
    };
  }
}
