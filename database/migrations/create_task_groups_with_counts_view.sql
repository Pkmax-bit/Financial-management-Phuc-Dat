-- =====================================================
-- Migration: Create View for Task Groups with Counts
-- Date: 2026-01-13
-- Description: Automatically calculate task counts for each group
-- =====================================================

-- Create or replace view for task groups with counts
CREATE OR REPLACE VIEW public.task_groups_with_counts AS
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
  COUNT(
    DISTINCT CASE
      WHEN t.deleted_at IS NULL THEN t.id
      ELSE NULL::uuid
    END
  ) AS task_count,
  COUNT(
    DISTINCT CASE
      WHEN t.deleted_at IS NULL
      AND t.status = 'completed'::task_status THEN t.id
      ELSE NULL::uuid
    END
  ) AS completed_count,
  COUNT(
    DISTINCT CASE
      WHEN t.deleted_at IS NULL
      AND t.status = 'in_progress'::task_status THEN t.id
      ELSE NULL::uuid
    END
  ) AS in_progress_count,
  COUNT(
    DISTINCT CASE
      WHEN t.deleted_at IS NULL
      AND t.status = 'todo'::task_status THEN t.id
      ELSE NULL::uuid
    END
  ) AS todo_count,
  MAX(t.updated_at) AS last_task_update
FROM
  task_groups tg
  LEFT JOIN tasks t ON t.group_id = tg.id
WHERE
  tg.deleted_at IS NULL
GROUP BY
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
  tg.category_id;

-- Grant permissions
GRANT SELECT ON task_groups_with_counts TO authenticated;
GRANT SELECT ON task_groups_with_counts TO anon;

-- Comment
COMMENT ON VIEW task_groups_with_counts IS 'Task groups with automatic task counts (total, completed, in_progress, todo)';


