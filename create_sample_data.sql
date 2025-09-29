-- Sample Data for Financial Management System
-- This script creates comprehensive sample data for testing reports

-- First, let's create some sample users (assuming auth.users already has some entries)
-- We'll reference existing user IDs or create sample ones

-- Insert sample customers
INSERT INTO customers (id, customer_code, name, type, email, phone, address, city, country, tax_id, status, notes, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'CUST001', 'Công ty TNHH ABC', 'company', 'contact@abc.com', '0123456789', '123 Đường ABC, Quận 1', 'TP.HCM', 'Vietnam', '0123456789', 'active', 'Khách hàng VIP', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'CUST002', 'Doanh nghiệp XYZ', 'company', 'info@xyz.com', '0987654321', '456 Đường XYZ, Quận 2', 'TP.HCM', 'Vietnam', '0987654321', 'active', 'Khách hàng thường xuyên', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'CUST003', 'Cá nhân Nguyễn C', 'individual', 'nguyenc@email.com', '0369852147', '789 Đường DEF, Quận 3', 'TP.HCM', 'Vietnam', NULL, 'active', 'Khách hàng cá nhân', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'CUST004', 'Tập đoàn GHI', 'company', 'ceo@ghi.com', '0147258369', '321 Đường GHI, Quận 7', 'TP.HCM', 'Vietnam', '0147258369', 'active', 'Khách hàng lớn', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'CUST005', 'Công ty JKL', 'company', 'admin@jkl.com', '0258147369', '654 Đường JKL, Quận 10', 'TP.HCM', 'Vietnam', '0258147369', 'active', 'Khách hàng mới', NOW(), NOW());

-- Insert sample vendors
INSERT INTO vendors (id, vendor_code, name, contact_person, email, phone, address, city, country, tax_id, payment_terms, is_active, notes, created_at, updated_at) VALUES
('66666666-6666-6666-6666-666666666666', 'VEND001', 'Nhà cung cấp MNO', 'Hoàng Văn F', 'supplier@mno.com', '0369258147', '987 Đường MNO, Quận 4', 'TP.HCM', 'Vietnam', '0369258147', 30, true, 'Nhà cung cấp chính', NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'VEND002', 'Công ty PQR', 'Vũ Thị G', 'contact@pqr.com', '0471852963', '147 Đường PQR, Quận 5', 'TP.HCM', 'Vietnam', '0471852963', 15, true, 'Nhà cung cấp phụ', NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'VEND003', 'Tập đoàn STU', 'Đặng Văn H', 'info@stu.com', '0582963741', '258 Đường STU, Quận 6', 'TP.HCM', 'Vietnam', '0582963741', 45, true, 'Nhà cung cấp lớn', NOW(), NOW()),
('99999999-9999-9999-9999-999999999999', 'VEND004', 'Công ty VWX', 'Bùi Thị I', 'sales@vwx.com', '0693074852', '369 Đường VWX, Quận 8', 'TP.HCM', 'Vietnam', '0693074852', 0, true, 'Nhà cung cấp địa phương', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VEND005', 'Doanh nghiệp YZ', 'Lý Văn J', 'admin@yz.com', '0704185926', '741 Đường YZ, Quận 9', 'TP.HCM', 'Vietnam', '0704185926', 30, true, 'Nhà cung cấp chuyên nghiệp', NOW(), NOW());

-- Insert sample projects
INSERT INTO projects (id, project_code, name, description, customer_id, manager_id, start_date, end_date, budget, status, priority, progress, created_at, updated_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PRJ001', 'Dự án Website ABC', 'Phát triển website cho công ty ABC', '11111111-1111-1111-1111-111111111111', NULL, '2024-01-01', '2024-06-30', 50000000, 'active', 'high', 75.5, NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'PRJ002', 'Hệ thống ERP XYZ', 'Triển khai hệ thống ERP cho doanh nghiệp XYZ', '22222222-2222-2222-2222-222222222222', NULL, '2024-02-01', '2024-12-31', 200000000, 'active', 'urgent', 45.0, NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'PRJ003', 'App Mobile GHI', 'Phát triển ứng dụng di động cho tập đoàn GHI', '44444444-4444-4444-4444-444444444444', NULL, '2024-03-01', '2024-09-30', 150000000, 'active', 'medium', 30.0, NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'PRJ004', 'Bảo trì JKL', 'Dịch vụ bảo trì hệ thống cho công ty JKL', '55555555-5555-5555-5555-555555555555', NULL, '2024-01-15', '2024-12-31', 30000000, 'active', 'low', 60.0, NOW(), NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'PRJ005', 'Tư vấn Cá nhân', 'Dịch vụ tư vấn IT cho khách hàng cá nhân', '33333333-3333-3333-3333-333333333333', NULL, '2024-04-01', '2024-08-31', 15000000, 'planning', 'medium', 0.0, NOW(), NOW());

-- Insert sample invoices
INSERT INTO invoices (id, invoice_number, customer_id, project_id, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, currency, status, payment_status, paid_amount, items, notes, created_at, updated_at) VALUES
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'INV-2024-001', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-01-15', '2024-02-14', 25000000, 10.0, 2500000, 27500000, 'VND', 'sent', 'paid', 27500000, '[{"description": "Phát triển website", "quantity": 1, "unit_price": 25000000, "total": 25000000}]', 'Thanh toán đúng hạn', NOW(), NOW()),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'INV-2024-002', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-02-01', '2024-03-02', 50000000, 10.0, 5000000, 55000000, 'VND', 'sent', 'partial', 30000000, '[{"description": "Giai đoạn 1 ERP", "quantity": 1, "unit_price": 50000000, "total": 50000000}]', 'Thanh toán một phần', NOW(), NOW()),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'INV-2024-003', '33333333-3333-3333-3333-333333333333', NULL, '2024-02-15', '2024-02-15', 5000000, 10.0, 500000, 5500000, 'VND', 'sent', 'paid', 5500000, '[{"description": "Tư vấn IT", "quantity": 10, "unit_price": 500000, "total": 5000000}]', 'Thanh toán ngay', NOW(), NOW()),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'INV-2024-004', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2024-03-01', '2024-04-15', 75000000, 10.0, 7500000, 82500000, 'VND', 'sent', 'pending', 0, '[{"description": "Giai đoạn 1 App Mobile", "quantity": 1, "unit_price": 75000000, "total": 75000000}]', 'Chưa thanh toán', NOW(), NOW()),
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'INV-2024-005', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024-03-15', '2024-04-14', 15000000, 10.0, 1500000, 16500000, 'VND', 'sent', 'overdue', 0, '[{"description": "Dịch vụ bảo trì Q1", "quantity": 1, "unit_price": 15000000, "total": 15000000}]', 'Quá hạn thanh toán', NOW(), NOW());

