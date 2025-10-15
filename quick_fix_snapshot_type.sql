-- Quick fix for snapshot_type column length
-- Run this in Supabase SQL Editor

ALTER TABLE public.expense_snapshots 
ALTER COLUMN snapshot_type TYPE VARCHAR(50);

-- Update constraint to allow the new table names
ALTER TABLE public.expense_snapshots 
DROP CONSTRAINT IF EXISTS valid_snapshot_type;

ALTER TABLE public.expense_snapshots 
ADD CONSTRAINT valid_snapshot_type 
CHECK (snapshot_type IN ('all', 'expenses', 'project_expenses', 'project_expenses_quote', 'project_actual', 'project_planned'));
