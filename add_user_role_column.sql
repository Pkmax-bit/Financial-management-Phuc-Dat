-- =====================================================
-- SCRIPT THÊM CỘT USER_ROLE VÀO BẢNG EMPLOYEES
-- =====================================================
-- Script này thêm cột user_role vào bảng employees nếu chưa có
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. KIỂM TRA CỘT USER_ROLE ĐÃ TỒN TẠI CHƯA
-- =====================================================

-- Kiểm tra xem cột user_role đã tồn tại chưa
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'user_role';

-- =====================================================
-- 2. THÊM CỘT USER_ROLE NẾU CHƯA CÓ
-- =====================================================

-- Thêm cột user_role vào bảng employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS user_role VARCHAR(50);

-- =====================================================
-- 3. CẬP NHẬT USER_ROLE CHO CÁC EMPLOYEES HIỆN TẠI
-- =====================================================

-- Cập nhật user_role dựa trên role trong bảng users
UPDATE employees 
SET user_role = u.role
FROM users u
WHERE employees.user_id = u.id
AND employees.user_role IS NULL;

-- =====================================================
-- 4. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Kiểm tra cột user_role đã được thêm
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'user_role';

-- Kiểm tra dữ liệu user_role trong employees
SELECT 
    employee_code,
    first_name,
    last_name,
    email,
    user_role
FROM employees 
WHERE user_role IS NOT NULL
ORDER BY user_role, employee_code;

-- Đếm số lượng employees theo user_role
SELECT 
    user_role,
    COUNT(*) as count
FROM employees 
WHERE user_role IS NOT NULL
GROUP BY user_role
ORDER BY user_role;

-- =====================================================
-- 5. HOÀN TẤT
-- =====================================================
-- Đã thêm cột user_role vào bảng employees
-- Có thể sử dụng cột này để lưu trữ role của nhân viên
