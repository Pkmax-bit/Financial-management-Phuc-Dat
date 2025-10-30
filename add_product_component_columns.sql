-- Add JSONB component columns to products table
-- Purpose: store line-item breakdowns for each cost group per product
-- Groups requested: Nhôm, Kính Phụ kiện, Gia công, Vận chuyển, lắp đặt

BEGIN;

-- Products table may be named 'products'. Adjust if your schema differs.
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS aluminum_components        JSONB DEFAULT '[]',  -- Nhôm
  ADD COLUMN IF NOT EXISTS glass_accessory_components JSONB DEFAULT '[]',  -- Kính Phụ kiện
  ADD COLUMN IF NOT EXISTS processing_components      JSONB DEFAULT '[]',  -- Gia công
  ADD COLUMN IF NOT EXISTS logistics_components       JSONB DEFAULT '[]';  -- Vận chuyển, lắp đặt

COMMENT ON COLUMN products.aluminum_components        IS 'Danh sách chi tiết Nhôm (JSONB). Mỗi phần tử: {"name":"", "unit":"", "unit_price":0, "quantity":0, "total_price":0}';
COMMENT ON COLUMN products.glass_accessory_components IS 'Danh sách chi tiết Kính/Phụ kiện (JSONB). Mỗi phần tử: {"name":"", "unit":"", "unit_price":0, "quantity":0, "total_price":0}';
COMMENT ON COLUMN products.processing_components      IS 'Danh sách chi tiết Gia công (JSONB). Mỗi phần tử: {"name":"", "unit":"", "unit_price":0, "quantity":0, "total_price":0}';
COMMENT ON COLUMN products.logistics_components       IS 'Danh sách chi tiết Vận chuyển/Lắp đặt (JSONB). Mỗi phần tử: {"name":"", "unit":"", "unit_price":0, "quantity":0, "total_price":0}';

-- GIN indexes to speed up queries by name or attributes (optional but useful)
CREATE INDEX IF NOT EXISTS idx_products_aluminum_components_gin        ON products USING GIN (aluminum_components);
CREATE INDEX IF NOT EXISTS idx_products_glass_accessory_components_gin ON products USING GIN (glass_accessory_components);
CREATE INDEX IF NOT EXISTS idx_products_processing_components_gin      ON products USING GIN (processing_components);
CREATE INDEX IF NOT EXISTS idx_products_logistics_components_gin       ON products USING GIN (logistics_components);

COMMIT;

-- Example JSON structure per component row
-- [
--   {
--     "name": "Nhôm Xingfa 1.2mm",
--     "unit": "m",
--     "unit_price": 150000,
--     "quantity": 12.5,
--     "total_price": 1875000
--   }
-- ]


