-- ============================================================================
-- Database Optimization - Add Critical Indexes
-- Financial Management System
-- ============================================================================

-- PURPOSE: Improve query performance by adding indexes on frequently queried columns

-- ============================================================================
-- PROJECTS TABLE INDEXES
-- ============================================================================

-- Index for filtering by status (frequent in dashboards)
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON projects(status);

-- Index for filtering by customer
CREATE INDEX IF NOT EXISTS idx_projects_customer_id 
ON projects(customer_id);

-- Index for filtering by manager/owner
CREATE INDEX IF NOT EXISTS idx_projects_manager_id 
ON projects(manager_id);

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_projects_created_at 
ON projects(created_at DESC);

-- Composite index for customer + status queries
CREATE INDEX IF NOT EXISTS idx_projects_customer_status 
ON projects(customer_id, status);

-- Enable trigram extension for better text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for searching by name (using gin for pattern matching)
CREATE INDEX IF NOT EXISTS idx_projects_name_gin 
ON projects USING gin(name gin_trgm_ops);

COMMENT ON INDEX idx_projects_status IS 'Fast filtering by project status';
COMMENT ON INDEX idx_projects_customer_id IS 'Fast filtering by customer';
COMMENT ON INDEX idx_projects_customer_status IS 'Composite index for customer projects by status';
COMMENT ON INDEX idx_projects_name_gin IS 'Full-text search on project names';

-- ============================================================================
-- EXPENSES TABLE INDEXES
-- ============================================================================

-- Index for project expenses
CREATE INDEX IF NOT EXISTS idx_expenses_project_id 
ON expenses(project_id);

-- Index for filtering by date
CREATE INDEX IF NOT EXISTS idx_expenses_date 
ON expenses(expense_date DESC);

-- Index for filtering by status  
CREATE INDEX IF NOT EXISTS idx_expenses_status 
ON expenses(status);

-- Composite index for project expenses by date (very common query)
CREATE INDEX IF NOT EXISTS idx_expenses_project_date 
ON expenses(project_id, expense_date DESC);

-- Index for filtering by category
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category expense_category NOT NULL DEFAULT 'other';
CREATE INDEX IF NOT EXISTS idx_expenses_category 
ON expenses(category);

COMMENT ON INDEX idx_expenses_project_id IS 'Fast retrieval of project expenses';
COMMENT ON INDEX idx_expenses_project_date IS 'Optimized for project expense timelines';

-- ============================================================================
-- CUSTOMERS TABLE INDEXES
-- ============================================================================

-- Unique index on email (also prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email 
ON customers(email)
WHERE email IS NOT NULL;

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_customers_created_at 
ON customers(created_at DESC);

-- Index for searching by name
CREATE INDEX IF NOT EXISTS idx_customers_name_gin 
ON customers USING gin(name gin_trgm_ops);

COMMENT ON INDEX idx_customers_email IS 'Unique email constraint with soft delete support';

-- ============================================================================
-- EMPLOYEES TABLE INDEXES
-- ============================================================================

-- Unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email 
ON employees(email)
WHERE email IS NOT NULL;

-- Index for filtering by department
CREATE INDEX IF NOT EXISTS idx_employees_department_id 
ON employees(department_id);

-- Index for filtering by position
CREATE INDEX IF NOT EXISTS idx_employees_position_id 
ON employees(position_id);

-- Index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_employees_created_at 
ON employees(created_at DESC);

-- ============================================================================
-- SALES/QUOTES TABLE INDEXES
-- ============================================================================

-- Index for filtering by customer
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id 
ON quotes(customer_id);

-- Index for filtering by project
CREATE INDEX IF NOT EXISTS idx_quotes_project_id 
ON quotes(project_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_quotes_status 
ON quotes(status);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_quotes_created_at 
ON quotes(created_at DESC);

-- ============================================================================
-- ENABLE pg_trgm EXTENSION (for text search)
-- ============================================================================

-- Enable trigram extension for better text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify indexes are created, run:
-- SELECT schemaname, tablename, indexname 
-- FROM pg_indexes 
-- WHERE tablename IN ('projects', 'expenses', 'customers', 'employees', 'quotes')
-- ORDER BY tablename, indexname;

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename IN ('projects', 'expenses', 'customers', 'employees', 'quotes')
-- ORDER BY idx_scan DESC;

-- To analyze query performance with indexes:
-- EXPLAIN ANALYZE SELECT * FROM projects WHERE status = 'active';
