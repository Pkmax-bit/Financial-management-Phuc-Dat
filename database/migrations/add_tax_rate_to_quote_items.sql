-- Migration: Add tax_rate column to quote_items table
-- Description: Adds tax_rate column to store VAT percentage for each quote item
-- Date: 2025-01-XX

-- Add tax_rate column to quote_items table
ALTER TABLE quote_items
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 10.00;

-- Add comment to explain the column
COMMENT ON COLUMN quote_items.tax_rate IS 'VAT percentage for this quote item (default: 10%)';

-- Create index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_quote_items_tax_rate ON quote_items(tax_rate);

