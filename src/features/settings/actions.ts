'use server';

import { revalidatePath } from 'next/cache';
import { updateClinicSettings } from '@/server/services/settings-service';
import type { ActionResult } from '@/types';

export type ClinicSettingsFormState = ActionResult;

const SETTING_KEYS = [
  'clinic_name',
  'clinic_tagline',
  'clinic_phone',
  'clinic_email',
  'clinic_address',
  'clinic_city',
  'clinic_country',
  'clinic_website',
  'clinic_tax_id',
  'logo_url',
  'currency_code',
  'currency_symbol',
  'receipt_prefix',
  'invoice_prefix',
  'patient_prefix',
  'invoice_footer',
  'working_hours_start',
  'working_hours_end',
  'appointment_duration',
] as const;

export async function saveClinicSettingsAction(
  _prev: ClinicSettingsFormState,
  formData: FormData
): Promise<ClinicSettingsFormState> {
  const payload: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    const raw = formData.get(key);
    payload[key] = typeof raw === 'string' ? raw.trim() : '';
  }

  if (!payload.clinic_name) {
    return { success: false, error: 'Practice name is required.' };
  }

  if (payload.logo_url && !/^https?:\/\//i.test(payload.logo_url)) {
    return {
      success: false,
      error: 'Logo URL must start with http:// or https://',
    };
  }

  const result = await updateClinicSettings(payload);
  if (!result.success) {
    return result;
  }

  revalidatePath('/', 'layout');
  revalidatePath('/settings/clinic');
  revalidatePath('/receipts');
  revalidatePath('/invoices');
  revalidatePath('/login');

  return { success: true };
}
