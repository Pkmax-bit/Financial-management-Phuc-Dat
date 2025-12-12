-- =====================================================
-- FIX INTERNAL CHAT RLS POLICIES - Type Cast Issues
-- Sửa lỗi: operator does not exist: uuid = text
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their conversations" ON internal_conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON internal_conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON internal_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON internal_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON internal_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON internal_messages;
DROP POLICY IF EXISTS "Users can create conversations" ON internal_conversations;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON internal_conversation_participants;

-- Recreate policies with correct type casting (UUID = UUID, not UUID = text)

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

