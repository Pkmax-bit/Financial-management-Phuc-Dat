-- Thêm các cột kích thước vào bảng products
-- Chạy script này để cập nhật database với các trường kích thước mới

-- Thêm các cột kích thước vào bảng products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS area DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS volume DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS height DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS length DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS depth DECIMAL(10,2) NULL;

-- Thêm comment cho các cột để dễ hiểu
COMMENT ON COLUMN products.area IS 'Diện tích sản phẩm (m²)';
COMMENT ON COLUMN products.volume IS 'Thể tích sản phẩm (m³)';
COMMENT ON COLUMN products.height IS 'Chiều cao sản phẩm (cm)';
COMMENT ON COLUMN products.length IS 'Chiều dài sản phẩm (cm)';
COMMENT ON COLUMN products.depth IS 'Chiều sâu sản phẩm (cm)';

-- Tạo index cho các cột kích thước để tối ưu query
CREATE INDEX IF NOT EXISTS idx_products_area ON products(area) WHERE area IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_volume ON products(volume) WHERE volume IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_height ON products(height) WHERE height IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_length ON products(length) WHERE length IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_depth ON products(depth) WHERE depth IS NOT NULL;

-- Kiểm tra kết quả
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND column_name IN ('area', 'volume', 'height', 'length', 'depth')
ORDER BY column_name;
