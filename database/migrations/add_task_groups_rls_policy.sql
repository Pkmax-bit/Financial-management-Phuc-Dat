-- Migration: Add RLS INSERT policy for task_groups table
-- Date: 2025-01-XX
-- Description: Allow authenticated users to create task_groups

-- ============================================================
-- PART 1: CREATE INSERT POLICY FOR TASK_GROUPS
-- ============================================================

-- Drop existing INSERT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can create task_groups" ON task_groups;
DROP POLICY IF EXISTS "Users can create task_groups" ON task_groups;
DROP POLICY IF EXISTS "Authenticated users can insert task_groups" ON task_groups;

-- Create INSERT policy for authenticated users
-- This allows any authenticated user to create task_groups
CREATE POLICY "Authenticated users can create task_groups" ON task_groups
    FOR INSERT
    WITH CHECK (
        (select auth.role()) = 'authenticated'
        AND (select auth.uid()) IS NOT NULL
    );

-- ============================================================
-- PART 2: ENSURE SELECT POLICY EXISTS (for reading)
-- ============================================================

-- Check if SELECT policy exists, if not create one
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_groups' 
        AND policyname = 'Authenticated users can read task_groups'
    ) THEN
        CREATE POLICY "Authenticated users can read task_groups" ON task_groups
            FOR SELECT
            USING (
                (select auth.role()) = 'authenticated'
            );
    END IF;
END $$;

-- ============================================================
-- PART 3: ENSURE UPDATE POLICY EXISTS (for updating)
-- ============================================================

-- Check if UPDATE policy exists, if not create one
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_groups' 
        AND policyname = 'Users can update task_groups'
    ) THEN
        -- Allow users to update task_groups they created or are members of
        CREATE POLICY "Users can update task_groups" ON task_groups
            FOR UPDATE
            USING (
                (select auth.role()) = 'authenticated'
                AND (
                    -- User created the task_group (if created_by exists)
                    created_by = (select auth.uid())
                    OR
                    -- User is admin, hr_manager, or accountant
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = (select auth.uid()) 
                        AND role IN ('admin', 'hr_manager', 'accountant')
                    )
                )
            )
            WITH CHECK (
                (select auth.role()) = 'authenticated'
                AND (
                    created_by = (select auth.uid())
                    OR
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = (select auth.uid()) 
                        AND role IN ('admin', 'hr_manager', 'accountant')
                    )
                )
            );
    END IF;
END $$;

-- ============================================================
-- PART 4: VERIFICATION
-- ============================================================

-- Verify policies exist
SELECT 
    policyname,
    cmd as command,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'task_groups'
ORDER BY policyname;
