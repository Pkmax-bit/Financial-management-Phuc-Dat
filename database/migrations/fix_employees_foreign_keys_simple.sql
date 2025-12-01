-- Migration: Fix employees table foreign key relationships (Simple Version)
-- Description: Đảm bảo foreign key relationships cho department_id, position_id, manager_id hoạt động đúng
-- Date: 2025-12-01
-- 
-- HƯỚNG DẪN: Copy toàn bộ file này và chạy trong Supabase SQL Editor

-- ============================================================================
-- SỬA FOREIGN KEY CHO DEPARTMENT_ID
-- ============================================================================

-- Xóa constraint cũ nếu tồn tại (bỏ qua lỗi nếu không có)
DO $$
BEGIN
    ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_department_id_fkey;
    RAISE NOTICE 'Đã xóa constraint cũ cho department_id (nếu có)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Không có constraint cũ để xóa cho department_id';
END $$;

-- Tạo constraint mới cho department_id
DO $$
BEGIN
    ALTER TABLE employees 
    ADD CONSTRAINT employees_department_id_fkey 
    FOREIGN KEY (department_id) 
    REFERENCES departments(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Đã tạo constraint: employees_department_id_fkey';
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE '⚠️  Constraint employees_department_id_fkey đã tồn tại';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Lỗi khi tạo constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- SỬA FOREIGN KEY CHO POSITION_ID
-- ============================================================================

-- Xóa constraint cũ nếu tồn tại
DO $$
BEGIN
    ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_position_id_fkey;
    RAISE NOTICE 'Đã xóa constraint cũ cho position_id (nếu có)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Không có constraint cũ để xóa cho position_id';
END $$;

-- Tạo constraint mới cho position_id
DO $$
BEGIN
    ALTER TABLE employees 
    ADD CONSTRAINT employees_position_id_fkey 
    FOREIGN KEY (position_id) 
    REFERENCES positions(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Đã tạo constraint: employees_position_id_fkey';
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE '⚠️  Constraint employees_position_id_fkey đã tồn tại';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Lỗi khi tạo constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- SỬA FOREIGN KEY CHO MANAGER_ID
-- ============================================================================

-- Xóa constraint cũ nếu tồn tại
DO $$
BEGIN
    ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_manager_id_fkey;
    RAISE NOTICE 'Đã xóa constraint cũ cho manager_id (nếu có)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Không có constraint cũ để xóa cho manager_id';
END $$;

-- Tạo constraint mới cho manager_id (self-referencing)
DO $$
BEGIN
    ALTER TABLE employees 
    ADD CONSTRAINT employees_manager_id_fkey 
    FOREIGN KEY (manager_id) 
    REFERENCES employees(id) 
    ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Đã tạo constraint: employees_manager_id_fkey';
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE '⚠️  Constraint employees_manager_id_fkey đã tồn tại';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Lỗi khi tạo constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- KIỂM TRA SAU KHI SỬA
-- ============================================================================

-- Xem tất cả foreign key constraints của bảng employees
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'employees' 
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.column_name;

-- ============================================================================
-- THỐNG KÊ
-- ============================================================================

-- Thống kê nhân viên theo phòng ban
SELECT 
    d.name as department_name,
    COUNT(e.id) as employee_count
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
GROUP BY d.id, d.name
ORDER BY employee_count DESC;

-- Thống kê nhân viên theo vị trí
SELECT 
    p.name as position_name,
    COUNT(e.id) as employee_count
FROM positions p
LEFT JOIN employees e ON p.id = e.position_id AND e.status = 'active'
GROUP BY p.id, p.name
ORDER BY employee_count DESC;

