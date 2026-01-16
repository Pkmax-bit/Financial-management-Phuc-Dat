-- =====================================================
-- FIX BROADCAST TRIGGER - Đảm bảo trigger hoạt động đúng
-- =====================================================

-- Bước 0: Kiểm tra Realtime extension
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'realtime') THEN
        RAISE EXCEPTION '❌ Realtime extension chưa được enable! Chạy: CREATE EXTENSION IF NOT EXISTS realtime;';
    ELSE
        RAISE NOTICE '✅ Realtime extension đã được enable';
    END IF;
END $$;

-- Bước 1: Drop và recreate function để đảm bảo đúng
DROP FUNCTION IF EXISTS broadcast_message_changes() CASCADE;

CREATE OR REPLACE FUNCTION broadcast_message_changes()
RETURNS TRIGGER AS $$
DECLARE
    channel_topic TEXT;
BEGIN
    -- Build channel topic: conversation:{conversation_id}:messages
    IF TG_OP = 'DELETE' THEN
        channel_topic := 'conversation:' || OLD.conversation_id::text || ':messages';
    ELSE
        channel_topic := 'conversation:' || NEW.conversation_id::text || ':messages';
    END IF;
    
    -- Broadcast to conversation-specific channel
    PERFORM realtime.broadcast_changes(
        channel_topic,           -- topic
        TG_OP,                   -- event name (INSERT, UPDATE, DELETE)
        TG_OP,                   -- operation (same as event)
        TG_TABLE_NAME,           -- table name
        TG_TABLE_SCHEMA,         -- schema name
        NEW,                     -- new record (NULL for DELETE)
        OLD                      -- old record (NULL for INSERT)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Bước 2: Drop và recreate trigger
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON internal_messages;

CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON internal_messages
  FOR EACH ROW 
  EXECUTE FUNCTION broadcast_message_changes();

-- Bước 3: Verify trigger exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'messages_broadcast_trigger' 
        AND tgrelid = 'internal_messages'::regclass
    ) THEN
        RAISE NOTICE '✅ Trigger messages_broadcast_trigger đã được tạo thành công';
    ELSE
        RAISE EXCEPTION '❌ Trigger không tồn tại!';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'broadcast_message_changes'
    ) THEN
        RAISE NOTICE '✅ Function broadcast_message_changes đã được tạo thành công';
    ELSE
        RAISE EXCEPTION '❌ Function không tồn tại!';
    END IF;
END $$;

-- Bước 4: Đảm bảo RLS policies đúng
-- Policy: Cho phép đọc broadcasts (nhận tin nhắn)
DROP POLICY IF EXISTS "authenticated_users_can_receive_broadcasts" ON realtime.messages;
CREATE POLICY "authenticated_users_can_receive_broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM internal_conversations ic
    JOIN internal_conversation_participants icp ON ic.id = icp.conversation_id
    WHERE icp.user_id = auth.uid()
    AND realtime.topic() = 'conversation:' || ic.id::text || ':messages'
    AND realtime.messages.extension = 'broadcast'
  )
);

-- Policy: Cho phép gửi broadcasts (gửi tin nhắn) - Trigger tự động gửi
DROP POLICY IF EXISTS "authenticated_users_can_send_broadcasts" ON realtime.messages;
CREATE POLICY "authenticated_users_can_send_broadcasts"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM internal_conversations ic
    JOIN internal_conversation_participants icp ON ic.id = icp.conversation_id
    WHERE icp.user_id = auth.uid()
    AND realtime.topic() = 'conversation:' || ic.id::text || ':messages'
    AND realtime.messages.extension = 'broadcast'
  )
);

-- Bước 5: Verify RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'realtime' 
      AND tablename = 'messages'
      AND policyname IN ('authenticated_users_can_receive_broadcasts', 'authenticated_users_can_send_broadcasts');
    
    IF policy_count = 2 THEN
        RAISE NOTICE '✅ RLS policies đã được tạo thành công (2 policies)';
    ELSE
        RAISE WARNING '⚠️ RLS policies không đầy đủ. Found: % policies', policy_count;
    END IF;
END $$;

-- Bước 6: Kiểm tra publication (cần cho realtime.messages)
DO $$
DECLARE
    pub_exists BOOLEAN;
BEGIN
    -- Kiểm tra xem có publication cho realtime.messages không
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'realtime' 
        AND tablename = 'messages'
    ) INTO pub_exists;
    
    IF pub_exists THEN
        RAISE NOTICE '✅ Publication cho realtime.messages đã tồn tại';
    ELSE
        RAISE WARNING '⚠️ Publication cho realtime.messages chưa tồn tại. Có thể cần enable:';
        RAISE WARNING '   ALTER PUBLICATION supabase_realtime ADD TABLE realtime.messages;';
    END IF;
END $$;

-- =====================================================
-- Sau khi chạy script này:
-- 1. Restart backend server (nếu đang chạy)
-- 2. Refresh frontend
-- 3. Test chat giữa 2 users
-- 4. Kiểm tra console logs để xem có broadcast events không
-- 
-- Nếu vẫn không hoạt động:
-- 1. Kiểm tra console logs để xem có "📡 Received broadcast" không
-- 2. Nếu không có → Trigger không hoạt động hoặc RLS chặn
-- 3. Chạy test_broadcast_trigger.sql để test trigger
-- 4. Kiểm tra user có trong internal_conversation_participants không
-- =====================================================

