-- =====================================================
-- SCRIPT XÓA TÀI KHOẢN TEST CŨ
-- =====================================================
-- Script này xóa các tài khoản test cũ để tránh xung đột
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. XÓA EMPLOYEES TEST
-- =====================================================

-- Xóa employees có email test
DELETE FROM employees WHERE email LIKE '%@test.com';

-- =====================================================
-- 2. XÓA USERS TEST
-- =====================================================

-- Xóa users có email test
DELETE FROM users WHERE email LIKE '%@test.com';

-- =====================================================
-- 3. XÓA AUTH USERS (CẦN THỰC HIỆN TRONG SUPABASE DASHBOARD)
-- =====================================================
-- Lưu ý: Không thể xóa auth users bằng SQL
-- Cần xóa thủ công trong Supabase Dashboard > Authentication > Users
-- Hoặc sử dụng Supabase Admin API

-- =====================================================
-- 4. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Kiểm tra employees còn lại
SELECT COUNT(*) as remaining_employees FROM employees WHERE email LIKE '%@test.com';

-- Kiểm tra users còn lại
SELECT COUNT(*) as remaining_users FROM users WHERE email LIKE '%@test.com';

-- Kiểm tra tất cả employees
SELECT 
    employee_code,
    first_name,
    last_name,
    email,
    user_role
FROM employees 
ORDER BY employee_code;

-- =====================================================
-- 5. HƯỚNG DẪN XÓA AUTH USERS
-- =====================================================
-- Để xóa auth users, thực hiện các bước sau:
-- 
-- 1. Vào Supabase Dashboard
-- 2. Chọn Authentication > Users
-- 3. Tìm các user có email @test.com
-- 4. Click vào từng user và chọn "Delete user"
-- 
-- Hoặc sử dụng script Python:
-- python delete_test_auth_users.py

-- =====================================================
-- 6. HOÀN TẤT
-- =====================================================
-- Đã xóa employees và users test
-- Cần xóa auth users thủ công trong Supabase Dashboard
-- Sau đó có thể tạo lại tài khoản test mới
