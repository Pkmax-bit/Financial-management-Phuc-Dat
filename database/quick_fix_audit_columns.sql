-- QUICK FIX: Add audit columns (Copy và Paste vào Supabase SQL Editor)
-- Chỉ mất 30 giây!

-- 1. Add columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- 2. Add columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- 3. Add indexes (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by);
CREATE INDEX IF NOT EXISTS idx_employees_created_by ON employees(created_by);
CREATE INDEX IF NOT EXISTS idx_employees_updated_by ON employees(updated_by);

-- 4. Verify
SELECT 'users table' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('created_by', 'updated_by')
UNION ALL
SELECT 'employees table' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND column_name IN ('created_by', 'updated_by');

-- Expected result: 4 rows (2 columns x 2 tables)
-- ✅ Done! Bây giờ upload Excel sẽ hoạt động!

