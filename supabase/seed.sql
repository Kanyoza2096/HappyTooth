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
  ('settings.audit', 'View audit trail', 'settings'),
  -- Granular aliases used by application services
  ('patients.medical.edit', 'Edit patient medical profiles', 'patients'),
  ('visits.view', 'View clinical visits', 'clinical'),
  ('visits.create', 'Create clinical visits', 'clinical'),
  ('visits.edit', 'Edit clinical visits', 'clinical'),
  ('clinical_notes.create', 'Create clinical notes', 'clinical'),
  ('procedures.view', 'View procedure catalog', 'clinical'),
  ('procedures.manage', 'Manage procedure catalog', 'clinical'),
  ('treatment_plans.view', 'View treatment plans', 'clinical'),
  ('treatment_plans.create', 'Create treatment plans', 'clinical'),
  ('treatment_plans.edit', 'Edit treatment plans', 'clinical'),
  ('invoices.view', 'View invoices', 'billing'),
  ('invoices.create', 'Create invoices', 'billing'),
  ('invoices.cancel', 'Cancel invoices', 'billing'),
  ('payments.view', 'View payments', 'billing'),
  ('payments.create', 'Record payments', 'billing'),
  ('receipts.view', 'View receipts', 'billing'),
  ('expenses.view', 'View expenses', 'billing'),
  ('expenses.create', 'Create expenses', 'billing'),
  ('expenses.delete', 'Delete expenses', 'billing'),
  ('reports.financial', 'View financial reports', 'reports');

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
  ('clinic_tagline', 'Your smile, our priority', 'Short tagline shown in the app header and login'),
  ('clinic_phone', '', 'Main phone number'),
  ('clinic_email', '', 'Main email address'),
  ('clinic_address', '', 'Physical address'),
  ('clinic_city', 'Lilongwe', 'City'),
  ('clinic_country', 'Malawi', 'Country'),
  ('clinic_website', '', 'Public website URL'),
  ('clinic_tax_id', '', 'Tax / registration number printed on invoices'),
  ('logo_url', '', 'Logo image URL (HTTPS). Leave empty to use the default mark.'),
  ('currency_code', 'MWK', 'Currency code'),
  ('currency_symbol', 'MK', 'Currency display symbol'),
  ('receipt_prefix', 'HT', 'Prefix for receipt numbers'),
  ('invoice_prefix', 'INV', 'Prefix for invoice numbers'),
  ('patient_prefix', 'HT-P', 'Prefix for patient numbers'),
  ('invoice_footer', 'Thank you for choosing our clinic. Payments are non-refundable unless otherwise stated.', 'Footer text on invoices and receipts'),
  ('working_hours_start', '08:00', 'Clinic opening time'),
  ('working_hours_end', '17:00', 'Clinic closing time'),
  ('appointment_duration', '30', 'Default appointment duration in minutes')
ON CONFLICT (key) DO NOTHING;
