-- =====================================================
-- SCRIPT TẠO EMPLOYEES TRƯỚC, SAU ĐÓ TẠO USERS
-- =====================================================
-- Script này tạo employees trước, sau đó tạo users với các role khác nhau
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. TẠO DEPARTMENTS (PHÒNG BAN) TRƯỚC
-- =====================================================

-- Xóa departments cũ nếu có
DELETE FROM departments WHERE code IN ('MGMT', 'ACCT', 'SALES', 'IT', 'OPS', 'WORKSHOP', 'TRANSPORT');

-- Tạo departments
INSERT INTO departments (id, name, code, description, is_active, created_at, updated_at) VALUES
('dept-001', 'Quản lý', 'MGMT', 'Phòng Quản lý và Điều hành', true, now(), now()),
('dept-002', 'Kế toán', 'ACCT', 'Phòng Kế toán và Tài chính', true, now(), now()),
('dept-003', 'Kinh doanh', 'SALES', 'Phòng Kinh doanh và Marketing', true, now(), now()),
('dept-004', 'Công nghệ', 'IT', 'Phòng Công nghệ thông tin', true, now(), now()),
('dept-005', 'Vận hành', 'OPS', 'Phòng Vận hành và Logistics', true, now(), now()),
('dept-006', 'Xưởng sản xuất', 'WORKSHOP', 'Xưởng sản xuất và Chế tạo', true, now(), now()),
('dept-007', 'Vận chuyển', 'TRANSPORT', 'Phòng Vận chuyển và Giao hàng', true, now(), now());

-- =====================================================
-- 2. TẠO POSITIONS (CHỨC VỤ)
-- =====================================================

-- Xóa positions cũ nếu có
DELETE FROM positions WHERE code LIKE 'POS-%';

-- Tạo positions
INSERT INTO positions (id, name, code, description, department_id, salary_range_min, salary_range_max, is_active, created_at, updated_at) VALUES
-- Quản lý
('pos-001', 'Giám đốc', 'POS-MGMT-001', 'Giám đốc điều hành', 'dept-001', 50000000, 80000000, true, now(), now()),
('pos-002', 'Phó giám đốc', 'POS-MGMT-002', 'Phó giám đốc', 'dept-001', 40000000, 60000000, true, now(), now()),

-- Kế toán
('pos-003', 'Kế toán trưởng', 'POS-ACCT-001', 'Trưởng phòng kế toán', 'dept-002', 25000000, 40000000, true, now(), now()),
('pos-004', 'Kế toán viên', 'POS-ACCT-002', 'Nhân viên kế toán', 'dept-002', 15000000, 25000000, true, now(), now()),

-- Kinh doanh
('pos-005', 'Trưởng phòng kinh doanh', 'POS-SALES-001', 'Trưởng phòng kinh doanh', 'dept-003', 30000000, 50000000, true, now(), now()),
('pos-006', 'Nhân viên kinh doanh', 'POS-SALES-002', 'Nhân viên kinh doanh', 'dept-003', 12000000, 20000000, true, now(), now()),

-- Công nghệ
('pos-007', 'Trưởng phòng IT', 'POS-IT-001', 'Trưởng phòng công nghệ thông tin', 'dept-004', 35000000, 55000000, true, now(), now()),
('pos-008', 'Lập trình viên', 'POS-IT-002', 'Lập trình viên', 'dept-004', 20000000, 35000000, true, now(), now()),

-- Vận hành
('pos-009', 'Trưởng phòng vận hành', 'POS-OPS-001', 'Trưởng phòng vận hành', 'dept-005', 25000000, 40000000, true, now(), now()),
('pos-010', 'Nhân viên vận hành', 'POS-OPS-002', 'Nhân viên vận hành', 'dept-005', 10000000, 18000000, true, now(), now()),

-- Xưởng sản xuất
('pos-011', 'Quản đốc xưởng', 'POS-WORKSHOP-001', 'Quản đốc xưởng sản xuất', 'dept-006', 20000000, 30000000, true, now(), now()),
('pos-012', 'Công nhân xưởng', 'POS-WORKSHOP-002', 'Công nhân xưởng', 'dept-006', 8000000, 15000000, true, now(), now()),

-- Vận chuyển
('pos-013', 'Trưởng phòng vận chuyển', 'POS-TRANSPORT-001', 'Trưởng phòng vận chuyển', 'dept-007', 18000000, 28000000, true, now(), now()),
('pos-014', 'Tài xế', 'POS-TRANSPORT-002', 'Tài xế vận chuyển', 'dept-007', 10000000, 18000000, true, now(), now());

-- =====================================================
-- 3. TẠO EMPLOYEES TRƯỚC
-- =====================================================

-- Xóa employees cũ nếu có
DELETE FROM employees WHERE email LIKE '%@test.com';

-- Tạo employees với user_role
INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, department_id, position_id, hire_date, salary, status, user_role, created_at, updated_at) VALUES
-- ADMIN
('emp-admin-001', 'test-admin-001', 'EMP001', 'Nguyễn Văn', 'Admin', 'admin@test.com', '0901000001', 'dept-001', 'pos-001', '2024-01-01', 60000000, 'active', 'admin', now(), now()),

