// ============================================================
// HAPPY TOOTH v2 — Financial Service (Business Logic Layer)
// ============================================================
// Enforces server-side calculations, idempotency checks,
// integrity guards against overpayments and race conditions.
// ============================================================

import { requireAuth } from '@/server/auth/session';
import { assertBillingAccess, assertPermission } from '@/server/authorization/rbac';
import { recordAuditLog } from '@/server/services/audit-service';
import {
  findInvoices,
  findInvoiceById,
  insertInvoice,
  updateInvoiceStatus,
  findPayments,
  insertPayment,
  findReceipts,
  findReceiptById,
  insertReceipt,
  findExpenses,
  findExpenseCategories,
  insertExpense,
  softDeleteExpense,
} from '@/server/repositories/financial-repository';
import {
  createInvoiceSchema,
  createPaymentSchema,
  createExpenseSchema,
} from '@/lib/validation/schemas';
import { roundFinancial } from '@/lib/utils';
import type {
  ActionResult,
  Invoice,
  InvoiceWithDetails,
  Payment,
  PaymentWithDetails,
  ReceiptWithDetails,
  ExpenseWithCategory,
  ExpenseCategory,
  InvoiceStatus,
  PaginatedResult,
  PaginationParams,
} from '@/types';

// ============================================================
// INVOICES
// ============================================================

