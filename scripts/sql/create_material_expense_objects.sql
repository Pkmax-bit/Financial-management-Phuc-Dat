-- Tạo đối tượng chi phí cho các loại vật liệu và nhà cung cấp
-- Parent objects (level 1) - Các loại vật liệu chính
-- Child objects (level 2) - Các nhà cung cấp cụ thể

-- 1. Tạo đối tượng cha cho NHÔM
INSERT INTO expense_objects (name, description, level, role, is_active) VALUES
('Nhôm', 'Vật liệu nhôm cho các sản phẩm', 1, 'material', true);

-- Lấy ID của đối tượng Nhôm để làm parent_id cho các con
-- (Trong thực tế, bạn sẽ cần lấy ID này từ database sau khi insert)

-- 2. Tạo các đối tượng con cho NHÔM (level 2)
-- Giả sử parent_id của Nhôm là 'nhom_parent_id' - cần thay thế bằng ID thực tế
INSERT INTO expense_objects (name, description, parent_id, level, role, is_active) VALUES
('Nhôm xưởng', 'Nhôm sản xuất tại xưởng', (SELECT id FROM expense_objects WHERE name = 'Nhôm' AND level = 1), 2, 'supplier', true),
('Nhôm Tùng Dương', 'Nhôm từ nhà cung cấp Tùng Dương', (SELECT id FROM expense_objects WHERE name = 'Nhôm' AND level = 1), 2, 'supplier', true),
('Nhôm Slim', 'Nhôm từ nhà cung cấp Slim', (SELECT id FROM expense_objects WHERE name = 'Nhôm' AND level = 1), 2, 'supplier', true),
('Nhôm Phú Hoàn Anh', 'Nhôm từ nhà cung cấp Phú Hoàn Anh', (SELECT id FROM expense_objects WHERE name = 'Nhôm' AND level = 1), 2, 'supplier', true);

-- 3. Tạo đối tượng cha cho KÍNH
INSERT INTO expense_objects (name, description, level, role, is_active) VALUES
('Kính', 'Vật liệu kính cho các sản phẩm', 1, 'material', true);

-- 4. Tạo các đối tượng con cho KÍNH (level 2)
INSERT INTO expense_objects (name, description, parent_id, level, role, is_active) VALUES
('Kính Thiên Phát', 'Kính từ nhà cung cấp Thiên Phát', (SELECT id FROM expense_objects WHERE name = 'Kính' AND level = 1), 2, 'supplier', true),
('Kính Phát Đạt', 'Kính từ nhà cung cấp Phát Đạt', (SELECT id FROM expense_objects WHERE name = 'Kính' AND level = 1), 2, 'supplier', true),
('Kính Thành Ký', 'Kính từ nhà cung cấp Thành Ký', (SELECT id FROM expense_objects WHERE name = 'Kính' AND level = 1), 2, 'supplier', true);

-- 5. Tạo đối tượng cha cho INOX
INSERT INTO expense_objects (name, description, level, role, is_active) VALUES
('Inox', 'Vật liệu inox cho các sản phẩm', 1, 'material', true);

-- 6. Tạo các đối tượng con cho INOX (level 2)
INSERT INTO expense_objects (name, description, parent_id, level, role, is_active) VALUES
('Inox Thiên Tân', 'Inox từ nhà cung cấp Thiên Tân', (SELECT id FROM expense_objects WHERE name = 'Inox' AND level = 1), 2, 'supplier', true),
('Inox Thành Khang', 'Inox từ nhà cung cấp Thành Khang', (SELECT id FROM expense_objects WHERE name = 'Inox' AND level = 1), 2, 'supplier', true);

-- 7. Tạo đối tượng cha cho SẮT
INSERT INTO expense_objects (name, description, level, role, is_active) VALUES
('Sắt', 'Vật liệu sắt cho các sản phẩm', 1, 'material', true);

-- 8. Tạo các đối tượng con cho SẮT (level 2)
INSERT INTO expense_objects (name, description, parent_id, level, role, is_active) VALUES
('Sắt Hải Yến', 'Sắt từ nhà cung cấp Hải Yến', (SELECT id FROM expense_objects WHERE name = 'Sắt' AND level = 1), 2, 'supplier', true),
('Sắt Mạnh', 'Sắt từ nhà cung cấp Mạnh', (SELECT id FROM expense_objects WHERE name = 'Sắt' AND level = 1), 2, 'supplier', true),
('Sắt Quang', 'Sắt từ nhà cung cấp Quang', (SELECT id FROM expense_objects WHERE name = 'Sắt' AND level = 1), 2, 'supplier', true);

-- 9. Tạo đối tượng cha cho NHỰA
INSERT INTO expense_objects (name, description, level, role, is_active) VALUES
('Nhựa', 'Vật liệu nhựa cho các sản phẩm', 1, 'material', true);

-- 10. Tạo đối tượng con cho NHỰA (level 2)
INSERT INTO expense_objects (name, description, parent_id, level, role, is_active) VALUES
('Cửa nhựa Thành An', 'Cửa nhựa từ nhà cung cấp Thành An', (SELECT id FROM expense_objects WHERE name = 'Nhựa' AND level = 1), 2, 'supplier', true);

-- 11. Tạo đối tượng cha cho GỖ
INSERT INTO expense_objects (name, description, level, role, is_active) VALUES
('Gỗ', 'Vật liệu gỗ cho các sản phẩm', 1, 'material', true);

-- 12. Tạo đối tượng con cho GỖ (level 2)
INSERT INTO expense_objects (name, description, parent_id, level, role, is_active) VALUES
('Gỗ Hiệu Hưng', 'Gỗ từ nhà cung cấp Hiệu Hưng', (SELECT id FROM expense_objects WHERE name = 'Gỗ' AND level = 1), 2, 'supplier', true);

-- 13. Tạo đối tượng cha cho PHỤ KIỆN
INSERT INTO expense_objects (name, description, level, role, is_active) VALUES
('Phụ kiện', 'Các loại phụ kiện cho sản phẩm', 1, 'material', true);

-- 14. Tạo các đối tượng con cho PHỤ KIỆN (level 2)
INSERT INTO expense_objects (name, description, parent_id, level, role, is_active) VALUES
('Phụ kiện Phước Thịnh', 'Phụ kiện từ nhà cung cấp Phước Thịnh', (SELECT id FROM expense_objects WHERE name = 'Phụ kiện' AND level = 1), 2, 'supplier', true),
('Phụ kiện Phúc Thịnh', 'Phụ kiện từ nhà cung cấp Phúc Thịnh', (SELECT id FROM expense_objects WHERE name = 'Phụ kiện' AND level = 1), 2, 'supplier', true),
('Phụ kiện Cmeck', 'Phụ kiện từ nhà cung cấp Cmeck', (SELECT id FROM expense_objects WHERE name = 'Phụ kiện' AND level = 1), 2, 'supplier', true),
('Phụ kiện Phú Hoàn Anh', 'Phụ kiện từ nhà cung cấp Phú Hoàn Anh', (SELECT id FROM expense_objects WHERE name = 'Phụ kiện' AND level = 1), 2, 'supplier', true);

-- Kiểm tra kết quả
SELECT 
    eo1.name as parent_name,
    eo1.level as parent_level,
    eo1.role as parent_role,
    eo2.name as child_name,
    eo2.level as child_level,
    eo2.role as child_role
FROM expense_objects eo1
LEFT JOIN expense_objects eo2 ON eo1.id = eo2.parent_id
WHERE eo1.level = 1
ORDER BY eo1.name, eo2.name;
