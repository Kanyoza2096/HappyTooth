'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createAppointment,
  changeAppointmentStatus,
} from '@/server/services/appointment-service';

export async function bookAppointmentAction(formData: FormData): Promise<void> {
  const data = {
    patient_id: formData.get('patient_id') as string,
    practitioner_id: formData.get('practitioner_id') as string,
    date: formData.get('date') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    reason: (formData.get('reason') as string) || null,
    notes: (formData.get('notes') as string) || null,
  };

  const result = await createAppointment(data);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to book appointment');
  }

  revalidatePath('/appointments');
  revalidatePath(`/patients/${data.patient_id}`);
  redirect('/appointments');
}

export async function updateStatusAction(id: string, status: string, cancellationReason?: string) {
  const result = await changeAppointmentStatus({
    id,
    status,
    cancellation_reason: cancellationReason || null,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/appointments');
  return { success: true };
}
