-- Migration: Temporarily disable RLS for projects table to fix insertion issues
-- Date: 2025-01-19
-- Description: Disable RLS on projects table so backend can insert without issues
-- WARNING: This is a temporary fix. Re-enable RLS and create proper policies later.

-- ============================================================
-- PART 1: DISABLE RLS ON PROJECTS TABLE
-- ============================================================

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 2: VERIFY RLS IS DISABLED
-- ============================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'projects';

-- Expected result: rls_enabled should be false
