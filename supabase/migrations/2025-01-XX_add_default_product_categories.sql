-- Migration: Add default product categories
-- Description: Thêm 13 loại sản phẩm mặc định vào hệ thống
-- Date: 2025-01-XX

-- Insert default product categories
-- Using INSERT ... ON CONFLICT to avoid duplicates if categories already exist

INSERT INTO product_categories (id, name, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Nhôm XingFa Nhập khẩu', 'Nhôm XingFa nhập khẩu chất lượng cao', true, NOW(), NOW()),
  (gen_random_uuid(), 'Nhôm XingFa Việt Nam', 'Nhôm XingFa sản xuất tại Việt Nam', true, NOW(), NOW()),
  (gen_random_uuid(), 'Nhôm MaxPro', 'Nhôm MaxPro - sản phẩm nhôm cao cấp', true, NOW(), NOW()),
  (gen_random_uuid(), 'Nhôm ZhongKai', 'Nhôm ZhongKai - nhôm nhập khẩu', true, NOW(), NOW()),
  (gen_random_uuid(), 'Nhôm OWin', 'Nhôm OWin - sản phẩm nhôm chất lượng', true, NOW(), NOW()),
  (gen_random_uuid(), 'Cửa kính cường lực', 'Cửa kính cường lực an toàn', true, NOW(), NOW()),
  (gen_random_uuid(), 'Vách kính', 'Vách kính ngăn phòng, văn phòng', true, NOW(), NOW()),
  (gen_random_uuid(), 'Phòng tắm kính', 'Phòng tắm kính hiện đại', true, NOW(), NOW()),
  (gen_random_uuid(), 'Lan can ban công kính', 'Lan can ban công bằng kính', true, NOW(), NOW()),
  (gen_random_uuid(), 'Lan can cầu thang kính', 'Lan can cầu thang kính an toàn', true, NOW(), NOW()),
  (gen_random_uuid(), 'Cửa sắt CNC', 'Cửa sắt CNC công nghệ cao', true, NOW(), NOW()),
  (gen_random_uuid(), 'Nhôm PMI', 'Nhôm PMI - sản phẩm nhôm chất lượng', true, NOW(), NOW()),
  (gen_random_uuid(), 'Nhôm HMA', 'Nhôm HMA - nhôm nhập khẩu', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as total_categories FROM product_categories WHERE is_active = true;




