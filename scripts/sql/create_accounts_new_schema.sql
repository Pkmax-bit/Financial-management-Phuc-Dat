-- =====================================================
-- SQL SCRIPT TO CREATE ACCOUNTS WITH NEW SCHEMA
-- =====================================================
-- This script creates test accounts using the new database schema
-- Execute this in Supabase SQL Editor

-- =====================================================
-- 1. CREATE USERS TABLE RECORDS
-- =====================================================

-- Insert users into the users table
INSERT INTO users (id, email, full_name, role, phone, is_active, created_at, updated_at) VALUES
('fb599dc6-3e6a-49c4-b99c-2a894c2ad84b', 'admin@example.com', 'Admin User', 'admin', '0123456789', true, now(), now()),
('b2a349fe-c644-4773-b1fb-3ed9e0174b94', 'sales@example.com', 'Sales Manager', 'employee', '0123456790', true, now(), now()),
('bb046b79-91e6-474f-8c46-791be8fab729', 'accountant@example.com', 'Accountant', 'employee', '0123456791', true, now(), now()),
('d9ef0457-ae4e-4a71-8081-8253992cf25e', 'workshop@example.com', 'Workshop Employee', 'employee', '0123456792', true, now(), now()),
('7e1b050c-e35b-42d8-819b-c49bc153fb3b', 'worker@example.com', 'Worker', 'employee', '0123456793', true, now(), now()),
('f0d26aa8-b444-41bb-99b6-6367853e253f', 'transport@example.com', 'Transport', 'employee', '0123456794', true, now(), now()),
('e4e9d8af-7ac0-4452-8696-c9f736873e33', 'customer@example.com', 'Customer', 'employee', '0123456795', true, now(), now());

-- =====================================================
-- 2. CREATE EMPLOYEES TABLE RECORDS
-- =====================================================

-- Insert employees into the employees table
INSERT INTO employees (id, user_id, employee_code, first_name, last_name, email, phone, hire_date, status, created_at, updated_at) VALUES
('870d4481-a0b9-4313-a05a-a4b6e4eb4c55', 'fb599dc6-3e6a-49c4-b99c-2a894c2ad84b', 'EMP001', 'Admin', 'User', 'admin@example.com', '0123456789', '2024-01-01', 'active', now(), now()),
('efa4d889-cb3e-45d0-a198-63ae26867d1a', 'b2a349fe-c644-4773-b1fb-3ed9e0174b94', 'EMP002', 'Sales', 'Manager', 'sales@example.com', '0123456790', '2024-01-01', 'active', now(), now()),
('c2d3b44f-5e0f-4046-8271-4027d358d41f', 'bb046b79-91e6-474f-8c46-791be8fab729', 'EMP003', 'Accountant', 'User', 'accountant@example.com', '0123456791', '2024-01-01', 'active', now(), now()),
('5e02186c-f0e2-4b7b-aefd-35598a0e5312', 'd9ef0457-ae4e-4a71-8081-8253992cf25e', 'EMP004', 'Workshop', 'Employee', 'workshop@example.com', '0123456792', '2024-01-01', 'active', now(), now()),
('4bbd71f2-d716-4fa1-abc2-480d3222301c', '7e1b050c-e35b-42d8-819b-c49bc153fb3b', 'EMP005', 'Worker', 'User', 'worker@example.com', '0123456793', '2024-01-01', 'active', now(), now()),
('6f9829bb-f3f6-4e07-82f0-e12b1dd7f659', 'f0d26aa8-b444-41bb-99b6-6367853e253f', 'EMP006', 'Transport', 'User', 'transport@example.com', '0123456794', '2024-01-01', 'active', now(), now()),
('a7018514-68c0-4a25-9423-2e24256946f1', 'e4e9d8af-7ac0-4452-8696-c9f736873e33', 'EMP007', 'Customer', 'User', 'customer@example.com', '0123456795', '2024-01-01', 'active', now(), now());

-- =====================================================
-- 3. VERIFY CREATED RECORDS
-- =====================================================

-- Check users table
SELECT 'USERS TABLE' as table_name, email, full_name, role FROM users WHERE email LIKE '%@example.com';

-- Check employees table  
SELECT 'EMPLOYEES TABLE' as table_name, email, first_name, last_name, employee_code FROM employees WHERE email LIKE '%@example.com';

-- =====================================================
-- 4. SUPABASE AUTH USER (ONLY FOR ADMIN)
-- =====================================================
-- Note: Only admin@example.com needs to be created in Supabase Auth
-- 
-- Create auth user for: Admin User
-- Email: admin@example.com
-- Password: admin123
-- User Metadata: {"role": "admin", "full_name": "Admin User"}

-- =====================================================
-- 5. TEST LOGIN QUERIES
-- =====================================================

-- Test queries to verify accounts
SELECT 'Testing Admin User' as test_name, * FROM users WHERE email = 'admin@example.com';
SELECT 'Testing Sales Manager' as test_name, * FROM users WHERE email = 'sales@example.com';
SELECT 'Testing Accountant' as test_name, * FROM users WHERE email = 'accountant@example.com';
SELECT 'Testing Workshop Employee' as test_name, * FROM users WHERE email = 'workshop@example.com';
SELECT 'Testing Worker' as test_name, * FROM users WHERE email = 'worker@example.com';
SELECT 'Testing Transport' as test_name, * FROM users WHERE email = 'transport@example.com';
SELECT 'Testing Customer' as test_name, * FROM users WHERE email = 'customer@example.com';
