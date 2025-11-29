-- Migration: Fix payments table foreign key constraints
-- Description: Fixes foreign key constraints that incorrectly reference employees instead of users
-- Date: 2025-01-XX

-- Drop incorrect foreign key constraints if they exist
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_created_by_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_processed_by_fkey;

-- Recreate correct foreign key constraints (references users, not employees)
ALTER TABLE payments 
ADD CONSTRAINT payments_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE payments 
ADD CONSTRAINT payments_processed_by_fkey 
FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL;

