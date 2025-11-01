-- Add product_components JSONB column to invoice_items table
-- Purpose: store vật tư (materials/components) at the invoice item level
-- Structure: Array of objects with name, unit, quantity, unit_price, total_price, expense_object_id

BEGIN;

-- ============================
-- INVOICE ITEMS TABLE
-- ============================
ALTER TABLE IF EXISTS invoice_items
  ADD COLUMN IF NOT EXISTS product_components JSONB NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN invoice_items.product_components IS 'Vật tư/chi tiết cho dòng hóa đơn (JSONB). Mỗi phần tử: {"name":"<string>", "unit":"<string>", "quantity":<number>, "unit_price":<number>, "total_price":<number>, "expense_object_id":"<uuid>"}';

CREATE INDEX IF NOT EXISTS idx_invoice_items_product_components_gin
  ON invoice_items USING GIN (product_components);

COMMIT;

