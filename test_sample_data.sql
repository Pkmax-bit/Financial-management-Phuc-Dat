-- Test script to check which tables exist and their structure
-- Run this first to identify any missing tables or columns

-- Test customers table
SELECT 'Testing customers table...' as test;
INSERT INTO customers (id, customer_code, name, type, email, phone, address, city, country, tax_id, status, notes, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'CUST001', 'Công ty TNHH ABC', 'company', 'contact@abc.com', '0123456789', '123 Đường ABC, Quận 1', 'TP.HCM', 'Vietnam', '0123456789', 'active', 'Khách hàng VIP', NOW(), NOW());

-- Test vendors table
SELECT 'Testing vendors table...' as test;
INSERT INTO vendors (id, vendor_code, name, contact_person, email, phone, address, city, country, tax_id, payment_terms, is_active, notes, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666666', 'VEND001', 'Nhà cung cấp MNO', 'Hoàng Văn F', 'supplier@mno.com', '0369258147', '987 Đường MNO, Quận 4', 'TP.HCM', 'Vietnam', '0369258147', 30, true, 'Nhà cung cấp chính', NOW(), NOW());

-- Test projects table
SELECT 'Testing projects table...' as test;
INSERT INTO projects (id, project_code, name, description, customer_id, manager_id, start_date, end_date, budget, status, priority, progress, created_at, updated_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PRJ001', 'Dự án Website ABC', 'Phát triển website cho công ty ABC', '11111111-1111-1111-1111-111111111111', NULL, '2024-01-01', '2024-06-30', 50000000, 'active', 'high', 75.5, NOW(), NOW());

-- Test invoices table
SELECT 'Testing invoices table...' as test;
INSERT INTO invoices (id, invoice_number, customer_id, project_id, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, currency, status, payment_status, paid_amount, items, notes, created_at, updated_at) VALUES
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'INV-2024-001', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-01-15', '2024-02-14', 25000000, 10.0, 2500000, 27500000, 'VND', 'sent', 'paid', 27500000, '[{"description": "Phát triển website", "quantity": 1, "unit_price": 25000000, "total": 25000000}]', 'Thanh toán đúng hạn', NOW(), NOW());

-- Test sales_receipts table
SELECT 'Testing sales_receipts table...' as test;
INSERT INTO sales_receipts (id, receipt_number, customer_id, issue_date, line_items, subtotal, tax_rate, tax_amount, discount_amount, total_amount, payment_method, notes, created_by, created_at, updated_at) VALUES
('llllllll-llll-llll-llll-llllllllllll', 'SR-2024-001', '11111111-1111-1111-1111-111111111111', '2024-01-20', '[{"description": "Dịch vụ hỗ trợ", "quantity": 1, "unit_price": 2000000, "total": 2000000}]', 2000000, 10.0, 200000, 0, 2200000, 'Cash', 'Thanh toán tiền mặt', NULL, NOW(), NOW());

-- Test bills table
SELECT 'Testing bills table...' as test;
INSERT INTO bills (id, bill_number, vendor_id, project_id, issue_date, due_date, amount, currency, status, paid_amount, paid_date, description, created_at, updated_at) VALUES
('oooooooo-oooo-oooo-oooo-oooooooooooo', 'BILL-2024-001', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-01-10', '2024-02-09', 10000000, 'VND', 'paid', 10000000, '2024-02-05', 'Mua server cho dự án ABC', NOW(), NOW());

-- Test expenses table
SELECT 'Testing expenses table...' as test;
INSERT INTO expenses (id, expense_code, employee_id, project_id, category, description, amount, currency, expense_date, receipt_url, status, approved_by, approved_at, notes, created_at, updated_at) VALUES
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'EXP-2024-001', NULL, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'travel', 'Đi công tác Hà Nội', 5000000, 'VND', '2024-01-15', NULL, 'approved', NULL, '2024-01-20', 'Chi phí đi lại và ăn ở', NOW(), NOW());

-- Test journal_entries table
SELECT 'Testing journal_entries table...' as test;
INSERT INTO journal_entries (id, entry_number, entry_date, description, transaction_type, transaction_id, status, total_debit, total_credit, created_by, created_at, updated_at) VALUES
('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 'JE-2024-001', '2024-01-15 10:00:00+07', 'Ghi nhận doanh thu từ Invoice INV-2024-001', 'invoice', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'posted', 27500000, 27500000, NULL, NOW(), NOW());

-- Test journal_entry_lines table
SELECT 'Testing journal_entry_lines table...' as test;
INSERT INTO journal_entry_lines (id, entry_id, account_code, account_name, debit_amount, credit_amount, description, reference_id, reference_type, created_at) VALUES
('44444444-4444-4444-4444-444444444445', 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', '131', 'Phải thu khách hàng', 27500000, 0, 'Ghi nhận công nợ khách hàng ABC', '11111111-1111-1111-1111-111111111111', 'customer', NOW());

SELECT 'All test inserts completed successfully!' as result;
