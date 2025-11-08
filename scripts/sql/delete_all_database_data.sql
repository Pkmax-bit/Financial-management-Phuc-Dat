-- =====================================================
-- SCRIPT XÓA TOÀN BỘ DỮ LIỆU DATABASE
-- =====================================================
-- Script này sẽ xóa tất cả dữ liệu trong database
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. TẮT KIỂM TRA FOREIGN KEY (nếu cần)
-- =====================================================
-- PostgreSQL thường không cần, nhưng để đảm bảo
SET session_replication_role = replica;

-- =====================================================
-- 2. XÓA DỮ LIỆU THEO THỨ TỰ PHỤ THUỘC
-- =====================================================

-- Xóa từ bảng con trước, bảng cha sau
DELETE FROM project_team_timeline;
DELETE FROM project_costs;
DELETE FROM journal_entries;
DELETE FROM expense_claims;
DELETE FROM credit_memos;
DELETE FROM purchase_orders;
DELETE FROM sales_receipts;
DELETE FROM invoices;
DELETE FROM quotes;
DELETE FROM projects;
DELETE FROM customers;
DELETE FROM employees;
DELETE FROM positions;
DELETE FROM departments;
DELETE FROM users;

-- =====================================================
-- 3. XÓA DỮ LIỆU AUTH (nếu cần)
-- =====================================================
-- Lưu ý: Chỉ xóa nếu bạn muốn xóa cả tài khoản đăng nhập
-- UNCOMMENT các dòng dưới nếu muốn xóa cả auth users
-- DELETE FROM auth.users WHERE email LIKE '%@example.com';
-- DELETE FROM auth.users WHERE email NOT LIKE '%@supabase%';

-- =====================================================
-- 4. RESET SEQUENCES (nếu có)
-- =====================================================
-- Reset các sequence nếu có sử dụng
-- ALTER SEQUENCE IF EXISTS your_sequence_name RESTART WITH 1;

-- =====================================================
-- 5. BẬT LẠI KIỂM TRA FOREIGN KEY
-- =====================================================
SET session_replication_role = DEFAULT;

-- =====================================================
-- 6. KIỂM TRA KẾT QUẢ XÓA
-- =====================================================
-- Kiểm tra số lượng bản ghi còn lại trong mỗi bảng
SELECT 
    'users' as table_name, 
    COUNT(*) as remaining_records 
FROM users
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'positions', COUNT(*) FROM positions
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'sales_receipts', COUNT(*) FROM sales_receipts
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'credit_memos', COUNT(*) FROM credit_memos
UNION ALL
SELECT 'expense_claims', COUNT(*) FROM expense_claims
UNION ALL
SELECT 'journal_entries', COUNT(*) FROM journal_entries
UNION ALL
SELECT 'project_costs', COUNT(*) FROM project_costs
UNION ALL
SELECT 'project_team_timeline', COUNT(*) FROM project_team_timeline;

-- =====================================================
-- 7. XÓA DỮ LIỆU HOÀN TẤT
-- =====================================================
-- Tất cả dữ liệu đã được xóa khỏi database
-- Bạn có thể bắt đầu với dữ liệu mới
