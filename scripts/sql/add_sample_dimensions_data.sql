-- Thêm dữ liệu mẫu cho các trường kích thước sản phẩm
-- Script này sẽ cập nhật các sản phẩm hiện có với dữ liệu kích thước mẫu

-- Cập nhật dữ liệu mẫu cho các sản phẩm hiện có
-- (Thay đổi ID sản phẩm theo dữ liệu thực tế trong database của bạn)

-- Ví dụ 1: Sản phẩm nội thất
UPDATE products 
SET 
    area = 2.5,
    volume = 0.8,
    height = 80.0,
    length = 120.0,
    depth = 60.0
WHERE name ILIKE '%bàn%' OR name ILIKE '%ghế%' OR name ILIKE '%tủ%'
LIMIT 5;

-- Ví dụ 2: Sản phẩm điện tử
UPDATE products 
SET 
    area = 0.5,
    volume = 0.02,
    height = 15.0,
    length = 30.0,
    depth = 5.0
WHERE name ILIKE '%máy%' OR name ILIKE '%điện%' OR name ILIKE '%laptop%'
LIMIT 3;

-- Ví dụ 3: Sản phẩm văn phòng phẩm
UPDATE products 
SET 
    area = 0.1,
    volume = 0.001,
    height = 2.0,
    length = 20.0,
    depth = 1.0
WHERE name ILIKE '%bút%' OR name ILIKE '%giấy%' OR name ILIKE '%vở%'
LIMIT 4;

-- Thêm dữ liệu mẫu cho sản phẩm mới (nếu cần)
INSERT INTO products (name, price, unit, description, category_id, is_active, area, volume, height, length, depth)
VALUES 
    -- Nội thất
    ('Bàn làm việc gỗ', 2500000, 'cái', 'Bàn làm việc gỗ tự nhiên', NULL, true, 1.2, 0.3, 75.0, 120.0, 60.0),
    ('Ghế văn phòng', 1200000, 'cái', 'Ghế văn phòng có tựa lưng', NULL, true, 0.3, 0.05, 100.0, 50.0, 50.0),
    ('Tủ quần áo 3 cánh', 3500000, 'cái', 'Tủ quần áo 3 cánh gỗ công nghiệp', NULL, true, 2.1, 0.6, 200.0, 180.0, 60.0),
    
    -- Điện tử
    ('Máy tính để bàn', 15000000, 'bộ', 'Máy tính để bàn cấu hình cao', NULL, true, 0.4, 0.08, 40.0, 50.0, 40.0),
    ('Màn hình 24 inch', 5000000, 'cái', 'Màn hình máy tính 24 inch', NULL, true, 0.3, 0.02, 35.0, 55.0, 5.0),
    ('Laptop gaming', 25000000, 'cái', 'Laptop gaming cấu hình cao', NULL, true, 0.2, 0.005, 2.5, 35.0, 25.0),
    
    -- Văn phòng phẩm
    ('Bút bi xanh', 5000, 'cái', 'Bút bi màu xanh', NULL, true, 0.0001, 0.000001, 15.0, 0.5, 0.5),
    ('Sổ ghi chép A4', 25000, 'quyển', 'Sổ ghi chép khổ A4', NULL, true, 0.06, 0.001, 0.5, 30.0, 21.0),
    ('Bút chì 2B', 3000, 'cái', 'Bút chì 2B chất lượng cao', NULL, true, 0.0001, 0.000001, 18.0, 0.5, 0.5),
    
    -- Xây dựng
    ('Gạch ống 6 lỗ', 1500, 'viên', 'Gạch ống 6 lỗ xây dựng', NULL, true, 0.02, 0.001, 10.0, 20.0, 10.0),
    ('Xi măng PC40', 80000, 'bao', 'Xi măng PC40 50kg', NULL, true, 0.1, 0.05, 20.0, 50.0, 30.0),
    ('Sắt phi 6', 15000, 'mét', 'Sắt phi 6 dài 1m', NULL, true, 0.0001, 0.00003, 0.6, 100.0, 0.6);

-- Cập nhật ngẫu nhiên cho các sản phẩm khác (nếu có)
UPDATE products 
SET 
    area = ROUND((RANDOM() * 5 + 0.1)::numeric, 2),
    volume = ROUND((RANDOM() * 2 + 0.01)::numeric, 3),
    height = ROUND((RANDOM() * 200 + 5)::numeric, 1),
    length = ROUND((RANDOM() * 300 + 10)::numeric, 1),
    depth = ROUND((RANDOM() * 100 + 2)::numeric, 1)
WHERE area IS NULL 
    AND volume IS NULL 
    AND height IS NULL 
    AND length IS NULL 
    AND depth IS NULL
LIMIT 10;

-- Kiểm tra kết quả
SELECT 
    name,
    price,
    unit,
    area,
    volume,
    height,
    length,
    depth,
    CASE 
        WHEN area IS NOT NULL AND volume IS NOT NULL AND height IS NOT NULL AND length IS NOT NULL AND depth IS NOT NULL 
        THEN 'Đầy đủ thông tin'
        ELSE 'Thiếu thông tin'
    END as dimension_status
FROM products 
WHERE area IS NOT NULL OR volume IS NOT NULL OR height IS NOT NULL OR length IS NOT NULL OR depth IS NOT NULL
ORDER BY name
LIMIT 20;
