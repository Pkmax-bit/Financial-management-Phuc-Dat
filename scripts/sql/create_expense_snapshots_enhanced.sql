-- Enhanced Expense Snapshots Table
-- Supports parent-child relationships for all expense types

-- Drop existing table if exists
DROP TABLE IF EXISTS public.expense_snapshots CASCADE;

-- Create enhanced expense_snapshots table
CREATE TABLE public.expense_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  snapshot_name VARCHAR(255) NOT NULL,
  snapshot_description TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  
  -- Expense counts by type
  total_expenses_count INTEGER NULL DEFAULT 0,
  root_expenses_count INTEGER NULL DEFAULT 0,
  child_expenses_count INTEGER NULL DEFAULT 0,
  
  -- Amounts by type
  total_amount NUMERIC(15, 2) NULL DEFAULT 0,
  root_amount NUMERIC(15, 2) NULL DEFAULT 0,
  child_amount NUMERIC(15, 2) NULL DEFAULT 0,
  
  -- Snapshot metadata
  snapshot_month VARCHAR(7) NULL,
  snapshot_type VARCHAR(20) NULL DEFAULT 'all', -- 'all', 'expenses', 'project_planned', 'project_actual'
  
  -- Expense data with parent-child relationships
  expenses_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  parent_expenses_data JSONB NULL DEFAULT '[]'::jsonb,
  child_expenses_data JSONB NULL DEFAULT '[]'::jsonb,
  
  -- Hierarchy metadata
  hierarchy_levels INTEGER NULL DEFAULT 0,
  max_depth INTEGER NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NULL DEFAULT TRUE,
  restored_at TIMESTAMP WITH TIME ZONE NULL,
  restored_by UUID NULL,
  
  -- Constraints
  CONSTRAINT expense_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT unique_snapshot_name UNIQUE (snapshot_name),
  CONSTRAINT expense_snapshots_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id),
  CONSTRAINT expense_snapshots_restored_by_fkey FOREIGN KEY (restored_by) REFERENCES users (id),
  CONSTRAINT valid_snapshot_type CHECK (snapshot_type IN ('all', 'expenses', 'project_planned', 'project_actual'))
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expense_snapshots_created_at 
  ON public.expense_snapshots USING btree (created_at DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_created_by 
  ON public.expense_snapshots USING btree (created_by) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_month 
  ON public.expense_snapshots USING btree (snapshot_month) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_active 
  ON public.expense_snapshots USING btree (is_active) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_type 
  ON public.expense_snapshots USING btree (snapshot_type) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_hierarchy 
  ON public.expense_snapshots USING btree (hierarchy_levels, max_depth) TABLESPACE pg_default;

-- Create GIN index for JSONB data
CREATE INDEX IF NOT EXISTS idx_expense_snapshots_expenses_data 
  ON public.expense_snapshots USING GIN (expenses_data) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_parent_data 
  ON public.expense_snapshots USING GIN (parent_expenses_data) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_expense_snapshots_child_data 
  ON public.expense_snapshots USING GIN (child_expenses_data) TABLESPACE pg_default;

-- Add comments for documentation
COMMENT ON TABLE public.expense_snapshots IS 'Enhanced expense snapshots with parent-child relationship support';
COMMENT ON COLUMN public.expense_snapshots.snapshot_type IS 'Type of expenses: all, expenses, project_planned, project_actual';
COMMENT ON COLUMN public.expense_snapshots.expenses_data IS 'All expense data including parent-child relationships';
COMMENT ON COLUMN public.expense_snapshots.parent_expenses_data IS 'Only parent expenses data';
COMMENT ON COLUMN public.expense_snapshots.child_expenses_data IS 'Only child expenses data';
COMMENT ON COLUMN public.expense_snapshots.hierarchy_levels IS 'Number of hierarchy levels in the snapshot';
COMMENT ON COLUMN public.expense_snapshots.max_depth IS 'Maximum depth of the expense tree';

-- Create function to build expense hierarchy
CREATE OR REPLACE FUNCTION build_expense_hierarchy(
  p_expenses JSONB,
  p_parent_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '[]'::jsonb;
  expense JSONB;
  children JSONB;
BEGIN
  -- Get all expenses with the specified parent_id
  FOR expense IN SELECT * FROM jsonb_array_elements(p_expenses)
  LOOP
    IF (expense->>'id_parent')::UUID = p_parent_id OR (p_parent_id IS NULL AND expense->>'id_parent' IS NULL) THEN
      -- Find children of this expense
      children := build_expense_hierarchy(p_expenses, (expense->>'id')::UUID);
      
      -- Add children to the expense
      expense := jsonb_set(expense, '{children}', children);
      
      -- Add to result
      result := result || expense;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get parent expenses only
CREATE OR REPLACE FUNCTION get_parent_expenses(
  p_expenses JSONB
)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '[]'::jsonb;
  expense JSONB;
BEGIN
  FOR expense IN SELECT * FROM jsonb_array_elements(p_expenses)
  LOOP
    -- Parent expenses have no id_parent or id_parent is null
    IF expense->>'id_parent' IS NULL OR expense->>'id_parent' = '' THEN
      result := result || expense;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get child expenses only
CREATE OR REPLACE FUNCTION get_child_expenses(
  p_expenses JSONB
)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '[]'::jsonb;
  expense JSONB;
BEGIN
  FOR expense IN SELECT * FROM jsonb_array_elements(p_expenses)
  LOOP
    -- Child expenses have id_parent
    IF expense->>'id_parent' IS NOT NULL AND expense->>'id_parent' != '' THEN
      result := result || expense;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate hierarchy statistics
CREATE OR REPLACE FUNCTION calculate_hierarchy_stats(
  p_expenses JSONB
)
RETURNS JSONB AS $$
DECLARE
  total_count INTEGER := 0;
  root_count INTEGER := 0;
  child_count INTEGER := 0;
  total_amount NUMERIC(15, 2) := 0;
  root_amount NUMERIC(15, 2) := 0;
  child_amount NUMERIC(15, 2) := 0;
  max_depth INTEGER := 0;
  expense JSONB;
  parent_id TEXT;
  depth INTEGER;
BEGIN
  -- Count total expenses
  total_count := jsonb_array_length(p_expenses);
  
  -- Calculate amounts and counts
  FOR expense IN SELECT * FROM jsonb_array_elements(p_expenses)
  LOOP
    total_amount := total_amount + COALESCE((expense->>'amount')::NUMERIC(15, 2), 0);
    
    parent_id := expense->>'id_parent';
    IF parent_id IS NULL OR parent_id = '' THEN
      root_count := root_count + 1;
      root_amount := root_amount + COALESCE((expense->>'amount')::NUMERIC(15, 2), 0);
    ELSE
      child_count := child_count + 1;
      child_amount := child_amount + COALESCE((expense->>'amount')::NUMERIC(15, 2), 0);
    END IF;
  END LOOP;
  
  -- Calculate max depth (simplified - would need recursive function for accurate depth)
  max_depth := 1; -- Placeholder - would need proper tree traversal
  
  RETURN jsonb_build_object(
    'total_count', total_count,
    'root_count', root_count,
    'child_count', child_count,
    'total_amount', total_amount,
    'root_amount', root_amount,
    'child_amount', child_amount,
    'max_depth', max_depth
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate hierarchy stats
CREATE OR REPLACE FUNCTION update_expense_snapshot_stats()
RETURNS TRIGGER AS $$
DECLARE
  stats JSONB;
BEGIN
  -- Calculate statistics
  stats := calculate_hierarchy_stats(NEW.expenses_data);
  
  -- Update the record with calculated stats
  NEW.total_expenses_count := (stats->>'total_count')::INTEGER;
  NEW.root_expenses_count := (stats->>'root_count')::INTEGER;
  NEW.child_expenses_count := (stats->>'child_count')::INTEGER;
  NEW.total_amount := (stats->>'total_amount')::NUMERIC(15, 2);
  NEW.root_amount := (stats->>'root_amount')::NUMERIC(15, 2);
  NEW.child_amount := (stats->>'child_amount')::NUMERIC(15, 2);
  NEW.max_depth := (stats->>'max_depth')::INTEGER;
  
  -- Separate parent and child data
  NEW.parent_expenses_data := get_parent_expenses(NEW.expenses_data);
  NEW.child_expenses_data := get_child_expenses(NEW.expenses_data);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_expense_snapshot_stats
  BEFORE INSERT OR UPDATE ON public.expense_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_snapshot_stats();

-- Create view for easy querying
CREATE OR REPLACE VIEW expense_snapshots_summary AS
SELECT 
  id,
  snapshot_name,
  snapshot_description,
  created_by,
  created_at,
  snapshot_month,
  snapshot_type,
  total_expenses_count,
  root_expenses_count,
  child_expenses_count,
  total_amount,
  root_amount,
  child_amount,
  hierarchy_levels,
  max_depth,
  is_active,
  restored_at,
  restored_by
FROM public.expense_snapshots;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_snapshots TO authenticated;
GRANT SELECT ON expense_snapshots_summary TO authenticated;
