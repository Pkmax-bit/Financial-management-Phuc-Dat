-- Migration: Add audit trail columns (created_by, updated_by)
-- Date: 2025-11-11
-- Purpose: Track who created/updated records for audit trail

-- Add columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);
CREATE INDEX IF NOT EXISTS idx_employees_updated_by ON employees(updated_by);

-- Add comments
COMMENT ON COLUMN users.created_by IS 'User ID who created this record';
COMMENT ON COLUMN users.updated_by IS 'User ID who last updated this record';
COMMENT ON COLUMN employees.created_by IS 'User ID who created this employee';
COMMENT ON COLUMN employees.updated_by IS 'User ID who last updated this employee';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - Added created_by and updated_by columns to users table';
    RAISE NOTICE '   - Added created_by and updated_by columns to employees table';
    RAISE NOTICE '   - Created indexes for better performance';
END $$;

