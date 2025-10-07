-- =====================================================
-- XÓA TẤT CẢ DỮ LIỆU ẢO/MẪU TRONG HỆ THỐNG
-- =====================================================
-- Script này sẽ xóa tất cả dữ liệu mẫu từ:
-- - Chi phí (expenses, bills, expense_claims)
-- - Bán hàng (sales_receipts, invoices, credit_memos)
-- - Dự án (projects)
-- - Báo cáo (journal_entries, budgets)
-- - Khách hàng và nhà cung cấp mẫu
-- =====================================================

-- Bắt đầu transaction
BEGIN;

-- =====================================================
-- XÓA DỮ LIỆU THEO THỨ TỰ PHỤ THUỘC
-- =====================================================

-- 1. Xóa dữ liệu báo cáo và kế toán
PRINT 'Đang xóa dữ liệu báo cáo và kế toán...';

-- Xóa budget lines trước (có foreign key đến budgets)
DELETE FROM budget_lines;
PRINT 'Đã xóa budget_lines';

-- Xóa budgets
DELETE FROM budgets;
PRINT 'Đã xóa budgets';

-- Xóa journal entry lines trước (có foreign key đến journal entries)
DELETE FROM journal_entry_lines;
PRINT 'Đã xóa journal_entry_lines';

-- Xóa journal entries
DELETE FROM journal_entries;
PRINT 'Đã xóa journal_entries';

-- 2. Xóa dữ liệu chi phí
PRINT 'Đang xóa dữ liệu chi phí...';

-- Xóa expense claims
DELETE FROM expense_claims;
PRINT 'Đã xóa expense_claims';

-- Xóa expenses
DELETE FROM expenses;
PRINT 'Đã xóa expenses';

-- Xóa bills
DELETE FROM bills;
PRINT 'Đã xóa bills';

-- 3. Xóa dữ liệu bán hàng
PRINT 'Đang xóa dữ liệu bán hàng...';

-- Xóa credit memo applications trước (có foreign key đến credit memos)
DELETE FROM credit_memo_applications;
PRINT 'Đã xóa credit_memo_applications';

-- Xóa credit memo refunds
DELETE FROM credit_memo_refunds;
PRINT 'Đã xóa credit_memo_refunds';

-- Xóa credit memos
DELETE FROM credit_memos;
PRINT 'Đã xóa credit_memos';

-- Xóa sales receipts
DELETE FROM sales_receipts;
PRINT 'Đã xóa sales_receipts';

-- Xóa invoices
DELETE FROM invoices;
PRINT 'Đã xóa invoices';

-- 4. Xóa dữ liệu dự án
PRINT 'Đang xóa dữ liệu dự án...';

-- Xóa projects
DELETE FROM projects;
PRINT 'Đã xóa projects';

-- 5. Xóa dữ liệu khách hàng và nhà cung cấp mẫu
PRINT 'Đang xóa dữ liệu khách hàng và nhà cung cấp mẫu...';

-- Xóa vendors
DELETE FROM vendors;
PRINT 'Đã xóa vendors';

-- Xóa customers
DELETE FROM customers;
PRINT 'Đã xóa customers';

-- =====================================================
-- XÓA DỮ LIỆU MẪU CỤ THỂ (NẾU CÓ)
-- =====================================================

-- Xóa các khách hàng mẫu có tên chứa "ABC", "XYZ", "DEF", "GHI", "JKL"
DELETE FROM customers 
WHERE name LIKE '%ABC%' 
   OR name LIKE '%XYZ%' 
   OR name LIKE '%DEF%' 
   OR name LIKE '%GHI%' 
   OR name LIKE '%JKL%'
   OR name LIKE '%Cong ty%'
   OR name LIKE '%Doanh nghiep%'
   OR name LIKE '%Tap doan%'
   OR name LIKE '%Ca nhan%';
PRINT 'Đã xóa khách hàng mẫu';

-- Xóa các nhà cung cấp mẫu có tên chứa "MNO", "PQR", "STU", "VWX", "YZ"
DELETE FROM vendors 
WHERE name LIKE '%MNO%' 
   OR name LIKE '%PQR%' 
   OR name LIKE '%STU%' 
   OR name LIKE '%VWX%' 
   OR name LIKE '%YZ%'
   OR name LIKE '%Nha cung cap%'
   OR name LIKE '%Cong ty%'
   OR name LIKE '%Tap doan%'
   OR name LIKE '%Doanh nghiep%';
PRINT 'Đã xóa nhà cung cấp mẫu';

-- Xóa các dự án mẫu có tên chứa "Website", "ERP", "App", "Bao tri", "Tu van"
DELETE FROM projects 
WHERE name LIKE '%Website%' 
   OR name LIKE '%ERP%' 
   OR name LIKE '%App%' 
   OR name LIKE '%Bao tri%'
   OR name LIKE '%Tu van%'
   OR name LIKE '%Du an%';
PRINT 'Đã xóa dự án mẫu';

-- =====================================================
-- KIỂM TRA VÀ BÁO CÁO
-- =====================================================

-- Đếm số lượng bản ghi còn lại
SELECT 
    'customers' as table_name, 
    COUNT(*) as remaining_records 
FROM customers
UNION ALL
SELECT 
    'vendors' as table_name, 
    COUNT(*) as remaining_records 
FROM vendors
UNION ALL
SELECT 
    'projects' as table_name, 
    COUNT(*) as remaining_records 
FROM projects
UNION ALL
SELECT 
    'invoices' as table_name, 
    COUNT(*) as remaining_records 
FROM invoices
UNION ALL
SELECT 
    'sales_receipts' as table_name, 
    COUNT(*) as remaining_records 
FROM sales_receipts
UNION ALL
SELECT 
    'expenses' as table_name, 
    COUNT(*) as remaining_records 
FROM expenses
UNION ALL
SELECT 
    'bills' as table_name, 
    COUNT(*) as remaining_records 
FROM bills
UNION ALL
SELECT 
    'journal_entries' as table_name, 
    COUNT(*) as remaining_records 
FROM journal_entries
UNION ALL
SELECT 
    'budgets' as table_name, 
    COUNT(*) as remaining_records 
FROM budgets;

-- Commit transaction
COMMIT;

PRINT '=====================================================';
PRINT 'HOÀN THÀNH XÓA DỮ LIỆU ẢO/MẪU';
PRINT '=====================================================';
PRINT 'Đã xóa tất cả dữ liệu mẫu từ:';
PRINT '- Chi phí (expenses, bills, expense_claims)';
PRINT '- Bán hàng (sales_receipts, invoices, credit_memos)';
PRINT '- Dự án (projects)';
PRINT '- Báo cáo (journal_entries, budgets)';
PRINT '- Khách hàng và nhà cung cấp mẫu';
PRINT '=====================================================';
