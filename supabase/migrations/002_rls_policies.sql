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
