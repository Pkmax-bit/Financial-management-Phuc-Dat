-- Create sample employees first before running the main sample data script
-- This ensures all foreign key references are satisfied

-- Insert sample employees (simplified schema)
INSERT INTO employees (id, employee_code, first_name, last_name, email, phone, department, hire_date, status, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'EMP001', 'Nguyen', 'Van A', 'nguyenvana@company.com', '0123456789', 'IT', '2023-01-01', 'active', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'EMP002', 'Tran', 'Thi B', 'tranthib@company.com', '0987654321', 'IT', '2023-02-01', 'active', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'EMP003', 'Le', 'Van C', 'levanc@company.com', '0369852147', 'Finance', '2023-03-01', 'active', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'EMP004', 'Pham', 'Thi D', 'phamthid@company.com', '0147258369', 'Sales', '2023-04-01', 'active', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'EMP005', 'Hoang', 'Van E', 'hoangvane@company.com', '0258147369', 'HR', '2023-05-01', 'active', NOW(), NOW());

-- Show confirmation
SELECT 'Sample employees created successfully!' as status;
SELECT COUNT(*) as employee_count FROM employees;