-- Insert sample sales receipts
INSERT INTO sales_receipts (id, receipt_number, customer_id, issue_date, line_items, subtotal, tax_rate, tax_amount, discount_amount, total_amount, payment_method, notes, created_by, created_at, updated_at) VALUES
('llllllll-llll-llll-llll-llllllllllll', 'SR-2024-001', '11111111-1111-1111-1111-111111111111', '2024-01-20', '[{"description": "Dịch vụ hỗ trợ", "quantity": 1, "unit_price": 2000000, "total": 2000000}]', 2000000, 10.0, 200000, 0, 2200000, 'Cash', 'Thanh toán tiền mặt', NULL, NOW(), NOW()),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'SR-2024-002', '33333333-3333-3333-3333-333333333333', '2024-02-10', '[{"description": "Tư vấn nhanh", "quantity": 2, "unit_price": 1000000, "total": 2000000}]', 2000000, 10.0, 200000, 100000, 2100000, 'Credit Card', 'Thanh toán thẻ', NULL, NOW(), NOW()),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', 'SR-2024-003', '22222222-2222-2222-2222-222222222222', '2024-03-05', '[{"description": "Dịch vụ bổ sung", "quantity": 1, "unit_price": 5000000, "total": 5000000}]', 5000000, 10.0, 500000, 0, 5500000, 'Bank Transfer', 'Chuyển khoản', NULL, NOW(), NOW());

