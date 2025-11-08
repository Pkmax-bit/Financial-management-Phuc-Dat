-- Update expense_snapshots table to store parent/child IDs separately
-- This makes it easier to query and validate snapshots

-- Add columns for parent and child expense IDs
ALTER TABLE public.expense_snapshots 
ADD COLUMN IF NOT EXISTS parent_expense_id UUID,
ADD COLUMN IF NOT EXISTS child_expense_id UUID,
ADD COLUMN IF NOT EXISTS project_id UUID;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expense_snapshots_parent_id 
  ON public.expense_snapshots USING btree (parent_expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_child_id 
  ON public.expense_snapshots USING btree (child_expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_project_id 
  ON public.expense_snapshots USING btree (project_id);

-- Remove rigid foreign key: parent may live in multiple tables (expenses, project_expenses, project_expenses_quote)
ALTER TABLE public.expense_snapshots 
DROP CONSTRAINT IF EXISTS fk_expense_snapshots_parent_id;

-- Note: parent/child IDs are validated in application logic based on snapshot_type

-- Add comments for documentation
COMMENT ON COLUMN public.expense_snapshots.parent_expense_id IS 'ID of the parent expense that was snapshotted';
COMMENT ON COLUMN public.expense_snapshots.child_expense_id IS 'ID of the child expense that triggered the snapshot';
COMMENT ON COLUMN public.expense_snapshots.project_id IS 'Project ID from the parent expense for easier filtering';
