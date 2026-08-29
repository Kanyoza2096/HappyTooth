// ============================================================
// HAPPY TOOTH v2 — Zod Validation Schemas
// ============================================================
// Server-side validation is MANDATORY.
// Client-side validation is supplementary only.
// ============================================================

import { z } from 'zod';

// ============================================================
// COMMON VALIDATORS
// ============================================================

const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`).trim();

const optionalString = z.string().trim().nullish().transform(v => v || null);

const positiveNumber = (field: string) =>
  z.number().positive(`${field} must be greater than zero`);

const nonNegativeNumber = (field: string) =>
  z.number().min(0, `${field} cannot be negative`);

const validEmail = z
  .string()
  .email('Invalid email address')
  .trim()
  .toLowerCase()
  .nullish()
  .transform(v => v || null);

const validPhone = z
  .string()
  .trim()
  .nullish()
  .transform(v => v || null);

const validUUID = z.string().uuid('Invalid ID format');

const validDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

const validTime = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)');

// ============================================================
// PATIENT SCHEMAS
// ============================================================

export const createPatientSchema = z.object({
  first_name: requiredString('First name').max(100, 'First name is too long'),
  last_name: requiredString('Last name').max(100, 'Last name is too long'),
  date_of_birth: z.string().nullish().transform(v => v || null),
  gender: z.enum(['male', 'female', 'other']).nullish().transform(v => v || null),
  email: validEmail,
  phone: validPhone,
  alt_phone: validPhone,
  address: optionalString,
  city: optionalString,
  occupation: optionalString,
  national_id: optionalString,
  notes: optionalString,
});

export const updatePatientSchema = createPatientSchema.partial().extend({
  id: validUUID,
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// ============================================================
// PATIENT CONTACT SCHEMAS
// ============================================================

export const patientContactSchema = z.object({
  patient_id: validUUID,
  name: requiredString('Contact name').max(100),
  relationship: requiredString('Relationship'),
  phone: requiredString('Phone number'),
  email: validEmail,
  is_emergency: z.boolean().default(false),
});

export type PatientContactInput = z.infer<typeof patientContactSchema>;

// ============================================================
// PATIENT MEDICAL PROFILE SCHEMAS
// ============================================================

export const patientMedicalProfileSchema = z.object({
  patient_id: validUUID,
  blood_type: optionalString,
  allergies: z.array(z.string()).default([]),
  chronic_conditions: z.array(z.string()).default([]),
  current_medications: z.array(z.string()).default([]),
  previous_dental_history: optionalString,
  medical_notes: optionalString,
});

export type PatientMedicalProfileInput = z.infer<typeof patientMedicalProfileSchema>;

// ============================================================
// APPOINTMENT SCHEMAS
// ============================================================

export const createAppointmentSchema = z.object({
  patient_id: validUUID,
  practitioner_id: validUUID,
  date: validDate,
  start_time: validTime,
  end_time: validTime,
  reason: optionalString,
  notes: optionalString,
}).refine(
  (data) => data.end_time > data.start_time,
  { message: 'End time must be after start time', path: ['end_time'] }
);

export const updateAppointmentSchema = z.object({
  id: validUUID,
  patient_id: validUUID.optional(),
  practitioner_id: validUUID.optional(),
  date: validDate.optional(),
  start_time: validTime.optional(),
  end_time: validTime.optional(),
  reason: optionalString,
  notes: optionalString,
});

export const cancelAppointmentSchema = z.object({
  id: validUUID,
  cancellation_reason: optionalString,
});

export const updateAppointmentStatusSchema = z.object({
  id: validUUID,
  status: z.enum([
    'scheduled', 'confirmed', 'waiting',
    'in_progress', 'completed', 'cancelled', 'no_show',
  ]),
  cancellation_reason: optionalString,
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

// ============================================================
// VISIT SCHEMAS
// ============================================================

export const createVisitSchema = z.object({
  patient_id: validUUID,
  appointment_id: validUUID.nullish().transform(v => v || null),
  practitioner_id: validUUID,
  chief_complaint: optionalString,
  examination_notes: optionalString,
  diagnosis: optionalString,
  treatment_notes: optionalString,
  visit_date: validDate.optional(),
});

export const updateVisitSchema = z.object({
  id: validUUID,
  chief_complaint: optionalString,
  examination_notes: optionalString,
  diagnosis: optionalString,
  treatment_notes: optionalString,
  status: z.enum(['in_progress', 'completed']).optional(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;

// ============================================================
// CLINICAL NOTE SCHEMAS
// ============================================================

export const clinicalNoteSchema = z.object({
  visit_id: validUUID,
  note_type: z.enum(['general', 'examination', 'treatment', 'follow_up']).default('general'),
  content: requiredString('Note content'),
  is_private: z.boolean().default(false),
});

export type ClinicalNoteInput = z.infer<typeof clinicalNoteSchema>;

// ============================================================
// PROCEDURE SCHEMAS
// ============================================================

export const procedureSchema = z.object({
  category_id: validUUID.nullish().transform(v => v || null),
  code: optionalString,
  name: requiredString('Procedure name').max(200),
  description: optionalString,
  default_price: nonNegativeNumber('Default price'),
  is_active: z.boolean().default(true),
});

export type ProcedureInput = z.infer<typeof procedureSchema>;

// ============================================================
// TREATMENT PLAN SCHEMAS
// ============================================================

export const createTreatmentPlanSchema = z.object({
  patient_id: validUUID,
  visit_id: validUUID.nullish().transform(v => v || null),
  practitioner_id: validUUID,
  title: requiredString('Treatment plan title').max(200),
  description: optionalString,
  items: z.array(z.object({
    procedure_id: validUUID.nullish().transform(v => v || null),
    description: requiredString('Item description'),
    tooth_number: optionalString,
    quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
    unit_price: nonNegativeNumber('Unit price'),
    planned_date: z.string().nullish().transform(v => v || null),
    notes: optionalString,
  })).min(1, 'At least one item is required'),
});

export const updateTreatmentPlanItemStatusSchema = z.object({
  id: validUUID,
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
  completed_date: z.string().nullish().transform(v => v || null),
});

export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>;

// ============================================================
// INVOICE SCHEMAS
// ============================================================

export const createInvoiceSchema = z.object({
  patient_id: validUUID,
  visit_id: validUUID.nullish().transform(v => v || null),
  treatment_plan_id: validUUID.nullish().transform(v => v || null),
  discount_type: z.enum(['percentage', 'fixed']).nullish().transform(v => v || null),
  discount_value: nonNegativeNumber('Discount').default(0),
  notes: optionalString,
  due_date: z.string().nullish().transform(v => v || null),
  items: z.array(z.object({
    procedure_id: validUUID.nullish().transform(v => v || null),
    description: requiredString('Item description'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unit_price: nonNegativeNumber('Unit price'),
  })).min(1, 'At least one item is required'),
}).refine(
  (data) => {
    if (data.discount_type === 'percentage' && data.discount_value > 100) {
      return false;
    }
    return true;
  },
  { message: 'Percentage discount cannot exceed 100%', path: ['discount_value'] }
);

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ============================================================
// PAYMENT SCHEMAS
// ============================================================

export const createPaymentSchema = z.object({
  invoice_id: validUUID,
  patient_id: validUUID,
  amount: positiveNumber('Payment amount'),
  method: z.enum(['cash', 'bank_transfer', 'mobile_money', 'card', 'other']),
  reference: optionalString,
  notes: optionalString,
  idempotency_key: requiredString('Idempotency key'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ============================================================
// EXPENSE SCHEMAS
// ============================================================

export const createExpenseSchema = z.object({
  category_id: validUUID,
  amount: positiveNumber('Expense amount'),
  date: validDate,
  description: requiredString('Description').max(500),
  method: z.enum(['cash', 'bank_transfer', 'mobile_money', 'card', 'other']).default('cash'),
  reference: optionalString,
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: validUUID,
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// ============================================================
// USER / AUTH SCHEMAS
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: requiredString('First name').max(100),
  last_name: requiredString('Last name').max(100),
  phone: validPhone,
  role: z.enum(['super_admin', 'admin', 'dentist', 'receptionist', 'accountant']),
});

export const updateUserSchema = z.object({
  id: validUUID,
  first_name: requiredString('First name').max(100).optional(),
  last_name: requiredString('Last name').max(100).optional(),
  phone: validPhone,
  role: z.enum(['super_admin', 'admin', 'dentist', 'receptionist', 'accountant']).optional(),
  is_active: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================================
// CLINIC SETTINGS SCHEMAS
// ============================================================

export const updateClinicSettingsSchema = z.object({
  clinic_name: requiredString('Clinic name').optional(),
  clinic_address: optionalString,
  clinic_city: optionalString,
  clinic_phone: optionalString,
  clinic_email: validEmail,
  clinic_website: optionalString,
  currency_code: z.string().length(3, 'Currency code must be 3 characters').optional(),
  currency_symbol: z.string().max(5).optional(),
  appointment_slot_minutes: z.number().int().min(5).max(240).optional(),
  working_hours_start: validTime.optional(),
  working_hours_end: validTime.optional(),
  invoice_due_days: z.number().int().min(0).max(365).optional(),
});

export type UpdateClinicSettingsInput = z.infer<typeof updateClinicSettingsSchema>;
