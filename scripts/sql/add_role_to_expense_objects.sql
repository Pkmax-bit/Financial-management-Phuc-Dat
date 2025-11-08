-- =====================================================
-- THÊM CỘT ROLE VÀO BẢNG EXPENSE_OBJECTS
-- =====================================================
-- Script này thêm cột role vào bảng expense_objects để phân quyền theo role
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. THÊM CỘT ROLE
-- =====================================================

-- Thêm cột role vào bảng expense_objects
ALTER TABLE expense_objects 
ADD COLUMN IF NOT EXISTS role TEXT NULL;

-- Thêm comment cho cột role
COMMENT ON COLUMN expense_objects.role IS 'Role được phân quyền cho đối tượng chi phí này';

-- =====================================================
-- 2. CẬP NHẬT DỮ LIỆU MẪU
-- =====================================================

-- Cập nhật role cho các đối tượng xưởng
UPDATE expense_objects 
SET role = 'Supplier' 
WHERE name LIKE '%Xưởng%' 
   OR name LIKE '%Nguyên vật liệu%' 
   OR name LIKE '%Nhân công xưởng%'
   OR name LIKE '%Thép%'
   OR name LIKE '%Xi măng%'
   OR name LIKE '%Vít, ốc%'
   OR name LIKE '%Keo dán%';

-- Cập nhật role cho các đối tượng nhân công thông thường
UPDATE expense_objects 
SET role = 'worker' 
WHERE (name LIKE '%Nhân công%' AND name NOT LIKE '%xưởng%')
   OR name LIKE '%Nhân công thợ chính%'
   OR name LIKE '%Nhân công thợ phụ%';

-- Cập nhật role cho các đối tượng vận chuyển
UPDATE expense_objects 
SET role = 'transport' 
WHERE name LIKE '%Vận chuyển%' 
   OR name LIKE '%Transport%';

-- Cập nhật role cho các đối tượng khác (admin, accountant, sales có thể thấy tất cả)
UPDATE expense_objects 
SET role = 'admin' 
WHERE role IS NULL;

-- =====================================================
-- 3. TẠO INDEX CHO CỘT ROLE
-- =====================================================

-- Tạo index cho cột role để tối ưu query
CREATE INDEX IF NOT EXISTS idx_expense_objects_role ON expense_objects(role);

-- =====================================================
-- 4. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Hiển thị phân bố role
SELECT 
    role,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as objects
FROM expense_objects 
WHERE is_active = true
GROUP BY role
ORDER BY role;

-- Hiển thị chi tiết các đối tượng theo role
SELECT 
    name,
    role,
    description,
    is_parent,
    hierarchy_level
FROM expense_objects 
WHERE is_active = true
ORDER BY role, hierarchy_level, name;

