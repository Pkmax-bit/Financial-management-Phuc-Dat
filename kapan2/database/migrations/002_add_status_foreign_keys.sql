-- Migration: Add status_id Foreign Keys
-- Version: 002
-- Description: Thêm cột status_id và Foreign Key constraints cho customers, projects, quotes, invoices

-- This migration has been applied via Supabase MCP
-- See migration: add_status_id_foreign_keys

-- Summary:
-- ✅ customers.status_id → customer_statuses.id
-- ✅ projects.status_id → project_statuses.id (đã có sẵn)
-- ✅ quotes.status_id → quote_statuses.id
-- ✅ invoices.status_id → invoice_statuses.id

-- All foreign keys have been successfully created!






