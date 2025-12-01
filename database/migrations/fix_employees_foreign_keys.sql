-- Migration: Fix employees table foreign key relationships
-- Description: Đảm bảo foreign key relationships cho department_id, position_id, manager_id hoạt động đúng
-- Date: 2025-12-01

-- ============================================================================
-- KIỂM TRA FOREIGN KEY CONSTRAINTS HIỆN TẠI
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
-- SỬA FOREIGN KEY CHO DEPARTMENT_ID
-- ============================================================================

-- Xóa constraint cũ nếu tồn tại (nếu có tên khác)
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    -- Tìm tên constraint cho department_id
    SELECT tc.constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employees' 
        AND kcu.column_name = 'department_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    LIMIT 1;
    
    -- Xóa constraint nếu tìm thấy
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE employees DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
        RAISE NOTICE 'Đã xóa constraint: %', constraint_name_var;
    END IF;
END $$;

-- Tạo lại foreign key constraint cho department_id
DO $$
BEGIN
    -- Kiểm tra xem constraint đã tồn tại chưa
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'employees' 
        AND constraint_name = 'employees_department_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE employees 
        ADD CONSTRAINT employees_department_id_fkey 
        FOREIGN KEY (department_id) 
        REFERENCES departments(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Đã tạo constraint: employees_department_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint employees_department_id_fkey đã tồn tại';
    END IF;
END $$;

-- ============================================================================
-- SỬA FOREIGN KEY CHO POSITION_ID
-- ============================================================================

-- Xóa constraint cũ nếu tồn tại
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    SELECT tc.constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employees' 
        AND kcu.column_name = 'position_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    LIMIT 1;
    
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE employees DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
        RAISE NOTICE 'Đã xóa constraint: %', constraint_name_var;
    END IF;
END $$;

-- Tạo lại foreign key constraint cho position_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'employees' 
        AND constraint_name = 'employees_position_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE employees 
        ADD CONSTRAINT employees_position_id_fkey 
        FOREIGN KEY (position_id) 
        REFERENCES positions(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Đã tạo constraint: employees_position_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint employees_position_id_fkey đã tồn tại';
    END IF;
END $$;

-- ============================================================================
-- SỬA FOREIGN KEY CHO MANAGER_ID (self-referencing)
-- ============================================================================

-- Xóa constraint cũ nếu tồn tại
DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    SELECT tc.constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employees' 
        AND kcu.column_name = 'manager_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    LIMIT 1;
    
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE employees DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
        RAISE NOTICE 'Đã xóa constraint: %', constraint_name_var;
    END IF;
END $$;

-- Tạo lại foreign key constraint cho manager_id (self-referencing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'employees' 
        AND constraint_name = 'employees_manager_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE employees 
        ADD CONSTRAINT employees_manager_id_fkey 
        FOREIGN KEY (manager_id) 
        REFERENCES employees(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Đã tạo constraint: employees_manager_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint employees_manager_id_fkey đã tồn tại';
    END IF;
END $$;

-- ============================================================================
-- KIỂM TRA SAU KHI SỬA
-- ============================================================================

-- Xem lại tất cả foreign key constraints sau khi sửa
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
-- KIỂM TRA DỮ LIỆU
-- ============================================================================

-- Kiểm tra nhân viên có department_id nhưng department không tồn tại
SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.department_id,
    'Department không tồn tại' as issue
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.department_id IS NOT NULL 
  AND d.id IS NULL;

-- Kiểm tra nhân viên có position_id nhưng position không tồn tại
SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.position_id,
    'Position không tồn tại' as issue
FROM employees e
LEFT JOIN positions p ON e.position_id = p.id
WHERE e.position_id IS NOT NULL 
  AND p.id IS NULL;

-- Kiểm tra nhân viên có manager_id nhưng manager không tồn tại
SELECT 
    e.id,
    e.first_name,
    e.last_name,
    e.manager_id,
    'Manager không tồn tại' as issue
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
WHERE e.manager_id IS NOT NULL 
  AND m.id IS NULL;

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

