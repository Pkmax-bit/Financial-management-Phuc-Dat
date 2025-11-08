-- =====================================================
-- SQL SCRIPT TO CREATE TEST ACCOUNTS
-- =====================================================
-- This script creates test accounts in both users and employees tables
-- Execute this in Supabase SQL Editor

-- =====================================================
-- 1. CREATE USERS TABLE RECORDS
-- =====================================================

INSERT INTO users (id, email, full_name, role, phone, is_active, created_at, updated_at) VALUES
('fb599dc6-3e6a-49c4-b99c-2a894c2ad84b', 'admin@example.com', 'Admin User', 'admin', '0123456789', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('b2a349fe-c644-4773-b1fb-3ed9e0174b94', 'sales@example.com', 'Sales Manager', 'sales', '0123456790', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('bb046b79-91e6-474f-8c46-791be8fab729', 'accountant@example.com', 'Accountant', 'accountant', '0123456791', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('d9ef0457-ae4e-4a71-8081-8253992cf25e', 'workshop@example.com', 'Workshop Employee', 'workshop_employee', '0123456792', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('7e1b050c-e35b-42d8-819b-c49bc153fb3b', 'worker@example.com', 'Worker', 'worker', '0123456793', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('f0d26aa8-b444-41bb-99b6-6367853e253f', 'transport@example.com', 'Transport', 'transport', '0123456794', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('e4e9d8af-7ac0-4452-8696-c9f736873e33', 'customer@example.com', 'Customer', 'customer', '0123456795', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322');

-- =====================================================
-- 2. CREATE EMPLOYEES TABLE RECORDS
-- =====================================================

INSERT INTO employees (id, email, full_name, position, phone, is_active, created_at, updated_at) VALUES
('870d4481-a0b9-4313-a05a-a4b6e4eb4c55', 'admin@example.com', 'Admin User', 'Administrator', '0123456789', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('efa4d889-cb3e-45d0-a198-63ae26867d1a', 'sales@example.com', 'Sales Manager', 'Sales Manager', '0123456790', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('c2d3b44f-5e0f-4046-8271-4027d358d41f', 'accountant@example.com', 'Accountant', 'Accountant', '0123456791', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('5e02186c-f0e2-4b7b-aefd-35598a0e5312', 'workshop@example.com', 'Workshop Employee', 'Workshop Employee', '0123456792', true, '2025-10-06T09:45:25.485322', '2025-10-06T09:45:25.485322'),
('4bbd71f2-d716-4fa1-abc2-480d3222301c', 'worker@example.com', 'Worker', 'Worker', '0123456793', true, '2025-10-06T09:45:25.486322', '2025-10-06T09:45:25.486322'),
('6f9829bb-f3f6-4e07-82f0-e12b1dd7f659', 'transport@example.com', 'Transport', 'Transport', '0123456794', true, '2025-10-06T09:45:25.486322', '2025-10-06T09:45:25.486322'),
('a7018514-68c0-4a25-9423-2e24256946f1', 'customer@example.com', 'Customer', 'Customer', '0123456795', true, '2025-10-06T09:45:25.486322', '2025-10-06T09:45:25.486322');

-- =====================================================
-- 3. VERIFY CREATED RECORDS
-- =====================================================

-- Check users table
SELECT 'USERS TABLE' as table_name, email, full_name, role FROM users WHERE email LIKE '%@example.com';

-- Check employees table  
SELECT 'EMPLOYEES TABLE' as table_name, email, full_name, position FROM employees WHERE email LIKE '%@example.com';

-- =====================================================
-- 4. SUPABASE AUTH USERS (MANUAL CREATION REQUIRED)
-- =====================================================
-- Note: These need to be created via Supabase Dashboard > Authentication > Users
-- 
-- For each user, create in Supabase Auth with:
-- - Email: as shown below
-- - Password: as shown below  
-- - User Metadata: {"role": "role_name", "full_name": "Full Name"}
--
-- Admin User:
--   Email: admin@example.com
--   Password: admin123
--   Metadata: {"role": "admin", "full_name": "Admin User"}
--
-- Sales Manager:
--   Email: sales@example.com
--   Password: sales123
--   Metadata: {"role": "sales", "full_name": "Sales Manager"}
--
-- Accountant:
--   Email: accountant@example.com
--   Password: accountant123
--   Metadata: {"role": "accountant", "full_name": "Accountant"}
--
-- Workshop Employee:
--   Email: workshop@example.com
--   Password: workshop123
--   Metadata: {"role": "workshop_employee", "full_name": "Workshop Employee"}
--
-- Worker:
--   Email: worker@example.com
--   Password: worker123
--   Metadata: {"role": "worker", "full_name": "Worker"}
--
-- Transport:
--   Email: transport@example.com
--   Password: transport123
--   Metadata: {"role": "transport", "full_name": "Transport"}
--
-- Customer:
--   Email: customer@example.com
--   Password: customer123
--   Metadata: {"role": "customer", "full_name": "Customer"}

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
