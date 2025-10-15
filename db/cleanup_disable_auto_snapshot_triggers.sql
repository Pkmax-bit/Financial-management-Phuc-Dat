-- Cleanup: disable/remove auto-snapshot triggers and functions
-- Reason: Backend now handles snapshots; triggers caused errors like
-- "record NEW has no field created_by" on insert into project_expenses_quote

-- 1) Drop triggers on expenses tables (if they exist)
DROP TRIGGER IF EXISTS trigger_auto_snapshot_expenses ON public.expenses;
DROP TRIGGER IF EXISTS trigger_auto_snapshot_project_expenses ON public.project_expenses;
DROP TRIGGER IF EXISTS trigger_auto_snapshot_project_expenses_quote ON public.project_expenses_quote;

-- 2) Drop helper functions used by triggers (if they exist)
DROP FUNCTION IF EXISTS public.create_auto_snapshot_on_child_creation() CASCADE;
DROP FUNCTION IF EXISTS public.get_latest_auto_snapshot(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.restore_parent_from_snapshot(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_restore_history(uuid, text) CASCADE;

-- Note: expense_snapshots table is kept intact for backend-managed snapshots.
-- After running this script, snapshot creation/restoration is fully managed by backend code.
