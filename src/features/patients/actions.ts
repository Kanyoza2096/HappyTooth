'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createPatient,
  editPatient,
  addPatientContact,
  saveMedicalProfile,
} from '@/server/services/patient-service';
import type { ActionResult } from '@/types';

export type PatientFormState = ActionResult<{ id: string }>;

function formDataToPatientPayload(formData: FormData) {
  return {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    date_of_birth: (formData.get('date_of_birth') as string) || null,
    gender: (formData.get('gender') as 'male' | 'female' | 'other') || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    alt_phone: (formData.get('alt_phone') as string) || null,
    address: (formData.get('address') as string) || null,
    city: (formData.get('city') as string) || null,
    occupation: (formData.get('occupation') as string) || null,
    national_id: (formData.get('national_id') as string) || null,
    notes: (formData.get('notes') as string) || null,
  };
}

/**
 * Form action wrapper (progressive enhancement — no useActionState required).
 */
export async function registerPatientFormAction(formData: FormData): Promise<void> {
  const result = await registerPatientAction({ success: false }, formData);
  if (!result.success) {
    throw new Error(result.error || 'Failed to register patient');
  }
}

/**
 * Register a new patient. Compatible with useActionState.
 * On success redirects to the patient profile.
 */
export async function registerPatientAction(
  _prev: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const data = formDataToPatientPayload(formData);
  const result = await createPatient(data);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to register patient',
      fieldErrors: result.fieldErrors,
    };
  }

  const contactName = formData.get('contact_name') as string;
  const contactPhone = formData.get('contact_phone') as string;
  const contactRel = formData.get('contact_relationship') as string;

  if (contactName && contactPhone && contactRel) {
    const contactResult = await addPatientContact({
      patient_id: result.data.id,
      name: contactName,
      phone: contactPhone,
      relationship: contactRel,
      is_emergency: true,
    });
    if (!contactResult.success) {
      // Patient was created; surface non-blocking warning via revalidation path
      console.warn('[registerPatient] contact save failed:', contactResult.error);
    }
  }

  const bloodType = formData.get('blood_type') as string;
  const allergiesRaw = formData.get('allergies') as string;
  const conditionsRaw = formData.get('chronic_conditions') as string;

  if (bloodType || allergiesRaw || conditionsRaw) {
    await saveMedicalProfile({
      patient_id: result.data.id,
      blood_type: bloodType || null,
      allergies: allergiesRaw
        ? allergiesRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      chronic_conditions: conditionsRaw
        ? conditionsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      current_medications: [],
      previous_dental_history: null,
      medical_notes: null,
    });
  }

  revalidatePath('/patients');
  redirect(`/patients/${result.data.id}`);
}

/**
 * Form action wrapper for patient updates.
 */
export async function updatePatientFormAction(formData: FormData): Promise<void> {
  const result = await updatePatientAction({ success: false }, formData);
  if (!result.success) {
    throw new Error(result.error || 'Failed to update patient');
  }
}

/**
 * Update an existing patient. Compatible with useActionState.
 */
export async function updatePatientAction(
  _prev: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, error: 'Patient id is required' };
  }

  const data = { id, ...formDataToPatientPayload(formData) };
  const result = await editPatient(data);

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Failed to update patient',
      fieldErrors: result.fieldErrors,
    };
  }

  revalidatePath(`/patients/${id}`);
  revalidatePath('/patients');
  redirect(`/patients/${id}`);
}
