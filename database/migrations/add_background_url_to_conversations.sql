-- =====================================================
-- ADD BACKGROUND_URL TO INTERNAL_CONVERSATIONS
-- Thêm cột background_url để lưu hình nền nhóm chat
-- =====================================================

-- Add background_url column to internal_conversations
ALTER TABLE internal_conversations
ADD COLUMN IF NOT EXISTS background_url TEXT;

-- Add comment
COMMENT ON COLUMN internal_conversations.background_url IS 'URL hình nền của nhóm chat (optional)';

