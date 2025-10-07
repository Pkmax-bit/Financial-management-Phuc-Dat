-- =====================================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- =====================================================
-- This script removes ALL data from the database
-- Execute this in Supabase SQL Editor

-- =====================================================
-- 1. DISABLE FOREIGN KEY CHECKS (if needed)
-- =====================================================

-- =====================================================
-- 2. DELETE ALL DATA FROM ALL TABLES
-- =====================================================

-- Delete from all tables in reverse dependency order
DELETE FROM project_team_timeline;
DELETE FROM project_costs;
DELETE FROM journal_entries;
DELETE FROM expense_claims;
DELETE FROM credit_memos;
DELETE FROM purchase_orders;
DELETE FROM sales_receipts;
DELETE FROM invoices;
DELETE FROM quotes;
DELETE FROM projects;
DELETE FROM customers;
DELETE FROM employees;
DELETE FROM positions;
DELETE FROM departments;
DELETE FROM users;

-- =====================================================
-- 3. RESET SEQUENCES (if any)
-- =====================================================

-- Reset any auto-increment sequences
-- (PostgreSQL doesn't typically use sequences for UUIDs, but included for completeness)

-- =====================================================
-- 4. VERIFY CLEANUP
-- =====================================================

-- Check that all tables are empty
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'positions', COUNT(*) FROM positions
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'sales_receipts', COUNT(*) FROM sales_receipts
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'credit_memos', COUNT(*) FROM credit_memos
UNION ALL
SELECT 'expense_claims', COUNT(*) FROM expense_claims
UNION ALL
SELECT 'journal_entries', COUNT(*) FROM journal_entries
UNION ALL
SELECT 'project_costs', COUNT(*) FROM project_costs
UNION ALL
SELECT 'project_team_timeline', COUNT(*) FROM project_team_timeline;

-- =====================================================
-- 5. CLEANUP COMPLETE
-- =====================================================
-- All database data has been removed
-- You can now start fresh with clean tables