-- ACCOUNTANT
('emp-acc-001', 'test-acc-001', 'EMP002', 'Trần Thị', 'Kế Toán', 'accountant@test.com', '0901000002', 'dept-002', 'pos-003', '2024-01-01', 30000000, 'active', 'accountant', now(), now()),

-- SALES
('emp-sales-001', 'test-sales-001', 'EMP003', 'Phạm Văn', 'Kinh Doanh', 'sales@test.com', '0901000003', 'dept-003', 'pos-005', '2024-01-01', 35000000, 'active', 'sales', now(), now()),

-- WORKSHOP_EMPLOYEE
('emp-workshop-001', 'test-workshop-001', 'EMP004', 'Võ Văn', 'Quản Đốc', 'xuong@gmail.com', '0901000004', 'dept-006', 'pos-011', '2024-01-01', 25000000, 'active', 'workshop_employee', now(), now()),

-- EMPLOYEE
('emp-emp-001', 'test-emp-001', 'EMP005', 'Bùi Văn', 'IT', 'employee@test.com', '0901000005', 'dept-004', 'pos-008', '2024-01-01', 25000000, 'active', 'employee', now(), now()),

-- WORKER
('emp-worker-001', 'test-worker-001', 'EMP006', 'Lý Văn', 'Công Nhân', 'worker@test.com', '0901000006', 'dept-006', 'pos-012', '2024-01-01', 10000000, 'active', 'worker', now(), now()),

-- TRANSPORT
('emp-trans-001', 'test-trans-001', 'EMP007', 'Trịnh Văn', 'Tài Xế', 'transport@test.com', '0901000007', 'dept-007', 'pos-014', '2024-01-01', 12000000, 'active', 'transport', now(), now()),

-- CUSTOMER (không cần employee record)
('emp-cust-001', 'test-cust-001', 'CUST001', 'Công ty', 'ABC', 'customer@test.com', '0901000008', 'dept-001', 'pos-001', '2024-01-01', 0, 'active', 'customer', now(), now());

-- =====================================================
-- 4. TẠO USERS VỚI CÁC ROLE KHÁC NHAU
-- =====================================================

-- Xóa users cũ nếu có
DELETE FROM users WHERE email LIKE '%@test.com';

-- Tạo users với các role khác nhau
INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at) VALUES
('test-admin-001', 'admin@test.com', 'Admin Test', 'admin', true, now(), now()),
('test-acc-001', 'accountant@test.com', 'Accountant Test', 'accountant', true, now(), now()),
('test-sales-001', 'sales@test.com', 'Sales Test', 'sales', true, now(), now()),
('test-workshop-001', 'xuong@gmail.com', 'Workshop Test', 'workshop_employee', true, now(), now()),
('test-emp-001', 'employee@test.com', 'Employee Test', 'employee', true, now(), now()),
('test-worker-001', 'worker@test.com', 'Worker Test', 'worker', true, now(), now()),
('test-trans-001', 'transport@test.com', 'Transport Test', 'transport', true, now(), now()),
('test-cust-001', 'customer@test.com', 'Customer Test', 'customer', true, now(), now());

-- =====================================================
-- 5. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Kiểm tra departments
SELECT 'Departments' as table_name, COUNT(*) as count FROM departments WHERE code IN ('MGMT', 'ACCT', 'SALES', 'IT', 'OPS', 'WORKSHOP', 'TRANSPORT')
UNION ALL
-- Kiểm tra positions
SELECT 'Positions', COUNT(*) FROM positions WHERE code LIKE 'POS-%'
UNION ALL
-- Kiểm tra employees
SELECT 'Employees', COUNT(*) FROM employees WHERE email LIKE '%@test.com'
UNION ALL
-- Kiểm tra users
SELECT 'Users', COUNT(*) FROM users WHERE email LIKE '%@test.com';

-- Kiểm tra users theo role
SELECT 
    role,
    COUNT(*) as count
FROM users 
WHERE email LIKE '%@test.com'
GROUP BY role
ORDER BY role;

-- Kiểm tra employees theo department với user_role
SELECT 
    d.name as department_name,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.email,
    e.user_role,
    u.role as user_table_role
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN users u ON e.user_id = u.id
WHERE e.email LIKE '%@test.com'
ORDER BY d.name, e.employee_code;

-- Kiểm tra user_role trong employees
SELECT 
    user_role,
    COUNT(*) as count
FROM employees 
WHERE email LIKE '%@test.com'
GROUP BY user_role
ORDER BY user_role;

-- =====================================================
-- 6. THÔNG TIN ĐĂNG NHẬP
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
-- 📧 Email: xuong@gmail.com
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
-- 7. HOÀN TẤT
-- =====================================================
-- Đã tạo thành công:
-- ✅ 7 Departments
-- ✅ 14 Positions  
-- ✅ 8 Employees
-- ✅ 8 Users với các role khác nhau
-- 
-- Tiếp theo: Tạo auth accounts trong Supabase Dashboard
