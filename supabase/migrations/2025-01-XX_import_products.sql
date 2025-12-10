-- Migration: Import all products
-- Description: Thêm tất cả các sản phẩm vào hệ thống
-- Date: 2025-01-XX
-- Note: Categories phải được tạo trước khi chạy script này

-- Insert products using subquery to get category_id from category name
INSERT INTO products (id, name, category_id, price, unit, description, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    product_name,
    (SELECT id FROM product_categories WHERE name = category_name LIMIT 1),
    0.0,
    'cái',
    'Sản phẩm ' || product_name,
    true,
    NOW(),
    NOW()
FROM (VALUES
    -- Cửa kính cường lực
    ('Cửa kính cường lực 1 cánh 10 li', 'Cửa kính cường lực'),
    ('Cửa kính cường lực 2 cánh 10 li', 'Cửa kính cường lực'),
    ('Cửa lùa kính cường lực 1 cánh 10 li', 'Cửa kính cường lực'),
    ('Cửa lùa kính cường lực 2 cánh 10 li', 'Cửa kính cường lực'),
    ('Cửa kính cường lực 1 cánh 12 li', 'Cửa kính cường lực'),
    ('Cửa kính cường lực 2 cánh 12 li', 'Cửa kính cường lực'),
    ('Cửa lùa kính cường lực 1 cánh 12 li', 'Cửa kính cường lực'),
    ('Cửa lùa kính cường lực 2 cánh 12 li', 'Cửa kính cường lực'),
    ('Cửa kính cường lực 1 cánh 15 li', 'Cửa kính cường lực'),
    ('Cửa kính cường lực 2 cánh 15 li', 'Cửa kính cường lực'),
    ('Cửa lùa kính cường lực 1 cánh 15 li', 'Cửa kính cường lực'),
    ('Cửa lùa kính cường lực 2 cánh 15 li', 'Cửa kính cường lực'),
    ('Phụ kiện bản lề sàn VVP', 'Cửa kính cường lực'),
    ('Phụ kiện bản lề sàn Hafpler', 'Cửa kính cường lực'),
    ('Phụ kiện của lùa thanh treo', 'Cửa kính cường lực'),
    ('Phụ kiện của lùa Zamilldoor', 'Cửa kính cường lực'),
    
    -- Cửa sắt CNC
    ('Cổng sắt CNC 4 cánh', 'Cửa sắt CNC'),
    
    -- Lan can ban công kính
    ('Lan can kính cường lực 10 li tay vịn gỗ', 'Lan can ban công kính'),
    ('Lan can kính cường lực 10 li tay vịn nhôm', 'Lan can ban công kính'),
    ('Lan can kính cường lực 12 li tay vịn gỗ', 'Lan can ban công kính'),
    ('Lan can kính cường lực 12 li tay vịn nhôm', 'Lan can ban công kính'),
    
    -- Lan can cầu thang kính
    ('Lan can kính cường lực 10 li tay vịn gỗ', 'Lan can cầu thang kính'),
    ('Lan can kính cường lực 10 li tay vịn nhôm', 'Lan can cầu thang kính'),
    ('Lan can kính cường lực 12 li tay vịn gỗ', 'Lan can cầu thang kính'),
    ('Lan can kính cường lực 12 li tay vịn nhôm', 'Lan can cầu thang kính'),
    
    -- Nhôm HMA
    ('Cửa đi mở quay 1 cánh', 'Nhôm HMA'),
    ('Cửa đi mở quay 2 cánh', 'Nhôm HMA'),
    ('Cửa đi mở quay 3 cánh', 'Nhôm HMA'),
    ('Cửa đi mở quay 4 cánh', 'Nhôm HMA'),
    ('Cửa đi mở quay', 'Nhôm HMA'),
    ('Cửa đi lùa 1 cánh', 'Nhôm HMA'),
    ('Cửa đi lùa 2 cánh', 'Nhôm HMA'),
    ('Cửa đi lùa 3 cánh', 'Nhôm HMA'),
    ('Cửa đi lùa 4 cánh', 'Nhôm HMA'),
    ('Cửa sổ mở quay 1', 'Nhôm HMA'),
    ('Cửa sổ mở quay 2', 'Nhôm HMA'),
    ('Cửa sổ mở quay 3', 'Nhôm HMA'),
    ('Cửa sổ mở quay 4', 'Nhôm HMA'),
    ('Cửa sổ lùa 1 cánh', 'Nhôm HMA'),
    ('Cửa sổ lùa 2 cánh', 'Nhôm HMA'),
    ('Cửa sổ lùa 3 cánh', 'Nhôm HMA'),
    ('Cửa sổ lùa 4 cánh', 'Nhôm HMA'),
    ('Vách nhôm', 'Nhôm HMA'),
    ('Mặt dựng', 'Nhôm HMA'),
    ('Cửa xếp trượt 3', 'Nhôm HMA'),
    ('Cửa xếp trượt 4', 'Nhôm HMA'),
    ('Cửa xếp trượt 5', 'Nhôm HMA'),
    ('Cửa xếp trượt 6', 'Nhôm HMA'),
    ('Cửa xếp trượt 7', 'Nhôm HMA'),
    ('Cửa xếp trượt 8', 'Nhôm HMA'),
    
    -- Nhôm PMI
    ('Cửa đi mở quay 1 cánh', 'Nhôm PMI'),
    ('Cửa đi mở quay 2 cánh', 'Nhôm PMI'),
    ('Cửa đi mở quay 3 cánh', 'Nhôm PMI'),
    ('Cửa đi mở quay 4 cánh', 'Nhôm PMI'),
    ('Cửa đi mở quay', 'Nhôm PMI'),
    ('Cửa đi lùa 1 cánh', 'Nhôm PMI'),
    ('Cửa đi lùa 2 cánh', 'Nhôm PMI'),
    ('Cửa đi lùa 3 cánh', 'Nhôm PMI'),
    ('Cửa đi lùa 4 cánh', 'Nhôm PMI'),
    ('Cửa sổ mở quay 1', 'Nhôm PMI'),
    ('Cửa sổ mở quay 2', 'Nhôm PMI'),
    ('Cửa sổ mở quay 3', 'Nhôm PMI'),
    ('Cửa sổ mở quay 4', 'Nhôm PMI'),
    ('Cửa sổ lùa 1 cánh', 'Nhôm PMI'),
    ('Cửa sổ lùa 2 cánh', 'Nhôm PMI'),
    ('Cửa sổ lùa 3 cánh', 'Nhôm PMI'),
    ('Cửa sổ lùa 4 cánh', 'Nhôm PMI'),
    ('Vách nhôm', 'Nhôm PMI'),
    ('Mặt dựng', 'Nhôm PMI'),
    ('Cửa xếp trượt 3', 'Nhôm PMI'),
    ('Cửa xếp trượt 4', 'Nhôm PMI'),
    ('Cửa xếp trượt 5', 'Nhôm PMI'),
    ('Cửa xếp trượt 6', 'Nhôm PMI'),
    ('Cửa xếp trượt 7', 'Nhôm PMI'),
    ('Cửa xếp trượt 8', 'Nhôm PMI'),
    
    -- Nhôm MaxPro
    ('Cửa đi mở quay 1 cánh', 'Nhôm MaxPro'),
    ('Cửa đi mở quay 2 cánh', 'Nhôm MaxPro'),
    ('Cửa đi mở quay 3 cánh', 'Nhôm MaxPro'),
    ('Cửa đi mở quay 4 cánh', 'Nhôm MaxPro'),
    ('Cửa đi mở quay', 'Nhôm MaxPro'),
    ('Cửa đi lùa 1 cánh', 'Nhôm MaxPro'),
    ('Cửa đi lùa 2 cánh', 'Nhôm MaxPro'),
    ('Cửa đi lùa 3 cánh', 'Nhôm MaxPro'),
    ('Cửa đi lùa 4 cánh', 'Nhôm MaxPro'),
    ('Cửa sổ mở quay 1', 'Nhôm MaxPro'),
    ('Cửa sổ mở quay 2', 'Nhôm MaxPro'),
    ('Cửa sổ mở quay 3', 'Nhôm MaxPro'),
    ('Cửa sổ mở quay 4', 'Nhôm MaxPro'),
    ('Cửa sổ lùa 1 cánh', 'Nhôm MaxPro'),
    ('Cửa sổ lùa 2 cánh', 'Nhôm MaxPro'),
    ('Cửa sổ lùa 3 cánh', 'Nhôm MaxPro'),
    ('Cửa sổ lùa 4 cánh', 'Nhôm MaxPro'),
    ('Vách nhôm', 'Nhôm MaxPro'),
    ('Mặt dựng', 'Nhôm MaxPro'),
    ('Cửa xếp trượt 3', 'Nhôm MaxPro'),
    ('Cửa xếp trượt 4', 'Nhôm MaxPro'),
    ('Cửa xếp trượt 5', 'Nhôm MaxPro'),
    ('Cửa xếp trượt 6', 'Nhôm MaxPro'),
    ('Cửa xếp trượt 7', 'Nhôm MaxPro'),
    ('Cửa xếp trượt 8', 'Nhôm MaxPro'),
    
    -- Nhôm OWin
    ('Cửa thủy lực 2 cánh', 'Nhôm OWin'),
    
    -- Nhôm XingFa Nhập khẩu
    ('Cửa đi mở quay 1 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa đi mở quay 2 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa đi mở quay 3 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa đi mở quay 4 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa đi mở quay', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa đi lùa 1 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa đi lùa 2 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa đi lùa 3 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa đi lùa 4 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa sổ mở quay 1', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa sổ mở quay 2', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa sổ mở quay 3', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa sổ mở quay 4', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa sổ lùa 1 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa sổ lùa 2 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa sổ lùa 3 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa sổ lùa 4 cánh', 'Nhôm XingFa Nhập khẩu'),
    ('Vách nhôm', 'Nhôm XingFa Nhập khẩu'),
    ('Mặt dựng', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa xếp trượt 3', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa xếp trượt 4', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa xếp trượt 5', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa xếp trượt 6', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa xếp trượt 7', 'Nhôm XingFa Nhập khẩu'),
    ('Cửa xếp trượt 8', 'Nhôm XingFa Nhập khẩu'),
    
    -- Nhôm XingFa Việt Nam
    ('Cửa đi mở quay 1 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa đi mở quay 2 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa đi mở quay 3 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa đi mở quay 4 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa đi mở quay', 'Nhôm XingFa Việt Nam'),
    ('Cửa đi lùa 1 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa đi lùa 2 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa đi lùa 3 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa đi lùa 4 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa sổ mở quay 1', 'Nhôm XingFa Việt Nam'),
    ('Cửa sổ mở quay 2', 'Nhôm XingFa Việt Nam'),
    ('Cửa sổ mở quay 3', 'Nhôm XingFa Việt Nam'),
    ('Cửa sổ mở quay 4', 'Nhôm XingFa Việt Nam'),
    ('Cửa sổ lùa 1 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa sổ lùa 2 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa sổ lùa 3 cánh', 'Nhôm XingFa Việt Nam'),
    ('Cửa sổ lùa 4 cánh', 'Nhôm XingFa Việt Nam'),
    ('Vách nhôm', 'Nhôm XingFa Việt Nam'),
    ('Mặt dựng', 'Nhôm XingFa Việt Nam'),
    ('Cửa xếp trượt 3', 'Nhôm XingFa Việt Nam'),
    ('Cửa xếp trượt 4', 'Nhôm XingFa Việt Nam'),
    ('Cửa xếp trượt 5', 'Nhôm XingFa Việt Nam'),
    ('Cửa xếp trượt 6', 'Nhôm XingFa Việt Nam'),
    ('Cửa xếp trượt 7', 'Nhôm XingFa Việt Nam'),
    ('Cửa xếp trượt 8', 'Nhôm XingFa Việt Nam'),
    
    -- Nhôm ZhongKai
    ('Cửa trượt quay 2 cánh', 'Nhôm ZhongKai'),
    ('Cửa trượt quay 3 cánh', 'Nhôm ZhongKai'),
    ('Cửa trượt quay 4 cánh', 'Nhôm ZhongKai'),
    ('Cửa trượt quay 5 cánh', 'Nhôm ZhongKai'),
    ('Cửa trượt quay 6 cánh', 'Nhôm ZhongKai'),
    
    -- Phòng tắm kính
    ('Phòng tắm kính cửa lùa', 'Phòng tắm kính'),
    ('Phòng tắm kính cửa mở 90 độ', 'Phòng tắm kính'),
    ('Phòng tắm kính cửa mở 135 độ', 'Phòng tắm kính'),
    ('Phòng tắm kính cửa mở 180 độ', 'Phòng tắm kính'),
    ('Phụ kiện VVP 90 độ', 'Phòng tắm kính'),
    ('Phụ kiện VVP 135 độ', 'Phòng tắm kính'),
    ('Phụ kiện VVP 180 độ', 'Phòng tắm kính'),
    
    -- Vách kính
    ('Vách kính cường lực 10 li', 'Vách kính'),
    ('Vách kính cường lực 12 li', 'Vách kính')
) AS products_data(product_name, category_name)
WHERE NOT EXISTS (
    SELECT 1 FROM products p
    INNER JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.name = products_data.product_name 
    AND pc.name = products_data.category_name
);

-- Verify insertion
SELECT 
    pc.name as category_name,
    COUNT(p.id) as product_count
FROM product_categories pc
LEFT JOIN products p ON p.category_id = pc.id
WHERE pc.name IN (
    'Cửa kính cường lực', 'Cửa sắt CNC', 'Lan can ban công kính', 
    'Lan can cầu thang kính', 'Nhôm HMA', 'Nhôm PMI', 'Nhôm MaxPro', 
    'Nhôm OWin', 'Nhôm XingFa Nhập khẩu', 'Nhôm XingFa Việt Nam', 
    'Nhôm ZhongKai', 'Phòng tắm kính', 'Vách kính'
)
GROUP BY pc.name
ORDER BY pc.name;




