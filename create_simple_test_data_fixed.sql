-- Clean existing data and insert simple test data with valid UUIDs
-- Using simple, predictable UUIDs for easy testing

-- Start transaction
BEGIN;

-- Delete existing data in reverse dependency order
DELETE FROM budget_lines;
DELETE FROM budgets;
DELETE FROM expense_claims;
DELETE FROM credit_memo_applications;
DELETE FROM credit_memo_refunds;
DELETE FROM credit_memos;
DELETE FROM journal_entry_lines;
DELETE FROM journal_entries;
DELETE FROM expenses;
DELETE FROM bills;
DELETE FROM sales_receipts;
DELETE FROM invoices;
DELETE FROM projects;
DELETE FROM vendors;
DELETE FROM customers;
DELETE FROM employees;

COMMIT;

-- Insert simple employees first (using valid UUIDs)
INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, hire_date, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', 'EMP001', 'Nguyen', 'Van A', 'nguyenvana@company.com', '0123456789', '2023-01-01', NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'EMP002', 'Tran', 'Thi B', 'tranthib@company.com', '0987654321', '2023-02-01', NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 'EMP003', 'Le', 'Van C', 'levanc@company.com', '0369852147', '2023-03-01', NOW(), NOW()),
('00000000-0000-0000-0000-000000000004', 'EMP004', 'Pham', 'Thi D', 'phamthid@company.com', '0147258369', '2023-04-01', NOW(), NOW()),
('00000000-0000-0000-0000-000000000005', 'EMP005', 'Hoang', 'Van E', 'hoangvane@company.com', '0258147369', '2023-05-01', NOW(), NOW());

-- Insert simple customers (using valid UUIDs)
INSERT INTO customers (id, customer_code, name, type, email, phone, address, city, country, tax_id, status, notes, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'CUST001', 'Cong ty ABC', 'company', 'contact@abc.com', '0123456789', '123 Duong ABC, Quan 1', 'TP.HCM', 'Vietnam', '0123456789', 'active', 'Khach hang VIP', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'CUST002', 'Doanh nghiep XYZ', 'company', 'info@xyz.com', '0987654321', '456 Duong XYZ, Quan 2', 'TP.HCM', 'Vietnam', '0987654321', 'active', 'Khach hang thuong xuyen', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'CUST003', 'Ca nhan Nguyen C', 'individual', 'nguyenc@email.com', '0369852147', '789 Duong DEF, Quan 3', 'TP.HCM', 'Vietnam', NULL, 'active', 'Khach hang ca nhan', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'CUST004', 'Tap doan ABC', 'company', 'ceo@abc.com', '0147258369', '321 Duong ABC, Quan 7', 'TP.HCM', 'Vietnam', '0147258369', 'active', 'Khach hang lon', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'CUST005', 'Cong ty DEF', 'company', 'admin@def.com', '0258147369', '654 Duong DEF, Quan 10', 'TP.HCM', 'Vietnam', '0258147369', 'active', 'Khach hang moi', NOW(), NOW());

