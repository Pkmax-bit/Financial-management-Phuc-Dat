-- =====================================================
-- SCRIPT THÊM CỘT USER_ROLE VÀO BẢNG EMPLOYEES
-- =====================================================
-- Script này thêm cột user_role vào bảng employees nếu chưa có
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. KIỂM TRA CỘT USER_ROLE ĐÃ TỒN TẠI CHƯA
-- =====================================================

-- Kiểm tra xem cột user_role đã tồn tại trong bảng employees chưa
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'user_role';

-- =====================================================
-- 2. THÊM CỘT USER_ROLE NẾU CHƯA CÓ
-- =====================================================

-- Thêm cột user_role vào bảng employees
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'employee';

-- =====================================================
-- 3. CẬP NHẬT DỮ LIỆU HIỆN TẠI
-- =====================================================

-- Cập nhật user_role cho các employees hiện có dựa trên email pattern
UPDATE employees 
SET user_role = 'admin' 
WHERE email LIKE '%admin%' OR email LIKE '%@test.com';

UPDATE employees 
SET user_role = 'accountant' 
WHERE email LIKE '%accountant%' OR email LIKE '%ketoan%';

UPDATE employees 
SET user_role = 'sales' 
WHERE email LIKE '%sales%' OR email LIKE '%kinhdoanh%';

UPDATE employees 
SET user_role = 'workshop_employee' 
WHERE email LIKE '%workshop%' OR email LIKE '%xuong%';

UPDATE employees 
SET user_role = 'employee' 
WHERE email LIKE '%employee%' OR email LIKE '%nhanvien%';

UPDATE employees 
SET user_role = 'worker' 
WHERE email LIKE '%worker%' OR email LIKE '%congnhan%';

UPDATE employees 
SET user_role = 'transport' 
WHERE email LIKE '%transport%' OR email LIKE '%taixe%';

UPDATE employees 
SET user_role = 'customer' 
WHERE email LIKE '%customer%' OR email LIKE '%khachhang%';

-- =====================================================
-- 4. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Kiểm tra cột user_role đã được thêm
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'user_role';

-- Kiểm tra dữ liệu user_role
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
-- Dữ liệu hiện tại đã được cập nhật
-- Có thể sử dụng user_role trong API tạo employee
