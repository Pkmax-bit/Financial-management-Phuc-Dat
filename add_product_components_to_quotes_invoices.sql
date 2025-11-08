-- Add product_components JSONB column to quotes and invoices tables
-- Purpose: store vật tư (materials/components) at the quote/invoice level
-- Structure: Array of objects with unit, quantity, unit_price, expense_object_id

BEGIN;

-- ============================
-- QUOTES TABLE
-- ============================
ALTER TABLE IF EXISTS quotes
  ADD COLUMN IF NOT EXISTS product_components JSONB NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN quotes.product_components IS 'Vật tư/chi tiết cho báo giá (JSONB). Mỗi phần tử: {"unit":"<string>", "quantity":<number>, "unit_price":<number>, "expense_object_id":"<uuid>"}';

CREATE INDEX IF NOT EXISTS idx_quotes_product_components_gin
  ON quotes USING GIN (product_components);

-- ============================
-- INVOICES TABLE
-- ============================
ALTER TABLE IF EXISTS invoices
  ADD COLUMN IF NOT EXISTS product_components JSONB NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN invoices.product_components IS 'Vật tư/chi tiết cho hóa đơn (JSONB). Mỗi phần tử: {"unit":"<string>", "quantity":<number>, "unit_price":<number>, "expense_object_id":"<uuid>"}';

CREATE INDEX IF NOT EXISTS idx_invoices_product_components_gin
  ON invoices USING GIN (product_components);

COMMIT;

