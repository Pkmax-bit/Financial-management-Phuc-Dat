-- =====================================================
-- SCRIPT TẠO TÀI KHOẢN NHÂN VIÊN VỚI CÁC ROLE
-- =====================================================
-- Script này tạo các tài khoản nhân viên với các role khác nhau
-- Thực thi trong Supabase SQL Editor

-- =====================================================
-- 1. TẠO DEPARTMENTS (PHÒNG BAN)
-- =====================================================

-- Xóa departments cũ nếu có
DELETE FROM departments WHERE name IN ('Quản lý', 'Kế toán', 'Kinh doanh', 'Công nghệ', 'Vận hành', 'Xưởng sản xuất', 'Vận chuyển');

-- Tạo departments mới
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

-- Tạo positions cho từng department
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
-- 3. TẠO USERS (TÀI KHOẢN NGƯỜI DÙNG)
-- =====================================================

-- Xóa users cũ nếu có
DELETE FROM users WHERE email LIKE '%@company.com';

-- Tạo users với các role khác nhau
INSERT INTO users (id, email, full_name, role, is_active, created_at, updated_at) VALUES
-- ADMIN
('user-admin-001', 'admin@company.com', 'Nguyễn Văn Admin', 'admin', true, now(), now()),

-- ACCOUNTANT
('user-acc-001', 'ketoan.truong@company.com', 'Trần Thị Kế Toán', 'accountant', true, now(), now()),
('user-acc-002', 'ketoan.vien@company.com', 'Lê Văn Kế Toán', 'accountant', true, now(), now()),

-- SALES
('user-sales-001', 'kinhdoanh.truong@company.com', 'Phạm Văn Kinh Doanh', 'sales', true, now(), now()),
('user-sales-002', 'kinhdoanh.vien@company.com', 'Hoàng Thị Kinh Doanh', 'sales', true, now(), now()),

-- WORKSHOP_EMPLOYEE
('user-workshop-001', 'xuong.quandoc@company.com', 'Võ Văn Quản Đốc', 'workshop_employee', true, now(), now()),
('user-workshop-002', 'xuong.congnhan@company.com', 'Đặng Thị Công Nhân', 'workshop_employee', true, now(), now()),

-- EMPLOYEE (Nhân viên chung)
('user-emp-001', 'nhanvien.it@company.com', 'Bùi Văn IT', 'employee', true, now(), now()),
('user-emp-002', 'nhanvien.vanhanh@company.com', 'Ngô Thị Vận Hành', 'employee', true, now(), now()),

-- WORKER (Công nhân)
('user-worker-001', 'congnhan.001@company.com', 'Lý Văn Công Nhân', 'worker', true, now(), now()),
('user-worker-002', 'congnhan.002@company.com', 'Vũ Thị Công Nhân', 'worker', true, now(), now()),

-- TRANSPORT (Vận chuyển)
('user-trans-001', 'taixe.001@company.com', 'Trịnh Văn Tài Xế', 'transport', true, now(), now()),
('user-trans-002', 'taixe.002@company.com', 'Phan Thị Tài Xế', 'transport', true, now(), now()),

-- CUSTOMER (Khách hàng mẫu)
('user-cust-001', 'khachhang.001@company.com', 'Công ty ABC', 'customer', true, now(), now()),
('user-cust-002', 'khachhang.002@company.com', 'Công ty XYZ', 'customer', true, now(), now());

-- =====================================================
-- 4. TẠO EMPLOYEES (HỒ SƠ NHÂN VIÊN)
-- =====================================================

-- Xóa employees cũ nếu có
DELETE FROM employees WHERE email LIKE '%@company.com';

-- Tạo employees
INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, department_id, position_id, hire_date, salary, status, created_at, updated_at) VALUES
-- ADMIN
('emp-001', 'user-admin-001', 'EMP001', 'Nguyễn Văn', 'Admin', 'admin@company.com', '0901000001', 'dept-001', 'pos-001', '2024-01-01', 60000000, 'active', now(), now()),

