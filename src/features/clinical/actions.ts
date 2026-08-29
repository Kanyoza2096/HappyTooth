'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createVisit,
  createProcedure,
  createTreatmentPlan,
} from '@/server/services/clinical-service';
import { requireAuth } from '@/server/auth/session';

export async function createVisitAction(formData: FormData): Promise<void> {
  const data = {
    patient_id: formData.get('patient_id') as string,
    appointment_id: (formData.get('appointment_id') as string) || null,
    practitioner_id: formData.get('practitioner_id') as string,
    visit_date:
      (formData.get('visit_date') as string) ||
      new Date().toISOString().split('T')[0],
    chief_complaint: (formData.get('chief_complaint') as string) || null,
    examination_notes: (formData.get('examination_notes') as string) || null,
    diagnosis: (formData.get('diagnosis') as string) || null,
    treatment_notes: (formData.get('treatment_notes') as string) || null,
  };

  const result = await createVisit(data);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create clinical visit');
  }

  revalidatePath('/visits');
  revalidatePath(`/patients/${data.patient_id}`);
  redirect(`/patients/${data.patient_id}?tab=clinical`);
}

export async function createProcedureAction(formData: FormData) {
  const data = {
    category_id: (formData.get('category_id') as string) || null,
    code: (formData.get('code') as string) || null,
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    default_price: parseFloat(formData.get('default_price') as string) || 0,
  };

  const result = await createProcedure(data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/procedures');
  return { success: true };
}

export async function createTreatmentPlanFormAction(
  formData: FormData
): Promise<void> {
  const user = await requireAuth();
  const patientId = formData.get('patient_id') as string;
  const title = formData.get('title') as string;
  const description = (formData.get('notes') as string) || null;
  const practitionerId =
    (formData.get('practitioner_id') as string) || user.id;
  const itemDesc =
    (formData.get('item_description') as string) || title || 'Treatment item';
  const unitPrice =
    parseFloat((formData.get('estimated_total') as string) || '0') || 0;

  const result = await createTreatmentPlan({
    patient_id: patientId,
    visit_id: null,
    practitioner_id: practitionerId,
    title,
    description,
    items: [
      {
        procedure_id: null,
        description: itemDesc,
        tooth_number: null,
        quantity: 1,
        unit_price: unitPrice,
        planned_date: null,
        notes: null,
      },
    ],
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create treatment plan');
  }

  revalidatePath('/treatment-plans');
  revalidatePath(`/patients/${patientId}`);
  redirect('/treatment-plans');
}
