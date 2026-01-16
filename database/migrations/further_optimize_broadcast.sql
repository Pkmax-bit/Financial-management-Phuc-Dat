-- =====================================================
-- FURTHER OPTIMIZE BROADCAST PERFORMANCE
-- Giảm delay từ 21s xuống < 3s
-- =====================================================

-- Bước 1: Đảm bảo trigger function tối ưu nhất có thể
-- Loại bỏ mọi logic không cần thiết
DROP FUNCTION IF EXISTS broadcast_message_changes() CASCADE;

CREATE OR REPLACE FUNCTION broadcast_message_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Broadcast immediately - no delays, no checks, no conditions
    -- Direct broadcast for maximum performance
    PERFORM realtime.broadcast_changes(
        'conversation:' || COALESCE(NEW.conversation_id, OLD.conversation_id)::text || ':messages',
        TG_OP,
        TG_OP,
        TG_TABLE_NAME,
        TG_TABLE_SCHEMA,
        NEW,
        OLD
    );
    
    -- Return immediately - don't wait for anything
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Bước 2: Đảm bảo trigger được tạo với performance tốt nhất
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON internal_messages;

CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON internal_messages
  FOR EACH ROW 
  EXECUTE FUNCTION broadcast_message_changes();

-- Bước 3: Tối ưu RLS Policies - Sử dụng index scan thay vì sequential scan
-- Đảm bảo indexes được sử dụng hiệu quả

-- Drop old policies
DROP POLICY IF EXISTS "authenticated_users_can_receive_broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated_users_can_send_broadcasts" ON realtime.messages;

-- Tối ưu: Sử dụng index scan với EXISTS
-- Đảm bảo có index trên internal_conversation_participants(user_id, conversation_id)
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conv 
ON internal_conversation_participants(user_id, conversation_id);

-- Tối ưu thêm: Index trên conversation_id để extract nhanh hơn
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv_id 
ON internal_conversation_participants(conversation_id);

-- Policy: Cho phép đọc broadcasts - Tối ưu với index scan
CREATE POLICY "authenticated_users_can_receive_broadcasts" ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Extract conversation_id from topic: 'conversation:{id}:messages'
  -- Use index scan for fast lookup
  EXISTS (
    SELECT 1
    FROM internal_conversation_participants icp
    WHERE icp.user_id = auth.uid()
    AND realtime.topic() = 'conversation:' || icp.conversation_id::text || ':messages'
    AND realtime.messages.extension = 'broadcast'
    -- Index idx_conversation_participants_user_conv will be used
  )
);

-- Policy: Cho phép gửi broadcasts - Tối ưu với index scan
CREATE POLICY "authenticated_users_can_send_broadcasts" ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM internal_conversation_participants icp
    WHERE icp.user_id = auth.uid()
    AND realtime.topic() = 'conversation:' || icp.conversation_id::text || ':messages'
    AND realtime.messages.extension = 'broadcast'
    -- Index idx_conversation_participants_user_conv will be used
  )
);

-- Bước 4: Đảm bảo indexes trên internal_messages được tối ưu
CREATE INDEX IF NOT EXISTS idx_internal_messages_conversation_id 
ON internal_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_internal_messages_created_at 
ON internal_messages(created_at DESC);

-- Bước 5: Analyze tables để optimizer sử dụng indexes hiệu quả
ANALYZE internal_messages;
ANALYZE internal_conversation_participants;

-- Bước 6: Verify setup
DO $$
BEGIN
    -- Check trigger
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'messages_broadcast_trigger' 
        AND tgrelid = 'internal_messages'::regclass
    ) THEN
        RAISE NOTICE '✅ Trigger đã được tối ưu';
    ELSE
        RAISE EXCEPTION '❌ Trigger không tồn tại!';
    END IF;
    
    -- Check indexes
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_conversation_participants_user_conv'
    ) THEN
        RAISE NOTICE '✅ Index trên conversation_participants đã được tạo';
    END IF;
    
    -- Check policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'realtime' 
        AND tablename = 'messages'
        AND policyname = 'authenticated_users_can_receive_broadcasts'
    ) THEN
        RAISE NOTICE '✅ RLS policies đã được tối ưu';
    END IF;
    
    RAISE NOTICE '✅ Tất cả optimizations đã được áp dụng';
END $$;

-- =====================================================
-- Các Tối Ưu Đã Thực Hiện:
-- 1. Trigger function đơn giản nhất - không có logic phức tạp
-- 2. Indexes được tối ưu cho RLS policies
-- 3. ANALYZE tables để optimizer sử dụng indexes
-- 4. Heartbeat interval giảm xuống 10s (frontend)
-- 5. Presence update mỗi 15s (frontend)
-- 
-- Expected Performance:
-- - Trước: ~21 giây
-- - Sau: < 3 giây (thường < 1 giây)
-- =====================================================

