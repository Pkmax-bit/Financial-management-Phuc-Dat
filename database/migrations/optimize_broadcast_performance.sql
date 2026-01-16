-- =====================================================
-- OPTIMIZE BROADCAST PERFORMANCE
-- Tối ưu hóa để giảm độ trễ realtime từ 30s xuống <1s
-- =====================================================

-- Bước 1: Tối ưu trigger function - đảm bảo không có delay
DROP FUNCTION IF EXISTS broadcast_message_changes() CASCADE;

CREATE OR REPLACE FUNCTION broadcast_message_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Broadcast immediately without any delay or complex logic
    -- Use direct string concatenation for better performance
    PERFORM realtime.broadcast_changes(
        'conversation:' || COALESCE(NEW.conversation_id, OLD.conversation_id)::text || ':messages',
        TG_OP,
        TG_OP,
        TG_TABLE_NAME,
        TG_TABLE_SCHEMA,
        NEW,
        OLD
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Bước 2: Đảm bảo trigger được tạo với performance tốt nhất
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON internal_messages;

CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON internal_messages
  FOR EACH ROW 
  EXECUTE FUNCTION broadcast_message_changes();

-- Bước 3: Tối ưu RLS Policies - Đơn giản hóa query để tăng tốc độ
-- Policy cũ có thể chậm do JOIN nhiều bảng
-- Tối ưu bằng cách sử dụng EXISTS với index

-- Drop old policies
DROP POLICY IF EXISTS "authenticated_users_can_receive_broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated_users_can_send_broadcasts" ON realtime.messages;

-- Tối ưu: Sử dụng EXISTS với index trên user_id và conversation_id
-- Đảm bảo có index trên internal_conversation_participants(user_id, conversation_id)
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_conv 
ON internal_conversation_participants(user_id, conversation_id);

-- Policy: Cho phép đọc broadcasts (nhận tin nhắn) - Tối ưu với index
CREATE POLICY "authenticated_users_can_receive_broadcasts" ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Extract conversation_id from topic: 'conversation:{id}:messages'
  EXISTS (
    SELECT 1
    FROM internal_conversation_participants icp
    WHERE icp.user_id = auth.uid()
    AND realtime.topic() = 'conversation:' || icp.conversation_id::text || ':messages'
    AND realtime.messages.extension = 'broadcast'
    -- Index sẽ giúp query này nhanh hơn
  )
);

-- Policy: Cho phép gửi broadcasts (gửi tin nhắn) - Tối ưu với index
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
    -- Index sẽ giúp query này nhanh hơn
  )
);

-- Bước 4: Đảm bảo có index trên internal_messages để trigger nhanh hơn
CREATE INDEX IF NOT EXISTS idx_internal_messages_conversation_id 
ON internal_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_internal_messages_created_at 
ON internal_messages(created_at DESC);

-- Bước 5: Verify setup
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
    
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_internal_messages_conversation_id'
    ) THEN
        RAISE NOTICE '✅ Index trên internal_messages đã được tạo';
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
END $$;

-- =====================================================
-- Các Tối Ưu Đã Thực Hiện:
-- 1. Đơn giản hóa trigger function - loại bỏ DECLARE không cần thiết
-- 2. Tạo index trên conversation_participants để RLS policies nhanh hơn
-- 3. Tạo index trên internal_messages để trigger nhanh hơn
-- 4. Đơn giản hóa RLS policies - loại bỏ JOIN không cần thiết
-- 
-- Expected Performance:
-- - Trước: ~30 giây
-- - Sau: <1 giây (tùy thuộc vào network latency)
-- =====================================================

