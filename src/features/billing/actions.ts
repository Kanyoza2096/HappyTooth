'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  createInvoice,
  recordPayment,
  createExpense,
} from '@/server/services/financial-service';
import { generateIdempotencyKey } from '@/lib/utils';
import type { PaymentMethod } from '@/types';

export async function createInvoiceAction(formData: FormData): Promise<void> {
  const patientId = formData.get('patient_id') as string;
  const discountType = (formData.get('discount_type') as 'percentage' | 'fixed') || null;
  const discountValue = parseFloat(formData.get('discount_value') as string) || 0;
  const notes = (formData.get('notes') as string) || null;
  const dueDate = (formData.get('due_date') as string) || null;

  // Extract items from form
  const descriptions = formData.getAll('item_description') as string[];
  const quantities = formData.getAll('item_quantity') as string[];
  const prices = formData.getAll('item_price') as string[];
  const procedureIds = formData.getAll('item_procedure_id') as string[];

  const items = descriptions.map((desc, idx) => ({
    description: desc,
    quantity: parseInt(quantities[idx], 10) || 1,
    unit_price: parseFloat(prices[idx]) || 0,
    procedure_id: procedureIds[idx] || null,
  })).filter(i => i.description.trim().length > 0);

  if (items.length === 0) {
    throw new Error('At least one invoice line item is required.');
  }

  const result = await createInvoice({
    patient_id: patientId,
    discount_type: discountType,
    discount_value: discountValue,
    notes,
    due_date: dueDate,
    items,
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to generate invoice');
  }

  revalidatePath('/invoices');
  revalidatePath(`/patients/${patientId}`);
  redirect(`/invoices/${result.data.id}`);
}

export async function recordPaymentAction(formData: FormData): Promise<void> {
  const invoiceId = formData.get('invoice_id') as string;
  const patientId = formData.get('patient_id') as string;
  const amount = parseFloat(formData.get('amount') as string) || 0;
  const method = (formData.get('method') as PaymentMethod) || 'cash';
  const reference = (formData.get('reference') as string) || null;
  const notes = (formData.get('notes') as string) || null;
  const idempotencyKey = (formData.get('idempotency_key') as string) || generateIdempotencyKey();

  const result = await recordPayment({
    invoice_id: invoiceId,
    patient_id: patientId,
    amount,
    method,
    reference,
    notes,
    idempotency_key: idempotencyKey,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to record payment');
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath('/payments');
  revalidatePath('/receipts');
  revalidatePath(`/patients/${patientId}`);
}

export async function createExpenseAction(formData: FormData): Promise<void> {
  const data = {
    category_id: formData.get('category_id') as string,
    amount: parseFloat(formData.get('amount') as string) || 0,
    date: (formData.get('date') as string) || new Date().toISOString().split('T')[0],
    description: formData.get('description') as string,
    method: (formData.get('method') as PaymentMethod) || 'cash',
    reference: (formData.get('reference') as string) || null,
  };

  const result = await createExpense(data);

  if (!result.success) {
    throw new Error(result.error || 'Failed to record expense');
  }

  revalidatePath('/expenses');
  redirect('/expenses');
}
