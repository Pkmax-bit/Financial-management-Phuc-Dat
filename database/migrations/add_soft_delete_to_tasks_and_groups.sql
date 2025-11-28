-- Add soft delete columns to tasks and task_groups
-- This allows recovery within 24 hours and permanent deletion after 24 hours

-- Add deleted_at column to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at column to task_groups table
ALTER TABLE task_groups
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on deleted_at
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_task_groups_deleted_at ON task_groups(deleted_at);

-- Create index for finding records to permanently delete (deleted_at < NOW() - INTERVAL '24 hours')
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at_old ON tasks(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_groups_deleted_at_old ON task_groups(deleted_at) WHERE deleted_at IS NOT NULL;

