-- ========== 001_initial_schema.sql ==========

-- ============================================================
-- HAPPY TOOTH v2 — Initial Schema
-- 001_initial_schema.sql
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'dentist', 'receptionist', 'accountant');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE visit_status AS ENUM ('in_progress', 'completed');
CREATE TYPE treatment_plan_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE treatment_item_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'mobile_money', 'card', 'other');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');

-- ============================================================
-- HELPER: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- IDENTITY & ACCESS
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'receptionist',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- ============================================================
-- PATIENTS
-- ============================================================

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender gender_type,
  email TEXT,
  phone TEXT,
  alt_phone TEXT,
  address TEXT,
  city TEXT,
  occupation TEXT,
  national_id TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER set_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE patient_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_patient_contacts_updated_at
  BEFORE UPDATE ON patient_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE patient_medical_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  blood_type TEXT,
  allergies TEXT[] NOT NULL DEFAULT '{}',
  chronic_conditions TEXT[] NOT NULL DEFAULT '{}',
  current_medications TEXT[] NOT NULL DEFAULT '{}',
  previous_dental_history TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_patient_medical_profiles_updated_at
  BEFORE UPDATE ON patient_medical_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES profiles(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CLINICAL
-- ============================================================

CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  practitioner_id UUID NOT NULL REFERENCES profiles(id),
  status visit_status NOT NULL DEFAULT 'in_progress',
  chief_complaint TEXT,
  examination_notes TEXT,
  diagnosis TEXT,
  treatment_notes TEXT,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TRIGGER set_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES profiles(id),
  note_type TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_clinical_notes_updated_at
  BEFORE UPDATE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PROCEDURES
-- ============================================================

CREATE TABLE procedure_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES procedure_categories(id),
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  default_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_procedures_updated_at
  BEFORE UPDATE ON procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TREATMENT PLANS
-- ============================================================

CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES visits(id),
  practitioner_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status treatment_plan_status NOT NULL DEFAULT 'planned',
  estimated_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_treatment_plans_updated_at
  BEFORE UPDATE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE treatment_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES procedures(id),
  description TEXT NOT NULL,
  tooth_number TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  status treatment_item_status NOT NULL DEFAULT 'planned',
  planned_date DATE,
  completed_date DATE,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_treatment_plan_items_updated_at
  BEFORE UPDATE ON treatment_plan_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES visits(id),
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  status invoice_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  outstanding_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  due_date DATE,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES procedures(id),
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  amount NUMERIC(12,2) NOT NULL,
  method payment_method NOT NULL DEFAULT 'cash',
  reference TEXT,
  notes TEXT,
  idempotency_key TEXT UNIQUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RECEIPTS
-- ============================================================

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number TEXT NOT NULL UNIQUE,
  payment_id UUID NOT NULL REFERENCES payments(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  amount NUMERIC(12,2) NOT NULL,
  method payment_method NOT NULL DEFAULT 'cash',
  balance_after NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPENSES
-- ============================================================

CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  method payment_method NOT NULL DEFAULT 'cash',
  reference TEXT,
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SYSTEM & AUDIT
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  entity_type TEXT,
  entity_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clinic_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ========== 002_rls_policies.sql ==========

-- ============================================================
-- HAPPY TOOTH v2 — Row Level Security Policies
-- 002_rls_policies.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Helper Functions
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_clinical_staff()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('super_admin', 'admin', 'dentist');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_billing_access()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('super_admin', 'admin', 'accountant');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_authenticated_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES: All authenticated staff can view, admins can manage
-- ============================================================

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "profiles_update_self" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "profiles_insert_admin" ON profiles
  FOR INSERT TO authenticated WITH CHECK (is_admin());

-- ============================================================
-- PERMISSIONS & ROLE_PERMISSIONS: Read-only for all, admin manages
-- ============================================================

CREATE POLICY "permissions_select" ON permissions
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "role_permissions_select" ON role_permissions
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "role_permissions_manage" ON role_permissions
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================
-- PATIENTS: All staff can read, receptionist+ can write
-- ============================================================

CREATE POLICY "patients_select" ON patients
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "patients_insert" ON patients
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "patients_update" ON patients
  FOR UPDATE TO authenticated USING (is_authenticated_staff());

-- Patient contacts & medical profiles follow same policy
CREATE POLICY "patient_contacts_select" ON patient_contacts
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "patient_contacts_insert" ON patient_contacts
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "patient_contacts_update" ON patient_contacts
  FOR UPDATE TO authenticated USING (is_authenticated_staff());

CREATE POLICY "patient_contacts_delete" ON patient_contacts
  FOR DELETE TO authenticated USING (is_authenticated_staff());

CREATE POLICY "patient_medical_profiles_select" ON patient_medical_profiles
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "patient_medical_profiles_insert" ON patient_medical_profiles
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "patient_medical_profiles_update" ON patient_medical_profiles
  FOR UPDATE TO authenticated USING (is_authenticated_staff());

-- ============================================================
-- APPOINTMENTS: All staff can read, receptionist+ can manage
-- ============================================================

CREATE POLICY "appointments_select" ON appointments
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE TO authenticated USING (is_authenticated_staff());

-- ============================================================
-- CLINICAL: All staff can read, clinical staff can write
-- ============================================================

CREATE POLICY "visits_select" ON visits
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "visits_insert" ON visits
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "visits_update" ON visits
  FOR UPDATE TO authenticated USING (is_authenticated_staff());

CREATE POLICY "clinical_notes_select" ON clinical_notes
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "clinical_notes_insert" ON clinical_notes
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "clinical_notes_update" ON clinical_notes
  FOR UPDATE TO authenticated
  USING (practitioner_id = auth.uid() OR is_admin());

-- ============================================================
-- PROCEDURES: All staff can read, admin can manage
-- ============================================================

CREATE POLICY "procedure_categories_select" ON procedure_categories
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "procedure_categories_manage" ON procedure_categories
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "procedures_select" ON procedures
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "procedures_insert" ON procedures
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "procedures_update" ON procedures
  FOR UPDATE TO authenticated USING (is_admin());

-- ============================================================
-- TREATMENT PLANS: All staff read, clinical staff manage
-- ============================================================

CREATE POLICY "treatment_plans_select" ON treatment_plans
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "treatment_plans_insert" ON treatment_plans
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "treatment_plans_update" ON treatment_plans
  FOR UPDATE TO authenticated USING (is_authenticated_staff());

CREATE POLICY "treatment_plan_items_select" ON treatment_plan_items
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "treatment_plan_items_insert" ON treatment_plan_items
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "treatment_plan_items_update" ON treatment_plan_items
  FOR UPDATE TO authenticated USING (is_authenticated_staff());

CREATE POLICY "treatment_plan_items_delete" ON treatment_plan_items
  FOR DELETE TO authenticated USING (is_authenticated_staff());

-- ============================================================
-- FINANCIAL: All staff read, billing access for write
-- ============================================================

CREATE POLICY "invoices_select" ON invoices
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE TO authenticated USING (is_authenticated_staff());

CREATE POLICY "invoice_items_select" ON invoice_items
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "invoice_items_insert" ON invoice_items
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "payments_select" ON payments
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "payments_insert" ON payments
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "payments_update" ON payments
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "receipts_select" ON receipts
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "receipts_insert" ON receipts
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

-- ============================================================
-- EXPENSES: All staff read, billing access manages
-- ============================================================

CREATE POLICY "expense_categories_select" ON expense_categories
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "expense_categories_manage" ON expense_categories
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "expenses_select" ON expenses
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "expenses_insert" ON expenses
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());

CREATE POLICY "expenses_update" ON expenses
  FOR UPDATE TO authenticated USING (is_authenticated_staff());

-- ============================================================
-- SYSTEM
-- ============================================================

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "clinic_settings_select" ON clinic_settings
  FOR SELECT TO authenticated USING (is_authenticated_staff());

CREATE POLICY "clinic_settings_manage" ON clinic_settings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (is_authenticated_staff());


-- ========== 003_functions.sql ==========

-- ============================================================
-- HAPPY TOOTH v2 — Database Functions & Triggers
-- 003_functions.sql
-- ============================================================

-- ============================================================
-- Sequential Number Generators (collision-safe)
-- ============================================================

-- Patient Number: HT-PXXXXXX
CREATE SEQUENCE IF NOT EXISTS patient_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.patient_number := 'HT-P' || LPAD(nextval('patient_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_patient_number
  BEFORE INSERT ON patients
  FOR EACH ROW
  WHEN (NEW.patient_number IS NULL OR NEW.patient_number = '')
  EXECUTE FUNCTION generate_patient_number();

-- Invoice Number: INV-XXXXXX
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- Receipt Number: HT-XXXXXX
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number := 'HT-' || LPAD(nextval('receipt_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_receipt_number
  BEFORE INSERT ON receipts
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL OR NEW.receipt_number = '')
  EXECUTE FUNCTION generate_receipt_number();

-- ============================================================
-- Invoice Line Total Auto-Calculation
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_line_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.line_total := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_item_line_total
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION calculate_line_total();

-- ============================================================
-- Invoice Totals Auto-Recalculation
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal NUMERIC(12,2);
  v_discount NUMERIC(12,2);
  v_total NUMERIC(12,2);
  v_paid NUMERIC(12,2);
  v_invoice invoices%ROWTYPE;
BEGIN
  -- Determine the invoice_id
  IF TG_TABLE_NAME = 'invoice_items' THEN
    SELECT * INTO v_invoice FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  ELSIF TG_TABLE_NAME = 'payments' THEN
    SELECT * INTO v_invoice FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;

  IF v_invoice.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate subtotal from items
  SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
  FROM invoice_items WHERE invoice_id = v_invoice.id;

  -- Calculate discount
  IF v_invoice.discount_type = 'percentage' THEN
    v_discount := ROUND(v_subtotal * v_invoice.discount_value / 100, 2);
  ELSIF v_invoice.discount_type = 'fixed' THEN
    v_discount := v_invoice.discount_value;
  ELSE
    v_discount := 0;
  END IF;

  v_total := v_subtotal - v_discount;

  -- Calculate amount paid
  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM payments WHERE invoice_id = v_invoice.id;

  -- Update invoice
  UPDATE invoices SET
    subtotal = v_subtotal,
    discount_amount = v_discount,
    total = v_total,
    amount_paid = v_paid,
    outstanding_balance = v_total - v_paid,
    status = CASE
      WHEN v_paid >= v_total AND v_total > 0 THEN 'paid'::invoice_status
      WHEN v_paid > 0 AND v_paid < v_total THEN 'partially_paid'::invoice_status
      ELSE v_invoice.status
    END
  WHERE id = v_invoice.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_invoice_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION recalculate_invoice_totals();

CREATE TRIGGER recalc_invoice_on_payment_change
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION recalculate_invoice_totals();

-- ============================================================
-- Auth User Profile Trigger
-- Creates a profile row when a new auth user signs up
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Staff'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Member'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'receptionist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ========== 004_indexes.sql ==========

-- ============================================================
-- HAPPY TOOTH v2 — Performance Indexes
-- 004_indexes.sql
-- ============================================================

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Patients
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_number ON patients(patient_number);
CREATE INDEX idx_patients_active ON patients(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_search ON patients USING gin (
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(patient_number, ''))
);

-- Patient Contacts
CREATE INDEX idx_patient_contacts_patient ON patient_contacts(patient_id);

-- Patient Medical Profiles
CREATE INDEX idx_patient_medical_patient ON patient_medical_profiles(patient_id);

-- Appointments
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_practitioner ON appointments(practitioner_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_practitioner ON appointments(date, practitioner_id);

-- Visits
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_practitioner ON visits(practitioner_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_appointment ON visits(appointment_id);

-- Clinical Notes
CREATE INDEX idx_clinical_notes_visit ON clinical_notes(visit_id);
CREATE INDEX idx_clinical_notes_practitioner ON clinical_notes(practitioner_id);

-- Procedures
CREATE INDEX idx_procedures_category ON procedures(category_id);
CREATE INDEX idx_procedures_active ON procedures(is_active);

-- Treatment Plans
CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_practitioner ON treatment_plans(practitioner_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX idx_treatment_plan_items_plan ON treatment_plan_items(treatment_plan_id);

-- Invoices
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_created ON invoices(created_at);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Payments
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_created ON payments(created_at);
CREATE INDEX idx_payments_idempotency ON payments(idempotency_key);

-- Receipts
CREATE INDEX idx_receipts_payment ON receipts(payment_id);
CREATE INDEX idx_receipts_invoice ON receipts(invoice_id);
CREATE INDEX idx_receipts_patient ON receipts(patient_id);
CREATE INDEX idx_receipts_number ON receipts(receipt_number);

-- Expenses
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_active ON expenses(deleted_at) WHERE deleted_at IS NULL;

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Audit Logs
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);


-- ========== seed.sql ==========

-- ============================================================
-- HAPPY TOOTH v2 — Seed Data
-- seed.sql
-- ============================================================

-- ============================================================
-- PERMISSIONS
-- ============================================================

INSERT INTO permissions (name, description, module) VALUES
  -- Patient module
  ('patients.view', 'View patient records', 'patients'),
  ('patients.create', 'Create new patients', 'patients'),
  ('patients.edit', 'Edit patient records', 'patients'),
  ('patients.delete', 'Delete patient records', 'patients'),
  -- Appointments module
  ('appointments.view', 'View appointments', 'appointments'),
  ('appointments.create', 'Create appointments', 'appointments'),
  ('appointments.edit', 'Edit appointments', 'appointments'),
  ('appointments.cancel', 'Cancel appointments', 'appointments'),
  -- Clinical module
  ('clinical.view', 'View clinical records', 'clinical'),
  ('clinical.create', 'Create clinical records', 'clinical'),
  ('clinical.edit', 'Edit clinical records', 'clinical'),
  -- Billing module
  ('billing.view', 'View financial records', 'billing'),
  ('billing.create', 'Create invoices and payments', 'billing'),
  ('billing.edit', 'Edit financial records', 'billing'),
  ('billing.void', 'Void/cancel financial records', 'billing'),
  -- Reports module
  ('reports.view', 'View reports and analytics', 'reports'),
  ('reports.export', 'Export report data', 'reports'),
  -- Settings module
  ('settings.view', 'View system settings', 'settings'),
  ('settings.edit', 'Edit system settings', 'settings'),
  ('settings.users', 'Manage user accounts', 'settings'),
  ('settings.audit', 'View audit trail', 'settings');

-- ============================================================
-- ROLE → PERMISSION MAPPINGS
-- ============================================================

-- Super Admin: all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions;

-- Admin: all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- Dentist: patients, appointments, clinical, billing view
INSERT INTO role_permissions (role, permission_id)
SELECT 'dentist', id FROM permissions
WHERE name IN (
  'patients.view', 'patients.create', 'patients.edit',
  'appointments.view', 'appointments.create', 'appointments.edit',
  'clinical.view', 'clinical.create', 'clinical.edit',
  'billing.view',
  'reports.view'
);

-- Receptionist: patients, appointments, billing view
INSERT INTO role_permissions (role, permission_id)
SELECT 'receptionist', id FROM permissions
WHERE name IN (
  'patients.view', 'patients.create', 'patients.edit',
  'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel',
  'clinical.view',
  'billing.view', 'billing.create'
);

-- Accountant: billing, reports, expenses
INSERT INTO role_permissions (role, permission_id)
SELECT 'accountant', id FROM permissions
WHERE name IN (
  'patients.view',
  'billing.view', 'billing.create', 'billing.edit', 'billing.void',
  'reports.view', 'reports.export'
);

-- ============================================================
-- PROCEDURE CATEGORIES
-- ============================================================

INSERT INTO procedure_categories (name, description, sort_order) VALUES
  ('Diagnostic', 'Examination and diagnostic procedures', 1),
  ('Preventive', 'Preventive dental care', 2),
  ('Restorative', 'Fillings, crowns, and repairs', 3),
  ('Endodontics', 'Root canal treatments', 4),
  ('Periodontics', 'Gum treatments', 5),
  ('Prosthodontics', 'Dentures, bridges, and implants', 6),
  ('Oral Surgery', 'Extractions and surgical procedures', 7),
  ('Orthodontics', 'Braces and aligners', 8),
  ('Cosmetic', 'Aesthetic dental procedures', 9),
  ('Emergency', 'Urgent dental procedures', 10);

-- ============================================================
-- COMMON DENTAL PROCEDURES (MK pricing)
-- ============================================================

INSERT INTO procedures (category_id, code, name, description, default_price) VALUES
  -- Diagnostic
  ((SELECT id FROM procedure_categories WHERE name = 'Diagnostic'), 'D0120', 'Periodic Oral Evaluation', 'Comprehensive oral exam for existing patients', 15000),
  ((SELECT id FROM procedure_categories WHERE name = 'Diagnostic'), 'D0140', 'Limited Oral Evaluation', 'Problem-focused evaluation', 10000),
  ((SELECT id FROM procedure_categories WHERE name = 'Diagnostic'), 'D0210', 'Full Mouth X-Ray', 'Complete set of dental radiographs', 25000),
  ((SELECT id FROM procedure_categories WHERE name = 'Diagnostic'), 'D0220', 'Periapical X-Ray', 'Single periapical radiograph', 5000),
  ((SELECT id FROM procedure_categories WHERE name = 'Diagnostic'), 'D0330', 'Panoramic X-Ray', 'Panoramic radiographic image', 20000),
  -- Preventive
  ((SELECT id FROM procedure_categories WHERE name = 'Preventive'), 'D1110', 'Adult Prophylaxis (Cleaning)', 'Professional dental cleaning for adults', 20000),
  ((SELECT id FROM procedure_categories WHERE name = 'Preventive'), 'D1120', 'Child Prophylaxis', 'Professional dental cleaning for children', 15000),
  ((SELECT id FROM procedure_categories WHERE name = 'Preventive'), 'D1208', 'Fluoride Application', 'Topical fluoride treatment', 10000),
  ((SELECT id FROM procedure_categories WHERE name = 'Preventive'), 'D1351', 'Sealant (per tooth)', 'Dental sealant application', 8000),
  -- Restorative
  ((SELECT id FROM procedure_categories WHERE name = 'Restorative'), 'D2140', 'Amalgam Filling (1 surface)', 'Silver amalgam restoration, one surface', 15000),
  ((SELECT id FROM procedure_categories WHERE name = 'Restorative'), 'D2150', 'Amalgam Filling (2 surfaces)', 'Silver amalgam restoration, two surfaces', 20000),
  ((SELECT id FROM procedure_categories WHERE name = 'Restorative'), 'D2330', 'Composite Filling (1 surface)', 'Tooth-colored filling, one surface', 20000),
  ((SELECT id FROM procedure_categories WHERE name = 'Restorative'), 'D2331', 'Composite Filling (2 surfaces)', 'Tooth-colored filling, two surfaces', 25000),
  ((SELECT id FROM procedure_categories WHERE name = 'Restorative'), 'D2740', 'Porcelain Crown', 'Full porcelain/ceramic crown', 80000),
  ((SELECT id FROM procedure_categories WHERE name = 'Restorative'), 'D2750', 'PFM Crown', 'Porcelain fused to metal crown', 65000),
  -- Endodontics
  ((SELECT id FROM procedure_categories WHERE name = 'Endodontics'), 'D3310', 'Root Canal (Anterior)', 'Root canal therapy, anterior tooth', 45000),
  ((SELECT id FROM procedure_categories WHERE name = 'Endodontics'), 'D3320', 'Root Canal (Premolar)', 'Root canal therapy, premolar tooth', 55000),
  ((SELECT id FROM procedure_categories WHERE name = 'Endodontics'), 'D3330', 'Root Canal (Molar)', 'Root canal therapy, molar tooth', 75000),
  -- Periodontics
  ((SELECT id FROM procedure_categories WHERE name = 'Periodontics'), 'D4341', 'Scaling & Root Planing (per quadrant)', 'Deep cleaning per quadrant', 25000),
  ((SELECT id FROM procedure_categories WHERE name = 'Periodontics'), 'D4910', 'Periodontal Maintenance', 'Follow-up periodontal cleaning', 20000),
  -- Oral Surgery
  ((SELECT id FROM procedure_categories WHERE name = 'Oral Surgery'), 'D7140', 'Simple Extraction', 'Non-surgical tooth extraction', 15000),
  ((SELECT id FROM procedure_categories WHERE name = 'Oral Surgery'), 'D7210', 'Surgical Extraction', 'Surgical removal of erupted tooth', 35000),
  ((SELECT id FROM procedure_categories WHERE name = 'Oral Surgery'), 'D7230', 'Impacted Tooth Extraction', 'Removal of impacted tooth (soft tissue)', 50000),
  ((SELECT id FROM procedure_categories WHERE name = 'Oral Surgery'), 'D7240', 'Impacted Tooth (Partial Bony)', 'Removal of impacted tooth (partial bony)', 65000),
  -- Prosthodontics
  ((SELECT id FROM procedure_categories WHERE name = 'Prosthodontics'), 'D5110', 'Complete Denture (Upper)', 'Full upper denture', 120000),
  ((SELECT id FROM procedure_categories WHERE name = 'Prosthodontics'), 'D5120', 'Complete Denture (Lower)', 'Full lower denture', 120000),
  ((SELECT id FROM procedure_categories WHERE name = 'Prosthodontics'), 'D5213', 'Partial Denture (Upper)', 'Upper partial denture, cast metal framework', 95000),
  ((SELECT id FROM procedure_categories WHERE name = 'Prosthodontics'), 'D6240', 'Dental Bridge (per unit)', 'Pontic, porcelain fused to metal', 70000),
  -- Cosmetic
  ((SELECT id FROM procedure_categories WHERE name = 'Cosmetic'), 'D9972', 'Teeth Whitening (In-Office)', 'Professional teeth bleaching', 45000),
  ((SELECT id FROM procedure_categories WHERE name = 'Cosmetic'), 'D2962', 'Dental Veneer (Porcelain)', 'Porcelain laminate veneer', 90000),
  -- Emergency
  ((SELECT id FROM procedure_categories WHERE name = 'Emergency'), 'D9110', 'Emergency Visit', 'Emergency dental examination and palliative treatment', 15000),
  ((SELECT id FROM procedure_categories WHERE name = 'Emergency'), 'D9310', 'Consultation', 'Specialist consultation', 20000);

-- ============================================================
-- EXPENSE CATEGORIES
-- ============================================================

INSERT INTO expense_categories (name, description) VALUES
  ('Dental Supplies', 'Consumable dental materials and supplies'),
  ('Equipment Maintenance', 'Repair and maintenance of dental equipment'),
  ('Laboratory Fees', 'Dental laboratory services and fabrication'),
  ('Rent & Utilities', 'Office rent, electricity, water, internet'),
  ('Staff Salaries', 'Employee wages and compensation'),
  ('Office Supplies', 'Administrative and office supplies'),
  ('Insurance', 'Business and liability insurance premiums'),
  ('Marketing', 'Advertising and promotional expenses'),
  ('Training & Education', 'Staff continuing education and training'),
  ('Miscellaneous', 'Other operational expenses');

-- ============================================================
-- DEFAULT CLINIC SETTINGS
-- ============================================================

INSERT INTO clinic_settings (key, value, description) VALUES
  ('clinic_name', 'Happy Tooth Dental Clinic', 'Name of the dental practice'),
  ('clinic_phone', '', 'Main phone number'),
  ('clinic_email', '', 'Main email address'),
  ('clinic_address', '', 'Physical address'),
  ('clinic_city', 'Lilongwe', 'City'),
  ('clinic_country', 'Malawi', 'Country'),
  ('currency_code', 'MWK', 'Currency code'),
  ('currency_symbol', 'MK', 'Currency display symbol'),
  ('receipt_prefix', 'HT', 'Prefix for receipt numbers'),
  ('invoice_prefix', 'INV', 'Prefix for invoice numbers'),
  ('patient_prefix', 'HT-P', 'Prefix for patient numbers'),
  ('working_hours_start', '08:00', 'Clinic opening time'),
  ('working_hours_end', '17:00', 'Clinic closing time'),
  ('appointment_duration', '30', 'Default appointment duration in minutes');


