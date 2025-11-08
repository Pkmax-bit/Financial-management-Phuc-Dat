-- =====================================================
-- TẠO ĐỐI TƯỢNG CHI PHÍ XƯỞNG VỚI CẤU TRÚC PHÂN CẤP
-- =====================================================
-- Script này tạo các đối tượng chi phí xưởng với cấu trúc phân cấp
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. XÓA DỮ LIỆU CŨ (NẾU CÓ)
-- =====================================================

-- Xóa đối tượng chi phí cũ nếu có
DELETE FROM expense_objects WHERE name LIKE '%Xưởng%' OR name LIKE '%Nhân công%';

-- =====================================================
-- 2. TẠO ĐỐI TƯỢNG CHI PHÍ XƯỞNG (PARENT)
-- =====================================================

-- Xưởng sản xuất (Root object)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent, 
    total_children_cost, cost_from_children, is_active, created_at, updated_at
) VALUES (
    gen_random_uuid(), 
    'Xưởng sản xuất', 
    'Tổng chi phí xưởng sản xuất bao gồm nguyên vật liệu và nhân công',
    NULL, 
    0, 
    TRUE, 
    0.00, 
    TRUE, 
    TRUE, 
    NOW(), 
    NOW()
);

-- Lấy ID của Xưởng sản xuất để làm parent_id
WITH workshop_parent AS (
    SELECT id FROM expense_objects WHERE name = 'Xưởng sản xuất' LIMIT 1
)

-- =====================================================
-- 3. TẠO ĐỐI TƯỢNG CHI PHÍ CON CỦA XƯỞNG
-- =====================================================

-- Nguyên vật liệu chính (Child of Xưởng sản xuất)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
) 
SELECT 
    gen_random_uuid(),
    'Nguyên vật liệu chính',
    'Chi phí nguyên vật liệu chính cho sản xuất',
    wp.id,
    1,
    TRUE,
    0.00,
    TRUE,
    TRUE,
    NOW(),
    NOW()
FROM workshop_parent wp;

-- Nguyên vật liệu phụ (Child of Xưởng sản xuất)  
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'Nguyên vật liệu phụ', 
    'Chi phí nguyên vật liệu phụ cho sản xuất',
    wp.id,
    1,
    TRUE,
    0.00,
    TRUE,
    TRUE,
    NOW(),
    NOW()
FROM workshop_parent wp;

-- Nhân công xưởng (Child of Xưởng sản xuất)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'Nhân công xưởng',
    'Chi phí nhân công làm việc trong xưởng',
    wp.id,
    1,
    FALSE,
    0.00,
    FALSE,
    TRUE,
    NOW(),
    NOW()
FROM workshop_parent wp;

-- =====================================================
-- 4. TẠO ĐỐI TƯỢNG CHI PHÍ CON CỦA NGUYÊN VẬT LIỆU CHÍNH
-- =====================================================

-- Lấy ID của Nguyên vật liệu chính
WITH main_materials AS (
    SELECT id FROM expense_objects WHERE name = 'Nguyên vật liệu chính' LIMIT 1
)

-- Thép (Child of Nguyên vật liệu chính)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'Thép',
    'Chi phí thép cho sản xuất',
    mm.id,
    2,
    FALSE,
    0.00,
    FALSE,
    TRUE,
    NOW(),
    NOW()
FROM main_materials mm;

-- Xi măng (Child of Nguyên vật liệu chính)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'Xi măng',
    'Chi phí xi măng cho sản xuất',
    mm.id,
    2,
    FALSE,
    0.00,
    FALSE,
    TRUE,
    NOW(),
    NOW()
FROM main_materials mm;

-- =====================================================
-- 5. TẠO ĐỐI TƯỢNG CHI PHÍ CON CỦA NGUYÊN VẬT LIỆU PHỤ
-- =====================================================

-- Lấy ID của Nguyên vật liệu phụ
WITH aux_materials AS (
    SELECT id FROM expense_objects WHERE name = 'Nguyên vật liệu phụ' LIMIT 1
)

-- Vít, ốc (Child of Nguyên vật liệu phụ)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'Vít, ốc',
    'Chi phí vít, ốc cho sản xuất',
    am.id,
    2,
    FALSE,
    0.00,
    FALSE,
    TRUE,
    NOW(),
    NOW()
FROM aux_materials am;

-- Keo dán (Child of Nguyên vật liệu phụ)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'Keo dán',
    'Chi phí keo dán cho sản xuất',
    am.id,
    2,
    FALSE,
    0.00,
    FALSE,
    TRUE,
    NOW(),
    NOW()
FROM aux_materials am;

-- =====================================================
-- 6. TẠO ĐỐI TƯỢNG CHI PHÍ NHÂN CÔNG RIÊNG BIỆT
-- =====================================================

-- Nhân công (Root object riêng)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'Nhân công',
    'Tổng chi phí nhân công',
    NULL,
    0,
    TRUE,
    0.00,
    TRUE,
    TRUE,
    NOW(),
    NOW()
);

-- Lấy ID của Nhân công
WITH worker_parent AS (
    SELECT id FROM expense_objects WHERE name = 'Nhân công' AND parent_id IS NULL LIMIT 1
)

-- Nhân công thợ chính (Child of Nhân công)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'Nhân công thợ chính',
    'Chi phí nhân công thợ chính',
    wp.id,
    1,
    FALSE,
    0.00,
    FALSE,
    TRUE,
    NOW(),
    NOW()
FROM worker_parent wp;

-- Nhân công thợ phụ (Child of Nhân công)
INSERT INTO expense_objects (
    id, name, description, parent_id, hierarchy_level, is_parent,
    total_children_cost, cost_from_children, is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'Nhân công thợ phụ',
    'Chi phí nhân công thợ phụ',
    wp.id,
    1,
    FALSE,
    0.00,
    FALSE,
    TRUE,
    NOW(),
    NOW()
FROM worker_parent wp;

-- =====================================================
-- 7. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Hiển thị cấu trúc phân cấp
SELECT 
    eo.name,
    eo.description,
    eo.hierarchy_level,
    eo.is_parent,
    eo.cost_from_children,
    CASE 
        WHEN eo.parent_id IS NULL THEN 'ROOT'
        ELSE (SELECT name FROM expense_objects WHERE id = eo.parent_id)
    END as parent_name
FROM expense_objects eo
ORDER BY eo.hierarchy_level, eo.name;

-- Đếm số lượng đối tượng theo cấp độ
SELECT 
    hierarchy_level,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as objects
FROM expense_objects
GROUP BY hierarchy_level
ORDER BY hierarchy_level;

-- Hiển thị cấu trúc cây
WITH RECURSIVE expense_tree AS (
    -- Root objects
    SELECT 
        id, name, parent_id, hierarchy_level,
        name as path,
        0 as level
    FROM expense_objects 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Child objects
    SELECT 
        eo.id, eo.name, eo.parent_id, eo.hierarchy_level,
        et.path || ' > ' || eo.name as path,
        et.level + 1
    FROM expense_objects eo
    JOIN expense_tree et ON eo.parent_id = et.id
)
SELECT 
    REPEAT('  ', level) || name as tree_structure,
    path,
    hierarchy_level
FROM expense_tree
ORDER BY path;
