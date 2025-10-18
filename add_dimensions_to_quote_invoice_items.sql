-- Add dimension columns to quote_items and invoice_items tables
-- Safe to run multiple times due to IF NOT EXISTS guards

-- Quote items dimensions
ALTER TABLE IF EXISTS quote_items
ADD COLUMN IF NOT EXISTS area DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS volume DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS depth DECIMAL(10,2) NULL;

-- Invoice items dimensions
ALTER TABLE IF EXISTS invoice_items
ADD COLUMN IF NOT EXISTS area DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS volume DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS depth DECIMAL(10,2) NULL;

-- Add comments for better documentation
COMMENT ON COLUMN quote_items.area IS 'Diện tích của sản phẩm (m²)';
COMMENT ON COLUMN quote_items.volume IS 'Thể tích của sản phẩm (m³)';
COMMENT ON COLUMN quote_items.height IS 'Chiều cao của sản phẩm (cm)';
COMMENT ON COLUMN quote_items.length IS 'Chiều dài của sản phẩm (cm)';
COMMENT ON COLUMN quote_items.depth IS 'Chiều sâu của sản phẩm (cm)';

COMMENT ON COLUMN invoice_items.area IS 'Diện tích của sản phẩm (m²)';
COMMENT ON COLUMN invoice_items.volume IS 'Thể tích của sản phẩm (m³)';
COMMENT ON COLUMN invoice_items.height IS 'Chiều cao của sản phẩm (cm)';
COMMENT ON COLUMN invoice_items.length IS 'Chiều dài của sản phẩm (cm)';
COMMENT ON COLUMN invoice_items.depth IS 'Chiều sâu của sản phẩm (cm)';

-- Optional: Add indexes for performance if these columns are frequently queried
CREATE INDEX IF NOT EXISTS idx_quote_items_area ON quote_items (area) WHERE area IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_items_volume ON quote_items (volume) WHERE volume IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_items_height ON quote_items (height) WHERE height IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_items_length ON quote_items (length) WHERE length IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_items_depth ON quote_items (depth) WHERE depth IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_items_area ON invoice_items (area) WHERE area IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_volume ON invoice_items (volume) WHERE volume IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_height ON invoice_items (height) WHERE height IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_length ON invoice_items (length) WHERE length IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_depth ON invoice_items (depth) WHERE depth IS NOT NULL;

-- Verify the columns have been added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quote_items'
  AND column_name IN ('area', 'volume', 'height', 'length', 'depth');

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'invoice_items'
  AND column_name IN ('area', 'volume', 'height', 'length', 'depth');
