-- =====================================================
-- MIGRATE CHAT TO BROADCAST - Supabase Realtime
-- Chuyển từ Postgres Changes sang Broadcast cho chat realtime
-- =====================================================
-- File này setup Broadcast với Private Channels cho internal_messages
-- Để cải thiện performance và hỗ trợ typing indicators, presence
-- =====================================================

-- Bước 1: Tạo function để broadcast message changes
CREATE OR REPLACE FUNCTION broadcast_message_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast to conversation-specific channel
  PERFORM realtime.broadcast_changes(
    'conversation:' || NEW.conversation_id::text || ':messages',
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Bước 2: Tạo trigger để broadcast khi có thay đổi
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON internal_messages;
CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON internal_messages
  FOR EACH ROW EXECUTE FUNCTION broadcast_message_changes();

-- Bước 3: Setup RLS Policies cho Realtime Authorization
-- Cho phép authenticated users nhận broadcasts từ conversations họ tham gia

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

-- Policy: Cho phép gửi broadcasts (gửi tin nhắn)
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

-- Bước 4: Verify setup
DO $$
BEGIN
    RAISE NOTICE '✅ Broadcast trigger function created';
    RAISE NOTICE '✅ Broadcast trigger created on internal_messages';
    RAISE NOTICE '✅ RLS policies created for realtime.messages';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Update frontend code to use Broadcast instead of Postgres Changes';
    RAISE NOTICE '2. Test realtime messaging';
    RAISE NOTICE '3. Add typing indicators and presence (optional)';
END $$;

-- =====================================================
-- Lưu ý:
-- 1. Sau khi chạy migration này, cần update frontend code
-- 2. Broadcast sẽ hoạt động với private channels
-- 3. RLS policies đảm bảo chỉ participants mới nhận được messages
-- 4. Có thể thêm typing indicators và presence sau
-- =====================================================

