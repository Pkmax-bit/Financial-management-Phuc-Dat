-- =====================================================
-- SCRIPT RESET HOÀN TOÀN DATABASE
-- =====================================================
-- ⚠️ CẢNH BÁO: Script này sẽ xóa TOÀN BỘ dữ liệu
-- Chỉ sử dụng khi muốn reset hoàn toàn database
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. XÓA TẤT CẢ DỮ LIỆU TRONG CÁC BẢNG
-- =====================================================

-- Tắt kiểm tra foreign key
SET session_replication_role = replica;

-- Xóa tất cả dữ liệu
TRUNCATE TABLE project_team_timeline CASCADE;
TRUNCATE TABLE project_costs CASCADE;
TRUNCATE TABLE journal_entries CASCADE;
TRUNCATE TABLE expense_claims CASCADE;
TRUNCATE TABLE credit_memos CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE sales_receipts CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE projects CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE positions CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE users CASCADE;

-- =====================================================
-- 2. XÓA TẤT CẢ AUTH USERS (TÙY CHỌN)
-- =====================================================
-- UNCOMMENT nếu muốn xóa cả tài khoản đăng nhập
-- DELETE FROM auth.users;

-- =====================================================
-- 3. RESET TẤT CẢ SEQUENCES
-- =====================================================
-- Reset các sequence về 1
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.schemaname) || '.' || quote_ident(r.sequencename) || ' RESTART WITH 1';
    END LOOP;
END $$;

-- =====================================================
-- 4. BẬT LẠI KIỂM TRA FOREIGN KEY
-- =====================================================
SET session_replication_role = DEFAULT;

-- =====================================================
-- 5. XÓA CÁC BẢNG TẠM (nếu có)
-- =====================================================
-- Xóa các bảng tạm thời nếu có
DROP TABLE IF EXISTS temp_* CASCADE;

-- =====================================================
-- 6. KIỂM TRA KẾT QUẢ
-- =====================================================
-- Kiểm tra tất cả bảng đã trống
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 7. RESET HOÀN TẤT
-- =====================================================
-- Database đã được reset hoàn toàn
-- Tất cả dữ liệu đã bị xóa
-- Có thể bắt đầu với dữ liệu mới
