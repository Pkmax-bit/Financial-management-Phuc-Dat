-- Migration: Add tax_rate column to invoice_items table
-- Description: Adds tax_rate column to store VAT percentage for each invoice item
-- Date: 2025-01-XX

-- Add tax_rate column to invoice_items table
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 10.00;

-- Add comment to explain the column
COMMENT ON COLUMN invoice_items.tax_rate IS 'VAT percentage for this invoice item (default: 10%)';

-- Create index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_invoice_items_tax_rate ON invoice_items(tax_rate);