-- ACCOUNTANT
('emp-002', 'user-acc-001', 'EMP002', 'Trần Thị', 'Kế Toán', 'ketoan.truong@company.com', '0901000002', 'dept-002', 'pos-003', '2024-01-01', 30000000, 'active', now(), now()),
('emp-003', 'user-acc-002', 'EMP003', 'Lê Văn', 'Kế Toán', 'ketoan.vien@company.com', '0901000003', 'dept-002', 'pos-004', '2024-01-01', 20000000, 'active', now(), now()),

-- SALES
('emp-004', 'user-sales-001', 'EMP004', 'Phạm Văn', 'Kinh Doanh', 'kinhdoanh.truong@company.com', '0901000004', 'dept-003', 'pos-005', '2024-01-01', 35000000, 'active', now(), now()),
('emp-005', 'user-sales-002', 'EMP005', 'Hoàng Thị', 'Kinh Doanh', 'kinhdoanh.vien@company.com', '0901000005', 'dept-003', 'pos-006', '2024-01-01', 15000000, 'active', now(), now()),

-- WORKSHOP_EMPLOYEE
('emp-006', 'user-workshop-001', 'EMP006', 'Võ Văn', 'Quản Đốc', 'xuong.quandoc@company.com', '0901000006', 'dept-006', 'pos-011', '2024-01-01', 25000000, 'active', now(), now()),
('emp-007', 'user-workshop-002', 'EMP007', 'Đặng Thị', 'Công Nhân', 'xuong.congnhan@company.com', '0901000007', 'dept-006', 'pos-012', '2024-01-01', 12000000, 'active', now(), now()),

-- EMPLOYEE
('emp-008', 'user-emp-001', 'EMP008', 'Bùi Văn', 'IT', 'nhanvien.it@company.com', '0901000008', 'dept-004', 'pos-008', '2024-01-01', 25000000, 'active', now(), now()),
('emp-009', 'user-emp-002', 'EMP009', 'Ngô Thị', 'Vận Hành', 'nhanvien.vanhanh@company.com', '0901000009', 'dept-005', 'pos-010', '2024-01-01', 14000000, 'active', now(), now()),

-- WORKER
('emp-010', 'user-worker-001', 'EMP010', 'Lý Văn', 'Công Nhân', 'congnhan.001@company.com', '0901000010', 'dept-006', 'pos-012', '2024-01-01', 10000000, 'active', now(), now()),
('emp-011', 'user-worker-002', 'EMP011', 'Vũ Thị', 'Công Nhân', 'congnhan.002@company.com', '0901000011', 'dept-006', 'pos-012', '2024-01-01', 10000000, 'active', now(), now()),

-- TRANSPORT
('emp-012', 'user-trans-001', 'EMP012', 'Trịnh Văn', 'Tài Xế', 'taixe.001@company.com', '0901000012', 'dept-007', 'pos-014', '2024-01-01', 12000000, 'active', now(), now()),
('emp-013', 'user-trans-002', 'EMP013', 'Phan Thị', 'Tài Xế', 'taixe.002@company.com', '0901000013', 'dept-007', 'pos-014', '2024-01-01', 12000000, 'active', now(), now());

-- =====================================================
-- 5. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Kiểm tra số lượng users theo role
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
WHERE email LIKE '%@company.com'
GROUP BY role
ORDER BY role;

-- Kiểm tra departments
SELECT 
    d.name as department_name,
    COUNT(e.id) as employee_count
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
WHERE d.name IN ('Quản lý', 'Kế toán', 'Kinh doanh', 'Công nghệ', 'Vận hành', 'Xưởng sản xuất', 'Vận chuyển')
GROUP BY d.id, d.name
ORDER BY d.name;

-- Kiểm tra employees theo department
SELECT 
    d.name as department_name,
    p.name as position_name,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.email,
    u.role
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN positions p ON e.position_id = p.id
JOIN users u ON e.user_id = u.id
WHERE e.email LIKE '%@company.com'
ORDER BY d.name, p.name, e.employee_code;

-- =====================================================
-- 6. TẠO TÀI KHOẢN HOÀN TẤT
-- =====================================================
-- Đã tạo thành công các tài khoản nhân viên với các role khác nhau
-- Mật khẩu mặc định: 123456 (cần thay đổi sau khi đăng nhập lần đầu)
