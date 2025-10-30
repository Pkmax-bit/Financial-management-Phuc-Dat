-- Adds employee_in_charge_id to quotes and invoices
-- Link to employees(id)

BEGIN;

ALTER TABLE IF EXISTS quotes
  ADD COLUMN IF NOT EXISTS employee_in_charge_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_employee_in_charge_id ON quotes(employee_in_charge_id);

ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS employee_in_charge_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_employee_in_charge_id ON invoices(employee_in_charge_id);

COMMIT;


