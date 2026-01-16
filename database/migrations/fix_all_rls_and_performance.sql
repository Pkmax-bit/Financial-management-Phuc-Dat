-- ============================================================
-- MIGRATION: Fix All RLS and Performance Issues
-- ============================================================
-- Description: Comprehensive fix for security and performance issues
-- Date: 2024
-- 
-- This migration:
-- 1. Enables RLS for all critical tables
-- 2. Creates indexes for foreign keys
-- 3. Optimizes existing RLS policies
-- 4. Creates missing policies where needed
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: ENABLE ROW LEVEL SECURITY (CRITICAL)
-- ============================================================

-- Task Management Tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_group_members ENABLE ROW LEVEL SECURITY;
-- Note: task_comments already has RLS enabled

-- Core Business Tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Financial Tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;

-- Other Important Tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 2: CREATE INDEXES FOR FOREIGN KEYS (HIGH PRIORITY)
-- ============================================================

-- ========== task_comments (CRITICAL for realtime chat) ==========
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_employee_id ON task_comments(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent_id ON task_comments(parent_id) WHERE parent_id IS NOT NULL;

-- ========== tasks ==========
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id ON tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_by ON tasks(completed_by);

-- ========== task_participants ==========
CREATE INDEX IF NOT EXISTS idx_task_participants_task_id ON task_participants(task_id);
CREATE INDEX IF NOT EXISTS idx_task_participants_employee_id ON task_participants(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_participants_added_by ON task_participants(added_by);

-- ========== task_attachments ==========
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);

-- ========== task_notifications ==========
CREATE INDEX IF NOT EXISTS idx_task_notifications_task_id ON task_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_user_id ON task_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_employee_id ON task_notifications(employee_id);

-- ========== task_checklists ==========
CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checklists_created_by ON task_checklists(created_by);

-- ========== task_checklist_items ==========
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_checklist_id ON task_checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_assignee_id ON task_checklist_items(assignee_id);

-- ========== task_time_logs ==========
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON task_time_logs(user_id);

-- ========== task_assignments ==========
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_to ON task_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_by ON task_assignments(assigned_by);

-- ========== task_group_members ==========
CREATE INDEX IF NOT EXISTS idx_task_group_members_group_id ON task_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_task_group_members_employee_id ON task_group_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_group_members_added_by ON task_group_members(added_by);

-- ========== projects ==========
CREATE INDEX IF NOT EXISTS idx_projects_status_id ON projects(status_id) WHERE status_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id) WHERE category_id IS NOT NULL;

-- ========== quotes ==========
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_status_id ON quotes(status_id) WHERE status_id IS NOT NULL;

-- ========== invoices ==========
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status_id ON invoices(status_id) WHERE status_id IS NOT NULL;

-- ========== employees ==========
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id) WHERE manager_id IS NOT NULL;

-- ========== users ==========
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_updated_by ON users(updated_by) WHERE updated_by IS NOT NULL;

-- ============================================================
-- PART 3: OPTIMIZE EXISTING RLS POLICIES (PERFORMANCE)
-- ============================================================

-- ========== task_comments Policies Optimization ==========
-- Drop and recreate with optimized auth.uid() calls

-- Update: Users can update their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON task_comments;
CREATE POLICY "Users can update their own comments" ON task_comments
    FOR UPDATE
    USING (
        (user_id IS NOT NULL AND user_id = (select auth.uid())) 
        OR 
        (employee_id IS NOT NULL AND employee_id = (select auth.uid()))
    )
    WITH CHECK (
        (user_id IS NOT NULL AND user_id = (select auth.uid())) 
        OR 
        (employee_id IS NOT NULL AND employee_id = (select auth.uid()))
    );

-- Delete: Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON task_comments;
CREATE POLICY "Users can delete their own comments" ON task_comments
    FOR DELETE
    USING (
        (user_id IS NOT NULL AND user_id = (select auth.uid())) 
        OR 
        (employee_id IS NOT NULL AND employee_id = (select auth.uid()))
    );

-- Optimize SELECT policy (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_comments' 
        AND policyname = 'Users can view relevant comments'
    ) THEN
        -- Keep existing policy but note it could be optimized further
        -- The policy is already complex, optimization would require restructuring
        NULL;
    END IF;
END $$;

-- Optimize INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert task comments" ON task_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON task_comments;
CREATE POLICY "Authenticated users can insert task comments" ON task_comments
    FOR INSERT
    WITH CHECK (
        (select auth.uid()) IS NOT NULL
        AND (
            user_id = (select auth.uid())
            OR employee_id IN (
                SELECT id FROM employees WHERE user_id = (select auth.uid())
            )
        )
    );

-- ========== tasks Policies (if needed) ==========
-- Note: tasks may not have policies yet, so we'll create basic ones

