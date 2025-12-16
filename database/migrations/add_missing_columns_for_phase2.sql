-- Migration: Add missing columns for Phase 2 testing
-- Purpose: Fix database schema errors found during Phase 2 testing
-- Date: 2025-12-14

BEGIN;

-- ============================
-- 1. Add product_components to invoices table
-- Purpose: Store vật tư (materials/components) for invoices
-- ============================
ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS product_components JSONB NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN invoices.product_components IS 'Vật tư/chi tiết cho hóa đơn (JSONB). Mỗi phần tử: {"unit":"<string>", "quantity":<number>, "unit_price":<number>, "expense_object_id":"<uuid>"}';

CREATE INDEX IF NOT EXISTS idx_invoices_product_components_gin
  ON invoices USING GIN (product_components);

-- ============================
-- 2. Add product_components to quotes table (if not exists)
-- Purpose: Store vật tư (materials/components) for quotes
-- ============================
ALTER TABLE IF EXISTS quotes
  ADD COLUMN IF NOT EXISTS product_components JSONB NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN quotes.product_components IS 'Vật tư/chi tiết cho báo giá (JSONB). Mỗi phần tử: {"unit":"<string>", "quantity":<number>, "unit_price":<number>, "expense_object_id":"<uuid>"}';

CREATE INDEX IF NOT EXISTS idx_quotes_product_components_gin
  ON quotes USING GIN (product_components);

-- ============================
-- 3. Add company column to customers table
-- Purpose: Store company name for customers (separate from name field)
-- ============================
ALTER TABLE IF EXISTS customers
  ADD COLUMN IF NOT EXISTS company VARCHAR(255) NULL;

COMMENT ON COLUMN customers.company IS 'Tên công ty (nếu khách hàng là công ty). Có thể khác với name field.';

CREATE INDEX IF NOT EXISTS idx_customers_company
  ON customers (company)
  WHERE company IS NOT NULL;

COMMIT;

-- Verify columns were added
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE (table_name = 'invoices' AND column_name = 'product_components')
   OR (table_name = 'quotes' AND column_name = 'product_components')
   OR (table_name = 'customers' AND column_name = 'company')
ORDER BY table_name, column_name;






