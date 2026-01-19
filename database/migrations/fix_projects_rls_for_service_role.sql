-- Migration: Fix RLS for projects table to allow service role and authenticated users
-- Date: 2025-01-19
-- Description: Ensure service role can insert projects and authenticated users can too

-- ============================================================
-- PART 1: ENABLE RLS (if not already enabled)
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 2: DROP EXISTING INSERT POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON projects;
DROP POLICY IF EXISTS "Service role can insert projects" ON projects;

-- ============================================================
-- PART 3: CREATE INSERT POLICY FOR AUTHENTICATED USERS
-- ============================================================

-- This policy allows authenticated users (including those using service role via backend)
CREATE POLICY "Authenticated users can create projects" ON projects
    FOR INSERT
    WITH CHECK (
        (select auth.role()) = 'authenticated'
        AND (select auth.uid()) IS NOT NULL
    );

-- ============================================================
-- PART 4: CREATE INSERT POLICY FOR SERVICE ROLE (BYPASS RLS)
-- ============================================================

-- Service role should bypass RLS, but if it doesn't, this policy helps
-- Note: Service role typically bypasses RLS automatically, but this is a fallback
CREATE POLICY "Service role can insert projects" ON projects
    FOR INSERT
    WITH CHECK (
        (select auth.role()) = 'service_role'
    );

-- ============================================================
-- PART 5: ENSURE SELECT POLICY EXISTS
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Authenticated users can read projects'
        AND cmd = 'SELECT'
    ) THEN
        CREATE POLICY "Authenticated users can read projects" ON projects
            FOR SELECT
            USING (
                (select auth.role()) = 'authenticated'
                OR (select auth.role()) = 'service_role'
            );
    END IF;
END $$;

-- ============================================================
-- PART 6: VERIFY POLICIES
-- ============================================================

SELECT 
    policyname,
    cmd as command,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'projects'
    AND cmd = 'INSERT'
ORDER BY policyname;
