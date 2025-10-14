-- Ensure project expense tables can store allocations and invoice items

-- Planned expenses (quotes)
ALTER TABLE project_expenses_quote 
  ADD COLUMN IF NOT EXISTS expense_object_columns JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS invoice_items JSONB DEFAULT '[]'::jsonb;

-- Actual expenses
ALTER TABLE project_expenses 
  ADD COLUMN IF NOT EXISTS expense_object_columns JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS invoice_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS id_parent UUID REFERENCES project_expenses(id) ON DELETE SET NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_project_expenses_quote_expense_object_columns 
  ON project_expenses_quote USING GIN (expense_object_columns);

CREATE INDEX IF NOT EXISTS idx_project_expenses_expense_object_columns 
  ON project_expenses USING GIN (expense_object_columns);

CREATE INDEX IF NOT EXISTS idx_project_expenses_id_parent 
  ON project_expenses(id_parent);


