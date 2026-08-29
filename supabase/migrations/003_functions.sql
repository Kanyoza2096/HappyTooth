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
