// ============================================================
// HAPPY TOOTH v2 — Core Type Definitions
// ============================================================

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'dentist'
  | 'receptionist'
  | 'accountant';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type VisitStatus = 'in_progress' | 'completed';

export type TreatmentPlanStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TreatmentItemStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'mobile_money'
  | 'card'
  | 'other';

export type GenderType = 'male' | 'female' | 'other';

export type AuditAction =
  | 'patient_created'
  | 'patient_updated'
  | 'patient_deleted'
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'visit_created'
  | 'visit_completed'
  | 'clinical_note_created'
  | 'clinical_note_updated'
  | 'procedure_created'
  | 'procedure_updated'
  | 'treatment_plan_created'
  | 'treatment_plan_updated'
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_cancelled'
  | 'payment_created'
  | 'payment_updated'
  | 'receipt_generated'
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'user_created'
  | 'user_updated'
  | 'user_deactivated'
  | 'role_changed'
  | 'settings_changed';

// ============================================================
// IDENTITY & ACCESS
// ============================================================

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  permission_id: string;
  created_at: string;
}

export interface AuthenticatedUser extends Profile {
  permissions: string[];
}

// ============================================================
// PATIENTS
// ============================================================

export interface Patient {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: GenderType | null;
  email: string | null;
  phone: string | null;
  alt_phone: string | null;
  address: string | null;
  city: string | null;
  occupation: string | null;
  national_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PatientContact {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  is_emergency: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientMedicalProfile {
  id: string;
  patient_id: string;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: string[];
  previous_dental_history: string | null;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientWithDetails extends Patient {
  contacts?: PatientContact[];
  medical_profile?: PatientMedicalProfile | null;
  outstanding_balance?: number;
}

// ============================================================
// APPOINTMENTS
// ============================================================

export interface Appointment {
  id: string;
  patient_id: string;
  practitioner_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export interface AppointmentWithDetails extends Appointment {
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'phone' | 'patient_number'>;
  practitioner?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'role'>;
}

// ============================================================
// CLINICAL
// ============================================================

export interface Visit {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  practitioner_id: string;
  status: VisitStatus;
  chief_complaint: string | null;
  examination_notes: string | null;
  diagnosis: string | null;
  treatment_notes: string | null;
  visit_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface VisitWithDetails extends Visit {
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'patient_number'>;
  practitioner?: Pick<Profile, 'id' | 'first_name' | 'last_name'>;
  notes?: ClinicalNote[];
}

export interface ClinicalNote {
  id: string;
  visit_id: string;
  practitioner_id: string;
  note_type: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PROCEDURES
// ============================================================

export interface ProcedureCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Procedure {
  id: string;
  category_id: string | null;
  code: string | null;
  name: string;
  description: string | null;
  default_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcedureWithCategory extends Procedure {
  category?: ProcedureCategory;
}

// ============================================================
// TREATMENT PLANS
// ============================================================

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  visit_id: string | null;
  practitioner_id: string;
  title: string;
  description: string | null;
  status: TreatmentPlanStatus;
  estimated_total: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlanItem {
  id: string;
  treatment_plan_id: string;
  procedure_id: string | null;
  description: string;
  tooth_number: string | null;
  quantity: number;
  unit_price: number;
  status: TreatmentItemStatus;
  planned_date: string | null;
  completed_date: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlanWithItems extends TreatmentPlan {
  items?: (TreatmentPlanItem & { procedure?: Procedure })[];
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'patient_number'>;
  practitioner?: Pick<Profile, 'id' | 'first_name' | 'last_name'>;
}

// ============================================================
// INVOICES
// ============================================================

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  visit_id: string | null;
  treatment_plan_id: string | null;
  status: InvoiceStatus;
  subtotal: number;
  discount_type: 'percentage' | 'fixed' | null;
  discount_value: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  outstanding_balance: number;
  notes: string | null;
  due_date: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  procedure_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
  created_at: string;
}

export interface InvoiceWithDetails extends Invoice {
  items?: (InvoiceItem & { procedure?: Procedure })[];
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'patient_number' | 'phone' | 'email'>;
  payments?: Payment[];
}

// ============================================================
// PAYMENTS
// ============================================================

export interface Payment {
  id: string;
  invoice_id: string;
  patient_id: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  idempotency_key: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithDetails extends Payment {
  invoice?: Pick<Invoice, 'id' | 'invoice_number' | 'total' | 'outstanding_balance'>;
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'patient_number'>;
  created_by_profile?: Pick<Profile, 'first_name' | 'last_name'>;
}

// ============================================================
// RECEIPTS
// ============================================================

export interface Receipt {
  id: string;
  receipt_number: string;
  payment_id: string;
  invoice_id: string;
  patient_id: string;
  amount: number;
  method: PaymentMethod;
  balance_after: number;
  created_by: string | null;
  created_at: string;
}

export interface ReceiptWithDetails extends Receipt {
  payment?: Payment;
  invoice?: Pick<Invoice, 'id' | 'invoice_number' | 'total'>;
  patient?: Pick<Patient, 'id' | 'first_name' | 'last_name' | 'patient_number'>;
}

// ============================================================
// EXPENSES
// ============================================================

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  category_id: string;
  amount: number;
  date: string;
  description: string;
  method: PaymentMethod;
  reference: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ExpenseWithCategory extends Expense {
  category?: ExpenseCategory;
  created_by_profile?: Pick<Profile, 'first_name' | 'last_name'>;
}

// ============================================================
// SYSTEM & AUDIT
// ============================================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ClinicSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogWithActor extends AuditLog {
  actor?: Pick<Profile, 'first_name' | 'last_name' | 'email'>;
}

// ============================================================
// RESPONSE & PAGINATION
// ============================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================
// DASHBOARD & REPORTS
// ============================================================

export interface DashboardStats {
  totalPatients: number;
  todaysAppointments: number;
  completedVisitsThisMonth: number;
  revenueThisMonth: number;
  outstandingBalances: number;
  expensesThisMonth: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  expenses: number;
}

export interface AppointmentStatusCount {
  status: AppointmentStatus;
  count: number;
}
