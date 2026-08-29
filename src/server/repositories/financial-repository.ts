// ============================================================
// HAPPY TOOTH v2 — Financial Repository (Data Access Layer)
// ============================================================

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type {
  Invoice,
  InvoiceWithDetails,
  InvoiceItem,
  Payment,
  PaymentWithDetails,
  Receipt,
  ReceiptWithDetails,
  Expense,
  ExpenseWithCategory,
  ExpenseCategory,
  InvoiceStatus,
  PaginatedResult,
  PaginationParams,
} from '@/types';

// ============================================================
// INVOICES
// ============================================================

export async function findInvoices(
  params: PaginationParams & {
    patientId?: string;
    status?: InvoiceStatus;
    startDate?: string;
    endDate?: string;
  }
): Promise<PaginatedResult<InvoiceWithDetails>> {
  const supabase = await createServerSupabaseClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('invoices')
    .select(`
      *,
      patient:patients (id, first_name, last_name, patient_number, phone, email)
    `, { count: 'exact' });

  if (params.patientId) {
    query = query.eq('patient_id', params.patientId);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);

  return {
    data: (data ?? []) as unknown as InvoiceWithDetails[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function findInvoiceById(id: string): Promise<InvoiceWithDetails | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      patient:patients (id, first_name, last_name, patient_number, phone, email),
      items:invoice_items (
        *,
        procedure:procedures (*)
      ),
      payments:payments (*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as unknown as InvoiceWithDetails;
}

export async function insertInvoice(
  invoice: Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[]
): Promise<InvoiceWithDetails> {
  const supabase = await createServerSupabaseClient();

  // Create invoice header (number assigned via PostgreSQL default/function if configured or generate here)
  const { data: createdInvoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      ...invoice,
      invoice_number: 'INV-' + Date.now().toString().slice(-6),
    })
    .select()
    .single();

  if (invError || !createdInvoice) {
    throw new Error(`Failed to create invoice: ${invError?.message}`);
  }

  const itemsToInsert = items.map((item, idx) => ({
    ...item,
    invoice_id: createdInvoice.id,
    sort_order: idx + 1,
  }));

  const { data: createdItems, error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsToInsert)
    .select();

  if (itemsError) {
    throw new Error(`Failed to insert invoice items: ${itemsError.message}`);
  }

  return {
    ...(createdInvoice as Invoice),
    items: (createdItems ?? []) as InvoiceItem[],
  };
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus, updatedBy: string): Promise<Invoice> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('invoices')
    .update({ status, updated_by: updatedBy })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update invoice status: ${error.message}`);
  return data as Invoice;
}

// ============================================================
// PAYMENTS
// ============================================================

export async function findPayments(
  params: PaginationParams & {
    patientId?: string;
    invoiceId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<PaginatedResult<PaymentWithDetails>> {
  const supabase = await createServerSupabaseClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('payments')
    .select(`
      *,
      invoice:invoices (id, invoice_number, total, outstanding_balance),
      patient:patients (id, first_name, last_name, patient_number),
      created_by_profile:profiles!payments_created_by_fkey (first_name, last_name)
    `, { count: 'exact' });

  if (params.patientId) query = query.eq('patient_id', params.patientId);
  if (params.invoiceId) query = query.eq('invoice_id', params.invoiceId);
  if (params.startDate) query = query.gte('created_at', params.startDate);
  if (params.endDate) query = query.lte('created_at', params.endDate);

  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to fetch payments: ${error.message}`);

  return {
    data: (data ?? []) as unknown as PaymentWithDetails[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function insertPayment(
  payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
): Promise<Payment> {
  const supabase = await createServerSupabaseClient();

  // Idempotent retry: if the same key was already used, return the existing row
  if (payment.idempotency_key) {
    const { data: existing } = await supabase
      .from('payments')
      .select('*')
      .eq('idempotency_key', payment.idempotency_key)
      .maybeSingle();

    if (existing) {
      return existing as Payment;
    }
  }

  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();

  if (error) {
    // Race: unique violation on idempotency_key — fetch winner
    if (
      payment.idempotency_key &&
      (error.code === '23505' || error.message?.includes('idempotency'))
    ) {
      const { data: existing } = await supabase
        .from('payments')
        .select('*')
        .eq('idempotency_key', payment.idempotency_key)
        .single();
      if (existing) return existing as Payment;
    }
    throw new Error(`Failed to record payment: ${error.message}`);
  }
  return data as Payment;
}

// ============================================================
// RECEIPTS
// ============================================================

export async function findReceipts(
  params: PaginationParams & { patientId?: string }
): Promise<PaginatedResult<ReceiptWithDetails>> {
  const supabase = await createServerSupabaseClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('receipts')
    .select(`
      *,
      invoice:invoices (id, invoice_number, total),
      patient:patients (id, first_name, last_name, patient_number),
      payment:payments (*)
    `, { count: 'exact' });

  if (params.patientId) query = query.eq('patient_id', params.patientId);

  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to fetch receipts: ${error.message}`);

  return {
    data: (data ?? []) as unknown as ReceiptWithDetails[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function findReceiptById(id: string): Promise<ReceiptWithDetails | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      invoice:invoices (id, invoice_number, total),
      patient:patients (id, first_name, last_name, patient_number),
      payment:payments (*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as unknown as ReceiptWithDetails;
}

export async function insertReceipt(
  receipt: Omit<Receipt, 'id' | 'receipt_number' | 'created_at'>
): Promise<Receipt> {
  const supabase = await createServerSupabaseClient();

  // Leave receipt_number empty so the DB trigger assigns HT-XXXXXX from the sequence
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      ...receipt,
      receipt_number: null as unknown as string,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create receipt: ${error.message}`);
  return data as Receipt;
}

// ============================================================
// EXPENSES
// ============================================================

export async function findExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch expense categories: ${error.message}`);
  return data as ExpenseCategory[];
}

export async function findExpenses(
  params: PaginationParams & {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<PaginatedResult<ExpenseWithCategory>> {
  const supabase = await createServerSupabaseClient();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('expenses')
    .select(`
      *,
      category:expense_categories (id, name),
      created_by_profile:profiles!expenses_created_by_fkey (first_name, last_name)
    `, { count: 'exact' })
    .is('deleted_at', null);

  if (params.categoryId) query = query.eq('category_id', params.categoryId);
  if (params.startDate) query = query.gte('date', params.startDate);
  if (params.endDate) query = query.lte('date', params.endDate);

  query = query.order('date', { ascending: false }).order('created_at', { ascending: false });
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to fetch expenses: ${error.message}`);

  return {
    data: (data ?? []) as unknown as ExpenseWithCategory[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

export async function insertExpense(
  expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Expense> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();

  if (error) throw new Error(`Failed to create expense: ${error.message}`);
  return data as Expense;
}

export async function softDeleteExpense(id: string, updatedBy: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString(), updated_by: updatedBy })
    .eq('id', id);

  if (error) throw new Error(`Failed to delete expense: ${error.message}`);
}
