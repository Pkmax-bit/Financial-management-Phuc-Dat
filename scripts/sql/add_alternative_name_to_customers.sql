-- Add alternative_name column to customers table
-- This allows storing an alternative name for the customer

-- Add alternative_name column to customers
ALTER TABLE IF EXISTS customers
  ADD COLUMN IF NOT EXISTS alternative_name TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN customers.alternative_name IS 'Tên khách hàng thay thế (tùy chọn)';

-- Create index for searching by alternative name
CREATE INDEX IF NOT EXISTS idx_customers_alternative_name 
  ON customers (alternative_name) 
  WHERE alternative_name IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name = 'alternative_name';