DO $$
BEGIN
    -- Only create if policies don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tasks' 
        AND policyname = 'Authenticated users can read tasks'
    ) THEN
        -- Basic SELECT policy for tasks
        CREATE POLICY "Authenticated users can read tasks" ON tasks
            FOR SELECT
            USING (
                (select auth.role()) = 'authenticated'
            );
        
        -- Basic INSERT policy
        CREATE POLICY "Authenticated users can create tasks" ON tasks
            FOR INSERT
            WITH CHECK ((select auth.uid()) IS NOT NULL);
        
        -- Basic UPDATE policy
        CREATE POLICY "Users can update their own tasks" ON tasks
            FOR UPDATE
            USING (created_by = (select auth.uid()))
            WITH CHECK (created_by = (select auth.uid()));
        
        -- Basic DELETE policy
        CREATE POLICY "Users can delete their own tasks" ON tasks
            FOR DELETE
            USING (created_by = (select auth.uid()));
    END IF;
END $$;

-- ========== projects Policies Optimization ==========
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Authenticated users can read projects'
    ) THEN
        -- Policy already exists, just ensure RLS is enabled (done above)
        NULL;
    END IF;
END $$;

-- ========== users Policies Optimization ==========
DO $$
BEGIN
    -- Optimize existing policies if they use auth.uid() directly
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can read own data'
        AND qual LIKE '%auth.uid()%'
        AND qual NOT LIKE '%(select auth.uid())%'
    ) THEN
        DROP POLICY IF EXISTS "Users can read own data" ON users;
        CREATE POLICY "Users can read own data" ON users
            FOR SELECT
            USING (id = (select auth.uid()));
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own data'
        AND qual LIKE '%auth.uid()%'
        AND qual NOT LIKE '%(select auth.uid())%'
    ) THEN
        DROP POLICY IF EXISTS "Users can update own data" ON users;
        CREATE POLICY "Users can update own data" ON users
            FOR UPDATE
            USING (id = (select auth.uid()))
            WITH CHECK (id = (select auth.uid()));
    END IF;
END $$;

-- ========== employees Policies Optimization ==========
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employees' 
        AND policyname = 'Employees can read own data'
        AND qual LIKE '%auth.uid()%'
        AND qual NOT LIKE '%(select auth.uid())%'
    ) THEN
        DROP POLICY IF EXISTS "Employees can read own data" ON employees;
        CREATE POLICY "Employees can read own data" ON employees
            FOR SELECT
            USING (user_id = (select auth.uid()));
    END IF;
END $$;

-- ============================================================
-- PART 4: CREATE MISSING POLICIES FOR CRITICAL TABLES
-- ============================================================

-- ========== quotes Policies ==========
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'quotes'
    ) THEN
        CREATE POLICY "Authenticated users can read quotes" ON quotes
            FOR SELECT
            USING ((select auth.role()) = 'authenticated');
        
        CREATE POLICY "Authenticated users can create quotes" ON quotes
            FOR INSERT
            WITH CHECK ((select auth.uid()) IS NOT NULL);
        
        CREATE POLICY "Users can update own quotes" ON quotes
            FOR UPDATE
            USING (created_by = (select auth.uid()))
            WITH CHECK (created_by = (select auth.uid()));
    END IF;
END $$;

-- ========== invoices Policies ==========
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'invoices'
    ) THEN
        CREATE POLICY "Authenticated users can read invoices" ON invoices
            FOR SELECT
            USING ((select auth.role()) = 'authenticated');
        
        CREATE POLICY "Authenticated users can create invoices" ON invoices
            FOR INSERT
            WITH CHECK ((select auth.uid()) IS NOT NULL);
        
        CREATE POLICY "Users can update own invoices" ON invoices
            FOR UPDATE
            USING (created_by = (select auth.uid()))
            WITH CHECK (created_by = (select auth.uid()));
    END IF;
END $$;

-- ========== budgets Policies ==========
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'budgets'
    ) THEN
        CREATE POLICY "Authenticated users can read budgets" ON budgets
            FOR SELECT
            USING ((select auth.role()) = 'authenticated');
        
        CREATE POLICY "Authenticated users can create budgets" ON budgets
            FOR INSERT
            WITH CHECK ((select auth.uid()) IS NOT NULL);
    END IF;
END $$;

-- ========== payments Policies ==========
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payments'
    ) THEN
        CREATE POLICY "Authenticated users can read payments" ON payments
            FOR SELECT
            USING ((select auth.role()) = 'authenticated');
        
        CREATE POLICY "Authenticated users can create payments" ON payments
            FOR INSERT
            WITH CHECK ((select auth.uid()) IS NOT NULL);
    END IF;
END $$;

-- ============================================================
-- PART 5: VERIFICATION AND SUMMARY
-- ============================================================

-- Create a function to verify RLS status
CREATE OR REPLACE FUNCTION verify_rls_status()
RETURNS TABLE (
    tablename TEXT,
    rls_enabled BOOLEAN,
    policy_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity as rls_enabled,
        COUNT(p.policyname)::BIGINT as policy_count
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
    WHERE t.schemaname = 'public'
        AND t.tablename IN (
            'tasks', 'task_comments', 'projects', 'users', 'employees',
            'quotes', 'invoices', 'expenses', 'budgets', 'bills',
            'approval_requests', 'cash_flow_entries', 'chat_messages',
            'chat_sessions', 'customers', 'files', 'notifications',
            'project_team', 'payments', 'vendors'
        )
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================
-- Run this query to verify:
-- SELECT * FROM verify_rls_status();
-- 
-- Expected results:
-- - All tables should have rls_enabled = true
-- - All tables should have policy_count > 0
-- ============================================================

