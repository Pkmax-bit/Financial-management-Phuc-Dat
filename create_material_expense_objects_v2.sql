-- Tạo đối tượng chi phí cho các loại vật liệu và nhà cung cấp
-- Sử dụng CTE (Common Table Expression) để đảm bảo thứ tự insert đúng
-- Cấu trúc 3 cấp:
-- Level 1: "Nhà cung cấp" (đối tượng cha gốc)
-- Level 2: Các loại vật liệu (Nhôm, Kính, Inox, Sắt, Nhựa, Gỗ, Phụ kiện)
-- Level 3: Các nhà cung cấp cụ thể

BEGIN;

-- Tạo đối tượng cha gốc "Nhà cung cấp" (Level 1)
WITH root_supplier AS (
    INSERT INTO expense_objects (name, description, level, role, is_active) VALUES
    ('Nhà cung cấp', 'Tổng hợp các nhà cung cấp vật liệu và phụ kiện', 1, 'supplier_root', true)
    RETURNING id, name
),
-- Tạo các loại vật liệu (Level 2) - con của "Nhà cung cấp"
material_categories AS (
    INSERT INTO expense_objects (name, description, parent_id, level, role, is_active)
    SELECT 
        material_name,
        material_description,
        r.id,
        2,
        'material_category',
        true
    FROM root_supplier r
    CROSS JOIN (VALUES 
        ('Nhôm', 'Vật liệu nhôm cho các sản phẩm'),
        ('Kính', 'Vật liệu kính cho các sản phẩm'),
        ('Inox', 'Vật liệu inox cho các sản phẩm'),
        ('Sắt', 'Vật liệu sắt cho các sản phẩm'),
        ('Nhựa', 'Vật liệu nhựa cho các sản phẩm'),
        ('Gỗ', 'Vật liệu gỗ cho các sản phẩm'),
        ('Phụ kiện', 'Các loại phụ kiện cho sản phẩm')
    ) AS materials(material_name, material_description)
    RETURNING id, name
),
-- Tạo các nhà cung cấp cụ thể cho NHÔM (Level 3)
nhom_suppliers AS (
    INSERT INTO expense_objects (name, description, parent_id, level, role, is_active)
    SELECT 
        supplier_name,
        supplier_description,
        m.id,
        3,
        'supplier',
        true
    FROM material_categories m
    CROSS JOIN (VALUES 
        ('Nhôm xưởng', 'Nhôm sản xuất tại xưởng'),
        ('Nhôm Tùng Dương', 'Nhôm từ nhà cung cấp Tùng Dương'),
        ('Nhôm Slim', 'Nhôm từ nhà cung cấp Slim'),
        ('Nhôm Phú Hoàn Anh', 'Nhôm từ nhà cung cấp Phú Hoàn Anh')
    ) AS suppliers(supplier_name, supplier_description)
    WHERE m.name = 'Nhôm'
    RETURNING id, name, parent_id
),
-- Tạo các nhà cung cấp cụ thể cho KÍNH (Level 3)
kinh_suppliers AS (
    INSERT INTO expense_objects (name, description, parent_id, level, role, is_active)
    SELECT 
        supplier_name,
        supplier_description,
        m.id,
        3,
        'supplier',
        true
    FROM material_categories m
    CROSS JOIN (VALUES 
        ('Kính Thiên Phát', 'Kính từ nhà cung cấp Thiên Phát'),
        ('Kính Phát Đạt', 'Kính từ nhà cung cấp Phát Đạt'),
        ('Kính Thành Ký', 'Kính từ nhà cung cấp Thành Ký')
    ) AS suppliers(supplier_name, supplier_description)
    WHERE m.name = 'Kính'
    RETURNING id, name, parent_id
),
-- Tạo các nhà cung cấp cụ thể cho INOX (Level 3)
inox_suppliers AS (
    INSERT INTO expense_objects (name, description, parent_id, level, role, is_active)
    SELECT 
        supplier_name,
        supplier_description,
        m.id,
        3,
        'supplier',
        true
    FROM material_categories m
    CROSS JOIN (VALUES 
        ('Inox Thiên Tân', 'Inox từ nhà cung cấp Thiên Tân'),
        ('Inox Thành Khang', 'Inox từ nhà cung cấp Thành Khang')
    ) AS suppliers(supplier_name, supplier_description)
    WHERE m.name = 'Inox'
    RETURNING id, name, parent_id
),
-- Tạo các nhà cung cấp cụ thể cho SẮT (Level 3)
sat_suppliers AS (
    INSERT INTO expense_objects (name, description, parent_id, level, role, is_active)
    SELECT 
        supplier_name,
        supplier_description,
        m.id,
        3,
        'supplier',
        true
    FROM material_categories m
    CROSS JOIN (VALUES 
        ('Sắt Hải Yến', 'Sắt từ nhà cung cấp Hải Yến'),
        ('Sắt Mạnh', 'Sắt từ nhà cung cấp Mạnh'),
        ('Sắt Quang', 'Sắt từ nhà cung cấp Quang')
    ) AS suppliers(supplier_name, supplier_description)
    WHERE m.name = 'Sắt'
    RETURNING id, name, parent_id
),
-- Tạo các nhà cung cấp cụ thể cho NHỰA (Level 3)
nhua_suppliers AS (
    INSERT INTO expense_objects (name, description, parent_id, level, role, is_active)
    SELECT 
        supplier_name,
        supplier_description,
        m.id,
        3,
        'supplier',
        true
    FROM material_categories m
    CROSS JOIN (VALUES 
        ('Cửa nhựa Thành An', 'Cửa nhựa từ nhà cung cấp Thành An')
    ) AS suppliers(supplier_name, supplier_description)
    WHERE m.name = 'Nhựa'
    RETURNING id, name, parent_id
),
-- Tạo các nhà cung cấp cụ thể cho GỖ (Level 3)
go_suppliers AS (
    INSERT INTO expense_objects (name, description, parent_id, level, role, is_active)
    SELECT 
        supplier_name,
        supplier_description,
        m.id,
        3,
        'supplier',
        true
    FROM material_categories m
    CROSS JOIN (VALUES 
        ('Gỗ Hiệu Hưng', 'Gỗ từ nhà cung cấp Hiệu Hưng')
    ) AS suppliers(supplier_name, supplier_description)
    WHERE m.name = 'Gỗ'
    RETURNING id, name, parent_id
),
-- Tạo các nhà cung cấp cụ thể cho PHỤ KIỆN (Level 3)
phu_kien_suppliers AS (
    INSERT INTO expense_objects (name, description, parent_id, level, role, is_active)
    SELECT 
        supplier_name,
        supplier_description,
        m.id,
        3,
        'supplier',
        true
    FROM material_categories m
    CROSS JOIN (VALUES 
        ('Phụ kiện Phước Thịnh', 'Phụ kiện từ nhà cung cấp Phước Thịnh'),
        ('Phụ kiện Phúc Thịnh', 'Phụ kiện từ nhà cung cấp Phúc Thịnh'),
        ('Phụ kiện Cmeck', 'Phụ kiện từ nhà cung cấp Cmeck'),
        ('Phụ kiện Phú Hoàn Anh', 'Phụ kiện từ nhà cung cấp Phú Hoàn Anh')
    ) AS suppliers(supplier_name, supplier_description)
    WHERE m.name = 'Phụ kiện'
    RETURNING id, name, parent_id
)
-- Trả về kết quả để kiểm tra
SELECT 'All expense objects created successfully' as status;

COMMIT;

-- Kiểm tra kết quả sau khi commit - hiển thị cấu trúc 3 cấp
SELECT 
    eo1.name as level1_name,
    eo1.level as level1_level,
    eo1.role as level1_role,
    eo2.name as level2_name,
    eo2.level as level2_level,
    eo2.role as level2_role,
    eo3.name as level3_name,
    eo3.level as level3_level,
    eo3.role as level3_role
FROM expense_objects eo1
LEFT JOIN expense_objects eo2 ON eo1.id = eo2.parent_id
LEFT JOIN expense_objects eo3 ON eo2.id = eo3.parent_id
WHERE eo1.level = 1
ORDER BY eo1.name, eo2.name, eo3.name;
