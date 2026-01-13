-- =====================================================
-- Migration: Create View for Task Groups with Counts
-- Date: 2026-01-13
-- Description: Automatically calculate task counts for each group
-- =====================================================

-- Create or replace view for task groups with counts
CREATE OR REPLACE VIEW task_groups_with_counts AS
SELECT 
    tg.id,
    tg.name,
    tg.description,
    tg.color,
    tg.avatar_url,
    tg.is_active,
    tg.created_at,
    tg.updated_at,
    tg.created_by,
    tg.deleted_at,
    tg.category_id,
    -- Count total tasks (exclude deleted)
    COUNT(DISTINCT CASE WHEN t.deleted_at IS NULL THEN t.id END) as task_count,
    -- Count completed tasks
    COUNT(DISTINCT CASE WHEN t.deleted_at IS NULL AND t.status = 'completed' THEN t.id END) as completed_count,
    -- Count in progress tasks
    COUNT(DISTINCT CASE WHEN t.deleted_at IS NULL AND t.status = 'in_progress' THEN t.id END) as in_progress_count,
    -- Count todo tasks
    COUNT(DISTINCT CASE WHEN t.deleted_at IS NULL AND t.status = 'todo' THEN t.id END) as todo_count,
    -- Latest task updated time
    MAX(t.updated_at) as last_task_update
FROM task_groups tg
LEFT JOIN tasks t ON t.group_id = tg.id
WHERE tg.deleted_at IS NULL
GROUP BY tg.id, tg.name, tg.description, tg.color, tg.avatar_url, 
         tg.is_active, tg.created_at, tg.updated_at, tg.created_by, 
         tg.deleted_at, tg.category_id;

-- Grant permissions
GRANT SELECT ON task_groups_with_counts TO authenticated;
GRANT SELECT ON task_groups_with_counts TO anon;

-- Comment
COMMENT ON VIEW task_groups_with_counts IS 'Task groups with automatic task counts (total, completed, in_progress, todo)';

