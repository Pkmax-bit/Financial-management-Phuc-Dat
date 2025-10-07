-- =====================================================
-- SCRIPT TẠO TÀI KHOẢN TEST ĐĂNG NHẬP ĐƠN GIẢN
-- =====================================================
-- Script này tạo các tài khoản test cơ bản để kiểm tra đăng nhập
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. TẠO USERS (TÀI KHOẢN NGƯỜI DÙNG)
-- =====================================================

-- Xóa users cũ nếu có
DELETE FROM users WHERE email LIKE '%@test.com';

-- Tạo users với các role khác nhau
INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at) VALUES
-- ADMIN
('test-admin-001', 'admin@test.com', 'Admin Test', 'admin', true, now(), now()),

-- ACCOUNTANT  
('test-acc-001', 'accountant@test.com', 'Accountant Test', 'accountant', true, now(), now()),

-- SALES
('test-sales-001', 'sales@test.com', 'Sales Test', 'sales', true, now(), now()),

-- WORKSHOP_EMPLOYEE
('test-workshop-001', 'workshop@test.com', 'Workshop Test', 'workshop_employee', true, now(), now()),

-- EMPLOYEE
('test-emp-001', 'employee@test.com', 'Employee Test', 'employee', true, now(), now()),

-- WORKER
('test-worker-001', 'worker@test.com', 'Worker Test', 'worker', true, now(), now()),

-- TRANSPORT
('test-trans-001', 'transport@test.com', 'Transport Test', 'transport', true, now(), now()),

-- CUSTOMER
('test-cust-001', 'customer@test.com', 'Customer Test', 'customer', true, now(), now());

-- =====================================================
-- 2. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Kiểm tra users đã tạo
SELECT 
    email,
    full_name,
    role,
    is_active,
    created_at
FROM users 
WHERE email LIKE '%@test.com'
ORDER BY role;

-- Đếm số lượng users theo role
SELECT 
    role,
    COUNT(*) as count
FROM users 
WHERE email LIKE '%@test.com'
GROUP BY role
ORDER BY role;

-- =====================================================
-- 3. THÔNG TIN ĐĂNG NHẬP
-- =====================================================
-- Sau khi chạy script này, bạn cần tạo auth accounts trong Supabase Dashboard:
-- 
-- 1. Vào Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" 
-- 3. Tạo từng tài khoản với thông tin:
--
-- 📧 Email: admin@test.com
-- 🔑 Password: 123456
-- 👤 Role: admin
--
-- 📧 Email: accountant@test.com  
-- 🔑 Password: 123456
-- 👤 Role: accountant
--
-- 📧 Email: sales@test.com
-- 🔑 Password: 123456
-- 👤 Role: sales
--
-- 📧 Email: workshop@test.com
-- 🔑 Password: 123456
-- 👤 Role: workshop_employee
--
-- 📧 Email: employee@test.com
-- 🔑 Password: 123456
-- 👤 Role: employee
--
-- 📧 Email: worker@test.com
-- 🔑 Password: 123456
-- 👤 Role: worker
--
-- 📧 Email: transport@test.com
-- 🔑 Password: 123456
-- 👤 Role: transport
--
-- 📧 Email: customer@test.com
-- 🔑 Password: 123456
-- 👤 Role: customer

-- =====================================================
-- 4. HOÀN TẤT
-- =====================================================
-- Đã tạo thành công 8 tài khoản test với các role khác nhau
-- Tiếp theo: Tạo auth accounts trong Supabase Dashboard
