-- Add JSONB materials/components storage to quote and invoice line items
-- Purpose: allow each quote/invoice item to store detailed materials breakdown
-- Structure per element: {"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":"", "total_price":0}

BEGIN;

-- QUOTE ITEMS
ALTER TABLE IF EXISTS quote_items
  ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]';

COMMENT ON COLUMN quote_items.components IS 'Vật tư/chi tiết cho dòng báo giá (JSONB). Mỗi phần tử: {"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":"", "total_price":0}';

CREATE INDEX IF NOT EXISTS idx_quote_items_components_gin
  ON quote_items USING GIN (components);

-- INVOICE ITEMS
ALTER TABLE IF NOT EXISTS invoice_items
  ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]';

COMMENT ON COLUMN invoice_items.components IS 'Vật tư/chi tiết cho dòng hóa đơn (JSONB). Mỗi phần tử: {"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":"", "total_price":0}';

CREATE INDEX IF NOT EXISTS idx_invoice_items_components_gin
  ON invoice_items USING GIN (components);

COMMIT;



