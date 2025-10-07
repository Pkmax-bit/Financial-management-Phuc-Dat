-- =====================================================
-- SCRIPT XÓA CHỈ DỮ LIỆU TEST/MOCK
-- =====================================================
-- Script này chỉ xóa dữ liệu test, giữ lại dữ liệu thật
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. XÓA DỮ LIỆU TEST THEO EMAIL PATTERN
-- =====================================================

-- Xóa users có email test
DELETE FROM users WHERE email LIKE '%@example.com';
DELETE FROM users WHERE email LIKE '%test%';
DELETE FROM users WHERE email LIKE '%demo%';
DELETE FROM users WHERE email LIKE '%sample%';

-- Xóa employees liên kết với users đã xóa
DELETE FROM employees WHERE email LIKE '%@example.com';
DELETE FROM employees WHERE email LIKE '%test%';
DELETE FROM employees WHERE email LIKE '%demo%';
DELETE FROM employees WHERE email LIKE '%sample%';

-- =====================================================
-- 2. XÓA DỮ LIỆU TEST THEO TÊN
-- =====================================================

-- Xóa customers test
DELETE FROM customers WHERE name LIKE '%Test%';
DELETE FROM customers WHERE name LIKE '%Demo%';
DELETE FROM customers WHERE name LIKE '%Sample%';

-- Xóa projects test
DELETE FROM projects WHERE name LIKE '%Test%';
DELETE FROM projects WHERE name LIKE '%Demo%';
DELETE FROM projects WHERE name LIKE '%Sample%';

-- =====================================================
-- 3. XÓA DỮ LIỆU TEST THEO ID PATTERN
-- =====================================================

-- Xóa dữ liệu có ID bắt đầu bằng 'user-' (test IDs)
DELETE FROM users WHERE id LIKE 'user-%';
DELETE FROM employees WHERE user_id LIKE 'user-%';

-- Xóa dữ liệu có ID bắt đầu bằng 'test-'
DELETE FROM projects WHERE id LIKE 'test-%';
DELETE FROM customers WHERE id LIKE 'test-%';

-- =====================================================
-- 4. XÓA CÁC BẢNG LIÊN QUAN
-- =====================================================

-- Xóa quotes, invoices, costs liên quan đến projects đã xóa
DELETE FROM quotes WHERE project_id NOT IN (SELECT id FROM projects);
DELETE FROM invoices WHERE project_id NOT IN (SELECT id FROM projects);
DELETE FROM project_costs WHERE project_id NOT IN (SELECT id FROM projects);

-- Xóa sales_receipts liên quan đến customers đã xóa
DELETE FROM sales_receipts WHERE customer_id NOT IN (SELECT id FROM customers);

-- =====================================================
-- 5. XÓA DEPARTMENTS VÀ POSITIONS TEST
-- =====================================================

-- Xóa departments test (cẩn thận với dữ liệu thật)
DELETE FROM departments WHERE name LIKE '%Test%';
DELETE FROM departments WHERE name LIKE '%Demo%';
DELETE FROM departments WHERE name LIKE '%Sample%';

-- Xóa positions test
DELETE FROM positions WHERE name LIKE '%Test%';
DELETE FROM positions WHERE name LIKE '%Demo%';
DELETE FROM positions WHERE name LIKE '%Sample%';

-- =====================================================
-- 6. KIỂM TRA KẾT QUẢ
-- =====================================================
-- Kiểm tra số lượng bản ghi còn lại
SELECT 
    'users' as table_name, 
    COUNT(*) as remaining_records 
FROM users
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'positions', COUNT(*) FROM positions;

-- =====================================================
-- 7. XÓA DỮ LIỆU TEST HOÀN TẤT
-- =====================================================
-- Chỉ dữ liệu test đã được xóa, dữ liệu thật được giữ lại
