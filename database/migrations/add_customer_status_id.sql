-- Migration: Add status_id column to customers table
-- Links customers to customer_statuses table

-- Add status_id column to customers table (keeping status for backward compatibility)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES customer_statuses(id) ON DELETE SET NULL;

-- Migrate existing status values to status_id
-- Map old status enum values to customer_statuses codes
UPDATE customers c
SET status_id = cs.id
FROM customer_statuses cs
WHERE 
  (c.status = 'prospect' AND cs.code = 'prospect')
  OR (c.status = 'active' AND cs.code = 'active')
  OR (c.status = 'inactive' AND cs.code = 'inactive')
  OR (c.status IS NULL AND cs.code = 'active') -- Default to active if status is null
  OR (c.status NOT IN ('prospect', 'active', 'inactive') AND cs.code = 'active'); -- Default unknown statuses to active

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_status_id ON customers(status_id);

-- Add comment
COMMENT ON COLUMN customers.status_id IS 'Foreign key reference to customer_statuses table';

