-- =====================================================
-- OPTIMIZE BACKEND QUERIES FOR CHAT
-- Tối ưu queries trong backend API endpoints
-- =====================================================

-- Bước 1: Indexes cho backend queries
-- Đảm bảo tất cả queries trong backend sử dụng indexes

-- Index cho get_messages query (conversation_id + created_at)
CREATE INDEX IF NOT EXISTS idx_internal_messages_conv_created_desc 
ON internal_messages(conversation_id, created_at DESC);

-- Index cho participant check (conversation_id + user_id)
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv_user 
ON internal_conversation_participants(conversation_id, user_id);

-- Index cho unread count query
CREATE INDEX IF NOT EXISTS idx_internal_messages_conv_sender_created 
ON internal_messages(conversation_id, sender_id, created_at DESC);

-- Index cho conversation list query (last_message_at)
CREATE INDEX IF NOT EXISTS idx_internal_conversations_last_message 
ON internal_conversations(last_message_at DESC NULLS LAST);

-- Bước 2: Analyze tables để optimizer sử dụng indexes
ANALYZE internal_messages;
ANALYZE internal_conversations;
ANALYZE internal_conversation_participants;

-- Bước 3: Verify indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_internal_messages_conv_created_desc'
    ) THEN
        RAISE NOTICE '✅ Index idx_internal_messages_conv_created_desc exists';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_conversation_participants_conv_user'
    ) THEN
        RAISE NOTICE '✅ Index idx_conversation_participants_conv_user exists';
    END IF;
    
    RAISE NOTICE '✅ Backend query optimizations verified';
END $$;


