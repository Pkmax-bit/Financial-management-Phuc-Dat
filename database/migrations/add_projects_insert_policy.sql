-- Migration: Add RLS INSERT policy for projects table
-- Date: 2025-01-XX
-- Description: Allow authenticated users to create projects

-- ============================================================
-- PART 1: CREATE INSERT POLICY FOR PROJECTS
-- ============================================================

-- Drop existing INSERT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;

-- Create INSERT policy for authenticated users
-- This allows any authenticated user to create projects
CREATE POLICY "Authenticated users can create projects" ON projects
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
        WHERE tablename = 'projects' 
        AND policyname = 'Authenticated users can read projects'
    ) THEN
        CREATE POLICY "Authenticated users can read projects" ON projects
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
        WHERE tablename = 'projects' 
        AND policyname = 'Users can update projects'
    ) THEN
        -- Allow users to update projects they are managers of or are admin
        CREATE POLICY "Users can update projects" ON projects
            FOR UPDATE
            USING (
                (select auth.role()) = 'authenticated'
                AND (
                    -- User is the manager (if manager_id exists and matches employee's user_id)
                    manager_id IN (
                        SELECT id FROM employees WHERE user_id = (select auth.uid())
                    )
                    OR
                    -- User is admin (check via users table)
                    EXISTS (
                        SELECT 1 FROM users 
                        WHERE id = (select auth.uid()) 
                        AND role = 'admin'
                    )
                    OR
                    -- User is HR_MANAGER or ACCOUNTANT (have broader access)
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
                    manager_id IN (
                        SELECT id FROM employees WHERE user_id = (select auth.uid())
                    )
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
    AND tablename = 'projects'
ORDER BY policyname;