export async function getInvoices(
  params: PaginationParams & { patientId?: string; status?: InvoiceStatus; startDate?: string; endDate?: string }
): Promise<ActionResult<PaginatedResult<InvoiceWithDetails>>> {
  try {
    const user = await requireAuth();
    assertBillingAccess(user);
    assertPermission(user, 'invoices.view');
    const result = await findInvoices(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch invoices' };
  }
}

export async function getInvoice(id: string): Promise<ActionResult<InvoiceWithDetails>> {
  try {
    const user = await requireAuth();
    assertBillingAccess(user);
    assertPermission(user, 'invoices.view');
    const invoice = await findInvoiceById(id);
    if (!invoice) return { success: false, error: 'Invoice not found' };
    return { success: true, data: invoice };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch invoice' };
  }
}

export async function createInvoice(input: unknown): Promise<ActionResult<InvoiceWithDetails>> {
  try {
    const user = await requireAuth();
    assertBillingAccess(user);
    assertPermission(user, 'invoices.create');

    const validation = createInvoiceSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { items, discount_type, discount_value, ...data } = validation.data;

    // Server-side financial calculations
    const subtotal = roundFinancial(
      items.reduce((sum, item) => sum + roundFinancial(item.quantity * item.unit_price), 0)
    );

    let discountAmount = 0;
    if (discount_type === 'percentage') {
      discountAmount = roundFinancial((subtotal * discount_value) / 100);
    } else if (discount_type === 'fixed') {
      discountAmount = Math.min(roundFinancial(discount_value), subtotal);
    }

    const total = roundFinancial(Math.max(subtotal - discountAmount, 0));
    const outstanding = total;

    const invoice = await insertInvoice(
      {
        patient_id: data.patient_id,
        visit_id: data.visit_id || null,
        treatment_plan_id: data.treatment_plan_id || null,
        status: 'sent',
        subtotal,
        discount_type: discount_type || null,
        discount_value,
        discount_amount: discountAmount,
        total,
        amount_paid: 0,
        outstanding_balance: outstanding,
        notes: data.notes || null,
        due_date: data.due_date || null,
        created_by: user.id,
        updated_by: user.id,
      },
      items.map(item => ({
        procedure_id: item.procedure_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: roundFinancial(item.quantity * item.unit_price),
        sort_order: 0,
      }))
    );

    await recordAuditLog({
      actorId: user.id,
      action: 'invoice_created',
      entityType: 'invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoice_number, total, patientId: invoice.patient_id },
    });

    return { success: true, data: invoice };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create invoice' };
  }
}

export async function cancelInvoice(id: string): Promise<ActionResult<Invoice>> {
  try {
    const user = await requireAuth();
    assertBillingAccess(user);
    assertPermission(user, 'invoices.cancel');

    const invoice = await findInvoiceById(id);
    if (!invoice) return { success: false, error: 'Invoice not found' };
    if (invoice.amount_paid > 0) {
      return { success: false, error: 'Cannot cancel invoice with recorded payments. Issue a refund instead.' };
    }

    const updated = await updateInvoiceStatus(id, 'cancelled', user.id);

    await recordAuditLog({
      actorId: user.id,
      action: 'invoice_cancelled',
      entityType: 'invoice',
      entityId: id,
      metadata: { invoiceNumber: invoice.invoice_number },
    });

    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel invoice' };
  }
}

// ============================================================
// PAYMENTS & RECEIPTS
// ============================================================

export async function getPayments(
  params: PaginationParams & { patientId?: string; invoiceId?: string; startDate?: string; endDate?: string }
): Promise<ActionResult<PaginatedResult<PaymentWithDetails>>> {
  try {
    const user = await requireAuth();
    assertBillingAccess(user);
    assertPermission(user, 'payments.view');
    const result = await findPayments(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch payments' };
  }
}

export async function recordPayment(input: unknown): Promise<ActionResult<Payment>> {
  try {
    const user = await requireAuth();
    assertBillingAccess(user);
    assertPermission(user, 'payments.create');

    const validation = createPaymentSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = validation.data;
    const invoice = await findInvoiceById(data.invoice_id);
    if (!invoice) return { success: false, error: 'Invoice not found' };

    if (invoice.status === 'cancelled' || invoice.status === 'refunded') {
      return { success: false, error: `Cannot accept payment on a ${invoice.status} invoice.` };
    }

    if (invoice.status === 'paid' || invoice.outstanding_balance <= 0) {
      return { success: false, error: 'This invoice is already fully paid.' };
    }

    // Overpayment protection
    const paymentAmount = roundFinancial(data.amount);
    if (paymentAmount > invoice.outstanding_balance) {
      return {
        success: false,
        error: `Payment amount (${paymentAmount}) exceeds outstanding balance (${invoice.outstanding_balance}).`,
      };
    }

    const payment = await insertPayment({
      invoice_id: data.invoice_id,
      patient_id: data.patient_id,
      amount: paymentAmount,
      method: data.method,
      reference: data.reference || null,
      notes: data.notes || null,
      idempotency_key: data.idempotency_key,
      created_by: user.id,
    });

    const balanceAfter = roundFinancial(invoice.outstanding_balance - paymentAmount);

    // Auto-generate receipt
    await insertReceipt({
      payment_id: payment.id,
      invoice_id: payment.invoice_id,
      patient_id: payment.patient_id,
      amount: payment.amount,
      method: payment.method,
      balance_after: balanceAfter,
      created_by: user.id,
    });

    await recordAuditLog({
      actorId: user.id,
      action: 'payment_created',
      entityType: 'payment',
      entityId: payment.id,
      metadata: {
        invoiceId: payment.invoice_id,
        amount: payment.amount,
        method: payment.method,
        balanceAfter,
      },
    });

    return { success: true, data: payment };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to record payment' };
  }
}

export async function getReceipts(
  params: PaginationParams & { patientId?: string }
): Promise<ActionResult<PaginatedResult<ReceiptWithDetails>>> {
  try {
    const user = await requireAuth();
    assertBillingAccess(user);
    assertPermission(user, 'receipts.view');
    const result = await findReceipts(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch receipts' };
  }
}

export async function getReceipt(id: string): Promise<ActionResult<ReceiptWithDetails>> {
  try {
    const user = await requireAuth();
    assertBillingAccess(user);
    assertPermission(user, 'receipts.view');
    const receipt = await findReceiptById(id);
    if (!receipt) return { success: false, error: 'Receipt not found' };
    return { success: true, data: receipt };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch receipt' };
  }
}

// ============================================================
// EXPENSES
// ============================================================

export async function getExpenseCategories(): Promise<ActionResult<ExpenseCategory[]>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'expenses.view');
    const categories = await findExpenseCategories();
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch expense categories' };
  }
}

export async function getExpenses(
  params: PaginationParams & { categoryId?: string; startDate?: string; endDate?: string }
): Promise<ActionResult<PaginatedResult<ExpenseWithCategory>>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'expenses.view');
    const result = await findExpenses(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch expenses' };
  }
}

export async function createExpense(input: unknown): Promise<ActionResult<ExpenseWithCategory>> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'expenses.create');

    const validation = createExpenseSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const data = validation.data;
    const expense = await insertExpense({
      category_id: data.category_id,
      amount: roundFinancial(data.amount),
      date: data.date,
      description: data.description,
      method: data.method,
      reference: data.reference || null,
      created_by: user.id,
      updated_by: user.id,
    });

    await recordAuditLog({
      actorId: user.id,
      action: 'expense_created',
      entityType: 'expense',
      entityId: expense.id,
      metadata: { amount: expense.amount, categoryId: expense.category_id },
    });

    return { success: true, data: expense };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to record expense' };
  }
}

export async function removeExpense(id: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    assertPermission(user, 'expenses.delete');

    await softDeleteExpense(id, user.id);

    await recordAuditLog({
      actorId: user.id,
      action: 'expense_deleted',
      entityType: 'expense',
      entityId: id,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete expense' };
  }
}
