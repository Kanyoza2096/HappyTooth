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
