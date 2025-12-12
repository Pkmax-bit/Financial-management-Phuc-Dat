-- =====================================================
-- INTERNAL CHAT SYSTEM - DATABASE SCHEMA (FIXED)
-- Hệ thống chat nội bộ cho nhân viên giống Zalo
-- Đã sửa tất cả lỗi type cast
-- =====================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CONVERSATIONS TABLE
-- Bảng lưu các cuộc trò chuyện (1-1 hoặc nhóm)
-- =====================================================

CREATE TABLE IF NOT EXISTS internal_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255), -- Tên nhóm (NULL nếu là chat 1-1)
    type VARCHAR(20) NOT NULL DEFAULT 'direct', -- 'direct' (1-1) hoặc 'group' (nhóm)
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- Liên kết với task (optional)
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE, -- Thời gian tin nhắn cuối cùng
    last_message_preview TEXT, -- Preview tin nhắn cuối cùng
    avatar_url TEXT -- Avatar nhóm (NULL nếu là chat 1-1)
);

-- =====================================================
-- 2. CONVERSATION PARTICIPANTS TABLE
-- Bảng lưu thành viên trong mỗi cuộc trò chuyện
-- =====================================================

CREATE TABLE IF NOT EXISTS internal_conversation_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES internal_conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE, -- Thời gian đọc tin nhắn cuối cùng
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
    is_muted BOOLEAN DEFAULT FALSE, -- Tắt thông báo
    UNIQUE(conversation_id, user_id)
);

-- =====================================================
-- 3. MESSAGES TABLE
-- Bảng lưu tin nhắn
-- =====================================================

CREATE TABLE IF NOT EXISTS internal_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES internal_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    file_url TEXT, -- URL file nếu là image/file
    file_name TEXT, -- Tên file
    file_size INTEGER, -- Kích thước file (bytes)
    reply_to_id UUID REFERENCES internal_messages(id) ON DELETE SET NULL, -- Reply to message
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON internal_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON internal_conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_task_id ON internal_conversations(task_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation_id ON internal_conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON internal_conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON internal_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON internal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON internal_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON internal_messages(reply_to_id);

-- =====================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_internal_conversations_updated_at 
    BEFORE UPDATE ON internal_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internal_messages_updated_at 
    BEFORE UPDATE ON internal_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. TRIGGER TO UPDATE LAST_MESSAGE_AT IN CONVERSATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE internal_conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = CASE 
            WHEN LENGTH(NEW.message_text) > 100 THEN LEFT(NEW.message_text, 100) || '...'
            ELSE NEW.message_text
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_on_new_message
    AFTER INSERT ON internal_messages
    FOR EACH ROW
    WHEN (NEW.is_deleted = FALSE)
    EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Đã sửa: So sánh UUID với UUID (không cast sang text)
-- =====================================================

-- Enable RLS
ALTER TABLE internal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations: Users can only see conversations they participate in
CREATE POLICY "Users can view their conversations"
    ON internal_conversations FOR SELECT
    USING (
        id IN (
            SELECT conversation_id 
            FROM internal_conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Policies for participants: Users can view participants of their conversations
CREATE POLICY "Users can view participants of their conversations"
    ON internal_conversation_participants FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM internal_conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Policies for messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
    ON internal_messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM internal_conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

-- Users can insert messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
    ON internal_messages FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT conversation_id 
            FROM internal_conversation_participants 
            WHERE user_id = auth.uid()
        )
        AND sender_id = auth.uid()
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages"
    ON internal_messages FOR UPDATE
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages (soft delete)
CREATE POLICY "Users can delete their own messages"
    ON internal_messages FOR UPDATE
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

-- Users can create conversations
CREATE POLICY "Users can create conversations"
    ON internal_conversations FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Users can add participants to conversations they created or are admin of
CREATE POLICY "Users can add participants to their conversations"
    ON internal_conversation_participants FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM internal_conversations 
            WHERE created_by = auth.uid()
            OR id IN (
                SELECT conversation_id 
                FROM internal_conversation_participants 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON TABLE internal_conversations IS 'Cuộc trò chuyện nội bộ (1-1 hoặc nhóm)';
COMMENT ON TABLE internal_conversation_participants IS 'Thành viên trong cuộc trò chuyện';
COMMENT ON TABLE internal_messages IS 'Tin nhắn trong cuộc trò chuyện';
COMMENT ON COLUMN internal_conversations.task_id IS 'Liên kết với task (optional) - cho phép chat nội bộ liên kết với nhiệm vụ';

