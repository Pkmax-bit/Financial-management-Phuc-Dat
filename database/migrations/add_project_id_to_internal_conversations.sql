-- =====================================================
-- ADD PROJECT_ID TO INTERNAL_CONVERSATIONS
-- Thêm cột project_id để liên kết chat với dự án
-- =====================================================

-- Add project_id column to internal_conversations
ALTER TABLE internal_conversations
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON internal_conversations(project_id);

-- Add comment
COMMENT ON COLUMN internal_conversations.project_id IS 'Liên kết với dự án (optional) - cho phép chat nội bộ liên kết với dự án';

