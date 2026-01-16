-- Migration: Fix RLS and Performance Issues (Critical)
-- Date: 2024
-- Description: Enable RLS for critical tables and add performance indexes

-- ============================================
-- PART 1: ENABLE ROW LEVEL SECURITY (CRITICAL)
-- ============================================

-- Task Management Tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_group_members ENABLE ROW LEVEL SECURITY;

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

-- Other Important Tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 2: CREATE INDEXES FOR FOREIGN KEYS (HIGH PRIORITY)
-- ============================================

-- task_comments (CRITICAL for realtime chat)
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_employee_id ON task_comments(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_group_id ON tasks(group_id);

-- task_participants
CREATE INDEX IF NOT EXISTS idx_task_participants_task_id ON task_participants(task_id);
CREATE INDEX IF NOT EXISTS idx_task_participants_employee_id ON task_participants(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_participants_added_by ON task_participants(added_by);

-- task_attachments
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);

-- task_notifications
CREATE INDEX IF NOT EXISTS idx_task_notifications_task_id ON task_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_user_id ON task_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_employee_id ON task_notifications(employee_id);

-- task_checklists
CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_task_checklists_created_by ON task_checklists(created_by);

-- task_checklist_items
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_checklist_id ON task_checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_task_checklist_items_assignee_id ON task_checklist_items(assignee_id);

-- task_time_logs
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON task_time_logs(user_id);

-- task_assignments
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_to ON task_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_by ON task_assignments(assigned_by);

-- task_group_members
CREATE INDEX IF NOT EXISTS idx_task_group_members_group_id ON task_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_task_group_members_employee_id ON task_group_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_group_members_added_by ON task_group_members(added_by);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_status_id ON projects(status_id);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);

-- ============================================
-- PART 3: OPTIMIZE RLS POLICIES (PERFORMANCE)
-- ============================================

-- Optimize task_comments policies (CRITICAL for realtime)
-- Note: Only update if policies already exist

-- Update policy for task_comments UPDATE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_comments' 
        AND policyname = 'Users can update own task comments'
    ) THEN
        DROP POLICY IF EXISTS "Users can update own task comments" ON task_comments;
        CREATE POLICY "Users can update own task comments" ON task_comments
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
    END IF;
END $$;

-- Update policy for task_comments DELETE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_comments' 
        AND policyname = 'Users can delete own task comments'
    ) THEN
        DROP POLICY IF EXISTS "Users can delete own task comments" ON task_comments;
        CREATE POLICY "Users can delete own task comments" ON task_comments
            FOR DELETE
            USING (
                (user_id IS NOT NULL AND user_id = (select auth.uid())) 
                OR 
                (employee_id IS NOT NULL AND employee_id = (select auth.uid()))
            );
    END IF;
END $$;

-- ============================================
-- PART 4: VERIFICATION QUERIES
-- ============================================

-- Check RLS status for critical tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'tasks', 'task_comments', 'projects', 
        'users', 'employees', 'quotes', 'invoices'
    )
ORDER BY tablename;

-- Check indexes for task_comments
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'task_comments'
ORDER BY indexname;

-- Check policies for task_comments
SELECT 
    policyname,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'task_comments'
ORDER BY policyname;

