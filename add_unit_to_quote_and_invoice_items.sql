-- Add unit column to quote_items and invoice_items for measurement unit (e.g., m, m2, cái)
-- Safe to run multiple times due to IF NOT EXISTS guards

-- Quote items
ALTER TABLE IF EXISTS quote_items
ADD COLUMN IF NOT EXISTS unit TEXT;

-- Invoice items
ALTER TABLE IF EXISTS invoice_items
ADD COLUMN IF NOT EXISTS unit TEXT;


