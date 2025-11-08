-- Consolidate product component columns into a single JSONB column
-- New column: product_components JSONB DEFAULT '[]'
-- Each item: {"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":""}

BEGIN;

-- Add the single components column
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS product_components JSONB DEFAULT '[]';

COMMENT ON COLUMN products.product_components IS 'Danh sách vật tư (JSONB). Mỗi phần tử: {"expense_object_id":"<uuid>", "quantity":0, "unit_price":0, "unit":""}';

-- Optional: GIN index for containment queries
CREATE INDEX IF NOT EXISTS idx_products_product_components_gin
  ON products USING GIN (product_components);

-- Drop old group-specific columns if they exist
ALTER TABLE IF EXISTS products
  DROP COLUMN IF EXISTS aluminum_components,
  DROP COLUMN IF EXISTS glass_accessory_components,
  DROP COLUMN IF EXISTS processing_components,
  DROP COLUMN IF EXISTS logistics_components;

COMMIT;


