-- Add VAT rate column to quote_items table
-- This allows each quote item to have its own VAT rate

-- Add vat_rate column to quote_items
ALTER TABLE IF EXISTS quote_items
  ADD COLUMN IF NOT EXISTS vat_rate NUMERIC DEFAULT 10.0;

-- Add comment to explain the column
COMMENT ON COLUMN quote_items.vat_rate IS 'Tỷ lệ thuế VAT cho sản phẩm này (%), mặc định 10%';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_quote_items_vat_rate 
  ON quote_items (vat_rate) 
  WHERE vat_rate IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_items'
  AND column_name = 'vat_rate';
