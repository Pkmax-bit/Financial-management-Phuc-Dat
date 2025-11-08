-- Fix snapshot_type column length to accommodate longer table names
-- Current limit is 20 characters, but 'project_expenses_quote' is 22 characters

-- Update the column to allow longer table names
ALTER TABLE public.expense_snapshots 
ALTER COLUMN snapshot_type TYPE VARCHAR(50);

-- Update the constraint to allow longer values
ALTER TABLE public.expense_snapshots 
DROP CONSTRAINT IF EXISTS valid_snapshot_type;

ALTER TABLE public.expense_snapshots 
ADD CONSTRAINT valid_snapshot_type 
CHECK (snapshot_type IN ('all', 'expenses', 'project_expenses', 'project_expenses_quote'));

-- Add comment for documentation
COMMENT ON COLUMN public.expense_snapshots.snapshot_type IS 'Type of expenses: all, expenses, project_expenses, project_expenses_quote';