-- Insert simple vendors (using valid UUIDs)
INSERT INTO vendors (id, vendor_code, name, contact_person, email, phone, address, city, country, tax_id, payment_terms, is_active, notes, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666666', 'VEND001', 'Nha cung cap ABC', 'Hoang Van A', 'supplier@abc.com', '0369258147', '987 Duong ABC, Quan 4', 'TP.HCM', 'Vietnam', '0369258147', 30, true, 'Nha cung cap chinh', NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'VEND002', 'Cong ty DEF', 'Vu Thi B', 'contact@def.com', '0471852963', '147 Duong DEF, Quan 5', 'TP.HCM', 'Vietnam', '0471852963', 15, true, 'Nha cung cap phu', NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'VEND003', 'Tap doan ABC', 'Dang Van C', 'info@abc.com', '0582963741', '258 Duong ABC, Quan 6', 'TP.HCM', 'Vietnam', '0582963741', 45, true, 'Nha cung cap lon', NOW(), NOW()),
('99999999-9999-9999-9999-999999999999', 'VEND004', 'Cong ty DEF', 'Bui Thi D', 'sales@def.com', '0693074852', '369 Duong DEF, Quan 8', 'TP.HCM', 'Vietnam', '0693074852', 0, true, 'Nha cung cap dia phuong', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VEND005', 'Doanh nghiep ABC', 'Ly Van E', 'admin@abc.com', '0704185926', '741 Duong ABC, Quan 9', 'TP.HCM', 'Vietnam', '0704185926', 30, true, 'Nha cung cap chuyen nghiep', NOW(), NOW());

-- Insert simple projects (using valid UUIDs)
INSERT INTO projects (id, project_code, name, description, customer_id, manager_id, start_date, end_date, budget, status, priority, progress, created_at, updated_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PRJ001', 'Du an Website ABC', 'Phat trien website cho cong ty ABC', '11111111-1111-1111-1111-111111111111', NULL, '2024-01-01', '2024-06-30', 50000000, 'active', 'high', 75.5, NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'PRJ002', 'He thong ERP XYZ', 'Trien khai he thong ERP cho doanh nghiep XYZ', '22222222-2222-2222-2222-222222222222', NULL, '2024-02-01', '2024-12-31', 200000000, 'active', 'urgent', 45.0, NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'PRJ003', 'App Mobile ABC', 'Phat trien ung dung di dong cho tap doan ABC', '44444444-4444-4444-4444-444444444444', NULL, '2024-03-01', '2024-09-30', 150000000, 'active', 'medium', 30.0, NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'PRJ004', 'Bao tri DEF', 'Dich vu bao tri he thong cho cong ty DEF', '55555555-5555-5555-5555-555555555555', NULL, '2024-01-15', '2024-12-31', 30000000, 'active', 'low', 60.0, NOW(), NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'PRJ005', 'Tu van Ca nhan', 'Dich vu tu van IT cho khach hang ca nhan', '33333333-3333-3333-3333-333333333333', NULL, '2024-04-01', '2024-08-31', 15000000, 'planning', 'medium', 0.0, NOW(), NOW());

-- Insert simple invoices (using valid UUIDs)
INSERT INTO invoices (id, invoice_number, customer_id, project_id, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, currency, status, payment_status, paid_amount, items, notes, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111112', 'INV-2024-001', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-01-15', '2024-02-14', 25000000, 10.0, 2500000, 27500000, 'VND', 'sent', 'paid', 27500000, '[{"description": "Phat trien website", "quantity": 1, "unit_price": 25000000, "total": 25000000}]', 'Thanh toan dung han', NOW(), NOW()),
('22222222-2222-2222-2222-222222222223', 'INV-2024-002', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-02-01', '2024-03-02', 50000000, 10.0, 5000000, 55000000, 'VND', 'sent', 'partial', 30000000, '[{"description": "Giai doan 1 ERP", "quantity": 1, "unit_price": 50000000, "total": 50000000}]', 'Thanh toan mot phan', NOW(), NOW()),
('33333333-3333-3333-3333-333333333334', 'INV-2024-003', '33333333-3333-3333-3333-333333333333', NULL, '2024-02-15', '2024-02-15', 5000000, 10.0, 500000, 5500000, 'VND', 'sent', 'paid', 5500000, '[{"description": "Tu van IT", "quantity": 10, "unit_price": 500000, "total": 5000000}]', 'Thanh toan ngay', NOW(), NOW()),
('44444444-4444-4444-4444-444444444445', 'INV-2024-004', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2024-03-01', '2024-04-15', 75000000, 10.0, 7500000, 82500000, 'VND', 'sent', 'pending', 0, '[{"description": "Giai doan 1 App Mobile", "quantity": 1, "unit_price": 75000000, "total": 75000000}]', 'Chua thanh toan', NOW(), NOW()),
('55555555-5555-5555-5555-555555555556', 'INV-2024-005', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024-03-15', '2024-04-14', 15000000, 10.0, 1500000, 16500000, 'VND', 'sent', 'overdue', 0, '[{"description": "Dich vu bao tri Q1", "quantity": 1, "unit_price": 15000000, "total": 15000000}]', 'Qua han thanh toan', NOW(), NOW());

-- Insert simple sales receipts (using valid UUIDs)
INSERT INTO sales_receipts (id, receipt_number, customer_id, issue_date, line_items, subtotal, tax_rate, tax_amount, discount_amount, total_amount, payment_method, notes, created_by, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111113', 'SR-2024-001', '11111111-1111-1111-1111-111111111111', '2024-01-20', '[{"description": "Dich vu ho tro", "quantity": 1, "unit_price": 2000000, "total": 2000000}]', 2000000, 10.0, 200000, 0, 2200000, 'Cash', 'Thanh toan tien mat', NULL, NOW(), NOW()),
('22222222-2222-2222-2222-222222222224', 'SR-2024-002', '33333333-3333-3333-3333-333333333333', '2024-02-10', '[{"description": "Tu van nhanh", "quantity": 2, "unit_price": 1000000, "total": 2000000}]', 2000000, 10.0, 200000, 100000, 2100000, 'Credit Card', 'Thanh toan the', NULL, NOW(), NOW()),
('33333333-3333-3333-3333-333333333335', 'SR-2024-003', '22222222-2222-2222-2222-222222222222', '2024-03-05', '[{"description": "Dich vu bo sung", "quantity": 1, "unit_price": 5000000, "total": 5000000}]', 5000000, 10.0, 500000, 0, 5500000, 'Bank Transfer', 'Chuyen khoan', NULL, NOW(), NOW());

-- Insert simple bills (using valid UUIDs)
INSERT INTO bills (id, bill_number, vendor_id, project_id, issue_date, due_date, amount, currency, status, paid_amount, paid_date, description, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666667', 'BILL-2024-001', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-01-10', '2024-02-09', 10000000, 'VND', 'paid', 10000000, '2024-02-05', 'Mua server cho du an ABC', NOW(), NOW()),
('77777777-7777-7777-7777-777777777778', 'BILL-2024-002', '77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-02-01', '2024-03-02', 20000000, 'VND', 'paid', 20000000, '2024-02-28', 'Phan mem ERP license', NOW(), NOW()),
('88888888-8888-8888-8888-888888888889', 'BILL-2024-003', '88888888-8888-8888-8888-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2024-03-01', '2024-04-15', 30000000, 'VND', 'pending', 0, NULL, 'Thiet bi mobile development', NOW(), NOW()),
('99999999-9999-9999-9999-99999999999a', 'BILL-2024-004', '99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024-03-10', '2024-04-09', 5000000, 'VND', 'paid', 5000000, '2024-04-05', 'Dich vu bao tri', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 'BILL-2024-005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, '2024-03-15', '2024-04-14', 8000000, 'VND', 'overdue', 0, NULL, 'Van phong pham', NOW(), NOW());

-- Insert simple expenses (using valid UUIDs)
INSERT INTO expenses (id, expense_code, employee_id, project_id, category, description, amount, currency, expense_date, receipt_url, status, approved_by, approved_at, notes, created_at, updated_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 'EXP-2024-001', '00000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'travel', 'Di cong tac Ha Noi', 5000000, 'VND', '2024-01-15', NULL, 'approved', NULL, '2024-01-20', 'Chi phi di lai va an o', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccd', 'EXP-2024-002', '00000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'meals', 'Tiep khach doi tac', 3000000, 'VND', '2024-02-10', NULL, 'approved', NULL, '2024-02-12', 'An toi voi khach hang', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-ddddddddddde', 'EXP-2024-003', '00000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'supplies', 'Mua thiet bi van phong', 2000000, 'VND', '2024-03-05', NULL, 'pending', NULL, NULL, 'Mua may in va giay', NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 'EXP-2024-004', '00000000-0000-0000-0000-000000000004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'training', 'Khoa hoc chuyen mon', 8000000, 'VND', '2024-03-20', NULL, 'approved', NULL, '2024-03-25', 'Hoc phi khoa hoc AWS', NOW(), NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'EXP-2024-005', '00000000-0000-0000-0000-000000000005', NULL, 'other', 'Chi phi khac', 1500000, 'VND', '2024-04-01', NULL, 'rejected', NULL, '2024-04-02', 'Chi phi khong hop le', NOW(), NOW());

-- Insert simple journal entries (using valid UUIDs)
INSERT INTO journal_entries (id, entry_number, entry_date, description, transaction_type, transaction_id, status, total_debit, total_credit, created_by, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111114', 'JE-2024-001', '2024-01-15 10:00:00+07', 'Ghi nhan doanh thu tu Invoice INV-2024-001', 'invoice', '11111111-1111-1111-1111-111111111112', 'posted', 27500000, 27500000, NULL, NOW(), NOW()),
('22222222-2222-2222-2222-222222222225', 'JE-2024-002', '2024-01-20 14:30:00+07', 'Ghi nhan doanh thu tu Sales Receipt SR-2024-001', 'sales_receipt', '11111111-1111-1111-1111-111111111113', 'posted', 2200000, 2200000, NULL, NOW(), NOW()),
('33333333-3333-3333-3333-333333333336', 'JE-2024-003', '2024-02-01 09:15:00+07', 'Ghi nhan doanh thu tu Invoice INV-2024-002', 'invoice', '22222222-2222-2222-2222-222222222223', 'posted', 55000000, 55000000, NULL, NOW(), NOW()),
('44444444-4444-4444-4444-444444444446', 'JE-2024-004', '2024-02-10 16:45:00+07', 'Ghi nhan doanh thu tu Sales Receipt SR-2024-002', 'sales_receipt', '22222222-2222-2222-2222-222222222224', 'posted', 2100000, 2100000, NULL, NOW(), NOW()),
('55555555-5555-5555-5555-555555555557', 'JE-2024-005', '2024-02-15 11:20:00+07', 'Ghi nhan doanh thu tu Invoice INV-2024-003', 'invoice', '33333333-3333-3333-3333-333333333334', 'posted', 5500000, 5500000, NULL, NOW(), NOW());

-- Insert simple journal entry lines (using valid UUIDs)
INSERT INTO journal_entry_lines (id, entry_id, account_code, account_name, debit_amount, credit_amount, description, reference_id, reference_type, created_at) VALUES
-- JE-2024-001: Invoice INV-2024-001
('66666666-6666-6666-6666-666666666668', '11111111-1111-1111-1111-111111111114', '131', 'Phai thu khach hang', 27500000, 0, 'Ghi nhan cong no khach hang ABC', '11111111-1111-1111-1111-111111111111', 'customer', NOW()),
('77777777-7777-7777-7777-777777777779', '11111111-1111-1111-1111-111111111114', '511', 'Doanh thu ban hang', 0, 25000000, 'Doanh thu tu du an website', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'project', NOW()),
('88888888-8888-8888-8888-88888888888a', '11111111-1111-1111-1111-111111111114', '3331', 'Thue GTGT phai nop', 0, 2500000, 'Thue GTGT 10%', NULL, 'tax', NOW()),

-- JE-2024-002: Sales Receipt SR-2024-001
('99999999-9999-9999-9999-99999999999b', '22222222-2222-2222-2222-222222222225', '111', 'Tien mat', 2200000, 0, 'Thu tien mat tu khach hang', '11111111-1111-1111-1111-111111111111', 'customer', NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '22222222-2222-2222-2222-222222222225', '511', 'Doanh thu ban hang', 0, 2000000, 'Doanh thu dich vu ho tro', NULL, 'service', NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', '22222222-2222-2222-2222-222222222225', '3331', 'Thue GTGT phai nop', 0, 200000, 'Thue GTGT 10%', NULL, 'tax', NOW()),

-- JE-2024-003: Invoice INV-2024-002
('cccccccc-cccc-cccc-cccc-ccccccccccce', '33333333-3333-3333-3333-333333333336', '131', 'Phai thu khach hang', 55000000, 0, 'Ghi nhan cong no khach hang XYZ', '22222222-2222-2222-2222-222222222222', 'customer', NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddf', '33333333-3333-3333-3333-333333333336', '511', 'Doanh thu ban hang', 0, 50000000, 'Doanh thu tu du an ERP', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'project', NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeeg', '33333333-3333-3333-3333-333333333336', '3331', 'Thue GTGT phai nop', 0, 5000000, 'Thue GTGT 10%', NULL, 'tax', NOW()),

-- JE-2024-004: Sales Receipt SR-2024-002
('ffffffff-ffff-ffff-ffff-ffffffffffff', '44444444-4444-4444-4444-444444444446', '112', 'Tien gui ngan hang', 2100000, 0, 'Thu tien qua the tin dung', '33333333-3333-3333-3333-333333333333', 'customer', NOW()),
('11111111-1111-1111-1111-111111111115', '44444444-4444-4444-4444-444444444446', '511', 'Doanh thu ban hang', 0, 2000000, 'Doanh thu tu van nhanh', NULL, 'service', NOW()),
('22222222-2222-2222-2222-222222222226', '44444444-4444-4444-4444-444444444446', '3331', 'Thue GTGT phai nop', 0, 200000, 'Thue GTGT 10%', NULL, 'tax', NOW()),

-- JE-2024-005: Invoice INV-2024-003
('33333333-3333-3333-3333-333333333337', '55555555-5555-5555-5555-555555555557', '131', 'Phai thu khach hang', 5500000, 0, 'Ghi nhan cong no khach hang ca nhan', '33333333-3333-3333-3333-333333333333', 'customer', NOW()),
('44444444-4444-4444-4444-444444444447', '55555555-5555-5555-5555-555555555557', '511', 'Doanh thu ban hang', 0, 5000000, 'Doanh thu tu van IT', NULL, 'service', NOW()),
('55555555-5555-5555-5555-555555555558', '55555555-5555-5555-5555-555555555557', '3331', 'Thue GTGT phai nop', 0, 500000, 'Thue GTGT 10%', NULL, 'tax', NOW());

-- Insert simple credit memos (using valid UUIDs)
INSERT INTO credit_memos (id, credit_memo_number, customer_id, original_invoice_id, issue_date, returned_items, subtotal, tax_rate, tax_amount, discount_amount, total_amount, currency, status, reason, applied_amount, remaining_amount, applied_to_invoices, refund_amount, notes, created_by, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666669', 'CM-2024-001', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111112', '2024-02-01', '[{"description": "Hoan tra mot phan dich vu", "quantity": 1, "unit_price": 5000000, "total": 5000000}]', 5000000, 10.0, 500000, 0, 5500000, 'VND', 'applied', 'Khach hang khong hai long voi mot phan dich vu', 5500000, 0, '["11111111-1111-1111-1111-111111111112"]', 0, 'Da ap dung vao hoa don goc', NULL, NOW(), NOW()),
('77777777-7777-7777-7777-77777777777a', 'CM-2024-002', '33333333-3333-3333-3333-333333333333', NULL, '2024-03-01', '[{"description": "Hoan tien dich vu", "quantity": 1, "unit_price": 1000000, "total": 1000000}]', 1000000, 10.0, 100000, 0, 1100000, 'VND', 'closed', 'Khach hang huy dich vu', 0, 0, '[]', 1100000, 'Da hoan tien cho khach hang', NULL, NOW(), NOW());

-- Insert simple expense claims (using valid UUIDs)
INSERT INTO expense_claims (id, claim_number, employee_id, submission_date, description, line_items, total_amount, currency, status, approved_by, approved_at, paid_by, paid_at, notes, created_at, updated_at) VALUES
('88888888-8888-8888-8888-88888888888b', 'EC-2024-001', '00000000-0000-0000-0000-000000000001', '2024-01-25', 'Chi phi cong tac thang 1', '[{"description": "Ve may bay", "amount": 3000000, "category": "travel"}, {"description": "Khach san", "amount": 2000000, "category": "accommodation"}]', 5000000, 'VND', 'paid', NULL, '2024-01-30', NULL, '2024-02-05', 'Da thanh toan day du', NOW(), NOW()),
('99999999-9999-9999-9999-99999999999c', 'EC-2024-002', '00000000-0000-0000-0000-000000000002', '2024-02-20', 'Chi phi tiep khach', '[{"description": "An toi voi doi tac", "amount": 2500000, "category": "meals"}]', 2500000, 'VND', 'approved', NULL, '2024-02-25', NULL, NULL, 'Cho thanh toan', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 'EC-2024-003', '00000000-0000-0000-0000-000000000003', '2024-03-15', 'Chi phi dao tao', '[{"description": "Khoa hoc online", "amount": 3000000, "category": "training"}]', 3000000, 'VND', 'submitted', NULL, NULL, NULL, NULL, 'Dang cho phe duyet', NOW(), NOW());

-- Insert simple budgets (using valid UUIDs)
INSERT INTO budgets (id, budget_name, period, start_date, end_date, total_budget, status, approved_by, approved_at, notes, created_by, created_at, updated_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', 'Ngan sach Q1 2024', 'Quarterly', '2024-01-01', '2024-03-31', 100000000, 'approved', NULL, '2024-01-01', 'Ngan sach quy 1 cho tat ca du an', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccf', 'Ngan sach Marketing 2024', 'Yearly', '2024-01-01', '2024-12-31', 50000000, 'approved', NULL, '2024-01-01', 'Ngan sach marketing ca nam', '00000000-0000-0000-0000-000000000002', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddg', 'Ngan sach Q2 2024', 'Quarterly', '2024-04-01', '2024-06-30', 120000000, 'draft', NULL, NULL, 'Ngan sach quy 2 dang soan thao', '00000000-0000-0000-0000-000000000003', NOW(), NOW());

-- Insert simple budget lines (using valid UUIDs)
INSERT INTO budget_lines (id, budget_id, expense_category_id, amount, notes, created_at, updated_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeeh', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', 'travel', 20000000, 'Chi phi di lai', NOW(), NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', 'meals', 15000000, 'Chi phi an uong', NOW(), NOW()),
('11111111-1111-1111-1111-111111111116', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', 'supplies', 10000000, 'Van phong pham', NOW(), NOW()),
('22222222-2222-2222-2222-222222222227', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', 'equipment', 30000000, 'Thiet bi', NOW(), NOW()),
('33333333-3333-3333-3333-333333333338', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', 'training', 25000000, 'Dao tao', NOW(), NOW()),
('44444444-4444-4444-4444-444444444448', 'cccccccc-cccc-cccc-cccc-cccccccccccf', 'other', 50000000, 'Chi phi marketing', NOW(), NOW());

-- Show summary of inserted data
SELECT 'Simple test data insertion completed successfully!' as status;

-- Show counts for verification
SELECT 'employees' as table_name, COUNT(*) as record_count FROM employees
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'sales_receipts', COUNT(*) FROM sales_receipts
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'journal_entries', COUNT(*) FROM journal_entries
UNION ALL
SELECT 'journal_entry_lines', COUNT(*) FROM journal_entry_lines
UNION ALL
SELECT 'credit_memos', COUNT(*) FROM credit_memos
UNION ALL
SELECT 'expense_claims', COUNT(*) FROM expense_claims
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets
UNION ALL
SELECT 'budget_lines', COUNT(*) FROM budget_lines;
