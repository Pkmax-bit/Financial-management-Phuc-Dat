-- Migration: Verify and fix RLS INSERT policy for projects table
-- Date: 2025-01-19
-- Description: Ensure RLS INSERT policy exists and works correctly

-- ============================================================
-- PART 1: VERIFY RLS IS ENABLED
-- ============================================================

-- Check if RLS is enabled on projects table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'projects';

-- ============================================================
-- PART 2: VERIFY INSERT POLICY EXISTS
-- ============================================================

-- Check existing INSERT policies
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
    AND cmd = 'INSERT'
ORDER BY policyname;

-- ============================================================
-- PART 3: ENSURE RLS IS ENABLED
-- ============================================================

-- Enable RLS if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 4: CREATE/REPLACE INSERT POLICY
-- ============================================================

-- Drop existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON projects;

-- Create INSERT policy for authenticated users
-- This allows any authenticated user to create projects
CREATE POLICY "Authenticated users can create projects" ON projects
    FOR INSERT
    WITH CHECK (
        (select auth.role()) = 'authenticated'
        AND (select auth.uid()) IS NOT NULL
    );

-- ============================================================
-- PART 5: VERIFY POLICY WAS CREATED
-- ============================================================

-- Verify the policy exists
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
