-- Migration: Add parent_id to task_comments for reply functionality
-- This allows comments to be replies to other comments

-- Add parent_id column to task_comments table
ALTER TABLE task_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES task_comments(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_task_comments_parent_id ON task_comments(parent_id);

-- Add comment
COMMENT ON COLUMN task_comments.parent_id IS 'ID of parent comment if this is a reply, NULL for top-level comments';