-- Insert sample bills
INSERT INTO bills (id, bill_number, vendor_id, project_id, issue_date, due_date, amount, currency, status, paid_amount, paid_date, description, created_at, updated_at) VALUES
('oooooooo-oooo-oooo-oooo-oooooooooooo', 'BILL-2024-001', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2024-01-10', '2024-02-09', 10000000, 'VND', 'paid', 10000000, '2024-02-05', 'Mua server cho dự án ABC', NOW(), NOW()),
('pppppppp-pppp-pppp-pppp-pppppppppppp', 'BILL-2024-002', '77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '2024-02-01', '2024-03-02', 20000000, 'VND', 'paid', 20000000, '2024-02-28', 'Phần mềm ERP license', NOW(), NOW()),
('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'BILL-2024-003', '88888888-8888-8888-8888-888888888888', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2024-03-01', '2024-04-15', 30000000, 'VND', 'pending', 0, NULL, 'Thiết bị mobile development', NOW(), NOW()),
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'BILL-2024-004', '99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2024-03-10', '2024-04-09', 5000000, 'VND', 'paid', 5000000, '2024-04-05', 'Dịch vụ bảo trì', NOW(), NOW()),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'BILL-2024-005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, '2024-03-15', '2024-04-14', 8000000, 'VND', 'overdue', 0, NULL, 'Văn phòng phẩm', NOW(), NOW());

-- Insert sample expenses
INSERT INTO expenses (id, expense_code, employee_id, project_id, category, description, amount, currency, expense_date, receipt_url, status, approved_by, approved_at, notes, created_at, updated_at) VALUES
('tttttttt-tttt-tttt-tttt-tttttttttttt', 'EXP-2024-001', NULL, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'travel', 'Đi công tác Hà Nội', 5000000, 'VND', '2024-01-15', NULL, 'approved', NULL, '2024-01-20', 'Chi phí đi lại và ăn ở', NOW(), NOW()),
('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 'EXP-2024-002', NULL, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'meals', 'Tiếp khách đối tác', 3000000, 'VND', '2024-02-10', NULL, 'approved', NULL, '2024-02-12', 'Ăn tối với khách hàng', NOW(), NOW()),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv', 'EXP-2024-003', NULL, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'supplies', 'Mua thiết bị văn phòng', 2000000, 'VND', '2024-03-05', NULL, 'pending', NULL, NULL, 'Mua máy in và giấy', NOW(), NOW()),
('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww', 'EXP-2024-004', NULL, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'training', 'Khóa học chuyên môn', 8000000, 'VND', '2024-03-20', NULL, 'approved', NULL, '2024-03-25', 'Học phí khóa học AWS', NOW(), NOW()),
('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'EXP-2024-005', NULL, NULL, 'other', 'Chi phí khác', 1500000, 'VND', '2024-04-01', NULL, 'rejected', NULL, '2024-04-02', 'Chi phí không hợp lệ', NOW(), NOW());

-- Insert sample journal entries for accounting
INSERT INTO journal_entries (id, entry_number, entry_date, description, transaction_type, transaction_id, status, total_debit, total_credit, created_by, created_at, updated_at) VALUES
('yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', 'JE-2024-001', '2024-01-15 10:00:00+07', 'Ghi nhận doanh thu từ Invoice INV-2024-001', 'invoice', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'posted', 27500000, 27500000, NULL, NOW(), NOW()),
('zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', 'JE-2024-002', '2024-01-20 14:30:00+07', 'Ghi nhận doanh thu từ Sales Receipt SR-2024-001', 'sales_receipt', 'llllllll-llll-llll-llll-llllllllllll', 'posted', 2200000, 2200000, NULL, NOW(), NOW()),
('11111111-1111-1111-1111-111111111112', 'JE-2024-003', '2024-02-01 09:15:00+07', 'Ghi nhận doanh thu từ Invoice INV-2024-002', 'invoice', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'posted', 55000000, 55000000, NULL, NOW(), NOW()),
('22222222-2222-2222-2222-222222222223', 'JE-2024-004', '2024-02-10 16:45:00+07', 'Ghi nhận doanh thu từ Sales Receipt SR-2024-002', 'sales_receipt', 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'posted', 2100000, 2100000, NULL, NOW(), NOW()),
('33333333-3333-3333-3333-333333333334', 'JE-2024-005', '2024-02-15 11:20:00+07', 'Ghi nhận doanh thu từ Invoice INV-2024-003', 'invoice', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'posted', 5500000, 5500000, NULL, NOW(), NOW());

-- Insert sample journal entry lines
INSERT INTO journal_entry_lines (id, entry_id, account_code, account_name, debit_amount, credit_amount, description, reference_id, reference_type, created_at) VALUES
-- JE-2024-001: Invoice INV-2024-001
('44444444-4444-4444-4444-444444444445', 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', '131', 'Phải thu khách hàng', 27500000, 0, 'Ghi nhận công nợ khách hàng ABC', '11111111-1111-1111-1111-111111111111', 'customer', NOW()),
('55555555-5555-5555-5555-555555555556', 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', '511', 'Doanh thu bán hàng', 0, 25000000, 'Doanh thu từ dự án website', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'project', NOW()),
('66666666-6666-6666-6666-666666666667', 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy', '3331', 'Thuế GTGT phải nộp', 0, 2500000, 'Thuế GTGT 10%', NULL, 'tax', NOW()),

-- JE-2024-002: Sales Receipt SR-2024-001
('77777777-7777-7777-7777-777777777778', 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', '111', 'Tiền mặt', 2200000, 0, 'Thu tiền mặt từ khách hàng', '11111111-1111-1111-1111-111111111111', 'customer', NOW()),
('88888888-8888-8888-8888-888888888889', 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', '511', 'Doanh thu bán hàng', 0, 2000000, 'Doanh thu dịch vụ hỗ trợ', NULL, 'service', NOW()),
('99999999-9999-9999-9999-99999999999a', 'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz', '3331', 'Thuế GTGT phải nộp', 0, 200000, 'Thuế GTGT 10%', NULL, 'tax', NOW()),

-- JE-2024-003: Invoice INV-2024-002
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '11111111-1111-1111-1111-111111111112', '131', 'Phải thu khách hàng', 55000000, 0, 'Ghi nhận công nợ khách hàng XYZ', '22222222-2222-2222-2222-222222222222', 'customer', NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', '11111111-1111-1111-1111-111111111112', '511', 'Doanh thu bán hàng', 0, 50000000, 'Doanh thu từ dự án ERP', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'project', NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccd', '11111111-1111-1111-1111-111111111112', '3331', 'Thuế GTGT phải nộp', 0, 5000000, 'Thuế GTGT 10%', NULL, 'tax', NOW()),

-- JE-2024-004: Sales Receipt SR-2024-002
('dddddddd-dddd-dddd-dddd-ddddddddddde', '22222222-2222-2222-2222-222222222223', '112', 'Tiền gửi ngân hàng', 2100000, 0, 'Thu tiền qua thẻ tín dụng', '33333333-3333-3333-3333-333333333333', 'customer', NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', '22222222-2222-2222-2222-222222222223', '511', 'Doanh thu bán hàng', 0, 2000000, 'Doanh thu tư vấn nhanh', NULL, 'service', NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffg', '22222222-2222-2222-2222-222222222223', '3331', 'Thuế GTGT phải nộp', 0, 200000, 'Thuế GTGT 10%', NULL, 'tax', NOW()),

-- JE-2024-005: Invoice INV-2024-003
('gggggggg-gggg-gggg-gggg-gggggggggggh', '33333333-3333-3333-3333-333333333334', '131', 'Phải thu khách hàng', 5500000, 0, 'Ghi nhận công nợ khách hàng cá nhân', '33333333-3333-3333-3333-333333333333', 'customer', NOW()),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhi', '33333333-3333-3333-3333-333333333334', '511', 'Doanh thu bán hàng', 0, 5000000, 'Doanh thu tư vấn IT', NULL, 'service', NOW()),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiij', '33333333-3333-3333-3333-333333333334', '3331', 'Thuế GTGT phải nộp', 0, 500000, 'Thuế GTGT 10%', NULL, 'tax', NOW());

-- Insert sample credit memos
INSERT INTO credit_memos (id, credit_memo_number, customer_id, original_invoice_id, issue_date, returned_items, subtotal, tax_rate, tax_amount, discount_amount, total_amount, currency, status, reason, applied_amount, remaining_amount, applied_to_invoices, refund_amount, notes, created_by, created_at, updated_at) VALUES
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjk', 'CM-2024-001', '11111111-1111-1111-1111-111111111111', 'gggggggg-gggg-gggg-gggg-gggggggggggg', '2024-02-01', '[{"description": "Hoàn trả một phần dịch vụ", "quantity": 1, "unit_price": 5000000, "total": 5000000}]', 5000000, 10.0, 500000, 0, 5500000, 'VND', 'applied', 'Khách hàng không hài lòng với một phần dịch vụ', 5500000, 0, '["gggggggg-gggg-gggg-gggg-gggggggggggg"]', 0, 'Đã áp dụng vào hóa đơn gốc', NULL, NOW(), NOW()),
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkl', 'CM-2024-002', '33333333-3333-3333-3333-333333333333', NULL, '2024-03-01', '[{"description": "Hoàn tiền dịch vụ", "quantity": 1, "unit_price": 1000000, "total": 1000000}]', 1000000, 10.0, 100000, 0, 1100000, 'VND', 'closed', 'Khách hàng hủy dịch vụ', 0, 0, '[]', 1100000, 'Đã hoàn tiền cho khách hàng', NULL, NOW(), NOW());

-- Insert sample expense claims
INSERT INTO expense_claims (id, claim_number, employee_id, submission_date, description, line_items, total_amount, currency, status, approved_by, approved_at, paid_by, paid_at, notes, created_at, updated_at) VALUES
('llllllll-llll-llll-llll-lllllllllllm', 'EC-2024-001', NULL, '2024-01-25', 'Chi phí công tác tháng 1', '[{"description": "Vé máy bay", "amount": 3000000, "category": "travel"}, {"description": "Khách sạn", "amount": 2000000, "category": "accommodation"}]', 5000000, 'VND', 'paid', NULL, '2024-01-30', NULL, '2024-02-05', 'Đã thanh toán đầy đủ', NOW(), NOW()),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmn', 'EC-2024-002', NULL, '2024-02-20', 'Chi phí tiếp khách', '[{"description": "Ăn tối với đối tác", "amount": 2500000, "category": "meals"}]', 2500000, 'VND', 'approved', NULL, '2024-02-25', NULL, NULL, 'Chờ thanh toán', NOW(), NOW()),
('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnno', 'EC-2024-003', NULL, '2024-03-15', 'Chi phí đào tạo', '[{"description": "Khóa học online", "amount": 3000000, "category": "training"}]', 3000000, 'VND', 'submitted', NULL, NULL, NULL, NULL, 'Đang chờ phê duyệt', NOW(), NOW());

-- Insert sample budgets
INSERT INTO budgets (id, budget_name, period, start_date, end_date, total_budget, status, approved_by, approved_at, notes, created_by, created_at, updated_at) VALUES
('oooooooo-oooo-oooo-oooo-ooooooooooop', 'Ngân sách Q1 2024', 'Quarterly', '2024-01-01', '2024-03-31', 100000000, 'approved', NULL, '2024-01-01', 'Ngân sách quý 1 cho tất cả dự án', NULL, NOW(), NOW()),
('pppppppp-pppp-pppp-pppp-pppppppppppq', 'Ngân sách Marketing 2024', 'Yearly', '2024-01-01', '2024-12-31', 50000000, 'approved', NULL, '2024-01-01', 'Ngân sách marketing cả năm', NULL, NOW(), NOW()),
('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqr', 'Ngân sách Q2 2024', 'Quarterly', '2024-04-01', '2024-06-30', 120000000, 'draft', NULL, NULL, 'Ngân sách quý 2 đang soạn thảo', NULL, NOW(), NOW());

-- Insert sample budget lines
INSERT INTO budget_lines (id, budget_id, expense_category_id, amount, notes, created_at, updated_at) VALUES
('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrs', 'oooooooo-oooo-oooo-oooo-ooooooooooop', 'travel', 20000000, 'Chi phí đi lại', NOW(), NOW()),
('ssssssss-ssss-ssss-ssss-ssssssssssst', 'oooooooo-oooo-oooo-oooo-ooooooooooop', 'meals', 15000000, 'Chi phí ăn uống', NOW(), NOW()),
('tttttttt-tttt-tttt-tttt-tttttttttttu', 'oooooooo-oooo-oooo-oooo-ooooooooooop', 'supplies', 10000000, 'Văn phòng phẩm', NOW(), NOW()),
('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuv', 'oooooooo-oooo-oooo-oooo-ooooooooooop', 'equipment', 30000000, 'Thiết bị', NOW(), NOW()),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvw', 'oooooooo-oooo-oooo-oooo-ooooooooooop', 'training', 25000000, 'Đào tạo', NOW(), NOW()),
('wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwwx', 'pppppppp-pppp-pppp-pppp-pppppppppppq', 'other', 50000000, 'Chi phí marketing', NOW(), NOW());

COMMIT;
