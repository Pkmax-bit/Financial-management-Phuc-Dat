-- =====================================================
-- ADD TASK_ID TO INTERNAL_CONVERSATIONS
-- Migration để thêm liên kết với tasks
-- =====================================================

-- Add task_id column to internal_conversations
ALTER TABLE internal_conversations 
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_task_id ON internal_conversations(task_id);

-- Add comment
COMMENT ON COLUMN internal_conversations.task_id IS 'Liên kết với task (optional) - cho phép chat nội bộ liên kết với nhiệm vụ';

