-- Migration: Enable RLS with proper policies including service_role
-- Date: 2025-01-19
-- Description: Enable RLS and create policies for both authenticated users and service_role

-- ============================================================
-- PART 1: ENABLE RLS
-- ============================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 2: DROP ALL EXISTING POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON projects;
DROP POLICY IF EXISTS "Service role can insert projects" ON projects;
DROP POLICY IF EXISTS "Allow service role to insert projects" ON projects;

-- ============================================================
-- PART 3: CREATE INSERT POLICY FOR SERVICE ROLE (HIGHEST PRIORITY)
-- ============================================================

-- Service role should bypass RLS, but create explicit policy as fallback
CREATE POLICY "Service role can insert projects" ON projects
    FOR INSERT
    WITH CHECK (
        (select auth.role()) = 'service_role'
    );

-- ============================================================
-- PART 4: CREATE INSERT POLICY FOR AUTHENTICATED USERS
-- ============================================================

CREATE POLICY "Authenticated users can create projects" ON projects
    FOR INSERT
    WITH CHECK (
        (select auth.role()) = 'authenticated'
        AND (select auth.uid()) IS NOT NULL
    );

-- ============================================================
-- PART 5: ENSURE SELECT POLICY EXISTS
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read projects" ON projects;

CREATE POLICY "Authenticated users can read projects" ON projects
    FOR SELECT
    USING (
        (select auth.role()) = 'authenticated'
        OR (select auth.role()) = 'service_role'
    );

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
ORDER BY cmd, policyname;
