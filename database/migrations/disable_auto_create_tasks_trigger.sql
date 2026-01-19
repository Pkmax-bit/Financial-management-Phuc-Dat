-- Migration: Disable auto-create default tasks trigger
-- Date: 2025-01-19
-- Description: Disable the database trigger that creates tasks automatically
--               because backend code now handles this with the new 3-tier hierarchy
--               (1 main parent task = project name, then template tasks as sub-tasks)

-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_create_default_tasks_on_project_insert ON projects;

-- Optionally drop the function (or keep it for reference)
-- DROP FUNCTION IF EXISTS create_default_tasks_for_new_project();

-- Verify trigger is removed
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'projects'
    AND trigger_name = 'trigger_create_default_tasks_on_project_insert';

-- Should return 0 rows if trigger is successfully removed
